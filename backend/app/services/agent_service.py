"""PROPIQ AI - Agent Service (LangChain + CrewAI + Azure OpenAI)"""
from __future__ import annotations

import uuid
from typing import Optional
from urllib.parse import urlparse

from app.config import settings


SYSTEM_PROMPT = """You are PropBot, the intelligent assistant for PROPIQ AI.
You help users find properties, understand the market, navigate legal processes,
and make smart investment decisions in Indian real estate.

You have access to tools that can:
1. Search and filter properties on the platform
2. Show market analytics and price trends
3. Answer legal questions about land deeds and RERA
4. Control the interface

When a user says "show me 3BHK in Kondapur under 80 lakhs", call search_properties with those parameters.
Always quote prices in lakhs/crores format. Reference real localities in Hyderabad.
Never hallucinate legal timelines without citing sources.

Response style:
- Start with the direct answer in 1-2 short sentences.
- Add 2-4 compact bullets only when they improve clarity.
- End with a practical next step when relevant.
- Avoid filler like "one moment" unless a tool is still running.
- Keep the message easy to scan in a chat bubble."""


def _build_gui_command(command: str, params: dict, target: str) -> dict:
    return {"command": command, "params": params, "target_component": target}


def _build_navigation_link(label: str, path: str, description: str = "", icon: str = "") -> dict:
    return {"label": label, "path": path, "description": description, "icon": icon}


def _format_inr(value: int | float | None) -> str:
    if value is None:
        return "price on request"
    amount = float(value)
    if amount >= 1e7:
        return f"Rs {amount / 1e7:.2f} Cr"
    if amount >= 1e5:
        return f"Rs {amount / 1e5:.1f} L"
    return f"Rs {amount:,.0f}"


def _query_from_params(params: dict) -> str:
    parts = []
    for key in ("locality", "bhk", "min_price", "max_price", "listing_type"):
        value = params.get(key)
        if value not in (None, ""):
            parts.append(f"{key}={value}")
    return "&".join(parts)


def _build_navigation_links(intent: str, gui_commands: list[dict]) -> list[dict]:
    links: list[dict] = []

    if intent == "search":
        props_path = "/properties"
        map_path = "/properties/map"
        for cmd in gui_commands:
            if cmd.get("command") == "APPLY_FILTER":
                query = _query_from_params(cmd.get("params", {}))
                if query:
                    props_path = f"/properties?{query}"
                    map_path = f"/properties/map?{query}"
                break
        links.extend(
            [
                _build_navigation_link("View matching properties", props_path, "Open filtered listing results.", "home"),
                _build_navigation_link("Open map view", map_path, "See the same results on the city map.", "map"),
                _build_navigation_link("Run AI valuation", "/predict/commercial", "Estimate price or commercial viability.", "sparkles"),
            ]
        )
    elif intent == "compare":
        links.append(_build_navigation_link("Open comparison", "/compare", "Compare shortlisted properties side by side.", "scale"))
    elif intent == "map":
        links.append(_build_navigation_link("Open map view", "/properties/map", "Inspect listings by location.", "map"))
    elif intent == "legal":
        links.extend(
            [
                _build_navigation_link("Open deed tools", "/deeds", "Upload deeds, track status, calculate stamp duty.", "file"),
                _build_navigation_link("Check RERA", "/deeds", "Use the RERA tab and official TG-RERA search.", "shield"),
            ]
        )
    elif intent == "valuation":
        links.extend(
            [
                _build_navigation_link("Run AI valuation", "/predict/commercial", "Use price prediction, commercial score, and appreciation tools.", "sparkles"),
                _build_navigation_link("Browse comparable listings", "/properties", "Compare nearby asking prices.", "home"),
            ]
        )
    elif intent == "investment":
        links.extend(
            [
                _build_navigation_link("View analytics", "/analytics", "Open locality rankings and market trends.", "chart"),
                _build_navigation_link("Browse top localities", "/properties", "Inspect listings in strong demand areas.", "home"),
            ]
        )
    elif intent == "general":
        links.extend(
            [
                _build_navigation_link("Browse properties", "/properties", "Search by budget, BHK, and locality.", "home"),
                _build_navigation_link("Open deed tools", "/deeds", "RERA, stamp duty, and document workflow.", "file"),
                _build_navigation_link("View analytics", "/analytics", "Market trends and locality insights.", "chart"),
            ]
        )

    return links


def _compose_curated_reply(intent: str, message: str, gui_commands: list[dict]) -> str | None:
    if intent == "search":
        params = {}
        for cmd in gui_commands:
            if cmd.get("command") == "APPLY_FILTER":
                params = cmd.get("params", {})
                break
        bits = []
        if params.get("bhk"):
            bits.append(f"{params['bhk']}BHK")
        if params.get("locality"):
            bits.append(f"in {params['locality']}")
        if params.get("max_price"):
            bits.append(f"under {_format_inr(params['max_price'])}")
        summary = " ".join(bits) if bits else "matching properties"
        return (
            f"I've narrowed the search to {summary}.\n\n"
            f"- Filters were applied to the listings view\n"
            f"- Use the buttons below to open the results or map view\n"
            f"- If you want, ask for budget, furnishing, or commercial-only refinement"
        )

    if intent == "compare":
        return (
            "Comparison is the right next step when you already have 2-3 options in mind.\n\n"
            "- Open the comparison page\n"
            "- Add shortlisted properties from the listings view\n"
            "- Compare price, area, furnishing, and locality side by side"
        )

    if intent == "map":
        return (
            "Map view is useful when locality and travel radius matter more than raw listing count.\n\n"
            "- Open the map to inspect clusters and nearby areas\n"
            "- Use it alongside filters to narrow by locality and BHK"
        )

    if intent == "legal" or any(word in message.lower() for word in ["deed", "stamp duty", "rera", "legal"]):
        msg = message.lower()
        if "rera" in msg:
            return (
                "For RERA, do not rely on seller screenshots alone. Verify the registration number on the official TG-RERA search portal.\n\n"
                "- Match the project name, promoter, location, and completion date\n"
                "- Use the RERA tab in Deed tools to keep the number with your checks\n"
                "- If the project is not found, treat it as a red flag until verified"
            )
        if "stamp" in msg or "registration fee" in msg:
            return (
                "In Telangana, the common property registration charge estimate is about 6% of property value.\n\n"
                "- Stamp duty: 4%\n"
                "- Registration fee: 0.5%\n"
                "- Transfer duty: 1.5%\n"
                "- Use the calculator for the exact amount on your property value"
            )
        return (
            "For a deed transfer in Telangana, plan for roughly 30 to 60 days when documents are clean.\n\n"
            "- Upload sale deed, EC, identity documents, and ownership records\n"
            "- Check name match and encumbrance before payment\n"
            "- Use the deed tracker to see OCR, legal check, and approval status"
        )

    if intent == "valuation" or any(word in message.lower() for word in ["predict", "valuation", "price", "commercial score", "appreciation"]):
        if "commercial" in message.lower() or "plot" in message.lower():
            return (
                "For a commercial plot, the key drivers are zoning, FSI, road width, and nearby business density.\n\n"
                "- Commercial or mixed-use zoning scores better than residential-only land\n"
                "- Road width above 24m usually improves visibility and access\n"
                "- Use Commercial Score for a numeric 0-100 viability result"
            )
        return (
            "The AI tools are the fastest way to get a concrete number instead of a general answer.\n\n"
            "- Run price valuation for a home\n"
            "- Run commercial score for a land parcel\n"
            "- Run appreciation forecast for locality trends"
        )

    if intent == "investment":
        return (
            "For Hyderabad investment, start with IT-corridor demand and then compare entry price.\n\n"
            "- Strong demand: HITEC City, Gachibowli, Madhapur, Kondapur\n"
            "- Better affordability: Miyapur, KPHB, Manikonda\n"
            "- Check analytics before shortlisting a locality"
        )

    return None


def _parse_intent(message: str) -> tuple[str, list[dict]]:
    """Simple intent parser (replaced by LangChain tool calling in production)."""
    msg = message.lower()
    gui_commands: list[dict] = []

    if any(kw in msg for kw in ["deed", "stamp duty", "rera", "legal", "encumbrance", "registration fee"]):
        return "legal", [_build_gui_command("NAVIGATE", {"path": "/deeds"}, "Router")]

    if any(kw in msg for kw in ["commercial score", "valuation", "predict", "appreciation", "price estimate", "plot score"]):
        return "valuation", [_build_gui_command("NAVIGATE", {"path": "/predict/commercial"}, "Router")]

    if any(kw in msg for kw in ["invest", "investment", "best locality", "best localities", "top area", "top localities"]):
        return "investment", [_build_gui_command("NAVIGATE", {"path": "/analytics"}, "Router")]

    if any(kw in msg for kw in ["show", "find", "search", "list"]):
        params = {}
        for bhk in ["1bhk", "2bhk", "3bhk", "4bhk", "1 bhk", "2 bhk", "3 bhk"]:
            if bhk in msg:
                params["bhk"] = int(bhk[0])
        localities = [
            "kondapur",
            "kphb",
            "gachibowli",
            "madhapur",
            "miyapur",
            "manikonda",
            "banjara hills",
            "jubilee hills",
            "kukatpally",
        ]
        for loc in localities:
            if loc in msg:
                params["locality"] = loc.title()
        import re
        budget = re.search(r"(?:under|below|less than|upto|up to)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(l|lac|lakh|lakhs|cr|crore|crores)?", msg)
        if budget:
            amount = float(budget.group(1))
            unit = (budget.group(2) or "lakh").lower()
            params["max_price"] = int(amount * (1e7 if unit in {"cr", "crore", "crores"} else 1e5))
        if params:
            gui_commands.append(_build_gui_command("APPLY_FILTER", params, "PropertyGrid"))
        return "search", gui_commands

    if any(kw in msg for kw in ["compare", "comparison", "vs"]):
        return "compare", [_build_gui_command("NAVIGATE", {"path": "/compare"}, "Router")]

    if any(kw in msg for kw in ["map", "location", "pin"]):
        return "map", [_build_gui_command("NAVIGATE", {"path": "/properties/map"}, "Router")]

    return "general", []


async def _call_azure_openai(message: str, history: list) -> str:
    """Call Azure OpenAI with conversation history."""
    if not settings.AZURE_OPENAI_KEY:
        return _fallback_response(message)

    try:
        endpoint = settings.AZURE_OPENAI_ENDPOINT.rstrip("/")
        parsed = urlparse(endpoint)
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.extend(history[-10:])
        messages.append({"role": "user", "content": message})

        if parsed.netloc.endswith("services.ai.azure.com"):
            from openai import OpenAI

            base_url = f"{parsed.scheme}://{parsed.netloc}/openai/v1/"
            client = OpenAI(api_key=settings.AZURE_OPENAI_KEY, base_url=base_url)
            response = client.chat.completions.create(
                model=settings.AZURE_OPENAI_DEPLOYMENT,
                messages=messages,
                temperature=0.5,
                max_tokens=420,
            )
        else:
            from openai import AzureOpenAI

            client = AzureOpenAI(
                azure_endpoint=endpoint,
                api_key=settings.AZURE_OPENAI_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
            )
            response = client.chat.completions.create(
                model=settings.AZURE_OPENAI_DEPLOYMENT,
                messages=messages,
                temperature=0.5,
                max_tokens=420,
            )
        return response.choices[0].message.content or _fallback_response(message)
    except Exception:
        return _fallback_response(message)


def _fallback_response(message: str) -> str:
    msg = message.lower()
    if "price" in msg or "predict" in msg:
        return (
            "Kondapur is currently around Rs 7,500 per sqft, while KPHB is closer to Rs 5,200 per sqft.\n\n"
            "- Use the AI valuation tool for a property-specific estimate\n"
            "- Compare nearby listings before treating this as a final decision"
        )
    if "deed" in msg or "legal" in msg:
        return (
            "Deed transfers in Telangana usually take 30 to 60 days.\n\n"
            "- Common documents: sale deed, encumbrance certificate, patta/adangal, Aadhaar, PAN\n"
            "- Delays usually come from document mismatch or legal review"
        )
    if "rera" in msg:
        return (
            "Check Telangana RERA status before buying any under-construction property.\n\n"
            "- Official portal: rera.telangana.gov.in\n"
            "- Verify the project number, promoter, and completion timeline"
        )
    return (
        "I can help with property search, AI valuation, deed workflow, and locality insights.\n\n"
        "- Ask for listings by budget, BHK, or locality\n"
        "- Ask legal or deed questions\n"
        "- Ask for commercial or appreciation analysis"
    )


class AgentService:
    def __init__(self):
        self._sessions: dict[str, dict] = {}

    async def chat(self, message: str, session_id: Optional[str], user_id: str, context: dict) -> dict:
        if not session_id:
            session_id = str(uuid.uuid4())

        if session_id not in self._sessions:
            self._sessions[session_id] = {"user_id": user_id, "history": [], "context": context}

        session = self._sessions[session_id]
        history = session["history"]

        intent, gui_commands = _parse_intent(message)
        reply = _compose_curated_reply(intent, message, gui_commands) or await _call_azure_openai(message, history)
        navigation_links = _build_navigation_links(intent, gui_commands)

        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": reply})

        return {
            "reply": reply,
            "session_id": session_id,
            "gui_commands": gui_commands,
            "sources": [],
            "navigation_links": navigation_links,
        }

    async def get_session(self, session_id: str, user_id: str) -> Optional[dict]:
        session = self._sessions.get(session_id)
        if session and session["user_id"] == user_id:
            return session
        return None

    async def issue_gui_command(self, session_id: str, command: str, params: dict, target: str) -> dict:
        return {"status": "issued", "command": command, "params": params}

    async def natural_language_search(self, query: str, user_id: str) -> dict:
        _, gui_commands = _parse_intent(query)
        reply = await _call_azure_openai(
            f"Extract property search filters from: '{query}'. Return JSON with locality, bhk, min_price, max_price if mentioned.",
            [],
        )
        return {"query": query, "filters": {}, "gui_commands": gui_commands, "explanation": reply}

    async def rag_query(self, query: str, document_type: Optional[str]) -> dict:
        try:
            from app.services.rag_service import rag_service

            return await rag_service.query(query, document_type)
        except Exception:
            return {
                "answer": _fallback_response(query),
                "sources": [],
                "confidence": "low",
            }


agent_service = AgentService()
