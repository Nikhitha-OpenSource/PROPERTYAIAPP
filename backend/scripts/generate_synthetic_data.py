"""PROPIQ AI — Synthetic Data Generator
Generates 1000 realistic Hyderabad property records and inserts into DB.
Run: python scripts/generate_synthetic_data.py
"""
import asyncio, json, random, uuid
from datetime import datetime, timedelta

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

LOCALITIES = [
    "Kondapur", "Gachibowli", "Madhapur", "HITEC City", "Miyapur",
    "KPHB", "Banjara Hills", "Jubilee Hills", "Manikonda",
    "Kukatpally", "Narsingi", "Uppal", "Secunderabad", "Ameerpet",
]

LOCALITY_COORDS = {
    "Kondapur":    (17.4700, 78.3490), "Gachibowli": (17.4401, 78.3489),
    "Madhapur":    (17.4478, 78.3800), "HITEC City":  (17.4435, 78.3772),
    "Miyapur":     (17.4950, 78.3250), "KPHB":        (17.4856, 78.3915),
    "Banjara Hills": (17.4108, 78.4483), "Jubilee Hills": (17.4239, 78.4072),
    "Manikonda":   (17.4023, 78.3822), "Kukatpally":  (17.4840, 78.4066),
    "Narsingi":    (17.3988, 78.3641), "Uppal":       (17.4057, 78.5593),
    "Secunderabad": (17.4399, 78.4983), "Ameerpet":   (17.4374, 78.4487),
}

LOCALITY_MEDIANS = {
    "Kondapur": 7500, "Gachibowli": 9500, "Madhapur": 9000, "HITEC City": 8800,
    "Miyapur": 5500, "KPHB": 5200, "Banjara Hills": 12000, "Jubilee Hills": 11500,
    "Manikonda": 6000, "Kukatpally": 5000, "Narsingi": 6500, "Uppal": 4200,
    "Secunderabad": 5800, "Ameerpet": 5600,
}

AMENITIES_POOL = ["Gym", "Swimming Pool", "Clubhouse", "Park", "Power Backup",
                  "Security", "CCTV", "Lift", "Intercom", "Rainwater Harvesting",
                  "EV Charging", "Children Play Area", "Jogging Track"]

FAKE_TITLES = [
    "Spacious {bhk}BHK in {loc}", "Premium {bhk}BHK Flat at {loc}",
    "Modern {bhk}BHK Apartment, {loc}", "Ready-to-Move {bhk}BHK in {loc}",
    "Vastu-Compliant {bhk}BHK Near {loc}", "Gated Community {bhk}BHK in {loc}",
]


def generate_property():
    locality = random.choice(LOCALITIES)
    base_lat, base_lng = LOCALITY_COORDS.get(locality, (17.45, 78.40))
    bhk = random.choices([1, 2, 3, 4], weights=[10, 40, 35, 15])[0]
    area_sqft = int(random.gauss(bhk * 450 + 300, 100))
    area_sqft = max(350, min(area_sqft, 5000))
    age_years = random.randint(0, 20)
    floor_num = random.randint(0, 25)
    total_floors = max(floor_num, random.randint(4, 30))
    amenities = random.sample(AMENITIES_POOL, random.randint(2, 7))
    base_ppsf = LOCALITY_MEDIANS.get(locality, 6000)
    furnishing = random.choices(["FURNISHED", "SEMI", "UNFURNISHED"], weights=[20, 45, 35])[0]
    noise = random.gauss(1.0, 0.08)
    ppsf = int(base_ppsf * noise)
    price = ppsf * area_sqft
    title = random.choice(FAKE_TITLES).format(bhk=bhk, loc=locality)

    return {
        "property_id": str(uuid.uuid4()),
        "listing_type": "RESIDENTIAL",
        "title": title,
        "description": f"{bhk}BHK flat in {locality}, Hyderabad. {area_sqft} sqft, {age_years} years old.",
        "address": f"{random.randint(1, 100)}, Some Street, {locality}",
        "locality": locality,
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": str(random.randint(500001, 500096)),
        "latitude": base_lat + random.uniform(-0.02, 0.02),
        "longitude": base_lng + random.uniform(-0.02, 0.02),
        "price": price,
        "price_per_sqft": ppsf,
        "area_sqft": area_sqft,
        "bhk": bhk,
        "bathrooms": min(bhk, random.randint(1, 4)),
        "floor": floor_num,
        "total_floors": total_floors,
        "age_years": age_years,
        "furnishing": furnishing,
        "parking": random.choices(["COVERED", "OPEN", "NONE"], weights=[50, 30, 20])[0],
        "facing": random.choice(["EAST", "WEST", "NORTH", "SOUTH"]),
        "amenities": amenities,
        "status": "ACTIVE",
        "verified": random.random() > 0.3,
        "seller_id": str(uuid.uuid4()),
        "image_urls": [],
        "created_at": (datetime.utcnow() - timedelta(days=random.randint(0, 180))).isoformat(),
    }


async def main():
    properties = [generate_property() for _ in range(1000)]

    # Save to JSON for reference
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "sample_properties.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(properties, f, indent=2, default=str)
    print(f"✅ Generated 1000 synthetic properties → {output_path}")

    # Try inserting into DB
    try:
        from app.database import AsyncSessionLocal
        from app.models.property import Property
        from sqlalchemy import text

        async with AsyncSessionLocal() as session:
            for p in properties:
                prop = Property(**{k: v for k, v in p.items()
                                   if k not in ("created_at",)})
                session.add(prop)
            await session.commit()
        print("✅ Inserted 1000 properties into database")
    except Exception as e:
        print(f"⚠️  DB insert skipped (run after DB setup): {e}")
        print("    JSON file saved — you can import it manually.")


if __name__ == "__main__":
    asyncio.run(main())
