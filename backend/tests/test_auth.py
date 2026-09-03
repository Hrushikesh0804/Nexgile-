import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.seed import seed_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_db(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)

def test_login_superadmin_success():
    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "admin@nexgile.com", "password": "AdminPass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "admin@nexgile.com"
    assert data["data"]["user"]["is_superadmin"] is True

def test_login_invalid_password():
    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "admin@nexgile.com", "password": "WrongPassword"}
    )
    assert response.status_code == 401
