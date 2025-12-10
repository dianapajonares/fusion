# backend/main.py
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import get_db, Patient, GlucoseReading, InsulinDose, DietaryIntake
from routers import fusion, auth, manual
from routers.auth import get_current_medico
import models, schemas






app = FastAPI(title="Sistema Clínico - ShanghaiT1DM")

#   Routers
app.include_router(auth.router)
app.include_router(fusion.router)
app.include_router(manual.router)

#   CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#   ROOT
@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend y DB conectados y listos."}

#   PACIENTES (CREAR Y LISTAR) - PROTEGIDOS
@app.post("/api/v1/pacientes/", response_model=schemas.Paciente)
def create_paciente(
    paciente: schemas.PacienteCreate,
    db: Session = Depends(get_db),
    current_medico: models.Medico = Depends(get_current_medico),
):
    db_paciente = Patient(
        nombre=paciente.nombre,
        apellido_paterno=paciente.apellido_paterno,
        apellido_materno=paciente.apellido_materno,
        fecha_nacimiento=paciente.fecha_nacimiento,
        sexo=paciente.sexo,
        anio_diagnostico=paciente.anio_diagnostico,
        enfermedades_cronicas=paciente.enfermedades_cronicas,
        tipo_insulina=paciente.tipo_insulina,
        hba1c=paciente.hba1c,
        duracion_periodo=paciente.duracion_periodo,
        historia_clinica_num=paciente.historia_clinica_num,
    )
    db.add(db_paciente)
    db.commit()
    db.refresh(db_paciente)
    return db_paciente
@app.get("/api/v1/pacientes/",response_model=List[schemas.Paciente])
def list_pacientes(
    db: Session = Depends(get_db),
    current_medico:models.Medico=Depends(get_current_medico),
):
    pacientes=db.query(Patient).all()
    return pacientes

@app.get("/api/v1/pacientes/{paciente_id}", response_model=schemas.Paciente)
def get_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_medico: models.Medico = Depends(get_current_medico),
):
    paciente = (
        db.query(Patient)
        .filter(Patient.paciente_id == paciente_id)
        .first()
    )

    if paciente:
        return paciente 
    raise HTTPException(status_code=404, detail="Paciente no encontrado")

#   ESQUEMAS AUXILIARES PARA FUSIÓN


class GlucosePointOut(BaseModel):
    timestamp: datetime
    value_mgdl: Optional[float] = None
    cbg_mgdl: Optional[float] = None
    ketones_mmol: Optional[float] = None

    class Config:
        from_attributes = True


class FusionSummaryOut(BaseModel):
    paciente_id: int
    range_start: datetime
    range_end: datetime
    avg_glucose: Optional[float]
    tir_percent: Optional[float]
    total_insulin: float
    diet_events: int

#   ENDPOINT GLUCOSA 14 DÍAS

@app.get(
    "/api/v1/pacientes/{paciente_id}/glucosa",
    response_model=List[GlucosePointOut],
)
def get_glucose_timeseries(
    paciente_id: int,
    days: int = 14,
    db: Session = Depends(get_db),
    current_medico: models.Medico = Depends(get_current_medico),
):
    paciente = (
        db.query(Patient)
        .filter(Patient.paciente_id == paciente_id)
        .first()
    )
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    last = (
        db.query(GlucoseReading)
        .filter(GlucoseReading.patient_id == paciente_id)
        .order_by(GlucoseReading.timestamp.desc())
        .first()
    )

    if not last:
        raise HTTPException(
            status_code=404,
            detail="No hay lecturas de glucosa para este paciente",
        )

    end = last.timestamp
    start = end - timedelta(days=days)

    readings = (
        db.query(GlucoseReading)
        .filter(
            GlucoseReading.patient_id == paciente_id,
            GlucoseReading.timestamp >= start,
            GlucoseReading.timestamp <= end,
        )
        .order_by(GlucoseReading.timestamp)
        .all()
    )

    return [
        GlucosePointOut(
            timestamp=g.timestamp,
            value_mgdl=g.value_mgdl,
            cbg_mgdl=g.cbg_mgdl,
            ketones_mmol=g.ketones_mmol,
        )
        for g in readings
    ]


