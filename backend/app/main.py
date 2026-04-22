from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.threats import router as threat_router
from app.api import ip_history

app.include_router(ip_history.router)
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

@app.get("/health")
def health():
    return {"status": "ok"}
