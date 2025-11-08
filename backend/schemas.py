from pydantic import BaseModel
from datetime import date, datetime

# Esquema para la creación de un nuevo Paciente (Input)
class PacienteCreate(BaseModel):
    nombre_completo: str
    fecha_nacimiento: date
    historia_clinica_num: str

# Esquema para la respuesta después de crear un Paciente (Output)
class Paciente(PacienteCreate):
    paciente_id: int
    fecha_registro: datetime # Debe coincidir con el tipo TIMESTAMP de la DB
    
    class Config:
        from_attributes = True