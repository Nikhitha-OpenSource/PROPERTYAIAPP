#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Hyderabad-only real-estate scraper.
"""

import argparse
import csv
import json
import os
import logging
import re
import hashlib
from typing import List, Dict, Any
from urllib.parse import quote, urlparse, urljoin

# Standard library imports for the helpers
import time, random
import requests
from bs4 import BeautifulSoup
from urllib.robotparser import RobotFileParser

# Base locality coordinates for generated property locations
LOCALITY_COORDS = {
    "Gachibowli": (17.4401, 78.3489),
    "Kondapur": (17.4700, 78.3490),
    "Madhapur": (17.4478, 78.3800),
    "Hitech City": (17.4435, 78.3772),
    "Miyapur": (17.4950, 78.3250),
    "KPHB": (17.4856, 78.3915),
    "Banjara Hills": (17.4108, 78.4483),
    "Jubilee Hills": (17.4239, 78.4072),
    "Manikonda": (17.4023, 78.3822),
    "Kukatpally": (17.4849, 78.4089),
    "Financial District": (17.4227, 78.3446),
    "Raidurg": (17.4242, 78.3647),
    "Begumpet": (17.4437, 78.4682),
    "Shamshabad": (17.2490, 78.4282),
    "Kompally": (17.5433, 78.4788),
    "Bowrampet": (17.5636, 78.4130),
    "Patancheru": (17.5307, 78.2642),
    "Medchal": (17.6280, 78.4809),
    "Hyder Nagar": (17.5059, 78.3943),
    "Narsingi": (17.3809, 78.3508),
}
HYDERABAD_DEFAULT_COORDS = (17.3850, 78.4867)


def _stable_coords_seed(value: str) -> int:
    return int(hashlib.md5(value.encode("utf-8")).hexdigest(), 16)


def deterministic_coords(locality: str, seed: str) -> tuple:
    base = LOCALITY_COORDS.get(locality, HYDERABAD_DEFAULT_COORDS)
    rng = random.Random(_stable_coords_seed(f"{locality}-{seed}"))
    return (
        round(base[0] + rng.uniform(-0.002, 0.002), 6),
        round(base[1] + rng.uniform(-0.002, 0.002), 6),
    )

# Inline helpers to avoid import issues in one-off runs
def can_fetch(base_url: str, path: str, ua: str = "PropiqScraper/1.0") -> bool:
    rp = RobotFileParser()
    robots_url = urljoin(base_url, "/robots.txt")
    try:
        rp.set_url(robots_url)
        rp.read()
    except:
        return True
    return rp.can_fetch(ua, path)

def fetch(url: str, pause: float = 1.5) -> requests.Response:
    hdr = {"User-Agent": "PropiqScraper/1.0"}
    resp = requests.get(url, headers=hdr, timeout=12)
    resp.raise_for_status()
    time.sleep(pause + random.uniform(0, 0.5))
    return resp

def normalize_price(raw: str) -> int:
    raw = raw.replace(",", "").replace("₹", "").strip()
    if not raw: return 0
    if "Cr" in raw:
        try: return int(float(raw.replace("Cr", "").strip()) * 10_000_000)
        except: return 0
    if "L" in raw or "Lakh" in raw:
        try: return int(float(raw.replace("L", "").replace("Lakh", "").strip()) * 100_000)
        except: return 0
    try: return int(float(raw))
    except: return 0

def normalize_area(raw: str) -> int:
    raw = raw.replace(",", "").replace("sqft", "").replace("sq ft", "").strip()
    try: return int(float(raw))
    except: return 0


def _is_candidate_image_url(url: str) -> bool:
    if not url or not isinstance(url, str):
        return False
    lower = url.lower()
    if not (lower.startswith("http") or lower.startswith("//")):
        return False
    if any(term in lower for term in ["logo", "icon", "sprite", "fonts.googleapis.com", "data:image"]):
        return False
    return any(ext in lower for ext in [".jpg", ".jpeg", ".png"])


def _extract_image_urls_from_html(html: str, base_url: str = "") -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    urls = []
    for img in soup.find_all("img"):
        src = img.get("data-src") or img.get("src") or img.get("data-original")
        if not src:
            continue
        if src.startswith("//"):
            src = "https:" + src
        elif src.startswith("/"):
            src = urljoin(base_url, src)
        if _is_candidate_image_url(src):
            urls.append(src.split("?")[0])
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        urls.append(og["content"].split("?")[0])
    return list(dict.fromkeys(urls))


def _fetch_image_urls_from_listing(url: str) -> List[str]:
    try:
        resp = fetch(url)
        if resp.status_code != 200:
            return []
        return _extract_image_urls_from_html(resp.text, base_url=url)
    except Exception:
        return []


def _scrape_99acres_listing_urls(locality: str, listing_type: str, page: int = 1) -> List[str]:
    query_type = "residential" if listing_type == "RESIDENTIAL" else "commercial"
    localized = quote(locality)
    url = f"https://www.99acres.com/search/property/buy/{query_type}/hyderabad?search_type=QS&keyword={localized}&page={page}"
    try:
        resp = fetch(url)
        if resp.status_code != 200:
            return []
        soup = BeautifulSoup(resp.text, "html.parser")
        urls = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/property-detail" in href or "/property-details" in href:
                full = href if href.startswith("http") else urljoin("https://www.99acres.com", href)
                urls.append(full)
        return list(dict.fromkeys(urls))
    except Exception:
        return []


def _scrape_99acres_image_urls(locality: str, listing_type: str, max_images: int = 4) -> List[str]:
    urls = []
    for page in range(1, 5):
        listing_urls = _scrape_99acres_listing_urls(locality, listing_type, page=page)
        if not listing_urls:
            break
        for listing_url in listing_urls:
            images = _fetch_image_urls_from_listing(listing_url)
            for img in images:
                if img not in urls:
                    urls.append(img)
            if len(urls) >= max_images:
                return urls[:max_images]
    return urls[:max_images]

# Configuration
BASE_OUTPUT = r"d:\CAPSTONE\data\datasets\properties\hyderabad_scraped.csv"
CSV_HEADERS = [
    "Price", "Area", "Location", "City", "No. of Bedrooms", "ListingType", "Resale",
    "Latitude", "Longitude", "ImageURLs",
    "Gymnasium", "SwimmingPool", "LandscapedGardens", "JoggingTrack",
    "RainWaterHarvesting", "IndoorGames", "ShoppingMall", "Intercom",
    "SportsFacility", "ATM", "ClubHouse", "School", "24X7Security",
    "PowerBackup", "CarParking", "WashingMachine", "Gasconnection",
    "AC", "Wifi", "LiftAvailable"
]

def scrape_mock(use_live_images: bool = False, output_path: str = BASE_OUTPUT):
    """Generate the Hyderabad dataset and optionally scrape live images from 99acres."""
    logging.info("Generating high-quality Hyderabad dataset...")
    residential_localities = ["Gachibowli", "Kondapur", "Madhapur", "Hitech City", "Miyapur", "KPHB", "Banjara Hills", "Jubilee Hills", "Manikonda", "Kukatpally"]
    commercial_localities = ["Hitech City", "Gachibowli", "Kondapur", "Madhapur", "Financial District", "Raidurg", "Begumpet"]
    land_localities = ["Shamshabad", "Kompally", "Bowrampet", "Patancheru", "Medchal", "Hyder Nagar", "Narsingi"]
    rows = []
    for i in range(1, 501):
        listing_type = random.choices(["RESIDENTIAL", "COMMERCIAL", "LAND"], weights=[60, 25, 15], k=1)[0]
        if listing_type == "LAND":
            loc = random.choice(land_localities)
            bhk = 0
            area = random.choice([1200, 2400, 3600, 4800, 6000, 7200])
            price = area * random.randint(1600, 3400)
            resale = 0
            amenities = {"Gymnasium": 0, "SwimmingPool": 0, "LandscapedGardens": 0, "JoggingTrack": 0,
                         "RainWaterHarvesting": 0, "IndoorGames": 0, "ShoppingMall": 0, "Intercom": 0,
                         "SportsFacility": 0, "ATM": 0, "ClubHouse": 0, "School": 0,
                         "24X7Security": 1, "PowerBackup": 0, "CarParking": 0, "WashingMachine": 0,
                         "Gasconnection": 0, "AC": 0, "Wifi": 0, "LiftAvailable": 0}
        elif listing_type == "COMMERCIAL":
            loc = random.choice(commercial_localities)
            bhk = 0
            area = random.randint(800, 5000)
            price = area * random.randint(7000, 15000)
            resale = random.choice([0, 1])
            amenities = {"Gymnasium": random.choice([0, 1]), "SwimmingPool": 0, "LandscapedGardens": 0, "JoggingTrack": 0,
                         "RainWaterHarvesting": 0, "IndoorGames": random.choice([0, 1]), "ShoppingMall": random.choice([0, 1]), "Intercom": random.choice([0, 1]),
                         "SportsFacility": random.choice([0, 1]), "ATM": random.choice([0, 1]), "ClubHouse": random.choice([0, 1]), "School": 0,
                         "24X7Security": 1, "PowerBackup": 1, "CarParking": 1, "WashingMachine": 0,
                         "Gasconnection": 1, "AC": random.choice([0, 1]), "Wifi": random.choice([0, 1]), "LiftAvailable": random.choice([0, 1])}
        else:
            loc = random.choice(residential_localities)
            bhk = random.randint(1, 5)
            area = bhk * random.randint(500, 850)
            price = area * random.randint(5000, 12000)
            resale = random.choice([0, 1])
            amenities = {"Gymnasium": random.choice([0, 1]), "SwimmingPool": random.choice([0, 1]), "LandscapedGardens": random.choice([0, 1]), "JoggingTrack": random.choice([0, 1]),
                         "RainWaterHarvesting": random.choice([0, 1]), "IndoorGames": random.choice([0, 1]), "ShoppingMall": random.choice([0, 1]), "Intercom": random.choice([0, 1]),
                         "SportsFacility": random.choice([0, 1]), "ATM": random.choice([0, 1]), "ClubHouse": random.choice([0, 1]), "School": random.choice([0, 1]),
                         "24X7Security": 1, "PowerBackup": 1, "CarParking": 1, "WashingMachine": 0,
                         "Gasconnection": 1, "AC": random.choice([0, 1]), "Wifi": 1, "LiftAvailable": 1}

        latitude, longitude = deterministic_coords(loc, f"hyd-{i:05d}")
        image_urls = []
        if use_live_images and listing_type in {"RESIDENTIAL", "COMMERCIAL"}:
            image_urls = _scrape_99acres_image_urls(loc, listing_type)

        row = {
            "Price": price,
            "Area": area,
            "Location": loc,
            "City": "Hyderabad",
            "No. of Bedrooms": bhk,
            "ListingType": listing_type,
            "Resale": resale,
            "Latitude": latitude,
            "Longitude": longitude,
            "ImageURLs": json.dumps(image_urls) if image_urls else "",
            **amenities
        }
        rows.append(row)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        writer.writeheader()
        writer.writerows(rows)
    logging.info(f"Saved {len(rows)} properties to %s", BASE_OUTPUT)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Hyderabad property data with optional live image scraping.")
    parser.add_argument("--live-images", action="store_true", help="Scrape 99acres for listing images instead of using stock placeholders.")
    parser.add_argument("--output", default=BASE_OUTPUT, help="CSV output path.")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    scrape_mock(use_live_images=args.live_images, output_path=args.output)
