import json
import uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "patients.json"


def _read() -> dict:
    # Create file if missing
    if not DB_PATH.exists():
        DB_PATH.write_text("{}")

    text = DB_PATH.read_text().strip()

    # Empty file
    if not text:
        return {}

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Corrupted JSON -> reset
        DB_PATH.write_text("{}")
        return {}


def _write(data: dict) -> None:
    DB_PATH.write_text(json.dumps(data, indent=2))


def _norm(name: str) -> str:
    return name.strip().lower()


def get_all_patients(doctor: str = "") -> list[dict]:
    data = _read()
    patients = list(data.values())

    if doctor:
        doctor = _norm(doctor)
        patients = [
            p for p in patients
            if _norm(p.get("doctor", "")) == doctor
        ]

    return sorted(patients, key=lambda p: p["name"])


def get_patient(patient_id: str):
    return _read().get(patient_id)


def create_patient(
    name: str,
    age: int,
    gender: str,
    blood: str = "",
    doctor: str = "",
):
    patient_id = str(uuid.uuid4())

    patient = {
        "id": patient_id,
        "name": name,
        "age": age,
        "gender": gender,
        "blood": blood,
        "doctor": _norm(doctor),
        "conditions": [],
        "meds": [],
        "docs": [],
        "alerts": 0,
        "created_at": datetime.now().isoformat(),
    }

    data = _read()
    data[patient_id] = patient
    _write(data)

    return patient


def add_document(patient_id, filename, chunks, size):
    data = _read()

    if patient_id not in data:
        raise ValueError("Patient not found")

    doc = {
        "name": filename,
        "chunks": chunks,
        "size": size,
        "uploaded_at": datetime.now().isoformat(),
        "status": "ingested",
    }

    data[patient_id]["docs"].append(doc)
    _write(data)

    return doc


def update_alerts(patient_id, alert_count):
    data = _read()

    if patient_id in data:
        data[patient_id]["alerts"] = alert_count
        _write(data)


def delete_patient(patient_id):
    data = _read()

    if patient_id in data:
        del data[patient_id]
        _write(data)
        return True

    return False
