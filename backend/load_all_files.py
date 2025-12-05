import pandas as pd
import re
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session

from models import (
    SessionLocal,
    init_db,
    Patient,
    GlucoseReading,
    InsulinDose,
    DietaryIntake,
)

DATA_DIR = Path(__file__).resolve().parent / "data"

# Columnas dataset Shanghai
COL_DATE = "Date"
COL_CGM = "CGM (mg / dl)"
COL_CBG = "CBG (mg / dl)"
COL_KETONE = "Blood Ketone (mmol / L)"
COL_DIET = "Dietary intake"
COL_DIET_CN = "饮食"
COL_SC_INSULIN = "Insulin dose - s.c."
COL_BOLUS = "CSII - bolus insulin (Novolin R, IU)"
COL_BASAL = "CSII - basal insulin (Novolin R, IU / H)"
COL_IV = "Insulin dose - i.v."


def parse_ts(value):
    """Convierte una fecha a datetime."""
    if isinstance(value, datetime):
        return value
    try:
        return pd.to_datetime(value)
    except Exception:
        return None


def parse_dose(value):
    """Extrae el número de una cadena como 'insulin degludec, 16 IU' -> 16.0"""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value)
    m = re.search(r"([-+]?\d*\.?\d+)", s)
    if m:
        return float(m.group(1))
    return None


def get_or_create_patient(db: Session, external_id: str) -> Patient:
    """
    Usa historia_clinica_num == external_id como ID del paciente dataset.
    Como el dataset no trae nombre real, usamos un nombre genérico.
    """
    patient = (
        db.query(Patient)
        .filter(Patient.historia_clinica_num == external_id)
        .first()
    )
    if not patient:
        patient = Patient(
            nombre=f"Paciente {external_id}",
            apellido_paterno="Shanghai",
            apellido_materno=None,
            fecha_nacimiento=datetime(2000, 1, 1),
            historia_clinica_num=external_id,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
    return patient


def load_file(path: Path, db: Session):
    print(f"📂 Cargando archivo: {path.name}")

    # ejemplo: 1006 del archivo 1006_0_20210114.xlsx
    external_id = path.stem.split("_")[0]
    patient = get_or_create_patient(db, external_id)

    # Leer el archivo
    if path.suffix.lower() == ".xls":
        df = pd.read_excel(path, engine="xlrd")
    else:
        df = pd.read_excel(path)

    if COL_DATE not in df.columns:
        raise ValueError(f"El archivo {path.name} no contiene la columna '{COL_DATE}'")

    # Procesar fila por fila
    for _, row in df.iterrows():
        ts = parse_ts(row[COL_DATE])
        if ts is None:
            continue

        # ----------------- GLUCOSA -------------------
        has_glucose = any(
            col in df.columns and not pd.isna(row[col])
            for col in [COL_CGM, COL_CBG, COL_KETONE]
        )

        if has_glucose:
            glucose = GlucoseReading(
                patient_id=patient.paciente_id,
                timestamp=ts,
                value_mgdl=float(row[COL_CGM]) if COL_CGM in df.columns and not pd.isna(row[COL_CGM]) else None,
                cbg_mgdl=float(row[COL_CBG]) if COL_CBG in df.columns and not pd.isna(row[COL_CBG]) else None,
                ketones_mmol=float(row[COL_KETONE]) if COL_KETONE in df.columns and not pd.isna(row[COL_KETONE]) else None,
            )
            db.add(glucose)

        # ----------------- DIETA -------------------
        has_diet = any(
            col in df.columns and not pd.isna(row[col])
            for col in [COL_DIET, COL_DIET_CN]
        )

        if has_diet:
            diet = DietaryIntake(
                patient_id=patient.paciente_id,
                timestamp=ts,
                dietary=row[COL_DIET] if COL_DIET in df.columns and not pd.isna(row[COL_DIET]) else None,
                dietary_cn=row[COL_DIET_CN] if COL_DIET_CN in df.columns and not pd.isna(row[COL_DIET_CN]) else None,
            )
            db.add(diet)

        # ----------------- INSULINA -------------------
        has_insulin = any(
            col in df.columns and not pd.isna(row[col])
            for col in [COL_SC_INSULIN, COL_BOLUS, COL_BASAL, COL_IV]
        )

        if has_insulin:
            insulin = InsulinDose(
                patient_id=patient.paciente_id,
                timestamp=ts,
                sc_insulin=parse_dose(row[COL_SC_INSULIN]) if COL_SC_INSULIN in df.columns else None,
                csii_bolus=parse_dose(row[COL_BOLUS]) if COL_BOLUS in df.columns else None,
                csii_basal=parse_dose(row[COL_BASAL]) if COL_BASAL in df.columns else None,
                iv_insulin=parse_dose(row[COL_IV]) if COL_IV in df.columns else None,
            )
            db.add(insulin)

    db.commit()
    print(f"Archivo {path.name} cargado.\n")


def main():
    # Asegura que las tablas existen
    init_db()
    db = SessionLocal()

    files = [
        "1006_0_20210114.xlsx",
        "1006_1_20210209.xlsx",
        "1006_2_20210303.xlsx",
        "1001_0_20210730.xlsx",
        "1002_0_20210504.xls",
    ]

    for fname in files:
        path = DATA_DIR / fname
        if not path.exists():
            print(f"No se encontró {path}, lo salto.")
            continue
        load_file(path, db)

    db.close()
    print(" Todos los archivos fueron procesado")


if __name__ == "__main__":
    main()
