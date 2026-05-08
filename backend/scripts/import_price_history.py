import asyncio
import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import uuid
from datetime import datetime

# Ensure backend directory is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import settings
import structlog

logger = structlog.get_logger(__name__)

async def import_price_history(price_hist_dir: str):
    """Parses Excel/CSV price history files and imports them into MongoDB."""
    
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    collection = db["price_history"]
    
    if not os.path.exists(price_hist_dir):
        logger.warning("Price history directory not found", directory=price_hist_dir)
        return

    files = [f for f in os.listdir(price_hist_dir) if f.endswith((".xlsx", ".csv"))]
    if not files:
        logger.warning("No Excel/CSV files found in price history directory")
        return

    total_inserted = 0
    
    for filename in files:
        file_path = os.path.join(price_hist_dir, filename)
        logger.info(f"Processing price history file: {file_path}")
        
        try:
            if file_path.endswith(".xlsx"):
                df = pd.read_excel(file_path)
            else:
                df = pd.read_csv(file_path)
                
            # The NHB RESIDEX file has "City" in the first column and Quarters as the other columns
            # Convert wide format to long format
            id_vars = [c for c in df.columns if c.lower() == 'city']
            if not id_vars:
                logger.warning(f"Could not find 'City' column in {filename}")
                continue
                
            city_col = id_vars[0]
            value_vars = [c for c in df.columns if c != city_col]
            
            # Melt the dataframe
            df_long = pd.melt(df, id_vars=[city_col], value_vars=value_vars, 
                              var_name='Quarter', value_name='PriceIndex')
            
            # Drop NaNs
            df_long = df_long.dropna(subset=['PriceIndex'])
            
            records = []
            for _, row in df_long.iterrows():
                try:
                    idx_val = float(row['PriceIndex'])
                    # Basic parsing of 'Quarter' string, e.g. 'Jun-2013' or 'Mar-2024'
                    # Or 'Jun--2013'
                    q_str = str(row['Quarter']).replace('--', '-')
                    parts = q_str.split('-')
                    if len(parts) >= 2:
                        month_str = parts[0].strip()[:3]
                        year_str = parts[-1].strip()
                        if len(year_str) == 2:
                            year_str = "20" + year_str
                        year = int(year_str)
                    else:
                        year = datetime.now().year
                        month_str = "Jan"
                except Exception:
                    continue
                    
                records.append({
                    "history_id": str(uuid.uuid4()),
                    "city": str(row[city_col]).strip(),
                    "quarter_label": q_str,
                    "year": year,
                    "month": month_str,
                    "price_index": idx_val,
                    "source": "NHB RESIDEX",
                    "created_at": datetime.utcnow()
                })
                
            if records:
                await collection.insert_many(records)
                total_inserted += len(records)
                logger.info(f"Inserted {len(records)} price history records from {filename}")
                
        except Exception as e:
            logger.error(f"Error processing {filename}: {str(e)}")
            
    logger.info(f"Total price history records inserted: {total_inserted}")
    
if __name__ == "__main__":
    target_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "datasets", "price_history")
    asyncio.run(import_price_history(target_dir))
