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
    ManualEvent
)
from routers.auth import get_current_medico
import models



def extract_kcal(text: str | None):
    if not text:
        return None

    match = re.search(r"(\d+)\s*kcal", text.lower())
    if match:
        return float(match.group(1))
    return None


router = APIRouter(
    prefix="/api/v1/fusion",
    tags=["fusion"],
    dependencies=[Depends(get_current_medico)],
)
def compute_insulin_stats(insulin_doses, days_window: int):
   
    if not insulin_doses:
        return {
            "total": 0.0,
            "total_per_day": None,
            "basal": 0.0,
            "bolus": 0.0,
            "basal_per_day": None,
            "bolus_per_day": None,
            "basal_ratio": None,   # %
            "bolus_ratio": None,   # %
        }

    total_sc = 0.0
    total_csii_basal = 0.0
    total_csii_bolus = 0.0
    total_iv = 0.0

    for d in insulin_doses:
        if d.sc_insulin is not None:
            total_sc += float(d.sc_insulin)
        if d.csii_basal is not None:
            total_csii_basal += float(d.csii_basal)
        if d.csii_bolus is not None:
            total_csii_bolus += float(d.csii_bolus)
        if d.iv_insulin is not None:
            total_iv += float(d.iv_insulin)

    usa_bomba = (total_csii_basal + total_csii_bolus) > 0

    if usa_bomba:
        basal_raw = total_csii_basal
        bolus_raw = total_csii_bolus + total_sc  
    else:
        basal_raw = total_sc * 0.45
        bolus_raw = total_sc * 0.55

    total_insulin = basal_raw + bolus_raw + total_iv
    days_window = max(days_window, 1)

    total_per_day = total_insulin / days_window
    basal_per_day = basal_raw / days_window
    bolus_per_day = bolus_raw / days_window

    suma_bb = basal_raw + bolus_raw
    if suma_bb > 0:
        basal_ratio = round(basal_raw * 100.0 / suma_bb, 1)
        bolus_ratio = round(bolus_raw * 100.0 / suma_bb, 1)
    else:
        basal_ratio = None
        bolus_ratio = None

    return {
        "total": round(total_insulin, 1),
        "total_per_day": round(total_per_day, 1),
        "basal": round(basal_raw, 1),
        "bolus": round(bolus_raw, 1),
        "basal_per_day": round(basal_per_day, 1),
        "bolus_per_day": round(bolus_per_day, 1),
        "basal_ratio": basal_ratio,
        "bolus_ratio": bolus_ratio,
    }


def _contar_eventos_por_umbral(
    lecturas,
    predicate,
    min_duration_minutes: int = 15,
    join_gap_minutes: int = 30,
):
    if not lecturas:
        return 0

    readings = [r for r in lecturas if r.value_mgdl is not None]
    if not readings:
        return 0

    readings = sorted(readings, key=lambda r: r.timestamp)

    raw_segments = []
    in_segment = False
    seg_start = None
    last_ts = None

    for r in readings:
        g = r.value_mgdl
        ts = r.timestamp

        if predicate(g):
            if not in_segment:
                in_segment = True
                seg_start = ts
            last_ts = ts
        else:
            if in_segment and seg_start is not None and last_ts is not None:
                raw_segments.append((seg_start, last_ts))
                in_segment = False
                seg_start = None
                last_ts = None

    if in_segment and seg_start is not None and last_ts is not None:
        raw_segments.append((seg_start, last_ts))

    if not raw_segments:
        return 0

    merged = []
    gap_limit = timedelta(minutes=join_gap_minutes)

    for start, end in sorted(raw_segments, key=lambda s: s[0]):
        if not merged:
            merged.append([start, end])
        else:
            prev_start, prev_end = merged[-1]
            gap = start - prev_end
            if gap <= gap_limit:
                merged[-1][1] = max(prev_end, end)
            else:
                merged.append([start, end])

    min_dur = timedelta(minutes=min_duration_minutes)
    count = 0
    for start, end in merged:
        dur = end - start
        if dur >= min_dur:
            count += 1

    return count


def calcular_eventos_relevantes(lecturas):
    if not lecturas:
        return {
            "hipo": 0,
            "hipo_severa": 0,
            "hiper_severa": 0,
        }

    lecturas_ordenadas = sorted(
        [r for r in lecturas if r.value_mgdl is not None],
        key=lambda r: r.timestamp
    )

    eventos_hipo = _contar_eventos_por_umbral(
        lecturas_ordenadas,
        predicate=lambda g: g < 70,
        min_duration_minutes=15,
        join_gap_minutes=30,
    )

    eventos_hipo_severa = _contar_eventos_por_umbral(
        lecturas_ordenadas,
        predicate=lambda g: g < 54,
        min_duration_minutes=15,
        join_gap_minutes=30,
    )

    eventos_hiper_severa = _contar_eventos_por_umbral(
        lecturas_ordenadas,
        predicate=lambda g: g > 250,
        min_duration_minutes=15,
        join_gap_minutes=30,
    )

    return {
        "hipo": eventos_hipo,
        "hipo_severa": eventos_hipo_severa,
        "hiper_severa": eventos_hiper_severa,
    }



def compute_stress_kpi(
    db: Session,
    patient_id: int,
    start: datetime,
    end: datetime,
):
    events = (
        db.query(ManualEvent)
        .filter(
            ManualEvent.patient_id == patient_id,
            ManualEvent.event_type == "stress",
            ManualEvent.timestamp >= start,
            ManualEvent.timestamp <= end,
            ManualEvent.value != None,
        )
        .order_by(ManualEvent.timestamp.desc())
        .all()
    )

    if not events:
        return {
            "has_data": False,
            "last_level": None,
            "last_timestamp": None,
            "n_events": 0,
        }

    last = events[0]

    return {
        "has_data": True,
        "last_level": float(last.value),   # p.ej. 4/5
        "last_timestamp": last.timestamp,
        "n_events": len(events),
    }



@router.get("/{patient_id}/fusion")
def fusion_summary(
    patient_id: int,
    days: int = 14,
    db: Session = Depends(get_db),
    current_medico: models.Medico = Depends(get_current_medico),
):

    paciente = db.query(Patient).filter(Patient.paciente_id == patient_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

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

    glucose = (
    db.query(GlucoseReading)
    .filter(
        GlucoseReading.patient_id == patient_id,
        GlucoseReading.timestamp >= start,
        GlucoseReading.timestamp <= end,
    )
    .order_by(GlucoseReading.timestamp.asc())
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

    glucose_values = [g.value_mgdl for g in glucose if g.value_mgdl is not None]
    avg_glucose = round(sum(glucose_values) / len(glucose_values), 2) if glucose_values else None
    tir_bands = compute_tir_from_readings(glucose)
    tir_target_percent = tir_bands["target"]["percent"] if glucose else None
    days_window = max((end.date() - start.date()).days, 1)
    insulin_stats = compute_insulin_stats(insulin, days_window)
    total_diet = len(diet)
    total_kcal = 0.0
    kcal_events = 0
    for d in diet:
        kcal = extract_kcal(d.dietary) or extract_kcal(d.dietary_cn)
        if kcal:
            total_kcal += kcal
            kcal_events += 1
    avg_kcal_per_day = total_kcal / days_window if total_kcal > 0 else None

    eventos = calcular_eventos_relevantes(glucose)
    stress_kpi = compute_stress_kpi(db, patient_id, start, end)


    return {
        "patient_id": patient_id,
        "range": {
            "start": start.isoformat(),
            "end": end.isoformat(),
        },
        "glucose": {
            "avg": avg_glucose,
            "tir_percent": tir_target_percent, 
            "tir": tir_bands,# breakdown para la gráfica
            "eventos": eventos,     
        },
        "insulin": insulin_stats,   
        "diet": {
            "events": total_diet,
            "total_kcal": total_kcal,
            "avg_kcal_per_day": avg_kcal_per_day,
        },
        "stress": stress_kpi,
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
    if not readings:
        return {
            "very_low": {"minutes": 0, "percent": 0.0},
            "low": {"minutes": 0, "percent": 0.0},
            "target": {"minutes": 0, "percent": 0.0},
            "high": {"minutes": 0, "percent": 0.0},
            "very_high": {"minutes": 0, "percent": 0.0},
        }

    #orden cronológico
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

        start = r.timestamp
        if i + 1 < len(readings):
            end = readings[i + 1].timestamp
        else:
            end = start + timedelta(minutes=default_gap_minutes)

        delta_min = max((end - start).total_seconds() / 60.0, 0.0)

        if band in minutes_by_band:
            minutes_by_band[band] += delta_min

    total_minutes = sum(minutes_by_band.values()) or 1.0  

    tir_result = {}
    for band, mins in minutes_by_band.items():
        tir_result[band] = {
            "minutes": round(mins, 1),
            "percent": round(mins * 100.0 / total_minutes, 1),
        }

    return tir_result
