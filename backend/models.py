from datetime import datetime

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DECIMAL,
    TIMESTAMP,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship, declarative_base, sessionmaker

from config import SQLALCHEMY_DATABASE_URL

# Base de SQLAlchemy
Base = declarative_base()

# Motor de conexión
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class GlucoseReading(Base):
    __tablename__ = "glucose_readings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("pacientes.paciente_id"), index=True)
    timestamp = Column(DateTime, index=True)
    value_mgdl = Column(Float, nullable=True)
    cbg_mgdl = Column(Float, nullable=True)
    ketones_mmol = Column(Float, nullable=True)

    patient = relationship("Patient", back_populates="glucose")


class InsulinDose(Base):
    __tablename__ = "insulin_doses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("pacientes.paciente_id"), index=True)
    timestamp = Column(DateTime, index=True)
    sc_insulin = Column(Float, nullable=True)
    csii_bolus = Column(Float, nullable=True)
    csii_basal = Column(Float, nullable=True)
    iv_insulin = Column(Float, nullable=True)

    patient = relationship("Patient", back_populates="insulin")


class DietaryIntake(Base):
    __tablename__ = "dietary_intake"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("pacientes.paciente_id"), index=True)
    timestamp = Column(DateTime, index=True)
    dietary = Column(String, nullable=True)      # "Dietary intake"
    dietary_cn = Column(String, nullable=True)   # "饮食"

    patient = relationship("Patient", back_populates="dietary")


class Medico(Base):
    __tablename__ = "medicos"

    medico_id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)


class Patient(Base):
    __tablename__ = "pacientes"

    paciente_id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido_paterno = Column(String(100), nullable=False)
    apellido_materno = Column(String(100), nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=False)
    sexo = Column(String(10), nullable=True)                 
    anio_diagnostico = Column(Integer, nullable=True)        

    enfermedades_cronicas = Column(String, nullable=True)   
    tipo_insulina = Column(String(100), nullable=True)      
    hba1c = Column(Float, nullable=True)                     
    duracion_periodo = Column(Integer, nullable=True)      

    historia_clinica_num = Column(String, unique=True, nullable=False)
    fecha_registro = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


    # Relaciones
    glucose = relationship("GlucoseReading", back_populates="patient")
    insulin = relationship("InsulinDose", back_populates="patient")
    dietary = relationship("DietaryIntake", back_populates="patient")
    datos_clinicos = relationship("DatosClinicosIngreso", back_populates="paciente")
    resultados_fusion = relationship("ResultadoFusion", back_populates="paciente")


class DatosClinicosIngreso(Base):
    __tablename__ = "datos_clinicos_ingreso"

    ingreso_id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.paciente_id"), nullable=False)
    medico_id = Column(Integer, ForeignKey("medicos.medico_id"), nullable=False)
    fecha_registro = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    presion_sistolica = Column(Integer)
    glucosa_ayunas = Column(DECIMAL)
    sintomas_claves = Column(String)

    paciente = relationship("Patient", back_populates="datos_clinicos")
    medico = relationship("Medico")


class ResultadoFusion(Base):
    __tablename__ = "resultados_fusion"

    resultado_id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.paciente_id"), index=True, nullable=False)
    fecha_analisis = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    indice_riesgo = Column(DECIMAL(5, 4), nullable=False)
    clasificacion = Column(String(50), nullable=False)

    paciente = relationship("Patient", back_populates="resultados_fusion")

#   UTILIDADES DE BD


def init_db():
    """Crea las tablas en la BD si no existen."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependencia típica de FastAPI para obtener sesión."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
