from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from api.stream import handle_event
from db.database import async_session_maker
from db.models import Event
from blockchain.avalanche_client import avalanche_client

class DisputeResponse(BaseModel):
    event_id: str
    hash_sha256: str
    blockchain_tx: str | None
    frame_urls: list[str]
    genlayer_verdict: str
    dispute_status: str

router = APIRouter()


class EventIngest(BaseModel):
    type: str
    camera_id: str
    timestamp: datetime
    clip_path: str | None = None
    hash_sha256: str | None = None
    confidence: float = 0.0
    metadata: dict[str, Any] = Field(default_factory=dict)
    module: str = "FACTORY"


@router.post("/ingest")
async def ingest_event(body: EventIngest) -> dict[str, Any]:
    payload = body.model_dump()
    ev = await handle_event(payload, extract_key_frames=True)
    return {
        "id": ev.id,
        "hash_sha256": ev.hash_sha256,
        "key_frames": (ev.event_metadata or {}).get("key_frames", []),
    }


@router.get("/")
async def list_events() -> list[dict[str, Any]]:
    async with async_session_maker() as session:
        result = await session.execute(select(Event).order_by(Event.timestamp.desc()).limit(100))
        events = result.scalars().all()
        import logging
        logging.getLogger(__name__).info(f"[INFO] Consultando eventos, total={len(events)}")
        from api.stream import _to_ws_payload
        return [_to_ws_payload(ev) for ev in events]


@router.get("/{event_id}")
async def get_event(event_id: str) -> dict[str, Any]:
    return {"id": event_id}


@router.get("/{event_id}/verify")
async def verify_event_endpoint(event_id: str) -> dict[str, Any]:
    async with async_session_maker() as session:
        result = await session.execute(select(Event).where(Event.id == event_id))
        ev = result.scalar_one_or_none()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        
        verified = False
        if ev.hash_sha256:
            verified = await avalanche_client.verify_hash(ev.hash_sha256)
            
        return {
            "event_id": str(ev.id),
            "hash_sha256": str(ev.hash_sha256),
            "blockchain_tx": str(ev.blockchain_tx) if ev.blockchain_tx else None,
            "verified": verified,
            "blockchain_status": str(ev.blockchain_status) if ev.blockchain_status else None
        }


@router.post("/{event_id}/dispute", response_model=DisputeResponse)
async def create_dispute(event_id: str) -> DisputeResponse:
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[INFO] Iniciando disputa para evento {event_id}")
    
    async with async_session_maker() as session:
        result = await session.execute(select(Event).where(Event.id == event_id))
        ev = result.scalar_one_or_none()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
            
        if not ev.hash_sha256 or not ev.clip_path:
            raise HTTPException(status_code=400, detail="Event missing hash or clip")
            
        key_frames = (ev.event_metadata or {}).get("key_frames", [])
        if not key_frames:
            raise HTTPException(status_code=400, detail="No key frames available")
            
        from integrations.ipfs_client import pinata_client
        logger.info(f"[INFO] Subiendo {len(key_frames)} frames a IPFS...")
        if pinata_client.is_configured():
            frame_urls = await pinata_client.upload_files(key_frames)
        else:
            frame_urls = [f"local://{p}" for p in key_frames]
            
        logger.info(f"[INFO] Frames subidos: {frame_urls}")
            
        from integrations.genlayer_client import genlayer_client
        logger.info("[INFO] Solicitando veredicto a Genlayer...")
        
        verdict = await genlayer_client.request_verdict(
            hash_sha256=ev.hash_sha256,
            frame_urls=frame_urls,
            event_type=ev.type,
            context=f"Módulo: {ev.module}, Timestamp: {ev.timestamp}"
        )
        
        logger.info(f"[INFO] Veredicto recibido: {verdict}")
        logger.info(f"[INFO] Disputa resuelta: {event_id} → {verdict}")
        
        ev.genlayer_verdict = verdict
        session.add(ev)
        await session.commit()
        await session.refresh(ev)
        
        return DisputeResponse(
            event_id=str(ev.id),
            hash_sha256=str(ev.hash_sha256),
            blockchain_tx=str(ev.blockchain_tx) if ev.blockchain_tx else None,
            frame_urls=frame_urls,
            genlayer_verdict=verdict,
            dispute_status="resolved"
        )

