"""
YOLOv8 food detection module.

Stage 1 – runs real YOLO inference on the image.
Stage 2 – maps COCO class names to food-friendly labels and filters
          out non-food objects.

If a food-specific weights file is specified in YOLO_MODEL_PATH, that model
is used instead of the default yolov8n.pt (80 COCO classes).
A food-trained checkpoint (e.g. trained on Food-101 / UEC-Food256) will give
far richer detections; the base model still catches common items like
banana, apple, sandwich, pizza, cake, etc.
"""

import base64
import io
import logging
import os
from pathlib import Path

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# COCO classes that are food or food-adjacent
_COCO_FOOD_CLASSES: set[str] = {
    "banana", "apple", "sandwich", "orange", "broccoli", "carrot",
    "hot dog", "pizza", "donut", "cake", "bowl", "cup",
    # additional common items the base model might pick up
    "bottle", "wine glass",
}

# Friendly label remaps for COCO class names → nutrition DB keys
_LABEL_REMAP: dict[str, str] = {
    "hot dog": "hot dog",
    "orange": "orange",
    "apple": "apple",
    "banana": "banana",
    "broccoli": "broccoli",
    "carrot": "carrot",
    "sandwich": "sandwich",
    "pizza": "pizza",
    "donut": "donut",
    "cake": "cake",
}

_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model

    try:
        from ultralytics import YOLO  # noqa: PLC0415

        custom_path = os.getenv("YOLO_MODEL_PATH", "").strip()
        if custom_path and Path(custom_path).exists():
            logger.info(f"Loading custom YOLO model from {custom_path}")
            _model = YOLO(custom_path)
        else:
            logger.info("Loading YOLOv8n (COCO baseline)…")
            _model = YOLO("yolov8n.pt")  # auto-downloads on first run

    except Exception as exc:
        logger.error(f"Failed to load YOLO model: {exc}")
        _model = None

    return _model


def _decode_image(image_b64: str) -> Image.Image:
    """Decode a base64-encoded JPEG/PNG into a PIL Image."""
    raw = base64.b64decode(image_b64)
    return Image.open(io.BytesIO(raw)).convert("RGB")


def detect_food_items(image_b64: str, conf_threshold: float = 0.35) -> list[dict]:
    """
    Run YOLO on the provided base64 image.

    Returns a list of detections, each with:
        { label: str, confidence: float, bbox: [x1,y1,x2,y2] }

    Only food-class detections above `conf_threshold` are returned.
    Falls back to an empty list if the model is unavailable.
    """
    model = _load_model()
    if model is None:
        logger.warning("YOLO model unavailable; returning empty detections.")
        return []

    try:
        img = _decode_image(image_b64)
        img_array = np.array(img)

        results = model(img_array, conf=conf_threshold, verbose=False)
        detections: list[dict] = []

        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                cls_id = int(box.cls[0])
                label: str = model.names[cls_id].lower()
                conf: float = float(box.conf[0])

                # Keep all classes if using a food-specific model (more than 80 classes),
                # otherwise filter to known food COCO classes.
                if len(model.names) > 80 or label in _COCO_FOOD_CLASSES:
                    friendly_label = _LABEL_REMAP.get(label, label)
                    bbox = box.xyxy[0].tolist()
                    detections.append({
                        "label": friendly_label,
                        "confidence": round(conf, 3),
                        "bbox": [round(v, 1) for v in bbox],
                    })

        # De-duplicate labels (keep highest-confidence per label)
        best: dict[str, dict] = {}
        for d in detections:
            lbl = d["label"]
            if lbl not in best or d["confidence"] > best[lbl]["confidence"]:
                best[lbl] = d

        deduped = sorted(best.values(), key=lambda x: x["confidence"], reverse=True)
        logger.info(f"YOLO detected {len(deduped)} food item(s): {[d['label'] for d in deduped]}")
        return deduped

    except Exception as exc:
        logger.error(f"YOLO inference error: {exc}")
        return []


def get_detected_labels(image_b64: str) -> list[str]:
    """Convenience wrapper — returns just the label strings."""
    return [d["label"] for d in detect_food_items(image_b64)]
