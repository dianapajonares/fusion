# backend/init_db.py

from models import Base, engine 

def init_db():
    print("Intentando crear todas las tablas en PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print(" Base de datos y tablas inicializadas con éxito.")

if __name__ == "__main__":
    init_db()