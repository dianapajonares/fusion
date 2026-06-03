import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from passlib.context import CryptContext

load_dotenv()  # si tu .env está en backend/
# load_dotenv("../.env")  # si tu .env está en la raiz del repo
from config import settings  # si tienes settings con DATABASE_URL


from models import SessionLocal, Medico  # ajusta si tu proyecto lo tiene distinto

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_pw(pw: str) -> str:
    return pwd_context.hash(pw)

def pick_password_field(u: Medico) -> str:
    # detecta automáticamente el nombre del campo
    for f in ["password_hash", "hashed_password", "password", "hash_password"]:
        if hasattr(u, f):
            return f
    raise RuntimeError("No encontré un campo de password en el modelo User")

def main():
    # 2) Imprime a qué DB cree que se conecta tu app
    db_url = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL") or os.getenv("SQLALCHEMY_DATABASE_URL")
    print("DB_URL usada:", db_url)

    identifier = "TU_CORREO_O_USERNAME"
    new_pw = "NuevaClaveSegura123!"

    db: Session = SessionLocal()

    # 3) Busca por email o username (lo que exista)
    q = db.query(Medico)
    Medico = None
    if hasattr(Medico, "email"):
        Medico = q.filter(Medico.email == identifier).first()
    if Medico is None and hasattr(Medico, "username"):
        Medico = q.filter(Medico.username == identifier).first()

    if not user:
        print("❌ No encontré el usuario con:", identifier)
        return

    # 4) Muestra datos antes
    print("✅ Usuario encontrado. id=", getattr(Medico, "id", None))
    field = pick_password_field(Medico)
    print("Campo password detectado:", field)
    before = getattr(Medico, field)
    print("Hash antes (primeros 25 chars):", str(before)[:25])

    # 5) Actualiza + commit
    setattr(Medico, field, hash_pw(new_pw))
    db.commit()
    db.refresh(Medico)

    after = getattr(Medico, field)
    print("Hash después (primeros 25 chars):", str(after)[:25])
    print("✅ Actualizado OK")

    db.close()

if __name__ == "__main__":
    main()
