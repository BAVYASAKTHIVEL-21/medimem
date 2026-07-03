"""
routes/patients.py — each doctor sees only their patients
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from patient_store import get_all_patients, get_patient, create_patient, delete_patient
from cognee_client import cognee_forget

router = APIRouter(prefix="/patients", tags=["patients"])


class CreatePatientRequest(BaseModel):
    name:   str
    age:    int
    gender: str
    blood:  str = ""
    doctor: str = ""


@router.get("/list")
async def list_patients(doctor: str = ""):
    patients = get_all_patients(doctor=doctor)
    return {"patients": patients, "total": len(patients)}


@router.get("/{patient_id}")
async def get_patient_by_id(patient_id: str):
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/create")
async def create_new_patient(body: CreatePatientRequest):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Patient name required")
    patient = create_patient(
        name=body.name.strip(),
        age=body.age,
        gender=body.gender,
        blood=body.blood,
        doctor=body.doctor,
    )
    return {"message": "Patient created", "patient": patient}


@router.delete("/{patient_id}")
async def delete_patient_and_memory(patient_id: str):
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    try:
        await cognee_forget(patient_id)
    except Exception as e:
        print(f"[Patients] forget() error: {e}")
    delete_patient(patient_id)
    return {"message": f"Patient {patient['name']} deleted"}