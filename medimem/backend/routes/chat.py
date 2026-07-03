"""
routes/chat.py — AI Doctor using Cognee V2 recall() + improve()
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from patient_store import get_patient
from cognee_client import cognee_recall, cognee_remember, cognee_improve
from llm_client import generate_answer

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str


def parse_results(results: list) -> tuple[str, list[str]]:
    parts, sources = [], []
    for r in results:
        if isinstance(r, dict):
            text = str(r.get("text") or r.get("content") or r.get("search_result") or "")
            if text and len(text) > 10:
                parts.append(text)
            src = r.get("document_name") or r.get("source") or ""
            if src and src not in sources:
                sources.append(src)
        elif isinstance(r, str) and len(r) > 10:
            parts.append(r)
    return "\n\n".join(parts[:5]), sources


@router.post("/{patient_id}")
async def chat(patient_id: str, body: ChatRequest):
    """
    AI Doctor chat flow:
    1. cognee.recall()    → graph traversal to find relevant memory (V2)
    2. LLM               → generate grounded answer using recalled memory
    3. cognee.remember()  → store conversation back into memory (V2)
    4. cognee.improve()   → strengthen graph after interaction (V2)
    """
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if not patient.get("docs"):
        return {
            "answer":  "No documents uploaded yet. Please upload patient records first.",
            "sources": [],
        }

    # RECALL — V2 graph traversal
    print(f"[Chat] cognee.recall() for: {question}")
    results = await cognee_recall(question, patient_id)
    memory_context, sources = parse_results(results)
    print(f"[Chat] Got {len(results)} results from Cognee")

    # Generate answer with LLM
    if memory_context:
        answer = await generate_answer(memory_context, question)
    else:
        answer = "I couldn't find specific information in the patient's memory. Please upload more documents."

    # REMEMBER — store conversation back (V2)
    try:
        from datetime import datetime
        conversation = (
            f"Doctor asked: {question}\n"
            f"AI answered: {answer}\n"
            f"Date: {datetime.now().strftime('%Y-%m-%d')}"
        )
        await cognee_remember(conversation, patient_id)
        print(f"[Chat] Conversation stored via cognee.remember()")
    except Exception as e:
        print(f"[Chat] remember() non-blocking error: {e}")

    # IMPROVE — strengthen graph after interaction (V2 / hackathon criteria)
    try:
        await cognee_improve(patient_id)
        print(f"[Chat] Graph strengthened via cognee.improve()")
    except Exception as e:
        print(f"[Chat] improve() non-blocking error: {e}")

    return {
        "answer":        answer,
        "sources":       sources or [f"patient_{patient_id} knowledge graph"],
        "memory_used":   bool(memory_context),
        "results_count": len(results),
    }


@router.get("/{patient_id}/history")
async def get_history(patient_id: str):
    """Fetch conversation history stored in Cognee memory."""
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    results = await cognee_recall("Doctor conversations questions asked answers", patient_id)
    history = []
    for r in results:
        text = str(r.get("text") or r) if isinstance(r, dict) else str(r)
        if "Doctor asked:" in text:
            history.append({"content": text})
    return {"history": history, "total": len(history)}
