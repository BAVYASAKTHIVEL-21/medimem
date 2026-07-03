"""
routes/brief.py — Pre-visit brief using Cognee V2 recall()
"""
from fastapi import APIRouter, HTTPException
from patient_store import get_patient
from cognee_client import cognee_recall
from llm_client import generate_brief

router = APIRouter(prefix="/brief", tags=["brief"])


@router.post("/{patient_id}")
async def generate_pre_visit_brief(patient_id: str):
    """
    Pre-visit brief flow:
    1. cognee.recall() → fetch complete patient memory (V2)
    2. LLM → structure into 5-point brief
    """
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient.get("docs"):
        raise HTTPException(status_code=400, detail="No documents uploaded yet.")

    print(f"[Brief] cognee.recall() full memory for patient_{patient_id}")

    results = await cognee_recall(
        "complete medical history conditions medications allergies risks lab results consultations",
        patient_id,
    )

    parts = []
    for r in results[:8]:
        text = str(r.get("text") or r.get("content") or "") if isinstance(r, dict) else str(r)
        if text and len(text) > 10:
            parts.append(text)

    memory_context = "\n\n".join(parts)

    if not memory_context:
        raise HTTPException(status_code=422, detail="Not enough memory to generate brief.")

    brief = await generate_brief(memory_context, patient["name"])

    return {
        "patient_id":    patient_id,
        "patient_name":  patient["name"],
        "brief":         brief,
        "memory_chunks": len(parts),
    }
