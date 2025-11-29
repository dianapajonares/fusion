from models import SessionLocal, Patient, GlucoseReading

db = SessionLocal()

print("Pacientes:")
for p in db.query(Patient).all():
    print(p.paciente_id, p.nombre_completo, p.historia_clinica_num)

print("\nAlgunas lecturas de glucosa:")
for g in db.query(GlucoseReading).limit(10):
    print(g.id, g.patient_id, g.timestamp, g.value_mgdl)

db.close()
