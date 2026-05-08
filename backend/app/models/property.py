"""PROPIQ AI — Pydantic Property Model (MongoDB/CosmosDB API)"""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

def generate_uuid():
    return str(uuid.uuid4())

class PropertyModel(BaseModel):
    property_id: str = Field(default_factory=generate_uuid)
    listing_type: str = Field(..., description="RESIDENTIAL, COMMERCIAL, LAND")
    title: str
    description: Optional[str] = None
    address: Optional[str] = None
    locality: str
    city: str
    state: str
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price: int
    price_per_sqft: Optional[int] = None
    area_sqft: int
    bhk: Optional[int] = None
    bathrooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    age_years: Optional[int] = None
    furnishing: Optional[str] = None  # FURNISHED, SEMI, UNFURNISHED
    parking: Optional[str] = None     # COVERED, OPEN, NONE
    facing: Optional[str] = None      # EAST, WEST, NORTH, SOUTH
    amenities: List[str] = Field(default_factory=list)
    status: str = Field(default="ACTIVE", description="ACTIVE, SOLD, RENTED, DISPUTED")
    seller_id: Optional[str] = None
    verified: bool = False
    image_urls: List[str] = Field(default_factory=list)
    anomaly_flag: bool = False
    anomaly_score: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LandParcelModel(BaseModel):
    parcel_id: str = Field(default_factory=generate_uuid)
    survey_number: str
    district: str
    mandal: str
    village: str
    area_acres: float
    land_use_zone: str  # RESIDENTIAL, COMMERCIAL, INDUSTRIAL, AGRICULTURAL, MIXED
    fsi_allowed: float
    setback_meters: Optional[float] = None
    road_width_meters: Optional[float] = None
    current_owner: str
    deed_doc_url: Optional[str] = None
    encumbrance: str = Field(default="CLEAN", description="CLEAN, MORTGAGED, DISPUTED, LITIGATED")
    rera_registered: bool = False
    rera_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    commercial_score: Optional[float] = None
    commercial_label: Optional[str] = None # LOW, MEDIUM, HIGH
    property_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
