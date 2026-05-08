"""PROPIQ AI — AI Agents Router (LangChain + CrewAI)"""
import re

import httpx
from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.services.agent_service import agent_service
from app.utils.security import get_current_user

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[dict] = None   # current_page, active_filters, etc.


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    gui_commands: list = []          # GUI actions the agent wants to execute
    sources: list = []               # RAG source documents
    navigation_links: list = []      # quick links for the frontend chat UI


class GUICommandRequest(BaseModel):
    session_id: str
    command: str
    params: dict = {}
    target_component: str


class SearchRequest(BaseModel):
    natural_language_query: str
    session_id: Optional[str] = None


class DocQueryRequest(BaseModel):
    query: str
    document_type: Optional[str] = None  # rera, deed, zoning, stamp_duty


class VoiceRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    model_id: Optional[str] = None


def _tts_text(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text.replace("*", "")).strip()
    return cleaned[:2400]


@router.post("/chat", response_model=ChatResponse)
async def agent_chat(
    payload: ChatRequest,
    current_user=Depends(get_current_user),
):
    """Send a message to the Universal GUI Agent (PropBot)."""
    result = await agent_service.chat(
        message=payload.message,
        session_id=payload.session_id,
        user_id=current_user.user_id,
        context=payload.context or {},
    )
    return result


@router.post("/voice")
async def agent_voice(payload: VoiceRequest, current_user=Depends(get_current_user)):
    """Generate PropBot speech with ElevenLabs while keeping the API key server-side."""
    text = _tts_text(payload.text)
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs voice is not configured. Add ELEVENLABS_API_KEY to backend/.env and restart the backend.",
        )

    voice_id = payload.voice_id or getattr(settings, "ELEVENLABS_VOICE_ID", None) or "21m00Tcm4TlvDq8ikWAM"
    model_id = payload.model_id or getattr(settings, "ELEVENLABS_MODEL_ID", None) or "eleven_monolingual_v1"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                url,
                params={"output_format": settings.ELEVENLABS_OUTPUT_FORMAT},
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": text,
                    "model_id": model_id,
                    "voice_settings": {
                        "stability": 0.45,
                        "similarity_boost": 0.8,
                    },
                },
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:200] if exc.response is not None else "ElevenLabs request failed"
        print(f"\n[ElevenLabs API Error]: {detail}\n")
        raise HTTPException(status_code=502, detail=f"ElevenLabs error: {detail}") from exc
    except httpx.HTTPError as exc:
        print(f"\n[ElevenLabs Connection Error]: {exc}\n")
        raise HTTPException(status_code=502, detail=f"ElevenLabs voice request failed: {str(exc)[:180]}") from exc

    return Response(content=response.content, media_type="audio/mpeg")


@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user=Depends(get_current_user)):
    """Retrieve conversation history for an agent session."""
    session = await agent_service.get_session(session_id, current_user.user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/gui-command")
async def issue_gui_command(payload: GUICommandRequest):
    """Agent issues a GUI command to the frontend (navigate, filter, compare)."""
    result = await agent_service.issue_gui_command(
        payload.session_id, payload.command, payload.params, payload.target_component
    )
    return result


@router.post("/search")
async def agent_search(payload: SearchRequest, current_user=Depends(get_current_user)):
    """Agent-driven natural language property search."""
    result = await agent_service.natural_language_search(
        payload.natural_language_query, current_user.user_id
    )
    return result


@router.post("/doc-query")
async def doc_query(payload: DocQueryRequest, current_user=Depends(get_current_user)):
    """RAG query on legal documents (deeds, RERA, zoning laws)."""
    result = await agent_service.rag_query(payload.query, payload.document_type)
    return result
