"""PROPIQ AI - Analytics Router."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import ChatMessage, Lead, Property, Review, User
from app.db.session import get_db
from app.config import settings
from app.services.ml_service import ml_service
from app.utils.security import MockUser, require_roles

router = APIRouter()

LOCALITIES = [
    "Kondapur", "Gachibowli", "Madhapur", "HITEC City", "Miyapur",
    "KPHB", "Banjara Hills", "Jubilee Hills", "Manikonda", "Kukatpally",
    "Uppal", "Secunderabad", "Ameerpet", "Narsingi",
]


@router.get("/market-trends")
async def market_trends(city: str = Query("Hyderabad"), months: int = Query(12, le=36)):
    """Price trends by locality over the specified number of months."""
    trends = {}
    for loc in LOCALITIES[:8]:
        history = await ml_service.get_price_history(loc)
        trends[loc] = history[-months:]
    return {"city": city, "localities": LOCALITIES[:8], "trends": trends}


@router.get("/heatmap")
async def price_heatmap():
    """GeoJSON heatmap for price intensity across Hyderabad."""
    centroids = {
        "Kondapur": (17.4700, 78.3490),
        "Gachibowli": (17.4401, 78.3489),
        "Madhapur": (17.4478, 78.3800),
        "HITEC City": (17.4435, 78.3772),
        "Miyapur": (17.4950, 78.3250),
        "KPHB": (17.4856, 78.3915),
        "Banjara Hills": (17.4108, 78.4483),
        "Jubilee Hills": (17.4239, 78.4072),
        "Manikonda": (17.4023, 78.3822),
    }
    features = []
    for loc, (lat, lng) in centroids.items():
        ppsf = ml_service._locality_medians.get(loc, 6000)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lng, lat]},
            "properties": {"locality": loc, "price_per_sqft": ppsf, "intensity": ppsf / 12000},
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/top-localities")
async def top_localities(metric: str = Query("price_growth", enum=["price_growth", "listings", "score"])):
    """Top performing localities ranked by metric."""
    data = []
    for loc in LOCALITIES:
        insights = await ml_service.get_locality_insights(loc)
        if insights:
            data.append(insights)
    if metric == "price_growth":
        data.sort(key=lambda x: x.get("growth_score", 0), reverse=True)
    elif metric == "score":
        data.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    return {"metric": metric, "localities": data[:10]}


@router.get("/commercial-zones")
async def commercial_zones():
    """Commercial zone intelligence for Hyderabad."""
    zones = [
        {"zone": "HITEC City", "fsi": 4.0, "score": 92, "road_width": 30, "status": "Prime"},
        {"zone": "Gachibowli", "fsi": 3.5, "score": 88, "road_width": 24, "status": "Prime"},
        {"zone": "Madhapur", "fsi": 3.5, "score": 85, "road_width": 18, "status": "Prime"},
        {"zone": "Kondapur", "fsi": 3.0, "score": 78, "road_width": 18, "status": "Good"},
        {"zone": "Kukatpally", "fsi": 2.5, "score": 70, "road_width": 18, "status": "Good"},
        {"zone": "Miyapur", "fsi": 2.5, "score": 62, "road_width": 12, "status": "Moderate"},
        {"zone": "Uppal", "fsi": 2.0, "score": 55, "road_width": 12, "status": "Moderate"},
    ]
    return {"city": "Hyderabad", "zones": zones}


def _month_keys(count: int = 6) -> list[str]:
    now = datetime.utcnow()
    keys = []
    for offset in range(count - 1, -1, -1):
        month = now.month - offset
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        keys.append(f"{year}-{month:02d}")
    return keys


def _demo_seller_ops() -> dict:
    months = _month_keys()
    sold_counts = [8, 11, 10, 14, 16, 18]
    sold_values = [72000000, 104000000, 96000000, 132000000, 151000000, 174000000]
    new_listings = [34, 39, 36, 45, 48, 52]
    return {
        "demo_data": True,
        "summary": {
            "total_sellers": 8,
            "total_listings": 286,
            "verified_listings": 241,
            "pending_listings": 45,
            "total_leads": 318,
            "open_leads": 186,
            "sold_count": 77,
            "sold_value": 729000000,
            "conversion_rate": 0.242,
            "avg_rating": 4.35,
            "review_count": 148,
            "flagged_items": 4,
        },
        "seller_performance": [
            {
                "seller_id": "demo-seller-001",
                "seller_name": "Aarohi Realty",
                "email": "aarohi.realty@demo.propiq",
                "listings": 42,
                "verified_listings": 38,
                "pending_listings": 4,
                "leads": 76,
                "sold_count": 17,
                "sold_value": 166000000,
                "conversion_rate": 0.224,
                "avg_rating": 4.7,
                "review_count": 31,
                "flagged_reviews": 0,
            },
            {
                "seller_id": "demo-seller-002",
                "seller_name": "Hyderabad Habitat",
                "email": "habitat@demo.propiq",
                "listings": 36,
                "verified_listings": 33,
                "pending_listings": 3,
                "leads": 68,
                "sold_count": 15,
                "sold_value": 142000000,
                "conversion_rate": 0.221,
                "avg_rating": 4.4,
                "review_count": 27,
                "flagged_reviews": 1,
            },
            {
                "seller_id": "demo-seller-003",
                "seller_name": "Skyline Estates",
                "email": "skyline@demo.propiq",
                "listings": 31,
                "verified_listings": 27,
                "pending_listings": 4,
                "leads": 55,
                "sold_count": 13,
                "sold_value": 128000000,
                "conversion_rate": 0.236,
                "avg_rating": 4.2,
                "review_count": 22,
                "flagged_reviews": 0,
            },
            {
                "seller_id": "demo-seller-004",
                "seller_name": "Prime Keys Realty",
                "email": "primekeys@demo.propiq",
                "listings": 29,
                "verified_listings": 24,
                "pending_listings": 5,
                "leads": 49,
                "sold_count": 10,
                "sold_value": 91000000,
                "conversion_rate": 0.204,
                "avg_rating": 4.1,
                "review_count": 18,
                "flagged_reviews": 1,
            },
            {
                "seller_id": "demo-seller-005",
                "seller_name": "Nexus Properties",
                "email": "nexus@demo.propiq",
                "listings": 24,
                "verified_listings": 20,
                "pending_listings": 4,
                "leads": 36,
                "sold_count": 8,
                "sold_value": 73000000,
                "conversion_rate": 0.222,
                "avg_rating": 4.0,
                "review_count": 14,
                "flagged_reviews": 2,
            },
        ],
        "sales_trend": [
            {"month": month, "sold_count": sold_counts[idx], "sold_value": sold_values[idx], "new_listings": new_listings[idx]}
            for idx, month in enumerate(months)
        ],
        "lead_pipeline": [
            {"stage": "NEW", "count": 92},
            {"stage": "CONTACTED", "count": 58},
            {"stage": "VISIT", "count": 24},
            {"stage": "NEGOTIATION", "count": 12},
            {"stage": "CLOSED", "count": 77},
            {"stage": "DROPPED", "count": 55},
        ],
        "top_localities": [
            {"locality": "Kondapur", "listings": 54, "sold_count": 16, "sold_value": 152000000, "avg_price": 9500000},
            {"locality": "Gachibowli", "listings": 46, "sold_count": 13, "sold_value": 149000000, "avg_price": 11400000},
            {"locality": "Madhapur", "listings": 38, "sold_count": 11, "sold_value": 118000000, "avg_price": 10700000},
            {"locality": "HITEC City", "listings": 32, "sold_count": 9, "sold_value": 111000000, "avg_price": 12300000},
            {"locality": "Miyapur", "listings": 29, "sold_count": 8, "sold_value": 64000000, "avg_price": 8000000},
        ],
        "review_insights": {
            "avg_rating": 4.35,
            "total_reviews": 148,
            "flagged_reviews": 4,
            "moderation_queue": [
                {
                    "type": "review",
                    "review_id": "demo-review-001",
                    "property_id": "demo-prop-018",
                    "reviewer_name": "Kiran",
                    "rating": 2,
                    "comment": "Seller kept asking for advance before site visit.",
                    "status": "FLAGGED",
                    "created_at": f"{months[-1]}-04T10:30:00",
                },
                {
                    "type": "chat_flag",
                    "channel_id": "demo-channel-044",
                    "property_id": "demo-prop-044",
                    "sender_role": "SELLER",
                    "text": "Cash only payment request detected in chat.",
                    "created_at": f"{months[-1]}-06T18:20:00",
                },
            ],
        },
        "rule_based_projection": {
            "method": "Demo: open leads multiplied by current closed-lead conversion rate. No AI model used.",
            "potential_sales_30d": 45,
            "potential_value_30d": 426000000,
        },
    }


def _powerbi_embed_url() -> str:
    value = (settings.POWERBI_EMBED_URL or "").strip()
    lowered = value.lower()
    if not value or "your-powerbi" in lowered or "placeholder" in lowered or value.startswith("<"):
        return ""
    return value


@router.get("/admin/seller-ops")
async def admin_seller_ops(
    db: Session = Depends(get_db),
    user: MockUser = Depends(require_roles("ADMIN")),
):
    """Operational admin analytics for sellers, sold deals, leads, and reviews."""
    sellers = db.query(User).filter(func.upper(User.role) == "SELLER").all()
    properties = db.query(Property).all()
    leads = db.query(Lead).all()
    reviews = db.query(Review).all()

    if not leads and not reviews:
        return _demo_seller_ops()

    seller_ids = {seller.user_id for seller in sellers}
    seller_ids.update(prop.owner_user_id for prop in properties if prop.owner_user_id)
    known_sellers = {seller.user_id: seller for seller in sellers}
    props_by_id = {prop.property_id: prop for prop in properties}

    props_by_seller: dict[str, list[Property]] = defaultdict(list)
    for prop in properties:
        props_by_seller[prop.owner_user_id].append(prop)

    leads_by_seller: dict[str, list[Lead]] = defaultdict(list)
    for lead in leads:
        leads_by_seller[lead.seller_user_id].append(lead)

    reviews_by_seller: dict[str, list[Review]] = defaultdict(list)
    for review in reviews:
        seller_id = review.seller_user_id
        if not seller_id and review.property_id in props_by_id:
            seller_id = props_by_id[review.property_id].owner_user_id
        if seller_id:
            reviews_by_seller[seller_id].append(review)

    closed_stages = {"CLOSED", "SOLD"}
    closed_leads = [lead for lead in leads if (lead.stage or "").upper() in closed_stages]
    open_leads = [lead for lead in leads if (lead.stage or "").upper() not in closed_stages]
    total_sold_value = sum(float(props_by_id.get(lead.property_id).price) for lead in closed_leads if props_by_id.get(lead.property_id))
    average_sold_value = total_sold_value / len(closed_leads) if closed_leads else 0
    conversion_rate = (len(closed_leads) / len(leads)) if leads else 0

    seller_performance = []
    for seller_id in sorted(seller_ids):
        seller = known_sellers.get(seller_id)
        seller_props = props_by_seller.get(seller_id, [])
        seller_leads = leads_by_seller.get(seller_id, [])
        seller_closed = [lead for lead in seller_leads if (lead.stage or "").upper() in closed_stages]
        seller_reviews = reviews_by_seller.get(seller_id, [])
        seller_sold_value = sum(float(props_by_id.get(lead.property_id).price) for lead in seller_closed if props_by_id.get(lead.property_id))
        avg_rating = sum(float(review.rating) for review in seller_reviews) / len(seller_reviews) if seller_reviews else None
        seller_performance.append({
            "seller_id": seller_id,
            "seller_name": seller.name if seller else f"Seller {seller_id[:8]}",
            "email": seller.email if seller else "",
            "listings": len(seller_props),
            "verified_listings": sum(1 for prop in seller_props if prop.verified),
            "pending_listings": sum(1 for prop in seller_props if not prop.verified),
            "leads": len(seller_leads),
            "sold_count": len(seller_closed),
            "sold_value": round(seller_sold_value, 2),
            "conversion_rate": round(len(seller_closed) / len(seller_leads), 3) if seller_leads else 0,
            "avg_rating": round(avg_rating, 2) if avg_rating is not None else None,
            "review_count": len(seller_reviews),
            "flagged_reviews": sum(1 for review in seller_reviews if review.flagged or review.status.upper() == "FLAGGED"),
        })
    seller_performance.sort(key=lambda item: (item["sold_value"], item["sold_count"], item["leads"]), reverse=True)

    now = datetime.utcnow()
    month_keys = []
    for offset in range(5, -1, -1):
        month = now.month - offset
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        month_keys.append(f"{year}-{month:02d}")

    sales_by_month = {month: {"month": month, "sold_count": 0, "sold_value": 0.0, "new_listings": 0} for month in month_keys}
    for lead in closed_leads:
        key = lead.created_at.strftime("%Y-%m")
        if key in sales_by_month:
            sales_by_month[key]["sold_count"] += 1
            prop = props_by_id.get(lead.property_id)
            if prop:
                sales_by_month[key]["sold_value"] += float(prop.price)
    for prop in properties:
        key = prop.created_at.strftime("%Y-%m")
        if key in sales_by_month:
            sales_by_month[key]["new_listings"] += 1

    pipeline_counts = defaultdict(int)
    for lead in leads:
        pipeline_counts[(lead.stage or "NEW").upper()] += 1
    lead_pipeline = [{"stage": stage, "count": count} for stage, count in sorted(pipeline_counts.items())]

    locality_map = defaultdict(lambda: {"locality": "", "listings": 0, "sold_count": 0, "sold_value": 0.0, "avg_price": 0.0})
    for prop in properties:
        item = locality_map[prop.locality]
        item["locality"] = prop.locality
        item["listings"] += 1
        item["avg_price"] += float(prop.price)
    for lead in closed_leads:
        prop = props_by_id.get(lead.property_id)
        if not prop:
            continue
        item = locality_map[prop.locality]
        item["sold_count"] += 1
        item["sold_value"] += float(prop.price)
    top_localities = []
    for item in locality_map.values():
        listings = item["listings"] or 1
        item["avg_price"] = round(item["avg_price"] / listings, 2)
        item["sold_value"] = round(item["sold_value"], 2)
        top_localities.append(item)
    top_localities.sort(key=lambda item: (item["sold_count"], item["sold_value"], item["listings"]), reverse=True)

    review_keywords = {"fraud", "fake", "scam", "advance", "cash only", "harass", "spam"}
    risky_messages = []
    for message in db.query(ChatMessage).order_by(ChatMessage.timestamp.desc()).limit(200).all():
        lowered = (message.message or "").lower()
        if any(keyword in lowered for keyword in review_keywords):
            risky_messages.append({
                "type": "chat_flag",
                "channel_id": message.channel_id,
                "property_id": message.property_id,
                "sender_role": message.sender_role,
                "text": message.message[:180],
                "created_at": message.timestamp.isoformat(),
            })

    flagged_reviews = [
        {
            "type": "review",
            "review_id": review.review_id,
            "property_id": review.property_id,
            "reviewer_name": review.reviewer_name,
            "rating": review.rating,
            "comment": (review.comment or "")[:180],
            "status": review.status,
            "created_at": review.created_at.isoformat(),
        }
        for review in reviews
        if review.flagged or review.status.upper() in {"FLAGGED", "PENDING"}
    ]

    avg_rating = sum(float(review.rating) for review in reviews) / len(reviews) if reviews else None
    potential_sales_30d = round(len(open_leads) * conversion_rate)
    potential_value_30d = potential_sales_30d * average_sold_value

    return {
        "summary": {
            "total_sellers": len(seller_ids),
            "total_listings": len(properties),
            "verified_listings": sum(1 for prop in properties if prop.verified),
            "pending_listings": sum(1 for prop in properties if not prop.verified),
            "total_leads": len(leads),
            "open_leads": len(open_leads),
            "sold_count": len(closed_leads),
            "sold_value": round(total_sold_value, 2),
            "conversion_rate": round(conversion_rate, 3),
            "avg_rating": round(avg_rating, 2) if avg_rating is not None else None,
            "review_count": len(reviews),
            "flagged_items": len(flagged_reviews) + len(risky_messages),
        },
        "seller_performance": seller_performance[:25],
        "sales_trend": list(sales_by_month.values()),
        "lead_pipeline": lead_pipeline,
        "top_localities": top_localities[:10],
        "review_insights": {
            "avg_rating": round(avg_rating, 2) if avg_rating is not None else None,
            "total_reviews": len(reviews),
            "flagged_reviews": len(flagged_reviews),
            "moderation_queue": (flagged_reviews + risky_messages)[:20],
        },
        "rule_based_projection": {
            "method": "Open leads multiplied by current closed-lead conversion rate. No AI model used.",
            "potential_sales_30d": potential_sales_30d,
            "potential_value_30d": round(potential_value_30d, 2),
        },
    }


@router.get("/admin/powerbi")
async def admin_powerbi_dataset(
    db: Session = Depends(get_db),
    user: MockUser = Depends(require_roles("ADMIN")),
):
    """Power BI-ready flat datasets for admin seller operations."""
    ops = await admin_seller_ops(db=db, user=user)
    generated_at = datetime.utcnow().isoformat()
    demo_data = bool(ops.get("demo_data"))
    summary = {
        **ops.get("summary", {}),
        "generated_at": generated_at,
        "demo_data": demo_data,
    }

    tables = {
        "summary": [summary],
        "seller_performance": ops.get("seller_performance", []),
        "sales_trend": ops.get("sales_trend", []),
        "lead_pipeline": ops.get("lead_pipeline", []),
        "top_localities": ops.get("top_localities", []),
        "review_moderation": ops.get("review_insights", {}).get("moderation_queue", []),
        "projection": [ops.get("rule_based_projection", {})],
    }

    return {
        "dataset_name": "PROPIQ Admin Seller Operations",
        "generated_at": generated_at,
        "demo_data": demo_data,
        "embed_url": _powerbi_embed_url(),
        "tables": tables,
        "table_counts": {name: len(rows) for name, rows in tables.items()},
    }
