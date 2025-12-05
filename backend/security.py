# security.py
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from config import SECRET_KEY, ALGORITHM

# Contexto de hash de contraseñas (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si la contraseña en texto plano coincide con el hash almacenado.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Genera el hash de una contraseña para guardarla en la base de datos.
    """
    return pwd_context.hash(password)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Crea un JWT firmado con SECRET_KEY y ALGORITHM.
    El campo `sub` de `data` suele ser el username o id del usuario.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Tiempo por defecto: 60 minutos
        expire = datetime.utcnow() + timedelta(minutes=60)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
