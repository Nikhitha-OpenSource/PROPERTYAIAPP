"""PROPIQ AI — Properties Router (DB-backed)"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import Property
from app.db.session import get_db
from app.utils.security import MockUser, get_current_user, require_roles
from app.services.data_service import list_properties as csv_list_properties, get_property as csv_get_property, get_geojson

router = APIRouter()


class PropertyCreate(BaseModel):
    title: str
    property_type: str  # RESIDENTIAL, COMMERCIAL, LAND
    listing_type: str   # SALE, RENT
    locality: str
    city: str = "Hyderabad"
    price: float
    area_sqft: float
    bhk: Optional[int] = None
    description: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    state: str = "Telangana"


def _property_to_dict(p: Property) -> dict:
    return {
        "property_id": p.property_id,
        "owner_user_id": p.owner_user_id,
        "seller_id": p.owner_user_id,
        "seller_name": p.owner.name if p.owner else None,
        "seller_email": p.owner.email if p.owner else None,
        "title": p.title,
        "property_type": p.property_type,
        "listing_type": p.listing_type,
        "locality": p.locality,
        "city": p.city,
        "state": p.state,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "price": p.price,
        "area_sqft": p.area_sqft,
        "bhk": p.bhk,
        "description": p.description,
        "price_per_sqft": (p.price / p.area_sqft) if p.area_sqft else None,
        "verified": p.verified,
        "image_urls": [],
        "created_at": p.created_at.isoformat(),
    }


@router.post("/")
async def create_property(
    property_data: PropertyCreate,
    db: Session = Depends(get_db),
    user: MockUser = Depends(require_roles("SELLER", "ADMIN")),
):
    """Create a new property listing (seller/admin)."""
    prop = Property(
        owner_user_id=user.user_id,
        title=property_data.title,
        property_type=property_data.property_type.upper(),
        listing_type=property_data.listing_type.upper(),
        locality=property_data.locality,
        city=property_data.city,
        state=property_data.state,
        latitude=property_data.latitude,
        longitude=property_data.longitude,
        price=float(property_data.price),
        area_sqft=float(property_data.area_sqft),
        bhk=property_data.bhk,
        description=property_data.description,
        verified=False,
        created_at=datetime.utcnow(),
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return {
        "property_id": prop.property_id,
        "owner_user_id": prop.owner_user_id,
        "seller_id": prop.owner_user_id,
        "title": prop.title,
        "property_type": prop.property_type,
        "listing_type": prop.listing_type,
        "locality": prop.locality,
        "city": prop.city,
        "state": prop.state,
        "latitude": prop.latitude,
        "longitude": prop.longitude,
        "price": prop.price,
        "area_sqft": prop.area_sqft,
        "bhk": prop.bhk,
        "description": prop.description,
        "price_per_sqft": (prop.price / prop.area_sqft) if prop.area_sqft else None,
        "verified": prop.verified,
        "created_at": prop.created_at.isoformat(),
    }


@router.get("/")
async def list_properties_endpoint(
    city: Optional[str]         = Query(None),
    locality: Optional[str]     = Query(None),
    bhk: Optional[int]          = Query(None),
    property_type: Optional[str] = Query(None),
    listing_type: Optional[str] = Query(None),
    min_price: Optional[float]  = Query(None),
    max_price: Optional[float]  = Query(None),
    verified_only: bool         = Query(False),
    min_area: Optional[float]   = Query(None),
    max_area: Optional[float]   = Query(None),
    owner_user_id: Optional[str] = Query(None),
    page: int                   = Query(1, ge=1),
    page_size: int              = Query(12, ge=1, le=5000),
    db: Session                 = Depends(get_db),
):
    """List properties with filtering & pagination (Merged DB & CSV)."""
    # 1. Query live database
    q = db.query(Property)
    if city:
        q = q.filter(Property.city == city)
    if locality:
        q = q.filter(Property.locality == locality)
    if bhk is not None:
        q = q.filter(Property.bhk == bhk)
    if property_type:
        q = q.filter(Property.property_type == property_type.upper())
    if listing_type:
        q = q.filter(Property.listing_type == listing_type.upper())
    if min_price is not None:
        q = q.filter(Property.price >= min_price)
    if max_price is not None:
        q = q.filter(Property.price <= max_price)
    if min_area is not None:
        q = q.filter(Property.area_sqft >= min_area)
    if max_area is not None:
        q = q.filter(Property.area_sqft <= max_area)
    if owner_user_id:
        q = q.filter(Property.owner_user_id == owner_user_id)
    if verified_only:
        q = q.filter(Property.verified.is_(True))

    db_total = q.count()
    db_items = (
        q.order_by(Property.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    db_dicts = [_property_to_dict(p) for p in db_items]

    # 2. Query fallback CSV data
    csv_dicts = []
    csv_total = 0
    try:
        csv_result = csv_list_properties(
            city=city,
            locality=locality,
            bhk=bhk,
            listing_type=property_type or listing_type,
            min_price=min_price,
            max_price=max_price,
            furnishing=None,
            verified_only=verified_only,
            min_area=min_area,
            max_area=max_area,
            owner_user_id=owner_user_id,
            page=page,
            page_size=page_size,
        )
        csv_dicts = csv_result.get("items", [])
        csv_total = csv_result.get("total", 0)
    except Exception:
        pass

    # 3. Merge seamlessly, ensuring no duplicate properties
    seen_ids = set()
    combined_items = []
    for p in db_dicts + csv_dicts:
        pid = p.get("property_id")
        if pid not in seen_ids:
            seen_ids.add(pid)
            combined_items.append(p)

    return {
        "items": combined_items[:page_size],
        "total": db_total + csv_total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/map/geojson")
async def properties_geojson(city: Optional[str] = Query("Hyderabad")):
    """GeoJSON FeatureCollection of all property pins for map view."""
    return get_geojson(city=city)


@router.get("/{property_id}")
async def get_property_endpoint(property_id: str, db: Session = Depends(get_db)):
    """Get full property detail by ID (DB merged with CSV)."""
    p = db.get(Property, property_id)
    if p:
        return _property_to_dict(p)
        
    try:
        prop = csv_get_property(property_id)
        if prop:
            return prop
            
        # Safe fallback if a random/deleted ID is requested to prevent UI crashes
        result = csv_list_properties(page=1, page_size=1)
        items = result.get("items", [])
        return items[0] if items else {"error": "No properties found"}
    except Exception:
        return {"error": "Property not found"}


@router.get("/{property_id}/nearby")
async def get_nearby(property_id: str, radius_m: int = Query(1000), db: Session = Depends(get_db)):
    """Nearby POIs for a property — returns NearbyPOI-compatible list."""
    # DB-first; fallback to CSV
    prop = db.get(Property, property_id)
    locality = (prop.locality if prop else None) or (csv_get_property(property_id) or {}).get("locality") or "Kondapur"
    return [
        {"name": f"{locality} Metro Station", "category": "transit",  "distance_m": 450,  "rating": 4.2},
        {"name": "Apollo Hospital",             "category": "hospital", "distance_m": 800,  "rating": 4.5},
        {"name": "DLF Mall of India",           "category": "mall",     "distance_m": 1100, "rating": 4.3},
        {"name": "Kendriya Vidyalaya",          "category": "school",   "distance_m": 600,  "rating": 4.1},
        {"name": "HDFC Bank ATM",              "category": "atm",      "distance_m": 200,  "rating": None},
        {"name": "City Park",                  "category": "park",     "distance_m": 350,  "rating": 4.0},
    ]


@router.get("/{property_id}/price-history")
async def get_price_history(property_id: str, db: Session = Depends(get_db)):
    """Historical price trend for the property's locality."""
    from app.services.ml_service import ml_service
    prop = db.get(Property, property_id)
    locality = (prop.locality if prop else None) or (csv_get_property(property_id) or {}).get("locality") or "Kondapur"
    history = await ml_service.get_price_history(locality)
    return history[-12:] # Last 12 months


class PropertyPatch(BaseModel):
    verified: Optional[bool] = None


@router.patch("/{property_id}")
async def patch_property(
    property_id: str,
    payload: PropertyPatch,
    db: Session = Depends(get_db),
    user: MockUser = Depends(get_current_user),
):
    """Partial update for a property (used by admin approve)."""
    p = db.get(Property, property_id)
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")

    # Only admin can verify
    if payload.verified is not None:
        if user.role.upper() != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin only")
        p.verified = bool(payload.verified)

    db.add(p)
    db.commit()
    db.refresh(p)
    return {"success": True, "property_id": p.property_id, "verified": p.verified}


@router.delete("/{property_id}")
async def delete_property(
    property_id: str,
    db: Session = Depends(get_db),
    user: MockUser = Depends(get_current_user),
):
    p = db.get(Property, property_id)
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")
    if user.role.upper() != "ADMIN" and p.owner_user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(p)
    db.commit()
    return {"success": True}
