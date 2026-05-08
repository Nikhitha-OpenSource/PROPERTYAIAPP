"""PROPIQ AI — Pydantic Deed Verification Model"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

def generate_uuid():
    return str(uuid.uuid4())

class DeedVerificationModel(BaseModel):
    verification_id: str = Field(default_factory=generate_uuid)
    parcel_id: str
    submitted_by: str
    stage: str = Field(
        default="UPLOAD",
        description="UPLOAD, OCR_EXTRACTION, NAME_VERIFY, LEGAL_CHECK, APPROVED, REJECTED"
    )
    extracted_name: Optional[str] = None   # from OCR
    declared_name: Optional[str] = None    # what seller entered
    name_match_score: Optional[float] = None # 0.0 – 1.0
    documents: List[str] = Field(default_factory=list) # list of Azure Blob URLs
    ocr_raw_data: Optional[Dict[str, Any]] = None      # raw Document Intelligence response
    notes: Optional[str] = None
    estimated_days: Optional[float] = None # days-to-complete estimate
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
