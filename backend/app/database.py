from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# PostgreSQL / SQL SQLAlchemy Setup
try:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    # Test connection initialization
    engine.connect().close()
except Exception:
    # Fallback to SQLite for local development/testing without PostgreSQL drivers
    engine = create_engine("sqlite:///./app.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# PyMongo Setup for schema-flexible documents
try:
    from pymongo import MongoClient
    mongo_client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
    mongo_db = mongo_client[settings.MONGO_DB]
except Exception:
    mongo_client = None
    mongo_db = None

def get_mongo_db():
    return mongo_db

