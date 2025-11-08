from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas 
from models import get_db 
app = FastAPI()
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Añadir dominios de producción aquí después
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Permite estos orígenes
    allow_credentials=True,       # Permite cookies de autenticación
    allow_methods=["*"],          # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"],          # Permite todos los encabezados
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend y DB conectados y listos."}

@app.post("/api/v1/pacientes/", response_model=schemas.Paciente)
def create_paciente(paciente: schemas.PacienteCreate, db: Session = Depends(get_db)):
    
    # 1. Verificación de duplicados antes de la inserción
    existe_paciente = db.query(models.Paciente).filter(
        models.Paciente.historia_clinica_num == paciente.historia_clinica_num
    ).first()
    
    if existe_paciente:
        raise HTTPException(status_code=400, detail="El número de historia clínica ya existe.")

    # 2. Creación de la instancia ORM (Sin pasar campos default como fecha_registro)
    db_paciente = models.Paciente(
        nombre_completo=paciente.nombre_completo,
        fecha_nacimiento=paciente.fecha_nacimiento,
        historia_clinica_num=paciente.historia_clinica_num
    )
    
    # 3. Guardar en la base de datos
    db.add(db_paciente)
    db.commit()
    db.refresh(db_paciente) # CRUCIAL: Obtiene el ID y la fecha_registro generados por la DB
    
    return db_paciente