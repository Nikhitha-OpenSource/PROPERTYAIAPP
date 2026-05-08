"""
PROPIQ AI — Master Data Import Script
======================================
Usage:
    python scripts/import_all_data.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Correct directory structure based on DATA_SOURCES.md
PROPERTIES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "datasets", "properties")
PRICE_HIST_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "datasets", "price_history")

def banner(text: str):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

async def main():
    banner("PROPIQ AI — MongoDB Data Import Wizard")
    print("\nScanning your data folders...\n")

    prop_csvs   = [f for f in os.listdir(PROPERTIES_DIR) if f.endswith(".csv")] if os.path.exists(PROPERTIES_DIR) else []
    price_files = [f for f in os.listdir(PRICE_HIST_DIR) if f.endswith((".csv",".xlsx"))] if os.path.exists(PRICE_HIST_DIR) else []

    print(f"  📂 data/datasets/properties/    → {len(prop_csvs)} CSV files")
    print(f"  📂 data/datasets/price_history/ → {len(price_files)} files")

    ran_something = False

    # ── Step 1: Import property CSVs ──────────────────────────
    if prop_csvs:
        banner("Step 1/2: Importing Property CSVs → MongoDB")
        try:
            from scripts.import_properties_csv import import_all_csvs
            await import_all_csvs(PROPERTIES_DIR)
            ran_something = True
        except Exception as e:
            print(f"Failed to import properties: {e}")
    else:
        print("\n⏭  Step 1/2: No property CSVs found — skipping")

    # ── Step 2: Import price history ──────────────────────────
    if price_files:
        banner("Step 2/2: Importing Price History Data → MongoDB")
        try:
            from scripts.import_price_history import import_price_history
            await import_price_history(PRICE_HIST_DIR)
            ran_something = True
        except Exception as e:
            print(f"Failed to import price history: {e}")
    else:
        print("\n⏭  Step 2/2: No price history files found — skipping")

    banner("✅ DONE!")
    if ran_something:
        print("\nAll data imported successfully into MongoDB. You can now start the server:")
        print("  uvicorn app.main:app --reload --port 8000")
    else:
        print("\nNo data files found in any folder.")
        print("Please read DATA_SOURCES.md for download links.")

if __name__ == "__main__":
    asyncio.run(main())
