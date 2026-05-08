import asyncio
import os
import glob
import pandas as pd
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import settings
from app.models.property import PropertyModel
import structlog
import random

logger = structlog.get_logger(__name__)

async def import_all_csvs(properties_dir: str):
    """Parses all CSVs in properties_dir and imports them into MongoDB."""
    
    # Initialize MongoDB client directly (since app startup logic is not run in script mode)
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    collection = db["properties"]
    
    # Load all image URLs we have available (scraped + generated)
    images_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "images", "property_photos")
    image_pool = []
    if os.path.exists(images_dir):
        image_pool = [f"/images/{f}" for f in os.listdir(images_dir) if f.endswith((".jpg", ".png", ".jpeg"))]
    
    csv_files = glob.glob(os.path.join(properties_dir, "**", "*.csv"), recursive=True)
    if not csv_files:
        logger.warning("No CSV files found", directory=properties_dir)
        return

    total_inserted = 0
    
    for file_path in csv_files:
        logger.info(f"Processing {file_path}...")
        try:
            df = pd.read_csv(file_path)
            # Try to detect which schema it is based on columns
            cols = [c.lower().strip() for c in df.columns]
            
            records_to_insert = []
            
            if 'total_sqft' in cols and 'bath' in cols:
                # Looks like bengaluru_house_prices
                for _, row in df.iterrows():
                    try:
                        # total_sqft can be a range "1195 - 1440" or "34.46Sq. Meter", extract numbers
                        sqft_val = str(row.get('total_sqft', '0'))
                        if '-' in sqft_val:
                            sqft_val = sqft_val.split('-')[0].strip()
                        import re
                        sqft_num = re.sub(r'[^\d.]', '', sqft_val)
                        sqft = int(float(sqft_num)) if sqft_num else 0
                        
                        price = float(row.get('price', 0)) * 100000 # price is typically in Lakhs in Bengaluru dataset
                        bhk_str = str(row.get('size', '0'))
                        bhk = int(re.sub(r'[^\d]', '', bhk_str)) if re.sub(r'[^\d]', '', bhk_str) else 0

                        prop = PropertyModel(
                            listing_type="RESIDENTIAL",
                            title=f"{bhk} BHK Flat in {row.get('location', 'Bengaluru')}",
                            locality=str(row.get('location', '')),
                            city="Bengaluru",
                            state="Karnataka",
                            price=int(price),
                            area_sqft=sqft,
                            price_per_sqft=int(price / sqft) if sqft > 0 else 0,
                            bhk=bhk,
                            bathrooms=int(row.get('bath', 0)) if pd.notna(row.get('bath')) else 0,
                            image_urls=random.sample(image_pool, min(len(image_pool), random.randint(3, 5))),
                            status="ACTIVE"
                        )
                        records_to_insert.append(prop.model_dump())
                    except Exception as e:
                        continue
                        
            elif 'no. of bedrooms' in cols or 'city' in cols:
                # Looks like hyderabad_house_prices (or combined multi-city)
                for _, row in df.iterrows():
                    try:
                        sqft = int(row.get('Area', 0))
                        price = int(row.get('Price', 0))
                        bhk = int(row.get('No. of Bedrooms', 0))
                        city = str(row.get('City', 'Hyderabad'))
                        loc = str(row.get('Location', ''))
                        
                        prop = PropertyModel(
                            listing_type="RESIDENTIAL",
                            title=f"{bhk} BHK Flat in {loc}, {city}",
                            locality=loc,
                            city=city,
                            state="Telangana" if city.lower() == "hyderabad" else "Maharashtra" if city.lower() in ["mumbai", "pune"] else "Karnataka",
                            price=price,
                            area_sqft=sqft,
                            price_per_sqft=int(price / sqft) if sqft > 0 else 0,
                            bhk=bhk,
                            image_urls=random.sample(image_pool, min(len(image_pool), random.randint(3, 5))),
                            status="ACTIVE"
                        )
                        records_to_insert.append(prop.model_dump())
                    except Exception as e:
                        continue
            else:
                logger.warning(f"Unknown schema for {file_path}, skipping.")
                
            if records_to_insert:
                # Insert in chunks of 5000 to avoid memory issues
                chunk_size = 5000
                for i in range(0, len(records_to_insert), chunk_size):
                    await collection.insert_many(records_to_insert[i:i+chunk_size])
                
                total_inserted += len(records_to_insert)
                logger.info(f"Inserted {len(records_to_insert)} properties from {os.path.basename(file_path)}")
                
        except Exception as e:
            logger.error(f"Error processing {file_path}: {str(e)}")
            
    logger.info(f"Total properties inserted: {total_inserted}")
    
if __name__ == "__main__":
    # Test execution
    target_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "datasets", "properties")
    asyncio.run(import_all_csvs(target_dir))
