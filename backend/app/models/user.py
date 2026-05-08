"""PROPIQ AI — Pydantic User & Alert Models"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

def generate_uuid():
    return str(uuid.uuid4())

class UserModel(BaseModel):
    user_id: str = Field(default_factory=generate_uuid)
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str = Field(default="BUYER", description="BUYER, SELLER, AGENT, ADMIN")
    hashed_pwd: Optional[str] = None
    aadhar_hash: Optional[str] = None    # SHA-256 hash only
    kyc_verified: bool = False
    azure_ad_oid: Optional[str] = None   # Azure AD object ID for SSO
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserAlertModel(BaseModel):
    alert_id: str = Field(default_factory=generate_uuid)
    user_id: str
    alert_type: str  # PRICE_DROP, NEW_LISTING, VISIT_REMINDER
    filters: Optional[Dict[str, Any]] = None
    threshold: Optional[int] = None    # price threshold in INR
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
