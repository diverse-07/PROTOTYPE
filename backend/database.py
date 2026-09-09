import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
# Resolve DB path in parent root or current backend dir
db_path = os.path.join(PARENT_DIR, "aegis_lews.db")
if not os.path.exists(db_path) and os.path.exists(os.path.join(BASE_DIR, "aegis_lews.db")):
    db_path = os.path.join(BASE_DIR, "aegis_lews.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()