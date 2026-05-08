"""PROPIQ AI — Pydantic Schemas for Properties"""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class PropertyBase(BaseModel):
    listing_type: str
    title: str
    description: Optional[str] = None
    address: Optional[str] = None
    locality: str
    city: str = "Hyderabad"
    state: str = "Telangana"
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price: int = Field(..., gt=0, description="Price in INR")
    price_per_sqft: Optional[int] = None
    area_sqft: int = Field(..., gt=0)
    bhk: Optional[int] = None
    bathrooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    age_years: Optional[int] = None
    furnishing: Optional[str] = None
    parking: Optional[str] = None
    facing: Optional[str] = None
    amenities: Optional[List[str]] = []
    image_urls: Optional[List[str]] = []


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    status: Optional[str] = None
    amenities: Optional[List[str]] = None


class PropertyResponse(PropertyBase):
    property_id: str
    status: str
    seller_id: Optional[str] = None
    verified: bool = False
    anomaly_flag: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertyListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[PropertyResponse]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: dict
    properties: dict


class GeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


class NearbyPOI(BaseModel):
    name: str
    category: str   # school, hospital, mall, metro
    distance_m: float
    rating: Optional[float] = None
    place_id: Optional[str] = None


class PriceHistoryPoint(BaseModel):
    month: str
    avg_price_per_sqft: float
    median_price: int
    listing_count: int


class ReviewCreate(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    comment: str
    reviewer_name: str


class ReviewResponse(ReviewCreate):
    review_id: str
    property_id: str
    created_at: datetime
