"""
cognee_client.py
────────────────
Cognee Cloud connection using V2 API (remember/recall/forget/improve).
Exactly what the hackathon criteria asks for!

V2 API (New — use these):
  cognee.remember()  → add + cognify in one call
  cognee.recall()    → intelligent graph search
  cognee.forget()    → delete memory
  cognee.improve()   → strengthen graph (= memify)

V1 API (still works but older):
  cognee.add() + cognee.cognify() + cognee.search()
"""

import os
import cognee
from dotenv import load_dotenv

load_dotenv()

COGNEE_API_KEY  = os.getenv("COGNEE_API_KEY", "")
COGNEE_BASE_URL = os.getenv("COGNEE_BASE_URL", "")

_connected = False


async def connect():
    """Connect to Cognee Cloud once at startup."""
    global _connected
    if _connected:
        return
    if not COGNEE_API_KEY:
        raise ValueError("COGNEE_API_KEY not set in .env")
    if not COGNEE_BASE_URL:
        raise ValueError("COGNEE_BASE_URL not set in .env")

    await cognee.serve(
        url=COGNEE_BASE_URL,
        api_key=COGNEE_API_KEY,
    )
    _connected = True
    print(f"[Cognee] Connected to {COGNEE_BASE_URL}")


def _dataset(patient_id: str) -> str:
    """Each patient gets their own isolated dataset."""
    return f"patient_{patient_id}"


# ── V2 API ────────────────────────────────────────────────

async def cognee_remember(text: str, patient_id: str):
    """V2: remember() correct signature"""
    await connect()
    await cognee.remember(
        data=text,                        # ← data, not positional
        dataset_name=_dataset(patient_id) # ← this one DOES accept dataset_name
    )



async def cognee_recall(query: str, patient_id: str) -> list:
    """
    V2: recall() — correct signature is query_text + datasets
    NOT dataset_name — that's the bug!
    """
    await connect()
    results = await cognee.recall(
        query_text=query,              # ← query_text, not query
        datasets=[_dataset(patient_id)]  # ← datasets list, not dataset_name
    )
    print(f"[Cognee] recall() returned {len(results) if results else 0} results")
    return results if results else []



async def cognee_forget(patient_id: str):
    """
    V2: forget() — correct parameter is dataset= not dataset_name=
    Deletes all patient memory from Cognee Cloud.
    """
    await connect()
    try:
        # V2 API — correct parameter
        await cognee.forget(dataset=_dataset(patient_id))
        print(f"[Cognee] forget() complete for {_dataset(patient_id)}")
    except Exception as e:
        print(f"[Cognee] forget() error: {e}")
        # Fallback — try prune method
        try:
            await cognee.prune.prune_data(dataset_name=_dataset(patient_id))
            print(f"[Cognee] prune fallback complete")
        except Exception as e2:
            print(f"[Cognee] prune also failed: {e2}")
            raise


async def cognee_improve(patient_id: str):
    await connect()
    ds = _dataset(patient_id)
    try:
        await cognee.improve(dataset=ds)
        print(f"[Cognee] improve() complete")
    except Exception:
        try:
            await cognee.memify(dataset=ds)
            print(f"[Cognee] memify() complete")
        except Exception as e:
            print(f"[Cognee] improve/memify not available: {e}")

async def cognee_health_check() -> bool:
    """Verify Cognee Cloud connection."""
    try:
        await connect()
        return True
    except Exception as e:
        print(f"[Cognee] Health check failed: {e}")
        return False
