"""
routes/memory.py — Timeline + Mindmap + Snapshot using Cognee V2 recall()
"""
import re, asyncio
from fastapi import APIRouter, HTTPException
from patient_store import get_patient
from cognee_client import cognee_recall

router = APIRouter(prefix="/memory", tags=["memory"])


def clean_text(text: str) -> str:
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*',     r'\1', text)
    text = re.sub(r'#{1,6}\s',      '',    text)
    text = re.sub(r'\[.*?\]\(.*?\)',r'',   text)
    return text.strip()


def classify_entity(text: str) -> tuple[str, str]:
    t = text.lower()

    if any(x in t for x in [
        "male", "female", "blood type", "blood group",
        "age", "yrs", "year", "gender"
    ]):
        return "Demographic", "#8b7ff5"

    if any(x in t for x in [
        "weight", "height", "bmi",
        "bp", "pressure", "pulse",
        "spo2", "mmhg"
    ]):
        return "Vital", "#4090e0"

    if any(x in t for x in [
        "hba1c", "glucose", "cholesterol",
        "ldl", "hdl", "creatinine",
        "egfr", "vitamin", "haemoglobin",
        "ferritin", "tsh", "lab"
    ]):
        return "Lab Result", "#4090e0"

    if any(x in t for x in [
        "metformin", "insulin",
        "amlodipine", "atorvastatin",
        "tablet", "capsule",
        "mg", "mcg", "drug",
        "medication"
    ]):
        return "Medication", "#50d4a0"

    if any(x in t for x in [
        "allergy", "penicillin",
        "iodine", "reaction",
        "anaphylaxis"
    ]):
        return "Allergy", "#f0a030"

    if any(x in t for x in [
        "doctor", "dr ", "dr."
    ]):
        return "Doctor", "#00c2ff"

    if any(x in t for x in [
        "hospital", "clinic",
        "medical centre", "department"
    ]):
        return "Hospital", "#e05a3a"

    if any(x in t for x in [
        "diabetes", "hypertension",
        "asthma", "ckd",
        "cancer", "thyroid",
        "disease", "condition",
        "syndrome"
    ]):
        return "Condition", "#00d4a0"

    return "Entity", "#8a9ab8"

def is_junk_label(part: str, patient_name: str) -> bool:
    """Filter out labels that are not meaningful medical entities."""
    p = part.lower().strip()
    patient_lower = patient_name.lower()

    # Skip patient name itself
    if patient_lower in p or p in patient_lower:
        return True

    # Skip dates
    if any(m in p for m in ["january","february","march","april","may","june","july",
                              "august","september","october","november","december",
                              "2024","2025","2026","2027"]):
        return True

    # Skip locations/places
    if any(w in p for w in ["bangalore","mumbai","delhi","chennai","hospital name",
                              "city general","department","clinic","centre","center"]):
        return True

    # Skip doctor names
    if p.startswith("dr ") or p.startswith("dr."):
        return True

    # Skip generic words
    if p in ["concise","general","upcoming","appointment","follow","next","last",
             "recent","current","note","notes","summary","report","history",
             "nephrology","cardiology","endocrinology","department","city"]:
        return True

    # Skip very short non-medical terms
    if len(p) < 4:
        return True

    return False


@router.get("/{patient_id}/mindmap")
async def get_mindmap(patient_id: str):
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient.get("docs"):
        return {
            "nodes": [{
                "id": patient_id, "label": patient["name"],
                "type": "Patient", "color": "#8b7ff5",
                "primary": True, "sub": "No documents uploaded yet"
            }],
            "relationships": [],
            "patient_name": patient["name"],
            "total_nodes": 1, "total_edges": 0,
        }

    # Single combined query — much faster than 5 separate queries
    all_results = []
    try:
        results = await asyncio.wait_for(
            cognee_recall(
                "conditions diagnoses medications drugs allergies lab results vitals history",
                patient_id
            ),
            timeout=30.0
        )
        if results:
            all_results.extend(results[:15])
    except Exception as e:
        print(f"[Mindmap] recall failed: {e}")

    # Center node — patient
    nodes = [{
        "id":      patient_id,
        "label":   patient["name"],
        "type":    "Patient",
        "color":   "#8b7ff5",
        "primary": True,
        "sub":     f"{patient.get('age','')} yrs · {patient.get('gender','')}",
    }]
    relationships = []
    seen = {patient["name"].lower()}
    node_counter = 0

    for r in all_results:
        raw = ""
        if isinstance(r, dict):
            raw = str(
                r.get("text") or r.get("content") or
                r.get("search_result") or r.get("result") or ""
            )
        elif isinstance(r, str):
            raw = r

        if not raw or len(raw) < 5:
            continue

        cleaned = clean_text(raw)

        # Split into parts by common delimiters
        parts = re.split(r'[:\-–•\n,;()]', cleaned)
        for part in parts:
            part = part.strip()

            # Skip too short or too long
            if len(part) < 3 or len(part) > 50:
                continue

            # Skip markdown remnants
            if any(x in part for x in ['**', '__', '#', 'http']):
                continue

            # Skip generic stop words
            stop = {'and','the','for','with','has','are','is','of','in','to','a',
                    'an','at','by','as','on','or','not','no','be','was','were',
                    'have','had','been','will','from','this','that','which'}
            if part.lower() in stop:
                continue

            # Skip if purely numeric
            if re.match(r'^[\d\s\.]+$', part):
                continue

            label_key = part.lower()
            if label_key in seen:
                continue

            # Skip junk labels
            if is_junk_label(part, patient["name"]):
                continue

            seen.add(label_key)
            node_type, color = classify_entity(part)
            node_id = f"node_{node_counter}"
            node_counter += 1

            # Get meaningful sub label from remaining text
            sub = ""
            remaining = cleaned.replace(part, "", 1).strip().lstrip(":-–,")
            if remaining and len(remaining) > 3:
                # Clean and take first meaningful phrase
                sub_parts = re.split('[,;]', remaining)
                for sp in sub_parts:
                    sp = sp.strip()
                    # Skip patient name in sub
                    if patient["name"].lower().replace("_"," ") in sp.lower():
                        continue
                    if len(sp) > 3 and len(sp) < 30:
                        sub = clean_text(sp)
                        break

            nodes.append({
                "id":      node_id,
                "label":   part[:28].replace("_"," "),
                "type":    node_type,
                "color":   color,
                "sub":     sub[:22] if sub else node_type,
                "primary": False,
            })
            rel_map = {
                "Condition": "has condition",
                "Medication": "takes",
                "Lab Result": "lab result",
                "Vital": "vital",
                "Demographic": "patient info",
                "Doctor": "treated by",
                "Hospital": "visited",
                "Allergy": "allergic to",
                "Episode": "clinical event",
                "Entity": "related to",
            }

            relationships.append({
                "from":  patient_id,
                "to":    node_id,
                "label": rel_map.get(node_type, "connected to"),
                "color": color,
            })

            if node_counter >= 14:
                break

        if node_counter >= 14:
            break

    return {
        "patient_name":  patient["name"],
        "nodes":         nodes,
        "relationships": relationships,
        "total_nodes":   len(nodes),
        "total_edges":   len(relationships),
    }


@router.get("/{patient_id}/timeline")
async def get_timeline(patient_id: str):
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient.get("docs"):
        return {"events": [], "total": 0}

    # Parallel recall — Cognee Cloud takes ~15–25s per query; run concurrently
    queries = [
        "patient medical history diagnoses conditions",
        "medications prescriptions allergies lab results vitals",
    ]

    async def _recall(q: str) -> list:
        try:
            return await asyncio.wait_for(cognee_recall(q, patient_id), timeout=30.0)
        except Exception as e:
            print(f"[Timeline] recall({q!r}) failed: {e}")
            return []

    batches = await asyncio.gather(*[_recall(q) for q in queries])
    all_results = [r for batch in batches for r in batch]

    # Deduplicate
    seen_texts = set()
    events = []
    idx = 0

    for r in all_results:
        text = ""
        if isinstance(r, dict):
            text = str(
                r.get("text") or r.get("content") or
                r.get("search_result") or r.get("result") or ""
            )
        elif isinstance(r, str):
            text = r

        text = clean_text(text).strip()
        if not text or len(text) < 3:
            continue

        # Deduplicate by first 50 chars
        key = text[:50].lower()
        if key in seen_texts:
            continue
        seen_texts.add(key)

        tl = text.lower()
        if any(w in tl for w in ["diagnos","condition","disease","thyroid",
                                   "diabetes","hypertension","asthma","pcos",
                                   "anaemia","ckd","kidney","cardiac"]):
            etype, color = "Diagnosis", "#00d4a0"
        elif any(w in tl for w in ["prescri","medication","drug","mg","mcg",
                                    "tablet","inhaler","insulin","capsule"]):
            etype, color = "Medication", "#8b7ff5"
        elif any(w in tl for w in ["allerg","avoid","reaction","anaphylaxis",
                                    "penicillin","aspirin allerg","iodine"]):
            etype, color = "Allergy", "#f0a030"
        elif any(w in tl for w in ["lab","result","hba1c","cholesterol","tsh",
                                    "creatinine","ferritin","ige","vitamin",
                                    "haemoglobin","egfr","ldl"]):
            etype, color = "Lab Result", "#4090e0"
        elif any(w in tl for w in ["bp","pressure","pulse","vital","spo2",
                                    "peak flow","weight","mmhg"]):
            etype, color = "Vital", "#4090e0"
        elif any(w in tl for w in ["follow","appointment","next visit",
                                    "review","monitor","schedule"]):
            etype, color = "Follow-up", "#00d4a0"
        else:
            etype, color = "Note", "#8a9ab8"

        events.append({
            "id":    f"evt_{idx}",
            "text":  text[:300],
            "type":  etype,
            "color": color,
        })
        idx += 1

        if idx >= 20:
            break

    print(f"[Timeline] {len(all_results)} raw results → {len(events)} events")
    return {"events": events, "total": len(events)}


@router.get("/{patient_id}/snapshot")
async def get_snapshot(patient_id: str):
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    docs   = patient.get("docs", [])
    chunks = sum(d.get("chunks", 0) for d in docs)

    # Realistic percentage based on chunks ingested
    pct = min(95, chunks * 10) if chunks > 0 else 0

    return {
        "memory_pct":   pct,
        "total_docs":   len(docs),
        "total_chunks": chunks,
        "alert_count":  patient.get("alerts", 0),
    }
