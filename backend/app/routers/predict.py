"""PROPIQ AI — ML Prediction Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.ml_service import ml_service

router = APIRouter()


class LandPriceRequest(BaseModel):
    locality: str
    area_sqft: int
    bhk: Optional[int] = None
    age_years: int = 5
    floor: int = 1
    amenity_count: int = 3
    road_width: Optional[float] = None
    furnishing: str = "SEMI"
    listing_type: str = "RESIDENTIAL"


class LandPriceResponse(BaseModel):
    predicted_price: int
    predicted_price_per_sqft: int
    confidence_low: int
    confidence_high: int
    model_version: str


class AppreciationRequest(BaseModel):
    locality: str
    current_price_per_sqft: int
    horizon_years: List[int] = [1, 3, 5]


class AppreciationResponse(BaseModel):
    locality: str
    forecasts: dict  # { "1yr": {...}, "3yr": {...}, "5yr": {...} }


class CommercialScoreRequest(BaseModel):
    latitude: float
    longitude: float
    land_use_zone: str = "COMMERCIAL"
    fsi_allowed: float = 2.5
    road_width: float = 12.0
    area_sqft: int = 5000


class CommercialScoreResponse(BaseModel):
    score: float          # 0-100
    label: str            # LOW / MEDIUM / HIGH
    top_factors: List[str]
    nearby_business_count: int


class AnomalyRequest(BaseModel):
    property_id: str
    price: int
    price_per_sqft: int
    locality: str
    area_sqft: int
    listing_type: str


class AnomalyResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    reason: Optional[str] = None


@router.post("/land-price", response_model=LandPriceResponse)
async def predict_land_price(payload: LandPriceRequest):
    """Predict land/property price using XGBoost model."""
    result = await ml_service.predict_price(payload.model_dump())
    if not result:
        raise HTTPException(status_code=503, detail="ML model unavailable")
    return result


@router.post("/appreciation", response_model=AppreciationResponse)
async def predict_appreciation(payload: AppreciationRequest):
    """Forecast price appreciation for 1/3/5 years using Prophet + LSTM."""
    result = await ml_service.predict_appreciation(
        payload.locality, payload.current_price_per_sqft, payload.horizon_years
    )
    return result


@router.post("/commercial-score", response_model=CommercialScoreResponse)
async def predict_commercial_score(payload: CommercialScoreRequest):
    """Predict commercial viability score (0-100) for a land parcel."""
    result = await ml_service.predict_commercial_score(payload.model_dump())
    return result


@router.post("/anomaly", response_model=AnomalyResponse)
async def detect_anomaly(payload: AnomalyRequest):
    """Detect if a listing has suspicious pricing (Isolation Forest)."""
    result = await ml_service.detect_anomaly(payload.model_dump())
    return result


@router.get("/locality-insights/{locality}")
async def get_locality_insights(locality: str):
    """ML-based locality score: schools, hospitals, transit, safety, growth."""
    result = await ml_service.get_locality_insights(locality)
    if not result:
        raise HTTPException(status_code=404, detail="Locality not found")
    return result
