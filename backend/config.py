import os
from dotenv import load_dotenv
from pathlib import Path
# Cargar variables del .env (asume que está un nivel arriba)
load_dotenv(dotenv_path='../.env')

# Configuración de la Base de Datos
DB_HOST = os.environ.get("DB_HOST", "localhost")  
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_USER = os.environ.get("POSTGRES_USER")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
DB_NAME = os.environ.get("POSTGRES_DB")

# Cadena de conexión de SQLAlchemy
SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

TOKEN_KEY=os.getenv("TOKEN_KEY","pwd")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES","60"))
ALGORITHM ="HS256"