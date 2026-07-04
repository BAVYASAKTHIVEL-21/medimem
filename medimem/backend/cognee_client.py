"""
cognee_client.py
Cognee Cloud V2 Client
"""
import os, asyncio
from dotenv import load_dotenv
load_dotenv()

COGNEE_API_KEY  = os.getenv("COGNEE_API_KEY", "")
COGNEE_BASE_URL = os.getenv("COGNEE_BASE_URL", "")

_connected     = False
_connect_lock  = asyncio.Lock()
_last_key      = None
_last_url      = None


def _dataset(patient_id: str) -> str:
    return f"patient_{patient_id}"


async def connect():
    """
    Connect to Cognee Cloud.
    Only re-serves when keys actually changed or not yet connected —
    avoids leaking a new aiohttp session on every call.
    """
    global _connected, COGNEE_API_KEY, COGNEE_BASE_URL, _last_key, _last_url

    # Reload env every call (Settings page / header middleware may update them)
    COGNEE_API_KEY  = os.getenv("COGNEE_API_KEY", "")
    COGNEE_BASE_URL = os.getenv("COGNEE_BASE_URL", "")

    if not COGNEE_API_KEY:
        raise ValueError("COGNEE_API_KEY not configured")
    if not COGNEE_BASE_URL:
        raise ValueError("COGNEE_BASE_URL not configured")

    keys_changed = (COGNEE_API_KEY != _last_key) or (COGNEE_BASE_URL != _last_url)

    if _connected and not keys_changed:
        return

    async with _connect_lock:
        # Re-check inside the lock — another request may have already connected
        if _connected and not keys_changed:
            return

        import cognee
        await cognee.serve(
            url=COGNEE_BASE_URL,
            api_key=COGNEE_API_KEY,
        )
        _connected = True
        _last_key  = COGNEE_API_KEY
        _last_url  = COGNEE_BASE_URL
        print(f"[Cognee] Connected to {COGNEE_BASE_URL}")


async def cognee_health_check() -> bool:
    """Verify Cognee configuration/connection."""
    try:
        await connect()
        return True
    except Exception as e:
        print(f"[Cognee] Health check failed: {e}")
        return False


# --------------------------------------------------
# REMEMBER — with one retry on transient failure
# --------------------------------------------------
async def cognee_remember(text: str, patient_id: str):
    """Store permanent memory. Retries once if the session dropped."""
    await connect()
    import cognee

    for attempt in range(2):
        try:
            await cognee.remember(
                text,
                dataset_name=_dataset(patient_id),
            )
            print(f"[Cognee] remember() complete for {_dataset(patient_id)}")
            return
        except Exception as e:
            print(f"[Cognee] remember() attempt {attempt+1} failed: {e}")
            if attempt == 0:
                # Force a fresh connection and retry once
                global _connected
                _connected = False
                try:
                    await connect()
                except Exception as reconnect_err:
                    print(f"[Cognee] reconnect failed: {reconnect_err}")
                    raise
                await asyncio.sleep(0.5)
            else:
                raise


# --------------------------------------------------
# RECALL
# --------------------------------------------------
async def cognee_recall(query: str, patient_id: str):
    await connect()
    import cognee
    try:
        results = await cognee.recall(
            query_text=query,
            datasets=[_dataset(patient_id)],
        )
        print(f"[Cognee] recall() returned {len(results) if results else 0} results")
        return results or []
    except Exception as e:
        print(f"[Cognee] recall failed: {e}")
        return []


# --------------------------------------------------
# IMPROVE
# --------------------------------------------------
async def cognee_improve(patient_id: str):
    try:
        await connect()
        import cognee
        try:
            await cognee.improve(dataset=_dataset(patient_id))
            print(f"[Cognee] improve() complete")
        except Exception:
            try:
                await cognee.memify(_dataset(patient_id))
                print(f"[Cognee] memify() complete")
            except Exception as e:
                print(f"[Cognee] improve/memify not available: {e}")
    except Exception as e:
        print(f"[Cognee] improve skipped: {e}")


# --------------------------------------------------
# FORGET
# --------------------------------------------------
async def cognee_forget(patient_id: str):
    await connect()
    import cognee
    try:
        await cognee.forget(dataset=_dataset(patient_id))
        print(f"[Cognee] forget() complete")
    except Exception as e:
        print(f"[Cognee] forget failed: {e}")
        raise
