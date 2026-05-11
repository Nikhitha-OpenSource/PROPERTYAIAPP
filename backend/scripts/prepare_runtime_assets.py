"""Create small runtime assets for the Docker image.

The full local data folder is intentionally not committed. This script gives the
container a self-contained sample catalogue, property photos, and legal docs so
the deployed demo keeps working from a clean Git checkout.
"""
from __future__ import annotations

import csv
from pathlib import Path


APP_ROOT = Path("/app")
DATA_DIR = APP_ROOT / "data"


def create_property_images() -> None:
    image_dir = DATA_DIR / "images" / "property_photos"
    image_dir.mkdir(parents=True, exist_ok=True)
    if any(image_dir.glob("*.jpg")):
        return

    try:
        from PIL import Image, ImageDraw
    except Exception:
        return

    palette = [
        (45, 96, 153),
        (42, 136, 116),
        (153, 103, 45),
        (112, 78, 145),
        (56, 120, 72),
        (166, 72, 86),
        (58, 113, 127),
        (130, 111, 54),
    ]
    for idx, color in enumerate(palette, start=1):
        image = Image.new("RGB", (1200, 800), color)
        draw = ImageDraw.Draw(image)
        draw.rectangle((60, 520, 1140, 740), fill=(255, 255, 255))
        draw.rectangle((120, 190, 1080, 520), outline=(255, 255, 255), width=10)
        draw.text((100, 555), f"PROPIQ Sample Property {idx}", fill=(24, 35, 48))
        draw.text((100, 615), "Hyderabad verified listing", fill=(62, 74, 89))
        image.save(image_dir / f"prop_seed_{idx:02d}.jpg", quality=88)


def create_property_csv() -> None:
    csv_dir = DATA_DIR / "datasets" / "properties"
    csv_dir.mkdir(parents=True, exist_ok=True)
    csv_path = csv_dir / "hyderabad_scraped.csv"
    if csv_path.exists():
        return

    fields = [
        "Price",
        "Area",
        "Location",
        "City",
        "No. of Bedrooms",
        "ListingType",
        "Resale",
        "Latitude",
        "Longitude",
        "ImageURLs",
        "Gymnasium",
        "SwimmingPool",
        "LandscapedGardens",
        "JoggingTrack",
        "RainWaterHarvesting",
        "IndoorGames",
        "ShoppingMall",
        "Intercom",
        "SportsFacility",
        "ATM",
        "ClubHouse",
        "School",
        "24X7Security",
        "PowerBackup",
        "CarParking",
        "WashingMachine",
        "Gasconnection",
        "AC",
        "Wifi",
        "LiftAvailable",
    ]
    localities = [
        ("Kondapur", 17.4700, 78.3490, 7800),
        ("Gachibowli", 17.4401, 78.3489, 9400),
        ("Madhapur", 17.4478, 78.3800, 9000),
        ("HITEC City", 17.4435, 78.3772, 8800),
        ("Miyapur", 17.4950, 78.3250, 5600),
        ("KPHB", 17.4856, 78.3915, 5400),
        ("Manikonda", 17.4023, 78.3822, 6400),
        ("Narsingi", 17.3809, 78.3508, 7000),
    ]

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for idx in range(1, 121):
            locality, lat, lng, ppsf = localities[(idx - 1) % len(localities)]
            bhk = (idx % 4) + 1
            area = 760 + (idx % 18) * 95
            listing_type = "COMMERCIAL" if idx % 17 == 0 else "LAND" if idx % 23 == 0 else "RESIDENTIAL"
            if listing_type == "LAND":
                bhk = 0
            row = {
                "Price": area * ppsf,
                "Area": area,
                "Location": locality,
                "City": "Hyderabad",
                "No. of Bedrooms": bhk,
                "ListingType": listing_type,
                "Resale": idx % 2,
                "Latitude": round(lat + ((idx % 5) - 2) * 0.0007, 6),
                "Longitude": round(lng + ((idx % 7) - 3) * 0.0007, 6),
                "ImageURLs": "",
            }
            for field in fields[10:]:
                row[field] = 1 if (idx + len(field)) % 3 else 0
            writer.writerow(row)


def create_legal_docs() -> None:
    deed_dir = DATA_DIR / "legal_docs" / "deeds"
    deed_dir.mkdir(parents=True, exist_ok=True)
    doc_path = deed_dir / "telangana_sale_deed_template.txt"
    if doc_path.exists():
        return
    doc_path.write_text(
        "\n".join(
            [
                "Telangana Sale Deed Verification Notes",
                "Required checks: sale deed, encumbrance certificate, stamp duty receipt, registration fee receipt, Aadhaar or PAN identity documents, and RERA project number when applicable.",
                "Common Telangana charges: stamp duty 4 percent, registration fee 0.5 percent, transfer duty 1.5 percent.",
                "Admin review should compare declared owner name, OCR extracted owner name, survey number, boundaries, document dates, and encumbrance status before approval.",
            ]
        ),
        encoding="utf-8",
    )


def main() -> None:
    create_property_images()
    create_property_csv()
    create_legal_docs()
    (DATA_DIR / "ml_models").mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    main()
