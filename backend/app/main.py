from fastapi import FastAPI

from app.api.threats import router as threat_router
from app.api.ip_routes import router as ip_router

app = FastAPI(title="ThreatStream API")

@app.middleware("http")
async def cors_fix(request, call_next):
    print("MIDDLEWARE RUNNING")   # ADD THIS
    response = await call_next(request)

    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"

    return response

app.include_router(threat_router)
app.include_router(ip_router)

@app.get("/")
def root():
    return {"status": "ThreatStream backend running"}

@app.get("/health")
def health():
    return {"status": "ok"}