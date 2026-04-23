from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.threats import router as threat_router
from backend.app.api.ip_routes import router as ip_router

app = FastAPI(title="ThreatStream API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(threat_router)
app.include_router(ip_router)

@app.get("/")
def root():
    return {"status": "ThreatStream backend running"}

@app.get("/health")
def health():
    return {"status": "ok"}