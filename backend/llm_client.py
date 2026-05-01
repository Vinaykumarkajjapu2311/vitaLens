"""
LLM client using Google Gemini API.
"""

import json
import logging
import os
from typing import Any

import google.generativeai as genai

logger = logging.getLogger(__name__)

# Load API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("EXPO_PUBLIC_GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not set in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)

# Preferred model order for availability/fallback
GEMINI_MODELS = [
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
]
TEXT_MODEL = GEMINI_MODELS[0]
VISION_MODEL = GEMINI_MODELS[0]

# Expose for health endpoint
# VISION_MODEL = "yolov8 (local CV)" # We still use YOLO for detection, but Gemini for synthesis

def _get_model(model_name: str = TEXT_MODEL):
    return genai.GenerativeModel(model_name)


def _parse_json_response(text: str) -> Any:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON: {text}")
        raise e


def _chat_text(prompt: str) -> str:
    for idx, model_name in enumerate(GEMINI_MODELS):
        try:
            model = _get_model(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            msg = str(e).lower()
            is_retryable = (
                "503" in msg
                or "high demand" in msg
                or "temporar" in msg
                or "not found" in msg
                or "unsupported model" in msg
            )
            if is_retryable and idx < len(GEMINI_MODELS) - 1:
                logger.warning(f"Gemini model failed ({model_name}), retrying next model: {e}")
                continue
            raise

    raise RuntimeError("All configured Gemini models failed or are unavailable")


# ── Meal image analysis ────────────────────────────────────────────────────────

def analyze_meal(
    image_b64: str,           # kept in signature for API compatibility but not sent to LLM
    yolo_labels: list[str],
    rag_context: str,
    user_profile: dict,
    language: str = "English",
) -> dict:
    """
    Vision is fully handled by YOLO (yolo_detector.py).
    llama3.2 only receives text: YOLO labels + USDA nutrition facts from RAG.
    """
    if not yolo_labels:
        yolo_section = (
            "YOLO could not detect food items from this image "
            "(base model only covers 15 common food classes). "
            "Generate a general analysis based on a typical mixed meal."
        )
    else:
        yolo_section = (
            f"YOLOv8 detected these food items in the image:\n"
            + "\n".join(f"  - {lbl}" for lbl in yolo_labels)
        )

    user_ctx = _format_user_profile(user_profile)

    prompt = f"""You are an expert nutritionist AI with access to USDA food composition data.

The meal image has been analysed by YOLOv8 (computer vision). Your job is to synthesise
the detection results and USDA nutrition data into an accurate nutritional report.

RULES:
1. Use ONLY the YOLO-detected items as the food list — do not add items not detected.
2. Use the USDA numbers from RAG for all calorie/macro values — do not invent numbers.
3. If USDA data is missing for an item, estimate and mark it "(estimated)".
4. Respond STRICTLY in {language}.
5. Output ONLY raw JSON — no markdown, no explanation outside the JSON.

{yolo_section}

USDA Nutrition Data (from RAG pipeline):
{rag_context}

{user_ctx}

Return this exact JSON schema:
{{
  "name": "General meal name based on detected items",
  "allergenNotices": ["allergen warnings relevant to user"],
  "totalGrams": "e.g. 420g",
  "calories": "e.g. 680",
  "macros": {{"carbs": "e.g. 85g", "fat": "e.g. 22g", "protein": "e.g. 28g"}},
  "micronutrients": [{{"name": "Sodium", "value": "820mg"}}],
  "identifiedItems": [
    {{"name": "Item (YOLO detected)", "weight": "200g", "calories": "340 kcal", "macros": "Carbs: 50g, Fat: 10g, Protein: 15g"}}
  ],
  "detailedAnalysis": "1-2 sentence nutritional breakdown based on USDA data.",
  "healthyImprovements": ["Specific actionable advice 1", "advice 2"],
  "portionGuidance": "Portion advice tailored to user health profile."
}}"""

    raw = _chat_text(prompt)
    return _parse_json_response(raw)


# ── Barcode product analysis ───────────────────────────────────────────────────

def analyze_barcode_product(
    barcode: str,
    off_context: str,
    rag_context: str,
    user_profile: dict,
    language: str = "English",
) -> dict:
    user_ctx = _format_user_profile(user_profile)

    prompt = f"""You are an expert nutritionist AI.
The user scanned barcode: {barcode}

Open Food Facts Data:
{off_context}

RAG-Retrieved USDA Nutrition Facts (use these numbers):
{rag_context}

{user_ctx}

Respond in {language}. Output ONLY raw JSON with no extra text:
{{
  "name": "Product/meal name",
  "allergenNotices": ["allergen warnings"],
  "totalGrams": "serving size e.g. 100g",
  "calories": "e.g. 420",
  "macros": {{"carbs": "e.g. 60g", "fat": "e.g. 12g", "protein": "e.g. 8g"}},
  "micronutrients": [{{"name": "Calcium", "value": "120mg"}}],
  "identifiedItems": [
    {{"name": "Product name", "weight": "100g", "calories": "420 kcal", "macros": "Carbs: 60g, Fat: 12g, Protein: 8g"}}
  ],
  "detailedAnalysis": "2-3 sentence nutritional breakdown.",
  "healthyImprovements": ["advice 1", "advice 2"],
  "portionGuidance": "Portion advice for user."
}}"""

    raw = _chat_text(prompt)
    return _parse_json_response(raw)


# ── Meal plan generation ───────────────────────────────────────────────────────

def generate_meal_plan(
    user_profile: dict,
    plan_type: str,
    dates: list[str],
    language: str = "English",
) -> dict:
    user_ctx = _format_user_profile(user_profile)

    prompt = f"""You are an expert Indian nutritionist AI.
Generate a {plan_type} meal plan in strictly Indian cuisine style.
Respond in {language}.

{user_ctx}

CRITICAL RULES:
1. Generate EXACTLY {len(dates)} items in "days". Day names MUST match: {", ".join(dates)}
2. 4 meals per day: Breakfast, Lunch, Snack, Dinner.
3. All dishes must be popular, recognisable Indian names.
4. Honour allergies and health condition severities strictly.
5. Output ONLY raw JSON — no markdown, no extra text.

JSON schema:
{{
  "title": "Catchy plan title",
  "description": "Short explanation why this fits the user",
  "averageDailyCalories": 1800,
  "days": [
    {{
      "dayName": "Mon, Apr 21",
      "meals": [
        {{"type": "Breakfast", "name": "Poha with peanuts", "calories": 280}},
        {{"type": "Lunch",     "name": "Dal tadka + roti",  "calories": 450}},
        {{"type": "Snack",     "name": "Masala chaas",      "calories": 80}},
        {{"type": "Dinner",    "name": "Palak paneer + rice","calories": 520}}
      ]
    }}
  ]
}}"""

    raw = _chat_text(prompt)
    return _parse_json_response(raw)


# ── Translation ────────────────────────────────────────────────────────────────

def translate_analysis(analysis: dict, target_language: str) -> dict:
    prompt = f"""Translate all string values in the following JSON into {target_language}.
Keep the exact same key structure. Output ONLY raw JSON — no markdown, no extra text.

JSON:
{json.dumps(analysis, ensure_ascii=False)}"""

    raw = _chat_text(prompt)
    return _parse_json_response(raw)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _format_user_profile(p: dict) -> str:
    if not p:
        return ""
    hc = p.get("healthConditions", {})
    return f"""User Profile (personalise response for this user):
- Weight: {p.get('weight', 'unknown')} kg
- Height: {p.get('height', 'unknown')} cm
- Diet / Goal: {p.get('dietaryPreference', 'none')}
- Allergies: {p.get('allergies', 'none')} (severity 0-5: {p.get('allergySeverity', 0)})
- Health conditions (0=none, 5=severe):
    Diabetes:         {hc.get('diabetes', 0)}
    High BP:          {hc.get('highBloodPressure', 0)}
    High Cholesterol: {hc.get('highCholesterol', 0)}
    PCOS:             {hc.get('pcos', 0)}
    Thyroid:          {hc.get('thyroidIssues', 0)}"""
