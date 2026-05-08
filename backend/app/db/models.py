from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", "role", name="uq_users_email_role"),)

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="BUYER", nullable=False)  # BUYER/SELLER/ADMIN
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Property(Base):
    __tablename__ = "properties"

    property_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    owner_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    property_type: Mapped[str] = mapped_column(String(32), nullable=False)  # RESIDENTIAL/COMMERCIAL/LAND
    listing_type: Mapped[str] = mapped_column(String(16), nullable=False)   # SALE/RENT

    locality: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    city: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    state: Mapped[str] = mapped_column(String(120), default="Telangana", nullable=False)

    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    price: Mapped[float] = mapped_column(Float, nullable=False)
    area_sqft: Mapped[float] = mapped_column(Float, nullable=False)
    bhk: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", lazy="joined")


class Lead(Base):
    __tablename__ = "leads"

    lead_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    property_id: Mapped[str] = mapped_column(String(64), ForeignKey("properties.property_id"), index=True, nullable=False)
    buyer_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True, nullable=False)
    seller_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True, nullable=False)
    stage: Mapped[str] = mapped_column(String(32), default="NEW", nullable=False)  # NEW/CONTACTED/VISIT/NEGOTIATION/CLOSED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    msg_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    channel_id: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    property_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("properties.property_id"), index=True, nullable=True)
    sender_user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.user_id"), nullable=True)
    sender_role: Mapped[str] = mapped_column(String(32), default="BUYER", nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)


class Event(Base):
    __tablename__ = "events"

    event_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    ts: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    event_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    property_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Review(Base):
    __tablename__ = "reviews"

    review_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    property_id: Mapped[str] = mapped_column(String(64), ForeignKey("properties.property_id"), index=True, nullable=False)
    seller_user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.user_id"), index=True, nullable=True)
    reviewer_user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.user_id"), index=True, nullable=True)
    reviewer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PUBLISHED", index=True, nullable=False)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    property = relationship("Property", lazy="joined")


class DeedVerification(Base):
    __tablename__ = "deed_verifications"

    verification_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    parcel_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    submitted_by_user_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    submitted_by_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    submitted_by_role: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    stage: Mapped[str] = mapped_column(String(32), default="UPLOAD", index=True, nullable=False)
    declared_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    extracted_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    name_match_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    legal_check_status: Mapped[str] = mapped_column(String(32), default="PENDING", index=True, nullable=False)
    legal_check_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    legal_sources_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    documents_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ocr_raw_data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estimated_days: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
