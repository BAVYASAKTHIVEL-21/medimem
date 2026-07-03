"""
patient_store.py
─────────────────
Each doctor has their own isolated patient list.
Doctor name is normalized (lowercase, trimmed) for consistent matching.
"""

import json, uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "patients.json"


def _read() -> dict:
    if not DB_PATH.exists():
        DB_PATH.write_text("{}")
    return json.loads(DB_PATH.read_text())


def _write(data: dict) -> None:
    DB_PATH.write_text(json.dumps(data, indent=2))


def _norm(name: str) -> str:
    """Normalize doctor name for consistent matching."""
    return name.strip().lower()


def get_all_patients(doctor: str = "") -> list[dict]:
    """
    Return patients for a specific doctor only.
    Uses normalized name matching.
    If no doctor → return all (admin).
    """
    data = _read()
    patients = list(data.values())

    if doctor:
        norm = _norm(doctor)
        patients = [
            p for p in patients
            if _norm(p.get("doctor", "")) == norm
        ]

    return sorted(patients, key=lambda p: p["name"])


def get_patient(patient_id: str) -> dict | None:
    return _read().get(patient_id)


def create_patient(
    name:   str,
    age:    int,
    gender: str,
    blood:  str = "",
    doctor: str = "",
) -> dict:
    """Create patient linked to specific doctor (normalized name)."""
    patient_id = str(uuid.uuid4())
    patient = {
        "id":         patient_id,
        "name":       name,
        "age":        age,
        "gender":     gender,
        "blood":      blood,
        "doctor":     _norm(doctor),  # always store normalized
        "conditions": [],
        "meds":       [],
        "docs":       [],
        "alerts":     0,
        "created_at": datetime.now().isoformat(),
    }
    data = _read()
    data[patient_id] = patient
    _write(data)
    return patient


def add_document(patient_id: str, filename: str, chunks: int, size: str) -> dict:
    data = _read()
    if patient_id not in data:
        raise ValueError(f"Patient {patient_id} not found")
    doc = {
        "name":        filename,
        "chunks":      chunks,
        "size":        size,
        "uploaded_at": datetime.now().isoformat(),
        "status":      "ingested",
    }
    data[patient_id]["docs"].append(doc)
    _write(data)
    return doc


def update_alerts(patient_id: str, alert_count: int) -> None:
    data = _read()
    if patient_id in data:
        data[patient_id]["alerts"] = alert_count
        _write(data)


def delete_patient(patient_id: str) -> bool:
    data = _read()
    if patient_id in data:
        del data[patient_id]
        _write(data)
        return True
    return False