from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.modules.admin.routes import router as admin_router
from app.modules.carbon.routes import router as carbon_router
from app.modules.products.routes import router as products_router
from app.modules.suppliers.routes import router as suppliers_router
from app.modules.ai_analytics.routes import router as ai_analytics_router
from app.seed import seed_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Ensure database schema is created and default seed data exists
    Base.metadata.create_all(bind=engine)
    seed_db()

@app.get("/health")
def health_check():
    return {"status": "healthy", "project": settings.PROJECT_NAME}

# Include Business Modules
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(carbon_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(suppliers_router, prefix=settings.API_V1_STR)
app.include_router(ai_analytics_router, prefix=settings.API_V1_STR)





if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
