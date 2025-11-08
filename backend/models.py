from sqlalchemy import create_engine, Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import SQLALCHEMY_DATABASE_URL
from datetime import datetime

# 1. Configuración de la Conexión
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Definición de las Clases (Tablas)
class Medico(Base):
    __tablename__ = "medicos"
    medico_id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

class Paciente(Base):
    __tablename__ = "pacientes"
    paciente_id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False)
    fecha_nacimiento = Column(TIMESTAMP, nullable=False)
    historia_clinica_num = Column(String(50), unique=True, nullable=False)
    # ESTA COLUMNA ES CRUCIAL Y FALTABA EN LA DB
    fecha_registro = Column(
        TIMESTAMP, 
        default=datetime.utcnow, 
        nullable=False
    )

class DatosClinicosIngreso(Base):
    __tablename__ = "datos_clinicos_ingreso"
    ingreso_id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey('pacientes.paciente_id'), nullable=False)
    medico_id = Column(Integer, ForeignKey('medicos.medico_id'), nullable=False)
    fecha_registro = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    presion_sistolica = Column(Integer) 
    glucosa_ayunas = Column(DECIMAL)
    sintomas_claves = Column(String)

class ResultadoFusion(Base):
    __tablename__ = "resultados_fusion"
    resultado_id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey('pacientes.paciente_id'), index=True, nullable=False)
    fecha_analisis = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    indice_riesgo = Column(DECIMAL(5, 4), nullable=False)
    clasificacion = Column(String(50), nullable=False) 

# 3. Función de Utilidad para la Base de Datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()