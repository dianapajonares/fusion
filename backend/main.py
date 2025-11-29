# backend/main.py
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models, schemas
from models import get_db, Patient, GlucoseReading, InsulinDose, DietaryIntake
from routers import fusion, auth
from routers.auth import get_current_medico


app = FastAPI(title="Sistema Clínico - ShanghaiT1DM")

# =========================
#   Routers
# =========================
app.include_router(auth.router)
app.include_router(fusion.router)

# =========================
#   CORS
# =========================
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
#   ROOT
# =========================
@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend y DB conectados y listos."}


# =========================
#   PACIENTES (CREAR Y LISTAR) - PROTEGIDOS
# =========================

@app.post("/api/v1/pacientes/", response_model=schemas.Paciente)
def create_paciente(
    paciente: schemas.PacienteCreate,
    db: Session = Depends(get_db),
    # 👇 obliga a que el request traiga un Bearer token válido
    current_medico: models.Medico = Security(get_current_medico),
):
    # Verificar duplicados
    existe_paciente = (
        db.query(models.Patient)
        .filter(models.Patient.historia_clinica_num == paciente.historia_clinica_num)
        .first()
    )

    if existe_paciente:
        raise HTTPException(
            status_code=400,
            detail="El número de historia clínica ya existe.",
        )

    db_paciente = models.Patient(
        nombre_completo=paciente.nombre_completo,
        fecha_nacimiento=paciente.fecha_nacimiento,
        historia_clinica_num=paciente.historia_clinica_num,
    )

    db.add(db_paciente)
    db.commit()
    db.refresh(db_paciente)

    return db_paciente


@app.get("/api/v1/pacientes/", response_model=List[schemas.Paciente])
def list_pacientes(
    db: Session = Depends(get_db),
    current_medico: models.Medico = Security(get_current_medico),
):
    pacientes = db.query(models.Patient).all()
    return pacientes


# =========================
#   ESQUEMAS AUXILIARES PARA FUSIÓN
# =========================

class GlucosePointOut(schemas.BaseModel):
    timestamp: datetime
    value_mgdl: Optional[float] = None
    cbg_mgdl: Optional[float] = None
    ketones_mmol: Optional[float] = None

    class Config:
        from_attributes = True


class FusionSummaryOut(schemas.BaseModel):
    paciente_id: int
    range_start: datetime
    range_end: datetime
    avg_glucose: Optional[float]
    tir_percent: Optional[float]
    total_insulin: float
    diet_events: int


# =========================
#   ENDPOINT GLUCOSA 14 DÍAS - PROTEGIDO
# =========================

@app.get(
    "/api/v1/pacientes/{paciente_id}/glucosa",
    response_model=List[GlucosePointOut],
)
def get_glucose_timeseries(
    paciente_id: int,
    days: int = 14,
    db: Session = Depends(get_db),
    current_medico: models.Medico = Security(get_current_medico),
):
    # Verificar paciente
    paciente = (
        db.query(Patient)
        .filter(Patient.paciente_id == paciente_id)
        .first()
    )
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # Última lectura como ancla de la ventana
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
