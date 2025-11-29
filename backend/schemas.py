from datetime import datetime
from pydantic import BaseModel, EmailStr

class PacienteBase(BaseModel):
    nombre_completo: str
    fecha_nacimiento: datetime
    historia_clinica_num: str

class PacienteCreate(PacienteBase):
    pass

class Paciente(PacienteBase):
    paciente_id: int
    fecha_registro: datetime

    class Config:
        from_attributes = True

#Médicos
class MedicoBase(BaseModel):
    nombre: str
    username: str
    email: EmailStr

class MedicoRegister(MedicoBase):
    password:str
class MedicoCreate(MedicoBase):
    password: str   # llega en texto plano en el request

class MedicoLogin(BaseModel):   # 👈 ESTE FALTABA
    username: str
    password: str
class MedicoOut(MedicoBase):
    medico_id: int

    class Config:
        from_attributes = True
        
#Login
class LoginData(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"