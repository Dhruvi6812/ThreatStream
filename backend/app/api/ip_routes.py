from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# TEMP IN-MEMORY STORAGE
fake_db = []

class IPRequest(BaseModel):
    ip: str
    domain: str | None = None
    userId: str


# SAVE SEARCH
@router.post("/ip/save")
def save_ip(data: IPRequest):
    fake_db.append({
        "ip": data.ip,
        "domain": data.domain,
        "userId": data.userId
    })
    return {"status": "saved"}


# GET HISTORY
@router.get("/ip/history")
def get_history(userId: str):
    user_history = [x for x in fake_db if x["userId"] == userId]
    return user_history[::-1]  # latest first