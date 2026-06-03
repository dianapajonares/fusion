from sqlalchemy.orm import Session
from passlib.context import CryptContext

from models import Medico, SessionLocal  # 👈 AQUÍ está la corrección

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_medico():
    db: Session = SessionLocal()

    username = "test_medico"
    password = "Test123!"
    email = "test@demo.com"
    nombre = "Médico Prueba"

    # Verificar si ya existe
    exists = db.query(Medico).filter(Medico.username == username).first()
    if exists:
        print("⚠️ El usuario ya existe")
        db.close()
        return

    medico = Medico(
        username=username,
        email=email,
        nombre=nombre,
        password_hash=get_password_hash(password),
    )

    db.add(medico)
    db.commit()
    db.refresh(medico)

    print("✅ Usuario creado")
    print("   username:", username)
    print("   password:", password)

    db.close()

if __name__ == "__main__":
    create_medico()
