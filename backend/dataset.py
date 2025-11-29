from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "postgresql://user_test:123@localhost:5432/db_test"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
