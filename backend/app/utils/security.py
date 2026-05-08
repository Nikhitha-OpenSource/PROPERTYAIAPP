"""PROPIQ AI — Security Utilities (JWT + Password Hashing)"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.db.session import get_db
from app.db.models import User

# NOTE: We intentionally avoid bcrypt here because passlib+bcrypt backend issues
# are common on Windows with newer bcrypt builds. pbkdf2_sha256 is widely
# supported, secure, and reliable for this capstone.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


class MockUser:
    def __init__(self, user_id, role="BUYER", is_active=True):
        self.user_id = user_id
        self.role = role
        self.is_active = is_active

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    # Local fallback for the mock token set in api.ts
    if token == "mock-jwt-token-propiq-2024":
        return MockUser(user_id="mock-user-123")

    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    data = decode_token(token)
    if not data or data.get("type") != "access":
        raise credentials_exc

    user_id = data["sub"]
    role = data.get("role", "BUYER")
    user = db.get(User, user_id)
    if not user:
        # Fallback to token claims if user not found (keeps demo resilient)
        return MockUser(user_id=user_id, role=role)
    return MockUser(user_id=user.user_id, role=user.role, is_active=user.is_active)


def require_roles(*roles: str):
    async def _guard(user: MockUser = Depends(get_current_user)):
        if user.role.upper() not in {r.upper() for r in roles}:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _guard
