from pydantic import BaseModel
from datetime import date, datetime

class PacienteCreate(BaseModel):
    nombre_completo: str
    fecha_nacimiento: date
    historia_clinica_num: str

class Paciente(PacienteCreate):
    paciente_id: int
    fecha_registro: datetime 
    
    class Config:
        from_attributes = True