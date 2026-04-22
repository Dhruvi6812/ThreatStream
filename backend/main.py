from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.threats import router as threat_router
from app.api import ip_routes

app = FastAPI(title="ThreatStream API")
app.include_router(ip_routes.router)
# Allow Next.js frontend to call backend
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

# Register the real threats router
app.include_router(threat_router)

@app.get("/")
def root():
    return {"status": "ThreatStream backend running"}

@app.get("/health")
def health():
    return {"status": "ok"}