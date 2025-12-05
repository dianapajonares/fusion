import re
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models import (
    get_db,
    Patient,
    GlucoseReading,
    InsulinDose,
    DietaryIntake,
)
from routers.auth import get_current_medico
import models


# ======================================
#  HELPER PARA EXTRAER KCAL DE TEXTO
# ======================================
def extract_kcal(text: str | None):
    if not text:
        return None

    # Busca ej. "450 kcal", "320kcal", "300 KCAL"
    match = re.search(r"(\d+)\s*kcal", text.lower())
    if match:
        return float(match.group(1))
    return None


router = APIRouter(
    prefix="/api/v1/fusion",
    tags=["fusion"],
    dependencies=[Depends(get_current_medico)],
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
    current_medico: models.Medico = Depends(get_current_medico),
):

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

    # --- Glucosa promedio ---
    glucose_values = [g.value_mgdl for g in glucose if g.value_mgdl is not None]

    if glucose_values:
        avg_glucose = round(sum(glucose_values) / len(glucose_values), 2)
    else:
        avg_glucose = None

    # --- TIR por bandas AGP (muy bajo, bajo, rango, alto, muy alto) ---
    tir_bands = compute_tir_from_readings(glucose)

    # TIR "principal" = porcentaje en rango 70–180 mg/dL
    tir_target_percent = tir_bands["target"]["percent"] if glucose else None

    # --- Insulina total ---
    total_insulin = 0.0
    for d in insulin:
        for val in [d.sc_insulin, d.csii_bolus, d.csii_basal, d.iv_insulin]:
            if val is not None:
                total_insulin += float(val)

    # --- Datos de dieta ---
    total_diet = len(diet)

    # ======================================
    #   CÁLCULO DE KCAL SUMADAS Y PROMEDIO
    # ======================================
    total_kcal = 0.0
    kcal_events = 0

    for d in diet:
        kcal = extract_kcal(d.dietary) or extract_kcal(d.dietary_cn)
        if kcal:
            total_kcal += kcal
            kcal_events += 1

    # promedio por día en la ventana
    days_window = max((end.date() - start.date()).days, 1)
    avg_kcal_per_day = total_kcal / days_window if total_kcal > 0 else None

    # 4. Respuesta fusionada
    return {
        "patient_id": patient_id,
        "range": {
            "start": start.isoformat(),
            "end": end.isoformat(),
        },
        "glucose": {
            "avg": avg_glucose,
            "tir_percent": tir_target_percent,  # TIR 70–180
            "tir": tir_bands,                   # breakdown para la gráfica
        },
        "insulin": {
            "total": total_insulin,
        },
        "diet": {
            "events": total_diet,
            "total_kcal": total_kcal,
            "avg_kcal_per_day": avg_kcal_per_day,
        },
        "fusion_summary": {
            "glucose_insulin_interaction": "placeholder",
            "post_meal_peaks": "placeholder",
            "basal_vs_bolus_ratio": "placeholder",
        },
    }


# Rangos estándar AGP en mg/dL
VERY_LOW_MAX = 54
LOW_MAX = 70
TARGET_MAX = 180
HIGH_MAX = 250
# VERY_HIGH: > 250


def classify_tir_band(value_mgdl: float) -> str:
    """Clasifica un valor en su banda AGP."""
    if value_mgdl is None:
        return "missing"
    if value_mgdl < VERY_LOW_MAX:
        return "very_low"
    if value_mgdl < LOW_MAX:
        return "low"
    if value_mgdl <= TARGET_MAX:
        return "target"
    if value_mgdl <= HIGH_MAX:
        return "high"
    return "very_high"


def compute_tir_from_readings(readings, default_gap_minutes: int = 5):
    """
    Calcula TIR ponderando por TIEMPO entre lecturas.
    readings: lista ORDENADA de objetos con .timestamp y .value_mgdl
              (por ejemplo instancias de GlucoseReading)
    """
    if not readings:
        return {
            "very_low": {"minutes": 0, "percent": 0.0},
            "low": {"minutes": 0, "percent": 0.0},
            "target": {"minutes": 0, "percent": 0.0},
            "high": {"minutes": 0, "percent": 0.0},
            "very_high": {"minutes": 0, "percent": 0.0},
        }

    # Aseguramos orden cronológico
    readings = sorted(readings, key=lambda r: r.timestamp)

    minutes_by_band = {
        "very_low": 0.0,
        "low": 0.0,
        "target": 0.0,
        "high": 0.0,
        "very_high": 0.0,
    }

    for i, r in enumerate(readings):
        band = classify_tir_band(r.value_mgdl)

        # Intervalo de tiempo cubierto por esta lectura
        start = r.timestamp
        if i + 1 < len(readings):
            end = readings[i + 1].timestamp
        else:
            # Última lectura: asumimos un intervalo fijo típico de CGM
            end = start + timedelta(minutes=default_gap_minutes)

        delta_min = max((end - start).total_seconds() / 60.0, 0.0)

        if band in minutes_by_band:
            minutes_by_band[band] += delta_min

    total_minutes = sum(minutes_by_band.values()) or 1.0  # evitar división por 0

    tir_result = {}
    for band, mins in minutes_by_band.items():
        tir_result[band] = {
            "minutes": round(mins, 1),
            "percent": round(mins * 100.0 / total_minutes, 1),
        }

    return tir_result
