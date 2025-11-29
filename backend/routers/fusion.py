from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import (get_db,Patient,GlucoseReading,InsulinDose,DietaryIntake,)
from routers.auth import get_current_medico  
import models
router = APIRouter(
    prefix="/api/v1/fusion",
    tags=["fusion"],
    dependencies=[Depends(get_current_medico)]
)


@router.get("/ejemplo")
def ejemplo_endpoint(db: Session = Depends(get_db)):
    """
    Endpoint de prueba para verificar que el router funciona.
    Lo puedes borrar cuando ya no lo necesites.
    """
    total_pacientes = db.query(Patient).count()
    return {"status": "ok", "pacientes_en_bd": total_pacientes}


@router.get("/{patient_id}/fusion")
def fusion_summary(
    patient_id: int,
    days: int = 14,
    db: Session = Depends(get_db), 
    current_medico: models.Medico = Depends(get_current_medico)

):
    """
    Resumen fusionado para un paciente en una ventana de `days` días.
    La ventana se ancla a la ÚLTIMA lectura de glucosa disponible
    (pensando en episodios de ShanghaiT1DM de ~14 días).
    """

    # 0. Verificar que el paciente exista
    paciente = db.query(Patient).filter(Patient.paciente_id == patient_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # 1. Anclar la ventana a la ÚLTIMA fecha de glucosa disponible
    last = (
        db.query(GlucoseReading)
        .filter(GlucoseReading.patient_id == patient_id)
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

    # 2. Obtener datos relevantes dentro de la ventana
    glucose = (
        db.query(GlucoseReading)
        .filter(
            GlucoseReading.patient_id == patient_id,
            GlucoseReading.timestamp >= start,
            GlucoseReading.timestamp <= end,
        )
        .all()
    )

    insulin = (
        db.query(InsulinDose)
        .filter(
            InsulinDose.patient_id == patient_id,
            InsulinDose.timestamp >= start,
            InsulinDose.timestamp <= end,
        )
        .all()
    )

    diet = (
        db.query(DietaryIntake)
        .filter(
            DietaryIntake.patient_id == patient_id,
            DietaryIntake.timestamp >= start,
            DietaryIntake.timestamp <= end,
        )
        .all()
    )

    # 3. Cálculos principales

    # --- Glucosa promedio y TIR ---
    glucose_values = [g.value_mgdl for g in glucose if g.value_mgdl is not None]

    if glucose_values:
        avg_glucose = round(sum(glucose_values) / len(glucose_values), 2)
        tir = round(
            len([v for v in glucose_values if 70 <= v <= 180])
            / len(glucose_values)
            * 100,
            2,
        )
    else:
        avg_glucose = None
        tir = None

    # --- Insulina total ---
    total_insulin = 0.0
    for d in insulin:
        for val in [d.sc_insulin, d.csii_bolus, d.csii_basal, d.iv_insulin]:
            if val is not None:
                total_insulin += float(val)

    # --- Consumo de dieta (número de eventos) ---
    total_diet = len(diet)

    # 4. Respuesta fusionada
    return {
        "patient_id": patient_id,
        "range": {
            "start": start,
            "end": end,
        },
        "glucose": {
            "avg": avg_glucose,
            "tir_percent": tir,
        },
        "insulin": {
            "total": total_insulin,
        },
        "diet": {
            "events": total_diet,
        },
        "fusion_summary": {
            "glucose_insulin_interaction": "placeholder",
            "post_meal_peaks": "placeholder",
            "basal_vs_bolus_ratio": "placeholder",
        },
    }
