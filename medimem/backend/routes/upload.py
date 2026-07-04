import io

from fastapi import APIRouter, UploadFile, File, HTTPException

from patient_store import (
    get_patient,
    add_document,
)

from cognee_client import (
    cognee_remember,
    cognee_improve,
)

router = APIRouter(
    prefix="/upload",
    tags=["upload"],
)


def extract_text(pdf_bytes: bytes) -> str:
    try:
        import PyPDF2

        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        return text.strip()

    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot read PDF: {e}",
        )


def chunk_text(text: str, size: int = 800) -> list[str]:
    words = text.split()

    chunks = []

    current = []

    length = 0

    for word in words:

        current.append(word)

        length += len(word) + 1

        if length >= size:

            chunks.append(" ".join(current))

            current = []

            length = 0

    if current:
        chunks.append(" ".join(current))

    return chunks


@router.post("/{patient_id}")
async def upload_document(
    patient_id: str,
    file: UploadFile = File(...),
):

    patient = get_patient(patient_id)

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    if (
        not file.filename
        or not file.filename.lower().endswith(".pdf")
    ):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files supported",
        )

    pdf_bytes = await file.read()

    size_mb = round(
        len(pdf_bytes) / (1024 * 1024),
        2,
    )

    if size_mb > 50:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb} MB). Maximum 50 MB.",
        )

    text = extract_text(pdf_bytes)

    if not text or len(text) < 50:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from PDF.",
        )

    chunks = chunk_text(text)

    print(f"[Upload] {file.filename}")

    print(f"[Upload] Total Chunks : {len(chunks)}")

    full_text = "\n\n".join(chunks)

    print("[Upload] Sending document to Cognee...")

    await cognee_remember(
        full_text,
        patient_id,
    )

    print("[Upload] remember() complete")

    doc = add_document(
        patient_id=patient_id,
        filename=file.filename,
        chunks=len(chunks),
        size=f"{size_mb}MB",
    )

    print("[Upload] Running improve()...")

    try:

        await cognee_improve(patient_id)

        print("[Upload] improve() complete")

    except Exception as e:

        print(f"[Upload] improve() skipped: {e}")

    return {
        "success": True,
        "message": "Document uploaded successfully.",
        "filename": file.filename,
        "patient_id": patient_id,
        "chunks": len(chunks),
        "size": f"{size_mb}MB",
        "dataset": f"patient_{patient_id}",
        "document": doc,
    }


@router.get("/{patient_id}/docs")
async def get_documents(patient_id: str):

    patient = get_patient(patient_id)

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    return {
        "documents": patient.get("docs", []),
        "total": len(patient.get("docs", [])),
    }
