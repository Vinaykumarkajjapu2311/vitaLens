"""
VitaLens FastAPI backend.

Pipeline for /analyze-meal:
  1. YOLOv8  → real computer-vision food detection (bounding boxes + labels)
  2. RAG     → retrieve USDA/IFCT nutrition facts for detected items via ChromaDB
  3. Ollama  → local LLM synthesises grounded JSON analysis (no API key needed)

All other endpoints (/analyze-barcode, /generate-meal-plan, /translate) follow the
same RAG → Ollama pattern.
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)

# Import pipeline modules (relative imports work because we run from backend/)
import llm_client
import rag_pipeline
import yolo_detector
from rag_pipeline import build_rag_context_for_items, init_rag


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initialising RAG pipeline…")
    init_rag()
    logger.info("Loading YOLO model…")
    yolo_detector._load_model()
    logger.info("VitaLens backend ready.")
    yield


app = FastAPI(title="VitaLens AI Backend", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────────────

class UserProfile(BaseModel):
    weight: float | None = None
    height: float | None = None
    dietaryPreference: str | None = None
    allergies: str | None = None
    allergySeverity: int = 0
    healthConditions: dict = {}


class AnalyzeMealRequest(BaseModel):
    image_base64: str          # JPEG base64, no data-URI prefix
    user_profile: UserProfile = UserProfile()
    language: str = "English"


class AnalyzeBarcodeRequest(BaseModel):
    barcode: str
    off_context: str = ""      # Pre-fetched Open Food Facts text (done client-side)
    product_name: str = ""     # Best-guess product name for RAG lookup
    user_profile: UserProfile = UserProfile()
    language: str = "English"


class GenerateMealPlanRequest(BaseModel):
    plan_type: str             # "Daily" | "Weekly" | "Monthly"
    dates: list[str]
    user_profile: UserProfile = UserProfile()
    language: str = "English"


class TranslateRequest(BaseModel):
    analysis: dict
    target_language: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "vision_model": llm_client.VISION_MODEL, "text_model": llm_client.TEXT_MODEL}


@app.post("/analyze-meal")
async def analyze_meal(req: AnalyzeMealRequest):
    """
    Full YOLO → RAG → LLM pipeline for meal photo analysis.
    """
    try:
        # Stage 1: YOLO detection
        logger.info("Stage 1: YOLO detection…")
        yolo_labels = yolo_detector.get_detected_labels(req.image_base64)
        logger.info(f"YOLO labels: {yolo_labels}")

        # Stage 2: RAG — retrieve USDA facts for detected items
        logger.info("Stage 2: RAG retrieval…")
        rag_ctx = build_rag_context_for_items(yolo_labels) if yolo_labels else (
            "No items detected by YOLO. Use visual analysis to identify food items "
            "and estimate nutrition based on USDA averages."
        )

        # Stage 3+4: Claude synthesis
        logger.info("Stage 3: Claude analysis…")
        result = llm_client.analyze_meal(
            image_b64=req.image_base64,
            yolo_labels=yolo_labels,
            rag_context=rag_ctx,
            user_profile=req.user_profile.model_dump(),
            language=req.language,
        )

        return {"success": True, "data": result, "yolo_labels": yolo_labels}

    except Exception as e:
        logger.error(f"/analyze-meal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-barcode")
async def analyze_barcode(req: AnalyzeBarcodeRequest):
    """
    RAG → LLM pipeline for barcode product analysis.
    Open Food Facts fetch is done client-side; we receive the formatted context.
    """
    try:
        # RAG lookup using product name or raw barcode as fallback
        query_term = req.product_name or req.barcode
        logger.info(f"RAG lookup for: {query_term}")
        rag_ctx = build_rag_context_for_items([query_term])

        result = llm_client.analyze_barcode_product(
            barcode=req.barcode,
            off_context=req.off_context or "No Open Food Facts data available.",
            rag_context=rag_ctx,
            user_profile=req.user_profile.model_dump(),
            language=req.language,
        )

        return {"success": True, "data": result}

    except Exception as e:
        logger.error(f"/analyze-barcode error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-meal-plan")
async def generate_meal_plan(req: GenerateMealPlanRequest):
    try:
        result = llm_client.generate_meal_plan(
            user_profile=req.user_profile.model_dump(),
            plan_type=req.plan_type,
            dates=req.dates,
            language=req.language,
        )
        return {"success": True, "data": result}

    except Exception as e:
        logger.error(f"/generate-meal-plan error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/translate")
async def translate(req: TranslateRequest):
    try:
        result = llm_client.translate_analysis(req.analysis, req.target_language)
        return {"success": True, "data": result}

    except Exception as e:
        logger.error(f"/translate error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Dev entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
