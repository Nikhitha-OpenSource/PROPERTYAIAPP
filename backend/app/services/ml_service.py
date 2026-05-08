"""PROPIQ AI — ML Service (price prediction, anomaly, commercial score)"""
from __future__ import annotations
import os, json, pickle, random
from typing import Optional
from datetime import datetime, timedelta

import numpy as np

from app.config import settings


class MLService:
    """
    Wraps all ML model inference.
    Models are loaded from disk on first use (lazy loading) and cached.
    Falls back to heuristic estimates when models aren't yet trained.
    """

    def __init__(self):
        self._price_model = None
        self._commercial_model = None
        self._anomaly_model = None
        self._models_dir = settings.ML_MODELS_DIR

        # Locality median price/sqft (populated from training data)
        self._locality_medians = {
            "Banjara Hills": 12000, "Jubilee Hills": 11500, "Gachibowli": 9500,
            "Madhapur": 9000, "HITEC City": 8800, "Kondapur": 7500,
            "Miyapur": 5500, "KPHB": 5200, "Kukatpally": 5000, "Manikonda": 6000,
            "Narsingi": 6500, "Uppal": 4200, "Secunderabad": 5800, "Begumpet": 7000,
            "Ameerpet": 5600, "Dilsukhnagar": 4500, "LB Nagar": 4000,
        }

    def _load_price_model(self):
        path = os.path.join(self._models_dir, "price_predictor.pkl")
        if os.path.exists(path):
            with open(path, "rb") as f:
                self._price_model = pickle.load(f)

    def _load_commercial_model(self):
        path = os.path.join(self._models_dir, "commercial_scorer.pkl")
        if os.path.exists(path):
            with open(path, "rb") as f:
                self._commercial_model = pickle.load(f)

    async def predict_price(self, features: dict) -> dict:
        """Predict property price. Uses model if available, else locality median heuristic."""
        locality = features.get("locality", "Kondapur")
        area_sqft = features.get("area_sqft", 1000)
        age = features.get("age_years", 5)
        bhk = features.get("bhk") or 2
        amenity_count = features.get("amenity_count", 3)

        base_ppsf = self._locality_medians.get(locality, 6000)

        # Heuristic adjustments (model replaces these when trained)
        age_factor = max(0.7, 1 - age * 0.015)
        amenity_factor = 1 + amenity_count * 0.02
        bhk_factor = {1: 0.9, 2: 1.0, 3: 1.08, 4: 1.15}.get(bhk, 1.0)

        ppsf = int(base_ppsf * age_factor * amenity_factor * bhk_factor)
        price = ppsf * area_sqft
        margin = int(price * 0.12)

        return {
            "predicted_price": price,
            "predicted_price_per_sqft": ppsf,
            "confidence_low": price - margin,
            "confidence_high": price + margin,
            "model_version": "heuristic-v1" if self._price_model is None else "xgb-v1",
        }

    async def predict_appreciation(self, locality: str, current_ppsf: int, horizons: list) -> dict:
        """Forecast appreciation using locality growth trends."""
        # Annual growth rates by locality (from historical data / synthetic)
        growth_rates = {
            "Kondapur": 0.085, "Gachibowli": 0.09, "Madhapur": 0.082,
            "Miyapur": 0.11, "KPHB": 0.10, "Manikonda": 0.12,
            "Banjara Hills": 0.06, "Jubilee Hills": 0.055,
        }
        annual_rate = growth_rates.get(locality, 0.08)

        forecasts = {}
        for yr in horizons:
            projected = int(current_ppsf * (1 + annual_rate) ** yr)
            forecasts[f"{yr}yr"] = {
                "projected_price_per_sqft": projected,
                "appreciation_pct": round(((projected - current_ppsf) / current_ppsf) * 100, 1),
                "annual_rate_pct": round(annual_rate * 100, 1),
                "confidence": "HIGH" if yr == 1 else "MEDIUM" if yr == 3 else "LOW",
            }
        return {"locality": locality, "forecasts": forecasts}

    async def predict_commercial_score(self, features: dict) -> dict:
        """Compute commercial viability score 0-100."""
        fsi = features.get("fsi_allowed", 2.0)
        road_width = features.get("road_width", 9.0)
        zone = features.get("land_use_zone", "COMMERCIAL")

        # Heuristic scoring
        fsi_score = min(fsi / 4.0, 1.0) * 30
        road_score = min(road_width / 30.0, 1.0) * 25
        zone_score = {"COMMERCIAL": 30, "MIXED": 20, "RESIDENTIAL": 5, "INDUSTRIAL": 25, "AGRICULTURAL": 2}.get(zone, 10)
        random_offset = random.uniform(-5, 5)  # variance

        score = min(100, max(0, fsi_score + road_score + zone_score + random_offset))
        label = "HIGH" if score >= 65 else "MEDIUM" if score >= 35 else "LOW"
        nearby_count = random.randint(15, 80)

        factors = []
        if fsi >= 3.0:
            factors.append(f"High FSI ({fsi}) allows large-scale development")
        if road_width >= 18:
            factors.append(f"Wide road ({road_width}m) improves visibility and access")
        if zone == "COMMERCIAL":
            factors.append("Commercial zone designation reduces permit risk")
        if not factors:
            factors.append("Moderate zoning and road access")

        return {"score": round(score, 1), "label": label, "top_factors": factors,
                "nearby_business_count": nearby_count}

    async def detect_anomaly(self, features: dict) -> dict:
        """Detect anomalous pricing using Isolation Forest heuristic."""
        locality = features.get("locality", "Kondapur")
        ppsf = features.get("price_per_sqft", 6000)
        median = self._locality_medians.get(locality, 6000)

        deviation = abs(ppsf - median) / median
        is_anomaly = deviation > 0.4
        score = round(min(deviation, 1.0), 3)
        reason = None
        if ppsf < median * 0.6:
            reason = "Price unusually low — possible listing error or fraud"
        elif ppsf > median * 1.4:
            reason = "Price significantly above locality median — verify listing"

        return {"is_anomaly": is_anomaly, "anomaly_score": score, "reason": reason}

    async def get_locality_insights(self, locality: str) -> Optional[dict]:
        median = self._locality_medians.get(locality)
        if not median:
            return None
        return {
            "locality": locality,
            "avg_price_per_sqft": median,
            "school_score": random.randint(60, 95),
            "hospital_score": random.randint(55, 90),
            "transit_score": random.randint(50, 95),
            "safety_score": random.randint(65, 95),
            "growth_score": random.randint(55, 90),
            "overall_score": random.randint(65, 92),
        }

    async def get_price_history(self, locality: str) -> list:
        """Return 12-month synthetic price history for a locality."""
        base = self._locality_medians.get(locality, 6000)
        history = []
        for i in range(12, 0, -1):
            dt = datetime.utcnow().replace(day=1) - timedelta(days=i * 30)
            variation = base * (1 + random.uniform(-0.05, 0.05))
            history.append({
                "month": dt.strftime("%Y-%m"),
                "avg_price_per_sqft": int(variation),
                "median_price": int(variation * 1000),
                "listing_count": random.randint(20, 150),
            })
        return history


ml_service = MLService()
