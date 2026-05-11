"""PROPIQ AI — Backend Tests"""
import uuid

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings
from app.db.models import User
from app.db.session import SessionLocal


AUTH_HEADERS = {"Authorization": "Bearer mock-jwt-token-propiq-2024"}


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_demo_admin_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/api/v1/auth/login",
            data={"username": "test@propiq.ai", "password": "test123", "role": "ADMIN"},
        )
    assert r.status_code == 200
    data = r.json()
    assert data["role"] == "ADMIN"
    assert data["access_token"]


@pytest.mark.asyncio
async def test_register_allows_same_email_for_buyer_and_seller_but_not_admin():
    email = f"same-role-{uuid.uuid4().hex}@example.com"
    admin_email = f"admin-register-{uuid.uuid4().hex}@example.com"

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            buyer = await client.post(
                "/api/v1/auth/register",
                json={"name": "Same Email Buyer", "email": email, "password": "test123", "role": "BUYER", "code": "123456"},
            )
            seller = await client.post(
                "/api/v1/auth/register",
                json={"name": "Same Email Seller", "email": email, "password": "test123", "role": "SELLER", "code": "123456"},
            )
            admin = await client.post(
                "/api/v1/auth/register",
                json={"name": "Blocked Admin", "email": admin_email, "password": "test123", "role": "ADMIN", "code": "123456"},
            )

        assert buyer.status_code == 201
        assert seller.status_code == 201
        assert buyer.json()["role"] == "BUYER"
        assert seller.json()["role"] == "SELLER"
        assert buyer.json()["user_id"] != seller.json()["user_id"]
        assert admin.status_code == 400
    finally:
        with SessionLocal() as db:
            db.query(User).filter(User.email.in_([email, admin_email])).delete(synchronize_session=False)
            db.commit()


@pytest.mark.asyncio
async def test_list_properties():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/properties/")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) > 0
    assert len(set(data["items"][0]["image_urls"])) == len(data["items"][0]["image_urls"])
    assert len(data["items"]) > 0
    assert isinstance(data["items"][0].get("latitude"), float)
    assert isinstance(data["items"][0].get("longitude"), float)


@pytest.mark.asyncio
async def test_predict_land_price():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/v1/predict/land-price", json={
            "locality": "Kondapur", "area_sqft": 1200, "bhk": 2, "age_years": 5,
        })
    assert r.status_code == 200
    data = r.json()
    assert "predicted_price" in data
    assert data["predicted_price"] > 0


@pytest.mark.asyncio
async def test_commercial_score():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/v1/predict/commercial-score", json={
            "latitude": 17.44, "longitude": 78.38,
            "land_use_zone": "COMMERCIAL", "fsi_allowed": 3.0, "road_width": 18.0,
        })
    assert r.status_code == 200
    data = r.json()
    assert "score" in data
    assert data["label"] in ["LOW", "MEDIUM", "HIGH"]


@pytest.mark.asyncio
async def test_appreciation_forecast():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/v1/predict/appreciation", json={
            "locality": "Kondapur", "current_price_per_sqft": 7500, "horizon_years": [1, 3, 5],
        })
    assert r.status_code == 200
    data = r.json()
    assert "forecasts" in data
    assert "1yr" in data["forecasts"]


@pytest.mark.asyncio
async def test_stamp_duty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/deeds/stamp-duty", params={"state": "Telangana", "property_value": 5000000})
    assert r.status_code == 200
    data = r.json()
    assert "stamp_duty" in data
    assert data["stamp_duty"] == 200000  # 4% of 50L


@pytest.mark.asyncio
async def test_rera_check_uses_official_manual_workflow_without_fake_registration():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/deeds/rera/P02400010494")
    assert r.status_code == 200
    data = r.json()
    assert data["rera_number"] == "P02400010494"
    assert data["status"] == "MANUAL_VERIFICATION_REQUIRED"
    assert data["is_registered"] is None
    assert data["official_search_url"].startswith("https://rerait.telangana.gov.in")


@pytest.mark.asyncio
async def test_market_trends():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/analytics/market-trends")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_geojson():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/properties/map/geojson")
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "FeatureCollection"


@pytest.mark.asyncio
async def test_agent_chat_returns_clear_answer_and_navigation_cards():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/api/v1/agents/chat",
            headers=AUTH_HEADERS,
            json={"message": "Commercial score for KPHB plot"},
        )
    assert r.status_code == 200
    data = r.json()
    assert "commercial plot" in data["reply"].lower()
    assert data["navigation_links"]
    assert data["navigation_links"][0]["path"] == "/predict/commercial"
    assert "description" in data["navigation_links"][0]


@pytest.mark.asyncio
async def test_agent_voice_requires_elevenlabs_key_when_not_configured():
    original_key = settings.ELEVENLABS_API_KEY
    settings.ELEVENLABS_API_KEY = ""
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post(
                "/api/v1/agents/voice",
                headers=AUTH_HEADERS,
                json={"text": "Hello from PropBot"},
            )
    finally:
        settings.ELEVENLABS_API_KEY = original_key
    assert r.status_code == 503
    assert "ElevenLabs voice is not configured" in r.json()["detail"]
