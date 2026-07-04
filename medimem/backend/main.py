"""
main.py — MediMem AI Backend
Loads saved API keys from settings.json on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os, json
from pathlib import Path

load_dotenv()

# ── Load saved settings from UI on startup ────────────────
SETTINGS_PATH = Path(__file__).parent / "settings.json"
if SETTINGS_PATH.exists():
    try:
        saved = json.loads(SETTINGS_PATH.read_text())
        for key, env_var in [
            ("cognee_api_key",  "COGNEE_API_KEY"),
            ("cognee_base_url", "COGNEE_BASE_URL"),
            ("llm_api_key",     "LLM_API_KEY"),
            ("llm_provider",    "LLM_PROVIDER"),
            ("llm_model",       "LLM_MODEL"),
        ]:
            if saved.get(key) and not os.getenv(env_var):
                os.environ[env_var] = saved[key]
        print("[Startup] Loaded API keys from settings.json")
    except Exception as e:
        print(f"[Startup] Could not load settings: {e}")

from routes.patients import router as patients_router
from routes.upload   import router as upload_router
from routes.chat     import router as chat_router
from routes.brief    import router as brief_router
from routes.memory   import router as memory_router
from routes.alerts   import router as alerts_router
from routes.settings import router as settings_router

app = FastAPI(
    title="MediMem AI Backend",
    description="Persistent AI memory for doctors — powered by Cognee Cloud",
    version="1.0.0",
)

allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    "https://medimem.vercel.app",
    "https://medimem-m2lx8mewm-bavyasakthivel21-6805s-projects.vercel.app",
]

app.include_router(patients_router)
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(brief_router)
app.include_router(memory_router)
app.include_router(alerts_router)
app.include_router(settings_router)


@app.on_event("startup")
async def startup():
    from cognee_client import cognee_health_check, COGNEE_API_KEY
    print("\n" + "="*50)
    print("  MediMem AI Backend starting...")
    print("="*50)
    if not COGNEE_API_KEY:
        print("  ⚠  COGNEE_API_KEY not set — configure in Settings page")
    else:
        ok = await cognee_health_check()
        print(f"  Cognee Cloud: {'Connected' if ok else 'Failed — check key in Settings'}")
    print(f"  LLM: {os.getenv('LLM_PROVIDER','groq')} / {os.getenv('LLM_MODEL','llama-3.1-8b-instant')}")
    print("="*50 + "\n")


@app.get("/")
async def root():
    return {"app": "MediMem AI Backend", "status": "running"}


@app.get("/health")
async def health():
    from cognee_client import cognee_health_check
    return {
        "backend": "ok",
        "cognee":  "connected" if await cognee_health_check() else "disconnected",
    }

