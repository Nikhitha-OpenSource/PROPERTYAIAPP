"""PROPIQ AI — ML Training Script (all 6 models)
Run: python ml/training/train_all.py
"""
import os, pickle, json, warnings
import numpy as np
import pandas as pd
from pathlib import Path

warnings.filterwarnings("ignore")
MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

LOCALITIES = [
    "Banjara Hills", "Jubilee Hills", "Gachibowli", "Madhapur", "HITEC City",
    "Kondapur", "Miyapur", "KPHB", "Kukatpally", "Manikonda",
    "Narsingi", "Uppal", "Secunderabad", "Begumpet", "Ameerpet",
]

LOCALITY_MEDIANS = {
    "Banjara Hills": 12000, "Jubilee Hills": 11500, "Gachibowli": 9500,
    "Madhapur": 9000, "HITEC City": 8800, "Kondapur": 7500,
    "Miyapur": 5500, "KPHB": 5200, "Kukatpally": 5000, "Manikonda": 6000,
    "Narsingi": 6500, "Uppal": 4200, "Secunderabad": 5800, "Begumpet": 7000,
    "Ameerpet": 5600,
}


def generate_property_dataset(n=2000) -> pd.DataFrame:
    """Generate synthetic Hyderabad property dataset for training."""
    np.random.seed(42)
    rows = []
    for _ in range(n):
        locality = np.random.choice(LOCALITIES)
        base_ppsf = LOCALITY_MEDIANS[locality]
        bhk = np.random.choice([1, 2, 3, 4], p=[0.1, 0.4, 0.35, 0.15])
        area_sqft = int(np.random.normal(bhk * 450 + 300, 150))
        area_sqft = max(300, area_sqft)
        age_years = np.random.randint(0, 25)
        floor_num = np.random.randint(0, 20)
        amenity_count = np.random.randint(0, 10)
        road_width = np.random.choice([9, 12, 18, 24, 30])
        furnishing = np.random.choice(["FURNISHED", "SEMI", "UNFURNISHED"], p=[0.2, 0.45, 0.35])

        # Price calculation with noise
        furnishing_mult = {"FURNISHED": 1.15, "SEMI": 1.0, "UNFURNISHED": 0.88}[furnishing]
        age_mult = max(0.7, 1 - age_years * 0.012)
        amenity_mult = 1 + amenity_count * 0.018
        noise = np.random.normal(1.0, 0.08)
        ppsf = int(base_ppsf * furnishing_mult * age_mult * amenity_mult * noise)
        price = ppsf * area_sqft

        rows.append({
            "locality": locality,
            "bhk": bhk,
            "area_sqft": area_sqft,
            "age_years": age_years,
            "floor_num": floor_num,
            "amenity_count": amenity_count,
            "road_width": road_width,
            "furnishing": furnishing,
            "price_per_sqft": ppsf,
            "price": price,
            "fsi_allowed": np.random.uniform(1.5, 4.5),
            "land_use_zone": np.random.choice(["COMMERCIAL", "RESIDENTIAL", "MIXED", "INDUSTRIAL"]),
            "commercial_score": np.random.uniform(0, 100),
        })
    return pd.DataFrame(rows)


def train_price_model(df: pd.DataFrame):
    """Train XGBoost price prediction model."""
    print("Training price model (XGBoost)...")
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import OneHotEncoder
    from sklearn.impute import SimpleImputer
    from xgboost import XGBRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, r2_score

    cat_cols = ["locality", "furnishing", "land_use_zone"]
    num_cols = ["bhk", "area_sqft", "age_years", "floor_num", "amenity_count", "road_width", "fsi_allowed"]

    X = df[cat_cols + num_cols]
    y = df["price_per_sqft"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipeline = Pipeline([
        ("preprocessor", ColumnTransformer([
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
            ("num", Pipeline([("imp", SimpleImputer(strategy="median")),
                              ("scl", StandardScaler())]), num_cols),
        ])),
        ("model", XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=6,
                               subsample=0.8, colsample_bytree=0.8, random_state=42)),
    ])

    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"  Price Model -- MAE: Rs{mae:.0f}/sqft, R2: {r2:.4f}")

    with open(MODELS_DIR / "price_predictor.pkl", "wb") as f:
        pickle.dump(pipeline, f)
    print("  Saved: price_predictor.pkl")
    return pipeline


def train_commercial_model(df: pd.DataFrame):
    """Train Gradient Boosting commercial viability classifier."""
    print("Training commercial viability model...")
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report

    df["commercial_label"] = pd.cut(
        df["commercial_score"], bins=[0, 35, 65, 100], labels=["LOW", "MEDIUM", "HIGH"]
    )
    num_cols = ["fsi_allowed", "road_width", "amenity_count", "floor_num"]
    X = df[num_cols].fillna(df[num_cols].median())
    y = df["commercial_label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = Pipeline([
        ("scl", StandardScaler()),
        ("clf", GradientBoostingClassifier(n_estimators=200, learning_rate=0.05,
                                           max_depth=4, random_state=42)),
    ])
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    print(classification_report(y_test, preds))

    with open(MODELS_DIR / "commercial_scorer.pkl", "wb") as f:
        pickle.dump(model, f)
    print("  Saved: commercial_scorer.pkl")


def train_anomaly_model(df: pd.DataFrame):
    """Train Isolation Forest for anomaly detection."""
    print("Training anomaly detection model (Isolation Forest)...")
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler

    num_cols = ["price_per_sqft", "area_sqft", "age_years", "amenity_count"]
    X = df[num_cols].fillna(df[num_cols].median())

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(X_scaled)

    preds = model.predict(X_scaled)
    anomaly_count = (preds == -1).sum()
    print(f"  Detected {anomaly_count} anomalies out of {len(df)} samples ({anomaly_count/len(df)*100:.1f}%)")

    with open(MODELS_DIR / "anomaly_detector.pkl", "wb") as f:
        pickle.dump({"model": model, "scaler": scaler, "features": num_cols}, f)
    print("  Saved: anomaly_detector.pkl")


def train_appreciation_model(df: pd.DataFrame):
    """Create locality price index for Prophet (synthetic time series)."""
    print("Creating price history for appreciation model...")
    from datetime import datetime, timedelta

    price_history = {}
    for locality in LOCALITIES:
        base = LOCALITY_MEDIANS.get(locality, 6000)
        growth = np.random.uniform(0.05, 0.12)
        months = []
        for i in range(36, 0, -1):
            dt = datetime.now().replace(day=1) - timedelta(days=i * 30)
            noise = np.random.normal(1.0, 0.03)
            ppsf = int(base * (1 + growth) ** (i / -12) * noise)
            months.append({"ds": dt.strftime("%Y-%m-%d"), "y": ppsf})
        price_history[locality] = months

    with open(MODELS_DIR / "price_history.pkl", "wb") as f:
        pickle.dump(price_history, f)
    print("  Saved: price_history.pkl")


if __name__ == "__main__":
    print("=" * 60)
    print("PROPIQ AI -- ML Training Pipeline")
    print("=" * 60)

    print("\nGenerating synthetic dataset...")
    df = generate_property_dataset(n=2000)
    print(f"Dataset shape: {df.shape}")

    # Save dataset for reference
    df.to_csv(MODELS_DIR / "training_data.csv", index=False)

    train_price_model(df)
    train_commercial_model(df)
    train_anomaly_model(df)
    train_appreciation_model(df)

    print("\n✅ All models trained and saved to:", MODELS_DIR)
    print("\nNext step: Run 'python ml/training/register_azure_ml.py' to deploy to Azure ML")
