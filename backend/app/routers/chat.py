"""PROPIQ AI — WebSocket Chat Router (Buyer ↔ Seller)"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import Optional

from app.db.models import ChatMessage, Property
from app.db.session import get_db, SessionLocal
from app.services.data_service import get_property as csv_get_property, list_properties as csv_list_properties
from app.utils.security import MockUser, decode_token, get_current_user, require_roles

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections per channel."""

    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, channel_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(channel_id, []).append(ws)

    def disconnect(self, channel_id: str, ws: WebSocket):
        if channel_id in self.active:
            self.active[channel_id] = [x for x in self.active[channel_id] if x is not ws]

    async def broadcast(self, channel_id: str, message: dict):
        for ws in self.active.get(channel_id, []):
            try:
                await ws.send_json(message)
            except Exception:
                # Non-fatal: connection may be closed mid-broadcast
                pass


manager = ConnectionManager()


def _channel_property_id(channel_id: str) -> Optional[str]:
    prefix = "property-"
    if channel_id.startswith(prefix):
        return channel_id[len(prefix):]
    return None


def _property_summary(prop: Property | dict) -> dict:
    if isinstance(prop, dict):
        return {
            "property_id": prop.get("property_id"),
            "title": prop.get("title"),
            "locality": prop.get("locality"),
            "city": prop.get("city"),
            "price": prop.get("price"),
            "owner_user_id": prop.get("owner_user_id") or prop.get("seller_id"),
        }
    return {
        "property_id": prop.property_id,
        "title": prop.title,
        "locality": prop.locality,
        "city": prop.city,
        "price": prop.price,
        "owner_user_id": prop.owner_user_id,
    }


def _visible_seller_properties(db: Session, user: MockUser) -> dict[str, dict]:
    """Return properties whose chats this seller/admin may see."""
    role = user.role.upper()
    if db.query(Property).count():
        q = db.query(Property)
        if role != "ADMIN":
            q = q.filter(Property.owner_user_id == user.user_id)
        return {p.property_id: _property_summary(p) for p in q.all()}

    fallback = csv_list_properties(
        owner_user_id=None if role == "ADMIN" else user.user_id,
        page=1,
        page_size=1000,
    )
    return {
        str(p["property_id"]): _property_summary(p)
        for p in fallback.get("items", [])
        if p.get("property_id")
    }


def _get_token_from_websocket(ws: WebSocket) -> Optional[str]:
    # Browsers cannot set custom headers on WebSocket.
    # We accept JWT via query string: ws://.../ws/chat/{channel}?token=...
    token = ws.query_params.get("token")
    if not token:
        return None
    return token.strip()


async def _get_user_from_websocket(ws: WebSocket) -> MockUser:
    token = _get_token_from_websocket(ws)
    if not token:
        raise HTTPException(status_code=401, detail="Missing token query param")

    data = decode_token(token)
    if not data or data.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = data["sub"]
    role = data.get("role", "BUYER")
    user = get_current_user  # just to keep mypy/linters calm; actual DB lookup below
    # Avoid Depends() in websocket; fetch DB directly through SessionLocal
    db: Session = SessionLocal()
    try:
        from app.db.models import User

        db_user = db.get(User, user_id)
        if not db_user:
            return MockUser(user_id=user_id, role=role)
        return MockUser(user_id=db_user.user_id, role=db_user.role, is_active=db_user.is_active)
    finally:
        db.close()


@router.websocket("/ws/chat/{channel_id}")
async def websocket_chat(channel_id: str, ws: WebSocket):
    """Real-time WebSocket chat channel for buyer-seller communication (JWT protected)."""
    user: MockUser
    try:
        user = await _get_user_from_websocket(ws)
    except HTTPException as exc:
        # WebSocket can't use normal JSON response reliably; close with policy code 1008
        await ws.close(code=1008)
        return

    await manager.connect(channel_id, ws)
    try:
        while True:
            data = await ws.receive_json()

            sender_id = data.get("sender_id")
            sender_role = user.role.upper()
            message_text = data.get("message", "")
            property_id = data.get("property_id") or _channel_property_id(channel_id)

            # Basic safety: require sender_id to match authenticated user (prevents impersonation).
            if sender_id and str(sender_id) != str(user.user_id):
                await ws.send_json({"error": "sender_id does not match authenticated user"})
                continue

            msg = {
                "id": str(uuid.uuid4()),
                "channel_id": channel_id,
                "sender_id": str(user.user_id),
                "sender_role": sender_role,
                "property_id": property_id,
                "message": message_text,
                "timestamp": datetime.utcnow().isoformat(),
                "read": False,
            }

            # Persist to SQL (survives server restarts)
            db = SessionLocal()
            try:
                db.add(
                    ChatMessage(
                        channel_id=channel_id,
                        property_id=property_id,
                        sender_user_id=str(user.user_id),
                        sender_role=sender_role,
                        message=message_text,
                        timestamp=datetime.utcnow(),
                    )
                )
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()

            await manager.broadcast(channel_id, msg)
    except WebSocketDisconnect:
        manager.disconnect(channel_id, ws)


@router.post("/property/{property_id}/start")
async def start_property_chat(
    property_id: str,
    db: Session = Depends(get_db),
    user: MockUser = Depends(get_current_user),
):
    """Mark a buyer's property chat as active as soon as they open the chat page."""
    channel_id = f"property-{property_id}"
    prop = db.get(Property, property_id)
    prop_data = _property_summary(prop) if prop else csv_get_property(property_id)
    if not prop_data:
        raise HTTPException(status_code=404, detail="Property not found")

    existing = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.channel_id == channel_id,
            ChatMessage.sender_user_id == str(user.user_id),
        )
        .first()
    )
    if existing:
        return {
            "channel_id": channel_id,
            "property_id": property_id,
            "status": "already_active",
        }

    message_text = "Chat started for this property."
    now = datetime.utcnow()
    row = ChatMessage(
        channel_id=channel_id,
        property_id=property_id,
        sender_user_id=str(user.user_id),
        sender_role=user.role.upper(),
        message=message_text,
        timestamp=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    await manager.broadcast(
        channel_id,
        {
            "id": row.msg_id,
            "channel_id": channel_id,
            "property_id": property_id,
            "sender_id": str(user.user_id),
            "sender_role": user.role.upper(),
            "message": message_text,
            "timestamp": now.isoformat(),
            "read": False,
        },
    )
    return {
        "channel_id": channel_id,
        "property_id": property_id,
        "status": "active",
    }


@router.get("/seller/active")
async def get_seller_active_chats(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: MockUser = Depends(require_roles("SELLER", "ADMIN")),
):
    """Return active chat threads only for properties owned by the seller."""
    property_map = _visible_seller_properties(db, user)
    if not property_map:
        return {"items": [], "total": 0, "seller_id": user.user_id}

    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.property_id.in_(list(property_map.keys())))
        .order_by(ChatMessage.timestamp.desc())
        .limit(1000)
        .all()
    )

    grouped: dict[str, dict] = {}
    for row in rows:
        channel_id = row.channel_id or f"property-{row.property_id}"
        if channel_id not in grouped:
            grouped[channel_id] = {
                "channel_id": channel_id,
                "property_id": row.property_id,
                "property": property_map.get(str(row.property_id), {}),
                "last_message": row.message,
                "last_sender_id": row.sender_user_id,
                "last_sender_role": row.sender_role,
                "last_timestamp": row.timestamp.isoformat(),
                "message_count": 0,
                "unread_count": 0,
            }
        grouped[channel_id]["message_count"] += 1
        if row.sender_user_id and str(row.sender_user_id) != str(user.user_id):
            grouped[channel_id]["unread_count"] += 1

    items = sorted(grouped.values(), key=lambda item: item["last_timestamp"], reverse=True)[:limit]
    return {"items": items, "total": len(items), "seller_id": user.user_id}


@router.get("/{channel_id}/history")
async def get_chat_history(
    channel_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: MockUser = Depends(get_current_user),
):
    """Fetch chat history for a channel (JWT protected)."""
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 200")

    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.channel_id == channel_id)
        .order_by(ChatMessage.timestamp.asc())
        .limit(limit)
        .all()
    )

    return {
        "channel_id": channel_id,
        "messages": [
            {
                "id": r.msg_id,
                "channel_id": r.channel_id,
                "sender_id": r.sender_user_id,
                "sender_role": r.sender_role,
                "message": r.message,
                "timestamp": r.timestamp.isoformat(),
            }
            for r in rows
        ],
        "requested_by": user.user_id,
    }


@router.post("/{channel_id}/alert")
async def send_visit_alert(
    channel_id: str,
    db: Session = Depends(get_db),
    user: MockUser = Depends(get_current_user),
):
    """Send 'visit before payment' nudge alert to the buyer (JWT protected)."""
    # Any authenticated user can trigger in demo mode, but impersonation is blocked.
    alert_msg = {
        "id": str(uuid.uuid4()),
        "channel_id": channel_id,
        "sender_id": "system",
        "sender_role": "SYSTEM",
        "message": "⚠️ Reminder: Always visit the property in person before making any payment. PropBot recommends a physical inspection.",
        "type": "VISIT_REMINDER",
        "timestamp": datetime.utcnow().isoformat(),
    }

    db.add(
        ChatMessage(
            channel_id=channel_id,
            property_id=None,
            sender_user_id="system",
            sender_role="SYSTEM",
            message=alert_msg["message"],
            timestamp=datetime.utcnow(),
        )
    )
    db.commit()

    await manager.broadcast(channel_id, alert_msg)
    return {"status": "alert_sent", "triggered_by": user.user_id}
