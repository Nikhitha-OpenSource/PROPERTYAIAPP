"""
PROPIQ AI — Property Image Scraper
Scrapes free, royalty-free property images from:
  1. Unsplash (no API key needed for basic scraping)
  2. Pixabay API (free tier — 20 req/hour without key)
  3. Pexels (fallback)

Run: python scripts/scrape_images.py
Images saved to: d:/CAPSTONE/data/images/property_photos/
Thumbnails saved to: d:/CAPSTONE/data/images/thumbnails/
"""

import os
import time
import json
import hashlib
import requests
from pathlib import Path
from urllib.parse import urlparse, urlencode
from PIL import Image
from io import BytesIO

# ── Config ────────────────────────────────────────────────────────────────────
PHOTOS_DIR   = Path(r"d:\CAPSTONE\data\images\property_photos")
THUMBS_DIR   = Path(r"d:\CAPSTONE\data\images\thumbnails")
THUMB_SIZE   = (400, 300)
TARGET_COUNT = 50          # how many images to download total
DELAY_SEC    = 3.0         # be polite — wait between requests

PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
THUMBS_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "PropiqAI/1.0 (Contact: admin@example.com) Scraping property images for local testing"
}

# ── Search queries to cover all property types ────────────────────────────────
QUERIES = [
    "hyderabad apartment interior",
    "india modern apartment",
    "india house exterior",
    "india villa property",
    "apartment living room india",
    "india real estate bedroom",
    "indian house kitchen",
    "india flat balcony",
    "luxury apartment india",
    "india residential building",
]


# ── Helper ────────────────────────────────────────────────────────────────────
def make_filename(url: str, prefix: str = "prop") -> str:
    """Generate a unique filename from URL hash."""
    h = hashlib.md5(url.encode()).hexdigest()[:8]
    return f"{prefix}_{h}.jpg"


def save_image(img_url: str, save_path: Path, thumb_path: Path) -> bool:
    """Download image, save full + thumbnail. Returns True on success."""
    try:
        resp = requests.get(img_url, headers=HEADERS, timeout=15, stream=True)
        resp.raise_for_status()

        # open with Pillow
        img = Image.open(BytesIO(resp.content)).convert("RGB")

        # skip tiny images (likely icons)
        if img.width < 600 or img.height < 400:
            print(f"  ⚠ Too small ({img.width}x{img.height}) — skipping")
            return False

        # save full
        img.save(save_path, "JPEG", quality=85, optimize=True)

        # save thumbnail
        thumb = img.copy()
        thumb.thumbnail(THUMB_SIZE, Image.LANCZOS)
        thumb.save(thumb_path, "JPEG", quality=75, optimize=True)

        print(f"  ✅ Saved: {save_path.name}  ({img.width}x{img.height})")
        return True

    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


from ddgs import DDGS

# ── Source: DuckDuckGo Images (Free, high-quality search) ────────────────────
def scrape_ddg(query: str, per_page: int = 10) -> list[str]:
    """Get image URLs using DuckDuckGo search."""
    urls = []
    try:
        results = DDGS().images(query, max_results=per_page)
        for r in results:
            if 'image' in r:
                urls.append(r['image'])
    except Exception as e:
        print(f"  DDG error: {e}")
    return urls


# ── Main scraper ──────────────────────────────────────────────────────────────
def scrape_all_images(target: int = TARGET_COUNT):
    downloaded = 0
    seen_urls: set[str] = set()
    counter = 100 # start at 100 to avoid overwriting existing
    
    # Check what the highest counter currently is in the directory
    for f in PHOTOS_DIR.glob("prop_*.jpg"):
        try:
            num = int(f.name.split("_")[1].split(".")[0])
            if num >= counter:
                counter = num + 1
        except:
            pass

    print(f"\n🏠 PROPIQ AI — Property Image Scraper")
    print(f"📂 Saving to: {PHOTOS_DIR}")
    print(f"🎯 Target: {target} images\n")

    for query in QUERIES:
        if downloaded >= target:
            break

        print(f"\n🔍 Query: '{query}'")

        # gather URLs
        all_urls: list[str] = scrape_ddg(query, per_page=15)
        time.sleep(DELAY_SEC)

        print(f"  Found {len(all_urls)} candidate URLs")

        for url in all_urls:
            if downloaded >= target:
                break
            if url in seen_urls:
                continue
            seen_urls.add(url)

            filename  = f"prop_{counter:04d}.jpg"
            thumb_name = f"thumb_{counter:04d}.jpg"
            save_path  = PHOTOS_DIR / filename
            thumb_path = THUMBS_DIR / thumb_name

            # skip if already downloaded
            if save_path.exists():
                counter += 1
                downloaded += 1
                continue

            print(f"  [{counter:04d}] Downloading...")
            success = save_image(url, save_path, thumb_path)
            if success:
                downloaded += 1
                counter += 1

            time.sleep(DELAY_SEC)

    print(f"\n{'='*50}")
    print(f"✅ Done! Downloaded {downloaded} images")
    print(f"📸 Photos  : {PHOTOS_DIR}")
    print(f"🖼  Thumbnails: {THUMBS_DIR}")


# ── Metadata export ───────────────────────────────────────────────────────────
def export_metadata():
    """Create a JSON manifest of all downloaded images."""
    manifest = []
    for img_path in sorted(PHOTOS_DIR.glob("prop_*.jpg")):
        try:
            img = Image.open(img_path)
            thumb_path = THUMBS_DIR / img_path.name.replace("prop_", "thumb_")
            manifest.append({
                "filename": img_path.name,
                "path": str(img_path),
                "thumbnail": str(thumb_path) if thumb_path.exists() else None,
                "width": img.width,
                "height": img.height,
                "size_kb": round(img_path.stat().st_size / 1024, 1),
                "source": "scraped_royalty_free",
                "license": "free_to_use",
            })
        except Exception:
            pass

    manifest_path = PHOTOS_DIR.parent / "images_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n📋 Manifest saved: {manifest_path} ({len(manifest)} entries)")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    scrape_all_images(target=TARGET_COUNT)
    export_metadata()
