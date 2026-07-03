"""
routes/upload.py — PDF upload using Cognee V2 remember()
"""
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from patient_store import get_patient, add_document, update_alerts
from alert_store import create_alert
from cognee_client import cognee_remember, cognee_recall, cognee_improve

router = APIRouter(prefix="/upload", tags=["upload"])


def extract_text(pdf_bytes: bytes) -> str:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Cannot read PDF: {e}")


def chunk_text(text: str, size: int = 800) -> list[str]:
    words, chunks, current, length = text.split(), [], [], 0
    for word in words:
        current.append(word)
        length += len(word) + 1
        if length >= size:
            chunks.append(" ".join(current))
            current, length = [], 0
    if current:
        chunks.append(" ".join(current))
    return chunks


async def scan_for_risks(patient_id: str, patient_name: str) -> list:
    """
    Use Cognee recall() to find risks — graph traversal, not keyword scan.
    Called after every PDF upload.
    """
    alerts_created = []
    queries = [
        ("critical allergies and severe allergic reactions", "critical"),
        ("drug conflicts contraindications dangerous interactions", "critical"),
        ("health risks warnings conditions requiring attention", "warning"),
    ]
    for query, alert_type in queries:
        try:
            results = await cognee_recall(query, patient_id)
            if results:
                text = ""
                for r in results[:2]:
                    if isinstance(r, dict):
                        text += str(r.get("text") or r.get("content") or r) + " "
                    elif isinstance(r, str):
                        text += r + " "
                text = text.strip()
                if text and len(text) > 20:
                    alert = create_alert(
                        patient_id=patient_id,
                        patient_name=patient_name,
                        title=f"{'Critical' if alert_type == 'critical' else 'Risk'} detected — {patient_name}",
                        description=text[:300],
                        alert_type=alert_type,
                        source="upload",
                    )
                    alerts_created.append(alert)
        except Exception as e:
            print(f"[Alerts] Non-blocking error: {e}")
    update_alerts(patient_id, len(alerts_created))
    return alerts_created


@router.post("/{patient_id}")
async def upload_document(patient_id: str, file: UploadFile = File(...)):
    """
    PDF Upload flow:
    1. Extract text from PDF
    2. cognee.remember()  → stores + builds knowledge graph (V2)
    3. cognee.recall()    → scan for risks (V2)
    4. cognee.improve()   → strengthen graph (V2, hackathon criteria)

    After step 2, session appears at platform.cognee.ai/sessions
    """
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files supported")

    pdf_bytes = await file.read()
    size_mb = round(len(pdf_bytes) / (1024 * 1024), 2)

    if size_mb > 50:
        raise HTTPException(status_code=413, detail=f"File too large ({size_mb}MB). Max 50MB.")

    # Extract text
    text = extract_text(pdf_bytes)
    if not text or len(text) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

    chunks = chunk_text(text)
    print(f"[Upload] {file.filename} → {len(chunks)} chunks")

    # REMEMBER — V2 API (add + cognify in one call)
    # Each chunk goes into Cognee Cloud knowledge graph
    for i, chunk in enumerate(chunks):
        await cognee_remember(chunk, patient_id)
        print(f"[Upload] Chunk {i+1}/{len(chunks)} remembered")

    # Store document record locally
    doc = add_document(
        patient_id=patient_id,
        filename=file.filename,
        chunks=len(chunks),
        size=f"{size_mb}MB",
    )

    # RECALL — scan for risks using graph traversal
    print(f"[Upload] Scanning for risks via cognee.recall()...")
    alerts = await scan_for_risks(patient_id, patient["name"])

    # IMPROVE — strengthen graph (hackathon criteria: improve/memify)
    print(f"[Upload] Running cognee.improve()...")
    try:
        await cognee_improve(patient_id)
    except Exception as e:
        print(f"[Upload] improve() non-blocking error: {e}")

    return {
        "message":         "Document ingested into Cognee Cloud",
        "filename":        file.filename,
        "chunks_ingested": len(chunks),
        "size":            f"{size_mb}MB",
        "alerts_created":  len(alerts),
        "cognee_dataset":  f"patient_{patient_id}",
        "cognee_sessions": "https://platform.cognee.ai/sessions",
        "document":        doc,
    }


@router.get("/{patient_id}/docs")
async def get_documents(patient_id: str):
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {
        "documents": patient.get("docs", []),
        "total":     len(patient.get("docs", [])),
    }
