# backend/seed_synthetic_data.py

from datetime import datetime, timedelta
import random

from sqlalchemy.orm import Session

from models import (
    SessionLocal,
    init_db,
    Patient,
    GlucoseReading,
    InsulinDose,
    DietaryIntake,
)

# ----------------------------
# Parámetros de simulación
# ----------------------------
START_DATE = datetime(2024, 11, 1, 0, 0, 0)
DAYS = 14
INTERVAL_MINUTES = 15  # glucosa cada 15 min → 96 lecturas/día aprox


def create_or_get_patient(
    db: Session,
    historia_clinica_num: str,
    nombre: str,
    apellido_paterno: str,
    apellido_materno: str,
    sexo: str,
    fecha_nacimiento: str,
    anio_diagnostico: int,
    enfermedades_cronicas: str,
    duracion_periodo: int | None = None,
):
    """Crea un paciente SIM si no existe, o lo recupera."""
    paciente = (
        db.query(Patient)
        .filter(Patient.historia_clinica_num == historia_clinica_num)
        .first()
    )
    if paciente:
        print(f"Paciente {historia_clinica_num} ya existe (id={paciente.paciente_id}), lo reutilizo.")
        return paciente

    paciente = Patient(
        nombre=nombre,
        apellido_paterno=apellido_paterno,
        apellido_materno=apellido_materno,
        sexo=sexo,
        fecha_nacimiento=datetime.fromisoformat(fecha_nacimiento),
        anio_diagnostico=anio_diagnostico,
        enfermedades_cronicas=enfermedades_cronicas,
        duracion_periodo=duracion_periodo,
        tipo_insulina="Análogos de acción rápida y basal (simulado)",
        hba1c=None,
        historia_clinica_num=historia_clinica_num,
    )
    db.add(paciente)
    db.commit()
    db.refresh(paciente)

    print(f"✅ Creado paciente SIM {historia_clinica_num} con paciente_id={paciente.paciente_id}")
    return paciente


def simulate_glucose_series(db: Session, patient_id: int, perfil: str):
    """
    Genera lecturas de glucosa simuladas por 14 días.
    perfil:
      - 'controlado' → ~140 mg/dL
      - 'intermedio' → ~170 mg/dL
      - 'descontrolado' → ~200 mg/dL
    """
    if perfil == "controlado":
        base = 140
        variabilidad = 35
    elif perfil == "intermedio":
        base = 170
        variabilidad = 45
    else:  # descontrolado
        base = 200
        variabilidad = 55

    total_points = 0
    for day in range(DAYS):
        day_start = START_DATE + timedelta(days=day)
        for step in range(int((24 * 60) / INTERVAL_MINUTES)):
            ts = day_start + timedelta(minutes=step * INTERVAL_MINUTES)
            # simulación básica: valor normal + ruido tipo seno + ruido aleatorio
            hour_factor = 10 * (
                1
                + 0.3 * random.uniform(-1, 1)
                + 0.3 * (1 if 6 <= ts.hour <= 9 or 19 <= ts.hour <= 22 else 0)
            )
            value = base + random.gauss(0, variabilidad) + hour_factor
            value = max(40, min(value, 350))  # límites razonables

            g = GlucoseReading(
                patient_id=patient_id,
                timestamp=ts,
                value_mgdl=value,
                cbg_mgdl=None,
                ketones_mmol=None,
            )
            db.add(g)
            total_points += 1

    db.commit()
    print(f"   → Glucosa simulada: {total_points} puntos para paciente_id={patient_id}")


def simulate_insulin(db: Session, patient_id: int, tdd_promedio: float):
    """
    Simula dosis de insulina:
      - basal 1 vez al día
      - bolos 3-4 veces al día
    tdd_promedio: unidades totales/día aproximadas.
    """
    total_registros = 0
    for day in range(DAYS):
        date = START_DATE + timedelta(days=day)

        # Basal (noche)
        basal_dose = tdd_promedio * 0.4 + random.uniform(-2, 2)
        basal_ts = date.replace(hour=22, minute=0)
        db.add(
            InsulinDose(
                patient_id=patient_id,
                timestamp=basal_ts,
                sc_insulin=max(0, basal_dose),
                csii_bolus=None,
                csii_basal=None,
                iv_insulin=None,
            )
        )
        total_registros += 1

        # Bolos (desayuno/comida/cena)
        for h in [7, 13, 19]:
            bolus_dose = tdd_promedio * 0.15 + random.uniform(-2, 2)
            ts = date.replace(hour=h, minute=0)
            db.add(
                InsulinDose(
                    patient_id=patient_id,
                    timestamp=ts,
                    sc_insulin=max(0, bolus_dose),
                    csii_bolus=None,
                    csii_basal=None,
                    iv_insulin=None,
                )
            )
            total_registros += 1

    db.commit()
    print(f"   → Insulina simulada: {total_registros} registros para paciente_id={patient_id}")


def simulate_diet(db: Session, patient_id: int, kcal_base: int):
    """
    Simula eventos de dieta textuales (no kcal reales en BD, pero útiles para tu proceso de fusión.
    """
    total_registros = 0
    for day in range(DAYS):
        date = START_DATE + timedelta(days=day)

        comidas = [
            (date.replace(hour=7, minute=30), "Desayuno ~45g CHO, 1 huevo, café"),
            (date.replace(hour=13, minute=30), "Comida ~60g CHO, pollo, ensalada"),
            (date.replace(hour=20, minute=30), "Cena ~50g CHO, verduras, yogurt"),
        ]

        # snack opcional aleatorio
        if random.random() < 0.4:
            snack_ts = date.replace(hour=random.choice([11, 17]), minute=0)
            comidas.append((snack_ts, "Snack ~20g CHO (fruta o galletas)"))

        for ts, texto in comidas:
            db.add(
                DietaryIntake(
                    patient_id=patient_id,
                    timestamp=ts,
                    dietary=texto,
                    dietary_cn=None,
                )
            )
            total_registros += 1

    db.commit()
    print(f"   → Dieta simulada: {total_registros} registros para paciente_id={patient_id}")


def seed():
    init_db()
    db = SessionLocal()

    try:
        # ------------------------
        # Paciente 1: Ana (control más o menos bueno)
        # ------------------------
        ana = create_or_get_patient(
            db=db,
            historia_clinica_num="SIM-ANA-001",
            nombre="Ana",
            apellido_paterno="García",
            apellido_materno="López",
            sexo="F",
            fecha_nacimiento="1998-03-12",
            anio_diagnostico=2010,
            enfermedades_cronicas="Diabetes tipo 1 desde los 12 años. Hipotiroidismo autoinmune.",
            duracion_periodo=28,
        )
        simulate_glucose_series(db, ana.paciente_id, perfil="controlado")
        simulate_insulin(db, ana.paciente_id, tdd_promedio=40)
        simulate_diet(db, ana.paciente_id, kcal_base=1800)

        # ------------------------
        # Paciente 2: Luis (control intermedio)
        # ------------------------
        luis = create_or_get_patient(
            db=db,
            historia_clinica_num="SIM-LUIS-002",
            nombre="Luis",
            apellido_paterno="Martínez",
            apellido_materno="Ruiz",
            sexo="M",
            fecha_nacimiento="1992-07-05",
            anio_diagnostico=2008,
            enfermedades_cronicas="Diabetes tipo 1. Hipertensión arterial controlada.",
            duracion_periodo=None,
        )
        simulate_glucose_series(db, luis.paciente_id, perfil="intermedio")
        simulate_insulin(db, luis.paciente_id, tdd_promedio=55)
        simulate_diet(db, luis.paciente_id, kcal_base=2200)

        # ------------------------
        # Paciente 3: María (un poco descontrolada)
        # ------------------------
        maria = create_or_get_patient(
            db=db,
            historia_clinica_num="SIM-MARIA-003",
            nombre="María",
            apellido_paterno="Hernández",
            apellido_materno="Santos",
            sexo="F",
            fecha_nacimiento="2001-11-21",
            anio_diagnostico=2015,
            enfermedades_cronicas="Diabetes tipo 1. Dislipidemia mixta.",
            duracion_periodo=30,
        )
        simulate_glucose_series(db, maria.paciente_id, perfil="descontrolado")
        simulate_insulin(db, maria.paciente_id, tdd_promedio=48)
        simulate_diet(db, maria.paciente_id, kcal_base=1950)

    finally:
        db.close()
        print("✔ Datos sintéticos generados.")


if __name__ == "__main__":
    seed()
