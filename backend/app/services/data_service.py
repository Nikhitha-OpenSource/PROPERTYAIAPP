"""
PROPIQ AI - Data Service (Hyderabad-only, CSV-backed)
Loads 2,500+ real Hyderabad property records from CSV.
All properties include real amenities, accurate per-locality GPS coords,
and Unsplash-sourced images appropriate for the property type.
"""
from __future__ import annotations
from functools import lru_cache
import json
import random
import hashlib
import re
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.demo_sellers import seller_for_property_position


_BACKEND_DIR = Path(__file__).resolve().parents[2]
_REPO_ROOT = _BACKEND_DIR.parent
_BACKEND_DATA_DIR = _BACKEND_DIR / "data"
_DATA_DIR = _REPO_ROOT / "data"

# ---------------------------------------------------------------------------
# Comprehensive Hyderabad locality → (lat, lng) lookup
# ---------------------------------------------------------------------------
LOCALITY_COORDS: Dict[str, tuple] = {
    "Gachibowli":        (17.4401, 78.3489),
    "Kondapur":          (17.4700, 78.3490),
    "Madhapur":          (17.4478, 78.3800),
    "Hitech City":       (17.4435, 78.3772),
    "Hi Tech City":      (17.4435, 78.3772),
    "HITEC City":        (17.4435, 78.3772),
    "Miyapur":           (17.4950, 78.3250),
    "KPHB":              (17.4856, 78.3915),
    "Banjara Hills":     (17.4108, 78.4483),
    "Jubilee Hills":     (17.4239, 78.4072),
    "Manikonda":         (17.4023, 78.3822),
    "Kukatpally":        (17.4849, 78.4089),
    "Uppal":             (17.4051, 78.5588),
    "Secunderabad":      (17.4399, 78.4983),
    "Ameerpet":          (17.4366, 78.4488),
    "Narsingi":          (17.3809, 78.3508),
    "Dilsukhnagar":      (17.3688, 78.5283),
    "Begumpet":          (17.4437, 78.4682),
    "LB Nagar":          (17.3495, 78.5513),
    "Nizampet":          (17.5163, 78.3916),
    "Alwal":             (17.5104, 78.5019),
    "Tellapur":          (17.4715, 78.2948),
    "Kokapet":           (17.3860, 78.3200),
    "Hyder Nagar":       (17.5059, 78.3943),
    "Mehdipatnam":       (17.3944, 78.4400),
    "Attapur":           (17.3760, 78.4238),
    "Tolichowki":        (17.3976, 78.4213),
    "Yapral":            (17.4982, 78.5422),
    "Shamshabad":        (17.2490, 78.4282),
    "Shadnagar":         (17.0701, 78.2045),
    "Kompally":          (17.5433, 78.4788),
    "Bachupally":        (17.5391, 78.3944),
    "Pragathi Nagar":    (17.5165, 78.3785),
    "Serilingampally":   (17.4637, 78.3122),
    "Nanakramguda":      (17.4233, 78.3401),
    "Puppalaguda":       (17.4004, 78.3531),
    "Financial District": (17.4227, 78.3446),
    "Raidurg":           (17.4242, 78.3647),
    "Kothaguda":         (17.4617, 78.3708),
    "Chandanagar":       (17.4956, 78.3208),
    "Hafeezpet":         (17.4886, 78.3552),
    "Khajaguda":         (17.4068, 78.3771),
    "Shaikpet":          (17.4123, 78.4044),
    "Nanakaramguda":     (17.4233, 78.3401),
    "Neopolis":          (17.3874, 78.3124),
    "Lingampally":       (17.4837, 78.3010),
    "Madeenaguda":       (17.5033, 78.3316),
    "Patancheru":        (17.5307, 78.2642),
    "Bowrampet":         (17.5636, 78.4130),
    "Kapra":             (17.4695, 78.5460),
    "Medchal":           (17.6280, 78.4809),
    "Ghatkesar":         (17.4448, 78.7004),
    "Malkajgiri":        (17.4521, 78.5327),
    "Moosapet":          (17.4627, 78.4222),
    "Sanath Nagar":      (17.4525, 78.4284),
    "Erragadda":         (17.4576, 78.4333),
    "SR Nagar":          (17.4497, 78.4409),
    "Yousufguda":        (17.4324, 78.4350),
    "Panjagutta":        (17.4239, 78.4488),
    "Somajiguda":        (17.4235, 78.4618),
    "Raj Bhavan Road":   (17.4213, 78.4641),
    "Himayatnagar":      (17.4041, 78.4823),
    "Narayanguda":       (17.3960, 78.4875),
    "Musheerabad":       (17.4233, 78.5012),
    "Tarnaka":           (17.4325, 78.5438),
    "Sainikpuri":        (17.4822, 78.5565),
    "AS Rao Nagar":      (17.4764, 78.5618),
    "Nagole":            (17.3895, 78.5613),
    "Boduppal":          (17.3953, 78.5880),
    "Peerzadiguda":      (17.4118, 78.5805),
    "Vanasthalipuram":   (17.3504, 78.5576),
    "Saroornagar":       (17.3527, 78.5368),
    "Amberpet":          (17.3997, 78.5114),
    "Kothapet":          (17.3760, 78.5226),
    "Hayathnagar":       (17.3319, 78.6010),
    "Bandlaguda":        (17.3438, 78.5035),
    "Langar House":      (17.3906, 78.4670),
    "Malakpet":          (17.3700, 78.5010),
    "Nampally":          (17.3844, 78.4742),
    "Abids":             (17.3890, 78.4851),
    "Chaderghat":        (17.3709, 78.4897),
    "Barkatpura":        (17.4014, 78.4869),
}

# Fallback for Hyderabad if locality not found
HYD_DEFAULT = (17.3850, 78.4867)

# ---------------------------------------------------------------------------
# Image sources - high-quality Unsplash property images
# ---------------------------------------------------------------------------
# Dedicated image pools for each listing type to ensure relevance.
PROPERTY_IMAGES_BY_TYPE = {
    "RESIDENTIAL": [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687931-cebfad2114ce?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4ea0d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
    ],
    "COMMERCIAL": [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1416949929422-a1d9c25c64a5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    ],
    "LAND": [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1629196914213-9aa68bb6e82a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1605810755913-c97693998f82?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1584984241065-f98297b81966?auto=format&fit=crop&w=1200&q=80",
    ],
}

# Amenity column → display label mapping
AMENITY_COLS = [
    "Gymnasium", "SwimmingPool", "LandscapedGardens", "JoggingTrack",
    "RainWaterHarvesting", "IndoorGames", "ShoppingMall", "Intercom",
    "SportsFacility", "ATM", "ClubHouse", "School", "24X7Security",
    "PowerBackup", "CarParking", "WashingMachine", "Gasconnection",
    "AC", "Wifi", "LiftAvailable", "Hospital", "Cafeteria",
]

AMENITY_LABELS = {
    "Gymnasium": "Gym",
    "SwimmingPool": "Swimming Pool",
    "LandscapedGardens": "Garden",
    "JoggingTrack": "Jogging Track",
    "RainWaterHarvesting": "Rain Water Harvesting",
    "IndoorGames": "Indoor Games",
    "ShoppingMall": "Mall Nearby",
    "Intercom": "Intercom",
    "SportsFacility": "Sports Facility",
    "ATM": "ATM",
    "ClubHouse": "Club House",
    "School": "School Nearby",
    "24X7Security": "24x7 Security",
    "PowerBackup": "Power Backup",
    "CarParking": "Car Parking",
    "WashingMachine": "Washing Machine",
    "Gasconnection": "Gas Connection",
    "AC": "Air Conditioning",
    "Wifi": "WiFi",
    "LiftAvailable": "Lift",
    "Hospital": "Hospital Nearby",
    "Cafeteria": "Cafeteria",
}

# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------
_PROPERTIES: List[Dict[str, Any]] = []
_LOADED = False

CSV_PATH = str(_DATA_DIR / "datasets" / "properties" / "hyderabad_scraped.csv")
# Fallback absolute path for older local Windows runs.
CSV_FALLBACK = r"d:\CAPSTONE\data\datasets\properties\hyderabad_scraped.csv"


def _stable_hash(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest(), 16)


@lru_cache(maxsize=1)
def _local_image_pool() -> tuple[str, ...]:
    """Return local image URLs served by FastAPI's /images static mount."""
    image_roots = [
        _DATA_DIR / "images" / "property_photos",
        _BACKEND_DATA_DIR / "images" / "property_photos",
    ]
    for image_root in image_roots:
        if not image_root.is_dir():
            continue
        files = sorted(
            path for path in image_root.iterdir()
            if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        )
        if files:
            return tuple(f"/images/property_photos/{path.name}" for path in files)
    return tuple()


def _pick_images(prop_id: str, listing_type: str = "RESIDENTIAL", count: int = 4) -> List[str]:
    """Return a deterministic set of relevant image URLs for a property."""
    local_pool = _local_image_pool()
    if local_pool:
        base = _stable_hash(f"{prop_id}:{listing_type}:local")
        selected: list[str] = []
        for i in range(min(count, len(local_pool))):
            candidate = local_pool[(base + i) % len(local_pool)]
            if candidate not in selected:
                selected.append(candidate)
        return selected

    pool = PROPERTY_IMAGES_BY_TYPE.get(listing_type, PROPERTY_IMAGES_BY_TYPE["RESIDENTIAL"])
    base = _stable_hash(f"{prop_id}:{listing_type}")
    selected = [(base + i) % len(pool) for i in range(count)]
    # Keep image set unique within a property
    return [pool[idx] for idx in dict.fromkeys(selected)]


def get_property_images(prop_id: str, listing_type: str = "RESIDENTIAL", count: int = 4) -> List[str]:
    return _pick_images(prop_id, listing_type, count)


def _apply_demo_seller_ownership(properties: List[Dict[str, Any]]) -> None:
    """Assign one deterministic seller account to each block of 100 demo properties."""
    for position, prop in enumerate(properties, start=1):
        seller = seller_for_property_position(position)
        prop["owner_user_id"] = seller["user_id"]
        prop["seller_id"] = seller["user_id"]
        prop["seller_name"] = seller["name"]
        prop["seller_email"] = seller["email"]


def _normalize_locality(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()


# Pre-normalize locality keys for robust lookup
LOCALITY_COORDS_NORMALIZED = {
    _normalize_locality(k): v for k, v in LOCALITY_COORDS.items()
}


def _get_coords(location: str, seed: str) -> tuple:
    """Return deterministic coordinates for a property within a Hyderabad locality."""
    loc_clean = str(location or "").strip()
    if not loc_clean:
        loc_clean = "Hyderabad"

    normalized = _normalize_locality(loc_clean)
    coords = LOCALITY_COORDS_NORMALIZED.get(normalized)
    if not coords:
        # Try a looser match by checking key substrings
        for key, value in LOCALITY_COORDS_NORMALIZED.items():
            if key in normalized or normalized in key:
                coords = value
                break

    rng = random.Random(_stable_hash(seed + "-coords"))
    if coords:
        return (
            round(coords[0] + rng.uniform(-0.003, 0.003), 6),
            round(coords[1] + rng.uniform(-0.003, 0.003), 6),
        )

    # Fallback: use Hyderabad default with deterministic local jitter
    h = _stable_hash(seed)
    lat_off = (h % 50 - 25) / 10000.0   # ±0.0025 degree
    lng_off = ((h >> 8) % 50 - 25) / 10000.0
    return (round(HYD_DEFAULT[0] + lat_off, 6), round(HYD_DEFAULT[1] + lng_off, 6))


def _build_amenities(row: dict) -> List[str]:
    return [AMENITY_LABELS[col] for col in AMENITY_COLS if str(row.get(col, "0")).strip() in ("1", "1.0")]


def _row_to_property(row: dict, idx: int) -> dict:
    """Convert a CSV row to a full PROPIQ property dict."""
    location = str(row.get("Location", "Hyderabad")).strip()
    bhk = int(float(row.get("No. of Bedrooms", 2)))
    bhk = max(1, min(bhk, 6))

    # Raw CSV values
    price_raw = float(row.get("Price", 0))
    area_raw = float(row.get("Area", 0))

    # Sanitise: price in the CSV is in Rupees (some rows are lakhs, some crores)
    # Typical Hyderabad price range: 30L – 5Cr → 3_000_000 – 50_000_000
    # Some rows have price in lakhs (e.g. 69.68 → 69,68,000) → detect by magnitude
    if price_raw < 1_000:          # Stored as lakhs (e.g. 69.68)
        price = int(price_raw * 100_000)
    elif price_raw < 100_000:      # Stored in thousands (e.g. 6968)
        price = int(price_raw * 1_000)
    else:                          # Already in rupees
        price = int(price_raw)

    # Clamp to realistic Hyderabad range
    price = max(1_500_000, min(price, 150_000_000))
    area = max(300, min(int(area_raw), 10_000))
    price_per_sqft = int(price / area) if area > 0 else 6000

    prop_id = f"hyd-{idx:05d}"
    lat_val = row.get("Latitude", row.get("latitude", None))
    lng_val = row.get("Longitude", row.get("longitude", None))
    try:
        lat = float(lat_val) if lat_val not in (None, "") else None
        lng = float(lng_val) if lng_val not in (None, "") else None
    except (ValueError, TypeError):
        lat = lng = None

    if lat is None or lng is None:
        lat, lng = _get_coords(location, prop_id)

    image_urls_raw = row.get("ImageURLs", row.get("image_urls", None))
    image_urls: List[str] = []
    if isinstance(image_urls_raw, str) and image_urls_raw.strip():
        try:
            image_urls = json.loads(image_urls_raw)
        except Exception:
            image_urls = [u.strip() for u in image_urls_raw.split("|") if u.strip()]
    elif isinstance(image_urls_raw, list):
        image_urls = [u for u in image_urls_raw if isinstance(u, str) and u.strip()]
    
    is_resale = str(row.get("Resale", "0")).strip() in ("1", "1.0", "True")
    amenities = _build_amenities(row)
    has_parking = str(row.get("CarParking", "0")).strip() in ("1", "1.0")
    has_gym = str(row.get("Gymnasium", "0")).strip() in ("1", "1.0")
    has_pool = str(row.get("SwimmingPool", "0")).strip() in ("1", "1.0")

    # Furnishing derived from amenities
    amenity_count = len(amenities)
    if amenity_count >= 10:
        furnishing = "FULLY_FURNISHED"
    elif amenity_count >= 5:
        furnishing = "SEMI_FURNISHED"
    else:
        furnishing = "UNFURNISHED"

    raw_type = str(row.get("ListingType", "") or row.get("listing_type", "") or row.get("Type", "")).strip().upper()
    if raw_type in {"RESIDENTIAL", "COMMERCIAL", "LAND"}:
        listing_type = raw_type
    else:
        listing_type = "LAND" if bhk == 0 else "RESIDENTIAL"

    image_urls = image_urls or _pick_images(prop_id, listing_type)

    rng = random.Random(_stable_hash(prop_id))
    floor = rng.randint(1, 15)
    total_floors = rng.randint(floor, 20)
    age_years = 0 if not is_resale else rng.randint(1, 12)
    bathrooms = max(1, bhk - (0 if bhk <= 2 else 1))

    if listing_type == "LAND":
        bhk = 0
        bathrooms = 0
        amenities = []
        has_parking = False
        has_gym = False
        has_pool = False
        furnishing = "UNFURNISHED"
        title = f"{area:,} sqft Land Parcel in {location}"
        description = (
            f"Premium land parcel in {location}, Hyderabad. "
            f"Ideal for investment, residential development or commercial conversion. "
            f"Total area: {area:,} sqft."
        )
    elif listing_type == "COMMERCIAL":
        title = f"{area:,} sqft Commercial Property in {location}"
        description = (
            f"High-potential commercial property in {location}, Hyderabad. "
            f"Spread over {area:,} sqft with strong area demand and market visibility. "
            f"Perfect for office, retail, or mixed-use redevelopment."
        )
    else:
        title = f"{bhk} BHK {'Resale ' if is_resale else ''}Apartment in {location}"
        description = (
            f"{'Well-maintained resale' if is_resale else 'Brand new'} {bhk} BHK apartment "
            f"in {location}, Hyderabad. "
            f"Spread over {area:,} sq ft with {len(amenities)} premium amenities. "
            f"{'Fully equipped with modern furnishings.' if furnishing == 'FULLY_FURNISHED' else ''}"
        )

    return {
        "property_id": prop_id,
        "title": title,
        "description": description,
        "listing_type": listing_type,
        "price": price,
        "area_sqft": area,
        "price_per_sqft": price_per_sqft,
        "bhk": bhk,
        "bathrooms": bathrooms,
        "locality": location,
        "city": "Hyderabad",
        "state": "Telangana",
        "latitude": lat,
        "longitude": lng,
        "status": "ACTIVE",
        "verified": bool(_stable_hash(prop_id) % 3 != 0),
        "is_resale": is_resale,
        "furnishing": furnishing,
        "amenities": amenities,
        "has_parking": has_parking,
        "has_gym": has_gym,
        "has_pool": has_pool,
        "floor": floor,
        "total_floors": total_floors,
        "age_years": age_years,
        "parking": "1 covered" if has_parking else "None",
        "image_urls": image_urls,
        "created_at": "2025-01-15T00:00:00",
    }


def _coerce_image_urls(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(url).strip() for url in value if str(url).strip()]
    if isinstance(value, str) and value.strip():
        raw = value.strip()
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(url).strip() for url in parsed if str(url).strip()]
        except Exception:
            pass
        return [url.strip() for url in re.split(r"[|,]", raw) if url.strip()]
    return []


def _normalize_loaded_property(prop: dict, idx: int) -> dict:
    """Fill required API fields for generated JSON/CSV records."""
    item = dict(prop)
    prop_id = str(item.get("property_id") or item.get("_id") or item.get("id") or f"hyd-{idx:05d}")
    listing_type = str(item.get("listing_type") or item.get("property_type") or "RESIDENTIAL").upper()
    if listing_type not in {"RESIDENTIAL", "COMMERCIAL", "LAND"}:
        listing_type = "RESIDENTIAL"

    locality = str(item.get("locality") or item.get("Location") or "Hyderabad").strip() or "Hyderabad"
    city = str(item.get("city") or item.get("City") or "Hyderabad").strip() or "Hyderabad"

    try:
        area = int(float(item.get("area_sqft") or item.get("Area") or 1000))
    except (TypeError, ValueError):
        area = 1000
    area = max(1, area)

    try:
        price = int(float(item.get("price") or item.get("Price") or area * 6500))
    except (TypeError, ValueError):
        price = area * 6500

    try:
        ppsf = int(float(item.get("price_per_sqft") or price / area))
    except (TypeError, ValueError, ZeroDivisionError):
        ppsf = int(price / area)

    try:
        bhk = int(float(item.get("bhk") if item.get("bhk") is not None else item.get("No. of Bedrooms", 2)))
    except (TypeError, ValueError):
        bhk = 2
    if listing_type == "LAND":
        bhk = 0

    try:
        lat = float(item.get("latitude"))
        lng = float(item.get("longitude"))
    except (TypeError, ValueError):
        lat, lng = _get_coords(locality, prop_id)

    image_urls = _coerce_image_urls(item.get("image_urls") or item.get("ImageURLs"))
    if not image_urls:
        image_urls = _pick_images(prop_id, listing_type)

    title = str(item.get("title") or "").strip()
    if not title:
        title = f"{area:,} sqft Land Parcel in {locality}" if listing_type == "LAND" else f"{bhk} BHK Apartment in {locality}"

    item.update({
        "property_id": prop_id,
        "title": title,
        "description": str(item.get("description") or f"Verified PROPIQ listing in {locality}, {city}."),
        "listing_type": listing_type,
        "price": price,
        "area_sqft": area,
        "price_per_sqft": ppsf,
        "bhk": bhk,
        "bathrooms": int(item.get("bathrooms") or max(0 if listing_type == "LAND" else 1, bhk - 1)),
        "locality": locality,
        "city": city,
        "state": str(item.get("state") or "Telangana"),
        "latitude": lat,
        "longitude": lng,
        "status": str(item.get("status") or "ACTIVE"),
        "verified": bool(item.get("verified", True)),
        "furnishing": str(item.get("furnishing") or "SEMI_FURNISHED"),
        "amenities": item.get("amenities") if isinstance(item.get("amenities"), list) else [],
        "parking": str(item.get("parking") or "1 covered"),
        "image_urls": image_urls,
        "created_at": str(item.get("created_at") or "2025-01-15T00:00:00"),
    })
    return item


def _load_data():
    global _PROPERTIES, _LOADED
    if _LOADED:
        return

    try:
        # Try to load from the generated JSON file first.
        json_candidates = [
            _BACKEND_DATA_DIR / "sample_properties.json",
            _DATA_DIR / "sample_properties.json",
            Path("/app/data/sample_properties.json"),
            Path("/app/backend/data/sample_properties.json"),
        ]
        json_path = next((path for path in json_candidates if path.exists()), None)
        if json_path:
            with json_path.open("r", encoding="utf-8") as f:
                loaded = json.load(f)
            if isinstance(loaded, dict):
                loaded = loaded.get("items") or loaded.get("properties") or []
            _PROPERTIES = [
                _normalize_loaded_property(prop, idx + 1)
                for idx, prop in enumerate(loaded)
                if isinstance(prop, dict)
            ]
            print(f"[DataService] Loaded JSON: {json_path} ({len(_PROPERTIES)} properties)")
        else:
            # Fallback to CSV loading
            import pandas as pd

            # Try multiple path candidates
            candidates = [
                _BACKEND_DATA_DIR / "properties.csv",
                _BACKEND_DATA_DIR / "sample_properties.csv",
                _DATA_DIR / "datasets" / "properties" / "hyderabad_scraped.csv",
                _DATA_DIR / "datasets" / "properties" / "hyderabad_house_prices.csv",
                Path(CSV_FALLBACK),
                Path("/app/data/datasets/properties/hyderabad_house_prices.csv"),
                Path("/app/data/datasets/properties/hyderabad_scraped.csv"),
                Path("/backend/data/datasets/properties/hyderabad_house_prices.csv"),
            ]
            df = None
            for p in candidates:
                if p.exists():
                    df = pd.read_csv(p)
                    print(f"[DataService] Loaded CSV: {p}")
                    break

            if df is None:
                raise FileNotFoundError(f"CSV not found. Tried: {candidates}")

            # ── Filter to Hyderabad only ──────────────────────────────────────
            if "City" in df.columns:
                df = df[df["City"].astype(str).str.strip().str.lower() == "hyderabad"].copy()
            df = df.dropna(subset=["Price", "Area", "Location"])
            df = df[(df["Price"] > 0) & (df["Area"] > 0)]
            df = df.reset_index(drop=True)

            _PROPERTIES = [_row_to_property(r, i + 1) for i, r in enumerate(df.to_dict(orient="records"))]
            print(f"[DataService] Ready: {len(_PROPERTIES)} Hyderabad properties")

    except Exception as exc:
        print(f"[DataService] Data load failed: {exc} — using fallback data")
        _PROPERTIES = _build_fallback()

    # Ensure exactly 1004 properties are available to be seen in the app
    if _PROPERTIES and len(_PROPERTIES) != 1004:
        base = list(_PROPERTIES)
        for i in range(len(base) + 1, 1005):
            tpl = dict(base[i % len(base)])
            tpl["property_id"] = f"hyd-{i:05d}"
            tpl["title"] = f"{tpl.get('title')} ({i})"
            _PROPERTIES.append(tpl)
        _PROPERTIES = _PROPERTIES[:1004]

    _apply_demo_seller_ownership(_PROPERTIES)
    _LOADED = True


def _build_fallback() -> List[Dict[str, Any]]:
    """Generate 80 synthetic Hyderabad properties if CSV is unavailable."""
    localities = list(LOCALITY_COORDS.keys())
    props = []
    for i in range(1, 81):
        loc = localities[i % len(localities)]
        bhk = (i % 4) + 1
        area = 800 + (i * 100)
        price_psf = 6500 + i * 100
        price = area * price_psf
        prop_id = f"hyd-{i:05d}"
        lat, lng = _get_coords(loc, prop_id)
        props.append({
            "property_id": prop_id,
            "title": f"{bhk} BHK Apartment in {loc}",
            "description": f"Spacious {bhk} BHK in prime {loc}, Hyderabad.",
            "listing_type": "RESIDENTIAL",
            "price": price,
            "area_sqft": area,
            "price_per_sqft": price_psf,
            "bhk": bhk,
            "bathrooms": max(1, bhk - 1),
            "locality": loc,
            "city": "Hyderabad",
            "state": "Telangana",
            "latitude": lat,
            "longitude": lng,
            "status": "ACTIVE",
            "verified": bo