"""Deterministic demo seller accounts for the fallback property catalogue."""
from __future__ import annotations

from typing import TypedDict


PROPERTIES_PER_DEMO_SELLER = 100
DEMO_SELLER_PASSWORD = "seller123"


class DemoSeller(TypedDict):
    user_id: str
    name: str
    email: str
    password: str


DEMO_SELLERS: list[DemoSeller] = [
    {
        "user_id": "demo-seller-001",
        "name": "Aarohi Realty",
        "email": "seller1@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-002",
        "name": "Hyderabad Habitat",
        "email": "seller2@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-003",
        "name": "Skyline Estates",
        "email": "seller3@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-004",
        "name": "Prime Keys Realty",
        "email": "seller4@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-005",
        "name": "Nexus Properties",
        "email": "seller5@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-006",
        "name": "Urban Nest Realty",
        "email": "seller6@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-007",
        "name": "Blue Oak Estates",
        "email": "seller7@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-008",
        "name": "MetroSquare Realty",
        "email": "seller8@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-009",
        "name": "Vertex Homes",
        "email": "seller9@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
    {
        "user_id": "demo-seller-010",
        "name": "Lotus Gate Realty",
        "email": "seller10@propiq.ai",
        "password": DEMO_SELLER_PASSWORD,
    },
]


def seller_for_property_position(position: int) -> DemoSeller:
    """Return the seller for a 1-based property position."""
    zero_based = max(position - 1, 0)
    seller_index = min(zero_based // PROPERTIES_PER_DEMO_SELLER, len(DEMO_SELLERS) - 1)
    return DEMO_SELLERS[seller_index]
