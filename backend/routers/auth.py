# backend/routers/auth.py

from datetime import datetime, timedelta

import jwt
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from config import TOKEN_KEY,ALGORITHM,ACCESS_TOKEN_EXPIRE_MINUTES
import models
import schemas
from models import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# ---- Seguridad / JWT ----
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()




def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode,TOKEN_KEY, algorithm=ALGORITHM)


# ---- Dependencia para proteger endpoints ----
def get_current_medico(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Medico:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, TOKEN_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    medico = (
        db.query(models.Medico)
        .filter(models.Medico.username == username)
        .first()
    )
    if medico is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return medico


# ---- Endpoints de AUTH ----

@router.post("/register", response_model=schemas.MedicoOut)
def register_medico(
    medico_in: schemas.MedicoRegister,
    db: Session = Depends(get_db),
):
    # ¿ya existe ese username o email?
    existing = (
        db.query(models.Medico)
        .filter(
            (models.Medico.username == medico_in.username)
            | (models.Medico.email == medico_in.email)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Nombre de usuario o email ya registrado",
        )

    medico = models.Medico(
        nombre=medico_in.nombre,
        username=medico_in.username,
        email=medico_in.email,
        password_hash=get_password_hash(medico_in.password),
    )
    db.add(medico)
    db.commit()
    db.refresh(medico)
    return medico


@router.post("/login", response_model=schemas.Token)
def login_medico(
    login_data: schemas.MedicoLogin,
    db: Session = Depends(get_db),
):
    medico = (
        db.query(models.Medico)
        .filter(models.Medico.username == login_data.username)
        .first()
    )
    if not medico:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not verify_password(login_data.password, medico.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    access_token = create_access_token({"sub": medico.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.MedicoOut)
def read_me(current_medico: models.Medico = Security(get_current_medico)):
    return current_medico
