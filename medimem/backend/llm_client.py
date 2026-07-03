"""
llm_client.py — LLM provider support with robust JSON parsing for briefs
"""
import os, json, re
from dotenv import load_dotenv
load_dotenv()


def get_config() -> dict:
    return {
        "key":      os.getenv("LLM_API_KEY",   ""),
        "model":    os.getenv("LLM_MODEL",      "llama-3.1-8b-instant"),
        "provider": os.getenv("LLM_PROVIDER",   "groq"),
        "base_url": os.getenv("LLM_BASE_URL",   ""),
    }


DOCTOR_SYSTEM = """You are MediMem AI — a clinical assistant with persistent memory of the patient's full medical history via Cognee Cloud knowledge graph. Ground every answer in the provided memory. Flag drug conflicts, allergies and risks clearly. Be concise but complete. Never use markdown formatting like **bold** or *italic*."""

BRIEF_SYSTEM = """You are MediMem AI. Generate a pre-visit clinical brief as valid JSON only.
CRITICAL: Return ONLY raw JSON. No markdown. No backticks. No explanation. No text before or after.
The response must start with { and end with }."""


async def generate_answer(memory_context: str, question: str) -> str:
    cfg = get_config()
    prompt = f"Patient memory from Cognee Cloud:\n{memory_context}\n\nDoctor's question: {question}\n\nAnswer (no markdown formatting):"
    return await _complete(cfg, DOCTOR_SYSTEM, prompt)


async def generate_brief(memory_context: str, patient_name: str) -> dict:
    cfg = get_config()
    prompt = f"""Patient: {patient_name}

Memory from Cognee Cloud:
{memory_context}

Return ONLY this JSON structure (no markdown, no backticks, start with {{):
{{
  "risk_level": "Low or Moderate or High",
  "risk_reason": "one sentence explaining risk level",
  "points": [
    {{"num": 1, "title": "Current conditions", "text": "list all diagnosed conditions"}},
    {{"num": 2, "title": "Active medications", "text": "list all medications with doses"}},
    {{"num": 3, "title": "Watch out for", "text": "allergies, contraindications, risks"}},
    {{"num": 4, "title": "Last visit notes", "text": "recent findings and doctor observations"}},
    {{"num": 5, "title": "Suggested questions", "text": "questions to ask the patient today"}}
  ],
  "suggested_focus": ["focus item 1", "focus item 2", "focus item 3"]
}}"""

    raw = await _complete(cfg, BRIEF_SYSTEM, prompt)
    return _parse_brief_json(raw, patient_name)


def _parse_brief_json(raw: str, patient_name: str) -> dict:
    """Robustly parse brief JSON from LLM response."""
    if not raw:
        return _fallback_brief(patient_name)

    # Try 1 — parse directly
    try:
        return json.loads(raw.strip())
    except Exception:
        pass

    # Try 2 — remove markdown code blocks
    cleaned = re.sub(r'```json\s*', '', raw)
    cleaned = re.sub(r'```\s*', '', cleaned)
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Try 3 — extract JSON between first { and last }
    start = raw.find('{')
    end   = raw.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(raw[start:end+1])
        except Exception:
            pass

    # Try 4 — find JSON array of points if full JSON fails
    # Extract what we can and build structure
    risk = "Moderate"
    if "high risk" in raw.lower() or "critical" in raw.lower():
        risk = "High"
    elif "low risk" in raw.lower():
        risk = "Low"

    # Extract text content (remove JSON syntax)
    text_content = re.sub(r'[{}\[\]":]', ' ', raw)
    text_content = re.sub(r'\s+', ' ', text_content).strip()

    return {
        "risk_level":  risk,
        "risk_reason": f"Based on {patient_name}'s medical history",
        "points": [
            {"num":1, "title":"Current conditions",  "text": text_content[:300] if text_content else "See uploaded documents"},
            {"num":2, "title":"Active medications",  "text": "Review uploaded prescriptions"},
            {"num":3, "title":"Watch out for",       "text": "Check allergies and drug interactions"},
            {"num":4, "title":"Last visit notes",    "text": "Refer to uploaded documents"},
            {"num":5, "title":"Suggested questions", "text": "Ask about current symptoms and medication compliance"},
        ],
        "suggested_focus": ["Review medications", "Check vitals", "Assess symptoms"],
    }


def _fallback_brief(patient_name: str) -> dict:
    return {
        "risk_level":  "Moderate",
        "risk_reason": f"Unable to generate brief for {patient_name} — upload more documents",
        "points": [
            {"num":1, "title":"Current conditions",  "text": "Upload patient records to generate"},
            {"num":2, "title":"Active medications",  "text": "Upload prescriptions to generate"},
            {"num":3, "title":"Watch out for",       "text": "Upload medical history to generate"},
            {"num":4, "title":"Last visit notes",    "text": "Upload visit notes to generate"},
            {"num":5, "title":"Suggested questions", "text": "Ask about current symptoms"},
        ],
        "suggested_focus": ["Upload documents", "Review history", "Check medications"],
    }


async def _complete(cfg: dict, system: str, prompt: str) -> str:
    provider = cfg["provider"].lower()
    if provider == "groq":
        return await _groq(cfg, system, prompt)
    elif provider == "anthropic":
        return await _anthropic(cfg, system, prompt)
    elif provider == "mistral":
        return await _mistral(cfg, system, prompt)
    elif provider == "together":
        return await _together(cfg, system, prompt)
    elif provider == "custom":
        return await _custom_openai(cfg, system, prompt)
    else:
        return await _openai(cfg, system, prompt)


async def _groq(cfg: dict, system: str, prompt: str) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=cfg["key"])
    r = await client.chat.completions.create(
        model=cfg["model"],
        messages=[{"role":"system","content":system},{"role":"user","content":prompt}],
        temperature=0.2, max_tokens=1200,
    )
    return r.choices[0].message.content or ""


async def _openai(cfg: dict, system: str, prompt: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=cfg["key"])
    r = await client.chat.completions.create(
        model=cfg["model"],
        messages=[{"role":"system","content":system},{"role":"user","content":prompt}],
        temperature=0.2, max_tokens=1200,
    )
    return r.choices[0].message.content or ""


async def _anthropic(cfg: dict, system: str, prompt: str) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=cfg["key"])
    msg = await client.messages.create(
        model=cfg["model"], max_tokens=1200,
        system=system,
        messages=[{"role":"user","content":prompt}],
    )
    return msg.content[0].text or ""


async def _mistral(cfg: dict, system: str, prompt: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=cfg["key"], base_url="https://api.mistral.ai/v1")
    r = await client.chat.completions.create(
        model=cfg["model"],
        messages=[{"role":"system","content":system},{"role":"user","content":prompt}],
        temperature=0.2, max_tokens=1200,
    )
    return r.choices[0].message.content or ""


async def _together(cfg: dict, system: str, prompt: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=cfg["key"], base_url="https://api.together.xyz/v1")
    r = await client.chat.completions.create(
        model=cfg["model"],
        messages=[{"role":"system","content":system},{"role":"user","content":prompt}],
        temperature=0.2, max_tokens=1200,
    )
    return r.choices[0].message.content or ""


async def _custom_openai(cfg: dict, system: str, prompt: str) -> str:
    from openai import AsyncOpenAI
    if not cfg.get("base_url"):
        raise ValueError("Custom LLM base URL not set in settings")
    client = AsyncOpenAI(api_key=cfg["key"] or "not-needed", base_url=cfg["base_url"])
    r = await client.chat.completions.create(
        model=cfg["model"],
        messages=[{"role":"system","content":system},{"role":"user","content":prompt}],
        temperature=0.2, max_tokens=1200,
    )
    return r.choices[0].message.content or ""