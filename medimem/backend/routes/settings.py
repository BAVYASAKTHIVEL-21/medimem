"""
routes/settings.py
───────────────────
Settings API — save keys + notification preferences from UI.
Everything stored in settings.json, loaded on startup.
"""

import json, os
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from cognee_client import cognee_health_check

router = APIRouter(prefix="/settings", tags=["settings"])
SETTINGS_PATH = Path(__file__).parent.parent / "settings.json"


def _read() -> dict:
    if not SETTINGS_PATH.exists():
        return {}
    try:
        return json.loads(SETTINGS_PATH.read_text())
    except Exception:
        return {}


def _write(data: dict):
    SETTINGS_PATH.write_text(json.dumps(data, indent=2))


class SaveKeysRequest(BaseModel):
    cognee_api_key:  str = ""
    cognee_base_url: str = ""
    llm_api_key:     str = ""
    llm_provider:    str = "groq"
    llm_model:       str = "llama-3.1-8b-instant"
    llm_base_url:    str = ""


class SaveNotificationsRequest(BaseModel):
    drug_alerts:  bool = True
    bp_alerts:    bool = True
    lab_alerts:   bool = True
    followup:     bool = True
    email:        bool = False
    email_address: str = ""


# ── GET /settings/status ──────────────────────────────────
@router.get("/status")
async def get_status():
    settings = _read()

    # Apply saved settings to env
    for key, env_var in [
        ("cognee_api_key",  "COGNEE_API_KEY"),
        ("cognee_base_url", "COGNEE_BASE_URL"),
        ("llm_api_key",     "LLM_API_KEY"),
        ("llm_provider",    "LLM_PROVIDER"),
        ("llm_model",       "LLM_MODEL"),
    ]:
        if settings.get(key):
            os.environ[env_var] = settings[key]

    cognee_ok = await cognee_health_check()

    return {
        "cognee_cloud": {
            "connected": cognee_ok,
            "url":       settings.get("cognee_base_url", os.getenv("COGNEE_BASE_URL", "")),
            "has_key":   bool(settings.get("cognee_api_key") or os.getenv("COGNEE_API_KEY")),
            "dashboard": "https://platform.cognee.ai",
            "sessions":  "https://platform.cognee.ai/sessions",
        },
        "llm": {
            "configured": bool(settings.get("llm_api_key") or os.getenv("LLM_API_KEY")),
            "provider":   settings.get("llm_provider", os.getenv("LLM_PROVIDER", "groq")),
            "model":      settings.get("llm_model",    os.getenv("LLM_MODEL", "llama-3.1-8b-instant")),
        },
        "notifications": {
            "drug_alerts":   settings.get("drug_alerts",  True),
            "bp_alerts":     settings.get("bp_alerts",    True),
            "lab_alerts":    settings.get("lab_alerts",   True),
            "followup":      settings.get("followup",     True),
            "email":         settings.get("email",        False),
            "email_address": settings.get("email_address",""),
        },
        "saved": bool(settings),
    }


# ── POST /settings/keys ───────────────────────────────────
@router.post("/keys")
async def save_keys(body: SaveKeysRequest):
    settings = _read()

    if body.cognee_api_key.strip():
        settings["cognee_api_key"]  = body.cognee_api_key.strip()
        os.environ["COGNEE_API_KEY"] = body.cognee_api_key.strip()

    if body.cognee_base_url.strip():
        settings["cognee_base_url"]  = body.cognee_base_url.strip()
        os.environ["COGNEE_BASE_URL"] = body.cognee_base_url.strip()

    if body.llm_api_key.strip():
        settings["llm_api_key"]  = body.llm_api_key.strip()
        os.environ["LLM_API_KEY"] = body.llm_api_key.strip()

    settings["llm_provider"]  = body.llm_provider
    settings["llm_model"]     = body.llm_model
    os.environ["LLM_PROVIDER"] = body.llm_provider
    os.environ["LLM_MODEL"]    = body.llm_model

    _write(settings)

    # Reset Cognee connection to reconnect with new keys
    import cognee_client
    cognee_client._connected = False

    cognee_ok = await cognee_health_check()

    return {
        "message":          "API keys saved successfully",
        "cognee_connected": cognee_ok,
        "llm_provider":     body.llm_provider,
        "llm_model":        body.llm_model,
    }


# ── POST /settings/notifications ─────────────────────────
@router.post("/notifications")
async def save_notifications(body: SaveNotificationsRequest):
    """
    Save notification preferences.
    These control what types of alerts are created during PDF upload.
    drug_alerts → scan for drug conflicts during upload
    bp_alerts   → scan for BP/vitals warnings during upload
    lab_alerts  → scan for lab result anomalies during upload
    followup    → flag patients overdue for visits
    email       → future: send email summaries (not yet implemented)
    """
    settings = _read()
    settings["drug_alerts"]   = body.drug_alerts
    settings["bp_alerts"]     = body.bp_alerts
    settings["lab_alerts"]    = body.lab_alerts
    settings["followup"]      = body.followup
    settings["email"]         = body.email
    settings["email_address"] = body.email_address
    _write(settings)

    return {
        "message": "Notification preferences saved",
        "preferences": {
            "drug_alerts":  body.drug_alerts,
            "bp_alerts":    body.bp_alerts,
            "lab_alerts":   body.lab_alerts,
            "followup":     body.followup,
            "email":        body.email,
        }
    }


# ── GET /settings/notifications ──────────────────────────
@router.get("/notifications")
async def get_notifications():
    settings = _read()
    return {
        "drug_alerts":   settings.get("drug_alerts",   True),
        "bp_alerts":     settings.get("bp_alerts",     True),
        "lab_alerts":    settings.get("lab_alerts",    True),
        "followup":      settings.get("followup",      True),
        "email":         settings.get("email",         False),
        "email_address": settings.get("email_address", ""),
    }