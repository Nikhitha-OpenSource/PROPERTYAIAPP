"""PROPIQ AI — Geocoding Service (Google Places API)"""
import httpx
from app.config import settings


async def get_nearby_pois(lat: float, lng: float, radius_m: int = 1000) -> list:
    """Fetch nearby POIs from Google Places API. Falls back to mock data."""
    if not settings.GOOGLE_PLACES_API_KEY:
        return _mock_pois(lat, lng)

    categories = [
        ("school", "school"),
        ("hospital", "hospital"),
        ("shopping_mall", "mall"),
        ("subway_station", "metro"),
    ]
    pois = []
    async with httpx.AsyncClient(timeout=10) as client:
        for gtype, category in categories:
            try:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                    params={
                        "location": f"{lat},{lng}",
                        "radius": radius_m,
                        "type": gtype,
                        "key": settings.GOOGLE_PLACES_API_KEY,
                    },
                )
                data = resp.json()
                for place in data.get("results", [])[:3]:
                    loc = place["geometry"]["location"]
                    dist = _haversine(lat, lng, loc["lat"], loc["lng"])
                    pois.append({
                        "name": place["name"],
                        "category": category,
                        "distance_m": round(dist),
                        "rating": place.get("rating"),
                        "place_id": place.get("place_id"),
                    })
            except Exception:
                continue
    return sorted(pois, key=lambda x: x["distance_m"])[:12]


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    import math
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def _mock_pois(lat: float, lng: float) -> list:
    import random
    return [
        {"name": "Green Valley School", "category": "school", "distance_m": random.randint(200, 800), "rating": round(random.uniform(3.5, 4.8), 1), "place_id": None},
        {"name": "City Hospital", "category": "hospital", "distance_m": random.randint(400, 1200), "rating": round(random.uniform(3.8, 4.5), 1), "place_id": None},
        {"name": "Nexus Mall", "category": "mall", "distance_m": random.randint(600, 2000), "rating": round(random.uniform(4.0, 4.7), 1), "place_id": None},
        {"name": "Metro Station", "category": "metro", "distance_m": random.randint(300, 1500), "rating": None, "place_id": None},
        {"name": "Presidency School", "category": "school", "distance_m": random.randint(800, 2000), "rating": round(random.uniform(3.5, 4.5), 1), "place_id": None},
        {"name": "Apollo Pharmacy", "category": "hospital", "distance_m": random.randint(100, 500), "rating": round(random.uniform(3.8, 4.2), 1), "place_id": None},
    ]
