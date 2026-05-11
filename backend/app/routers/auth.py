"""PROPIQ AI — Auth Router (JWT)"""
from fastapi import APIRouter, Depends, Form, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.utils.security import (
    hash_password, verify_password, create_access_token, create_refresh_token
)

router = APIRouter()

LOGIN_ROLES = {"BUYER", "SELLER", "ADMIN"}
REGISTER_ROLES = {"BUYER", "SELLER"}


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str = ""
    role: str = "BUYER"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str
    email: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    role = (payload.role or "BUYER").upper().strip()
    if role not in REGISTER_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Registration is available only for buyer and seller accounts",
        )

    email = str(payload.email).lower().strip()
    existing = db.query(User).filter(User.email == email, User.role == role).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered for this role")

    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        role=role,
    )
    db.add(user)
    db.commit()  # Explicitly commit to save the user
    db.refresh(user)  # ensures user_id available

    return {
        "access_token": create_access_token(user.user_id, user.role),
        "refresh_token": create_refresh_token(user.user_id),
        "user_id": user.user_id,
        "role": user.role,
        "name": user.name,
        "email": user.email,
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    username: str = Form(...),
    password: str = Form(...),
    role: str = Form("BUYER"),
    db: Session = Depends(get_db),
):
    """Login with email + password, returns JWT tokens."""
    email = (username or "").lower().strip()
    role_u = (role or "BUYER").upper().strip()
    if role_u not in LOGIN_ROLES:
        raise HTTPException(status_code=400, detail="Invalid login role")

    user = db.query(User).filter(User.email == email, User.role == role_u).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User disabled")

    return {
        "access_token": create_access_token(user.user_id, user.role),
        "refresh_token": create_refresh_token(user.user_id),
        "user_id": user.user_id,
        "role": user.role,
        "name": user.name,
        "email": user.email,
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest):
    """Refresh access token using refresh token (mock)."""
    user_id = "mock-user-123"
    return {
        "access_token": create_access_token(user_id, "BUYER"),
        "refresh_token": create_refresh_token(user_id),
        "user_id": user_id,
        "role": "BUYER",
        "name": "Demo User",
        "email": "test@propiq.ai",
    }
