"""
RAG pipeline: ChromaDB vector store backed by USDA/IFCT nutrition data.
On first run it builds the collection; subsequent runs reload from disk.
"""

import os
import logging
from pathlib import Path

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from nutrition_data import NUTRITION_DB, format_nutrition_context

logger = logging.getLogger(__name__)

_COLLECTION_NAME = "vitalens_nutrition"
_PERSIST_DIR = str(Path(__file__).parent / "chroma_db")

_client: chromadb.ClientAPI | None = None
_collection: chromadb.Collection | None = None
_embedder: SentenceTransformer | None = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        logger.info("Loading sentence-transformers model…")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def init_rag() -> None:
    """Build or reload the ChromaDB collection. Call once at startup."""
    global _client, _collection

    os.makedirs(_PERSIST_DIR, exist_ok=True)
    _client = chromadb.PersistentClient(
        path=_PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False),
    )

    existing = [c.name for c in _client.list_collections()]
    if _COLLECTION_NAME in existing:
        _collection = _client.get_collection(_COLLECTION_NAME)
        logger.info(f"Loaded existing ChromaDB collection ({_collection.count()} items).")
        return

    logger.info("Building ChromaDB nutrition collection…")
    _collection = _client.create_collection(
        name=_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    embedder = _get_embedder()
    food_names = list(NUTRITION_DB.keys())

    # Build rich documents for each food so semantic search is meaningful
    documents: list[str] = []
    for name in food_names:
        d = NUTRITION_DB[name]
        doc = (
            f"{name}: {d['calories']} kcal per 100g, "
            f"protein {d['protein_g']}g, carbs {d['carbs_g']}g, "
            f"fat {d['fat_g']}g, fiber {d['fiber_g']}g, sodium {d['sodium_mg']}mg"
        )
        documents.append(doc)

    embeddings = embedder.encode(documents, show_progress_bar=False).tolist()

    _collection.add(
        ids=food_names,
        documents=documents,
        embeddings=embeddings,
        metadatas=[{"food_name": n} for n in food_names],
    )
    logger.info(f"ChromaDB collection built with {len(food_names)} entries.")


def query_nutrition(food_name: str, top_k: int = 3) -> list[dict]:
    """
    Return the top_k closest food entries for `food_name`.
    Each result has keys: food_name, nutrition_context, distance.
    """
    if _collection is None:
        raise RuntimeError("RAG pipeline not initialised. Call init_rag() first.")

    embedder = _get_embedder()
    query_vec = embedder.encode([food_name]).tolist()

    results = _collection.query(
        query_embeddings=query_vec,
        n_results=min(top_k, _collection.count()),
        include=["metadatas", "distances"],
    )

    hits: list[dict] = []
    if not results["metadatas"] or not results["metadatas"][0]:
        return hits

    for meta, dist in zip(results["metadatas"][0], results["distances"][0]):
        name = meta["food_name"]
        hits.append({
            "food_name": name,
            "nutrition_context": format_nutrition_context(name),
            "similarity": round(1 - dist, 3),
        })
    return hits


def build_rag_context_for_items(detected_items: list[str]) -> str:
    """
    Given a list of food names detected by YOLO / LLM, retrieve USDA nutrition
    facts for each and return a single combined context string for the LLM prompt.
    """
    if not detected_items:
        return "No food items detected."

    sections: list[str] = []
    seen: set[str] = set()

    for item in detected_items:
        hits = query_nutrition(item, top_k=1)
        if hits and hits[0]["food_name"] not in seen:
            seen.add(hits[0]["food_name"])
            sections.append(hits[0]["nutrition_context"])
        else:
            sections.append(f"No USDA data found for '{item}'.")

    return "\n\n".join(sections)
