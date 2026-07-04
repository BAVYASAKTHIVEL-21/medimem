"""
cognee_client.py — Cognee Cloud V2 client
Connects using keys from env (set via Settings page or request headers)
"""
import os
from dotenv import load_dotenv
load_dotenv()

COGNEE_API_KEY  = os.getenv("COGNEE_API_KEY", "")
COGNEE_BASE_URL = os.getenv("COGNEE_BASE_URL", "")

_connected = False


def _dataset(patient_id: str) -> str:
    return f"patient_{patient_id}"


async def connect():
    global _connected, COGNEE_API_KEY, COGNEE_BASE_URL

    # Always re-read from env — keys may have been updated via headers
    COGNEE_API_KEY  = os.getenv("COGNEE_API_KEY", "")
    COGNEE_BASE_URL = os.getenv("COGNEE_BASE_URL", "")

    if not COGNEE_API_KEY or not COGNEE_BASE_URL:
        raise ValueError("Cognee API key and Base URL not configured. Go to Settings to add them.")

    if not _connected:
        import cognee
        await cognee.serve(url=COGNEE_BASE_URL, api_key=COGNEE_API_KEY)
        _connected = True


async def cognee_health_check() -> bool:
    """Check if Cognee is configured and reachable."""
    # Always re-read from env
    api_key  = os.getenv("COGNEE_API_KEY", "")
    base_url = os.getenv("COGNEE_BASE_URL", "")

    if not api_key or not base_url:
        # Not configured yet — not an error, just not set up
        print("[Cognee] Not configured yet — user needs to add keys in Settings")
        return False

    try:
        import cognee
        await cognee.serve(url=base_url, api_key=api_key)
        print("[Cognee] Health check passed")
        return True
    except Exception as e:
        print(f"[Cognee] Health check failed: {e}")
        return False


async def cognee_remember(text: str, patient_id: str):
    await connect()
    import cognee
    await cognee.remember(text, dataset_name=_dataset(patient_id))
    print(f"[Cognee] remember() complete for {_dataset(patient_id)}")


async def cognee_recall(query: str, patient_id: str) -> list:
    await connect()
    import cognee
    results = await cognee.recall(
        query_text=query,
        datasets=[_dataset(patient_id)]
    )
    print(f"[Cognee] recall() returned {len(results)} results")
    return results


async def cognee_forget(patient_id: str):
    await connect()
    import cognee
    dataset = _dataset(patient_id)
    await cognee.forget(dataset=dataset)
    print(f"[Cognee] forget() complete for {dataset}")


async def cognee_improve(patient_id: str):
    """Strengthen graph — runs in background, safe to fail."""
    try:
        await connect()
        import cognee
        try:
            await cognee.improve(dataset_name=_dataset(patient_id))
            print(f"[Cognee] improve() complete")
        except Exception:
            try:
                await cognee.memify(_dataset(patient_id))
                print(f"[Cognee] memify() complete")
            except Exception as e:
                print(f"[Cognee] improve/memify not available: {e}")
    except Exception as e:
        print(f"[Cognee] improve skipped: {e}")
