from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List
from models import ManualEvent, get_db
from pydantic import BaseModel  
import schemas
from routers.auth import get_current_medico 

router = APIRouter(
    prefix="/api/v1/manual-events",
    tags=["manual-events"],
    dependencies=[Depends(get_current_medico)]
)

ALLOWED_TYPES = {"hba1c", "insulin", "exercise", "sleep", "stress", "carbs", "note"}

@router.post("/", response_model=schemas.ManualEventOut)
def create_manual_event(
    event_in: schemas.ManualEventIn,
    db: Session = Depends(get_db)
):
    if event_in.event_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de evento no soportado")

    db_event = ManualEvent(
        patient_id=event_in.patient_id,
        event_type=event_in.event_type,
        subtype=event_in.subtype,
        timestamp=event_in.timestamp,
        value=event_in.value,
        unit=event_in.unit,
        note=event_in.note,
        extra=event_in.extra,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.get("/paciente/{patient_id}", response_model=List[schemas.ManualEventOut])
def list_manual_events(
    patient_id: int,
    db: Session = Depends(get_db)
):
    events = (
        db.query(ManualEvent)
        .filter(ManualEvent.patient_id == patient_id)
        .order_by(ManualEvent.timestamp.desc())
        .all()
    )
    return events


@router.get("/hba1c/{patient_id}")
def get_hba1c_history(patient_id: int, db: Session = Depends(get_db)):
    events = (
        db.query(ManualEvent)
        .filter(
            ManualEvent.patient_id == patient_id,
            ManualEvent.event_type == "hba1c",
            ManualEvent.value != None,         
        )
        .order_by(ManualEvent.timestamp.asc())
        .all()
    )

    return [
        {
            "timestamp": e.timestamp,
            "value": e.value
        }
        for e in events
    ]

@router.get("/stress/{patient_id}")
def get_stress_history(
    patient_id: int,
    db: Session = Depends(get_db)
):
    events = (
        db.query(ManualEvent)
        .filter(
            ManualEvent.patient_id == patient_id,
            ManualEvent.event_type == "stress",
            ManualEvent.value != None,
        )
        .order_by(ManualEvent.timestamp.asc())
        .all()
    )

    return [
        {
            "timestamp": e.timestamp,
            "value": e.value
        }
        for e in events
    ]
