# backend/routers/auth.py

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Security,Response,Cookie, status,Request
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from config import TOKEN_KEY,ALGORITHM,ACCESS_TOKEN_EXPIRE_MINUTES,SECRET_KEY
import models
import schemas
from models import Medico,get_db
from security import verify_password, create_access_token  

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================
#   ESQUEMA LOGIN
# =========================

class LoginRequest(BaseModel):
    username: str
    password: str

# =========================
#   AUTENTICACIÓN BÁSICA
# =========================

def authenticate_medico(db: Session, username: str, password: str) -> Optional[Medico]:
    """Usa tu lógica actual para validar usuario y contraseña."""
    medico = db.query(Medico).filter(Medico.username == username).first()
    if not medico:
        return None
    if not verify_password(password, medico.password_hash):
        return None
    return medico


# =========================
#   LOGIN (COOKIE HTTPONLY)
# =========================

@router.post("/login")
def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Login:
    - Verifica credenciales
    - Crea JWT
    - Guarda el JWT en una cookie HttpOnly
    - (Opcional) devuelve también info en el body
    """
    medico = authenticate_medico(db, login_data.username, login_data.password)
    if not medico:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": medico.username},
        expires_delta=access_token_expires,
    )

    # 👇 Guardamos el token en una cookie HttpOnly
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,     # JS no puede leer esta cookie
        secure=False,      # En producción con HTTPS → True
        samesite="lax",    # Protege un poco contra CSRF básico
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {
        "detail": "login ok",
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


# =========================
#   DEPENDENCIA: MÉDICO ACTUAL
# =========================

def get_current_medico(
    access_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
) -> Medico:
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado (falta token).",
        )

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido (sin sujeto).",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
        )

    medico = db.query(Medico).filter(Medico.username == username).first()
    if medico is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
        )

    return medico

# =========================
#   QUIÉN SOY (PARA EL FRONT)
# =========================
@router.get("/me")
def read_me(current_medico: Medico = Depends(get_current_medico)):
    """Para que el front pueda comprobar si hay sesión."""
    return {
        "id": current_medico.medico_id,
        "username": current_medico.username,
        "email": current_medico.email,
    }


# =========================
#   LOGOUT
# =========================

@router.post("/logout")
def logout(response: Response):
    """
    Cierra sesión eliminando la cookie 'access_token'.
    """
    response.delete_cookie("access_token", path="/")
    return {"detail": "logout ok"}