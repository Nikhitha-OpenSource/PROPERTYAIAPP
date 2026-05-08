"""PROPIQ AI — WebSocket Chat Router (Buyer ↔ Seller)"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import Optional

from app.db.models import ChatMessage
from app.db.session import get_db, SessionLocal
from app.utils.security import MockUser, decode_token, get_current_user

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
            sender_role = (data.get("sender_role") or user.role).upper()
            message_text = data.get("message", "")
            property_id = data.get("property_id")

            # Basic safety: require sender_id to match authenticated user (prevents impersonation).
            if sender_id and str(sender_id) != str(user.user_id):
                await ws.send_json({"error": "sender_id does not match authenticated user"})
                continue

            msg = {
                "id": str(uuid.uuid4()),
                "channel_id": channel_id,
                "sender_id": str(user.user_id),
                "sender_role": sender_role,
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
