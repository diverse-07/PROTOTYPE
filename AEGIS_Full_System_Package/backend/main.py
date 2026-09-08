import os, sys

# Ensure both project root and backend folder are in sys.path
CUR_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CUR_DIR)
for path in (CUR_DIR, PARENT_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.routers import weather, alerts, risk, analytics, reports
    from backend.database import Base, engine
    import backend.seed as seed_module
except ImportError:
    from routers import weather, alerts, risk, analytics, reports
    from database import Base, engine
    import seed as seed_module

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NER-LEWS API - Team AEGIS",
    description="NER Landslide Early Warning System | MDoNER & NDMA Initiative",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.on_event("startup")
async def startup():
    seed_module.run_seed()

@app.get("/")
def root():
    return {
        "system": "NER-LEWS",
        "team": "Team AEGIS",
        "status": "operational",
        "version": "2.0.0",
        "endpoints": [
            "/api/weather",
            "/api/zones",
            "/api/risk",
            "/api/alerts",
            "/api/reports",
            "/api/analytics/performance",
            "/docs"
        ]
    }