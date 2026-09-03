import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# PostgreSQL / SQL SQLAlchemy Setup
try:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
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

# Mock MongoDB fallback for testing and local environments without Mongo daemon
class MockMongoCollection:
    def __init__(self):
        self.store = {}

    def insert_one(self, doc):
        doc_id = uuid.uuid4().hex[:24]
        doc_copy = dict(doc)
        doc_copy["_id"] = doc_id
        self.store[doc_id] = doc_copy
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_id)

    def find_one(self, query):
        for doc in self.store.values():
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    def update_one(self, query, update):
        doc = self.find_one(query)
        if doc and "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
        return doc

class MockMongoDB:
    def __init__(self):
        self._collections = {}

    def __getattr__(self, name):
        if name not in self._collections:
            self._collections[name] = MockMongoCollection()
        return self._collections[name]

    def __getitem__(self, name):
        return getattr(self, name)

# PyMongo Setup with Mock Fallback
try:
    from pymongo import MongoClient
    mongo_client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=1000)
    mongo_client.admin.command('ping')
    mongo_db = mongo_client[settings.MONGO_DB]
except Exception:
    mongo_client = None
    mongo_db = MockMongoDB()

def get_mongo_db():
    return mongo_db
