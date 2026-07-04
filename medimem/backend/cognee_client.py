import os
from dotenv import load_dotenv

load_dotenv()

COGNEE_API_KEY = os.getenv("COGNEE_API_KEY", "")
COGNEE_BASE_URL = os.getenv("COGNEE_BASE_URL", "")

_connected = False


def _dataset(patient_id: str) -> str:
    return f"patient_{patient_id}"


async def connect():
    global _connected, COGNEE_API_KEY, COGNEE_BASE_URL

    COGNEE_API_KEY = os.getenv("COGNEE_API_KEY", "")
    COGNEE_BASE_URL = os.getenv("COGNEE_BASE_URL", "")

    if not COGNEE_API_KEY:
        raise ValueError("COGNEE_API_KEY not configured")

    if not COGNEE_BASE_URL:
        raise ValueError("COGNEE_BASE_URL not configured")

    if _connected:
        return

    import cognee

    await cognee.serve(
        url=COGNEE_BASE_URL,
        api_key=COGNEE_API_KEY,
    )

    _connected = True
    print(f"[Cognee] Connected to {COGNEE_BASE_URL}")


async def cognee_health_check() -> bool:
    try:
        await connect()
        return True
    except Exception as e:
        print(f"[Cognee] Health check failed: {e}")
        return False


async def cognee_remember(text: str, patient_id: str):
    await connect()
    import cognee

    await cognee.remember(
        text,
        dataset_name=_dataset(patient_id),
    )

    print(f"[Cognee] remember() complete for {_dataset(patient_id)}")


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


async def cognee_improve(patient_id: str):
    await connect()
    import cognee

    try:
        await cognee.improve(
            dataset=_dataset(patient_id),
        )
        print(f"[Cognee] improve() complete")
    except Exception as e:
        print(f"[Cognee] improve failed: {e}")


async def cognee_forget(patient_id: str):
    await connect()
    import cognee

    try:
        await cognee.forget(
            dataset=_dataset(patient_id),
        )
        print(f"[Cognee] forget() complete for {_dataset(patient_id)}")
    except Exception as e:
        print(f"[Cognee] forget failed: {e}")
        raise
