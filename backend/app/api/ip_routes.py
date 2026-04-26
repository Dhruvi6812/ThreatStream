from fastapi import APIRouter
from pydantic import BaseModel
import requests
import socket

router = APIRouter()

# TEMP IN-MEMORY STORAGE
fake_db = []

class IPRequest(BaseModel):
    ip: str
    domain: str | None = None
    userId: str


# 🔧 Helper: clean input (remove https:// etc.)
def clean_input(value: str):
    return value.replace("https://", "").replace("http://", "").split("/")[0]


# 🔧 Helper: resolve domain → IP
def resolve_ip(domain: str):
    try:
        return socket.gethostbyname(domain)
    except:
        return None


# 🔹 MAIN IP CHECK
@router.get("/check-ip")
def check_ip(ip: str):
    cleaned = clean_input(ip)

    # resolve domain → IP if needed
    resolved_ip = resolve_ip(cleaned) or cleaned

    url = "https://api.abuseipdb.com/api/v2/check"
    headers = {
        "Key": "9ea5369168a27fb3053ea0dc29124c5b7b45753a20806c0d9d6e6d74c4ed841cf242cd90a487e034",  
        "Accept": "application/json"
    }

    params = {
        "ipAddress": resolved_ip,
        "maxAgeInDays": 90
    }

    try:
        res = requests.get(url, headers=headers, params=params)
        data = res.json()

        # 🚨 Handle rate limit / API error
        if "errors" in data:
            return {
                "status": "error",
                "message": "AbuseIPDB rate limit reached or API error",
                "data": {
                    "input": cleaned,
                    "resolved_ip": resolved_ip,
                    "ip": resolved_ip,
                    "abuse_score": 0,
                    "country": "Unknown",
                    "isp": "Unknown",
                    "domain": cleaned,
                    "reports": 0
                }
            }

        result = data["data"]

        return {
            "status": "success",
            "data": {
                "input": cleaned,
                "resolved_ip": resolved_ip,
                "ip": result["ipAddress"],
                "abuse_score": result["abuseConfidenceScore"],
                "country": result["countryCode"],
                "isp": result["isp"],
                "domain": cleaned,
                "reports": result["totalReports"]
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": None
        }


# 🔹 SAVE SEARCH
@router.post("/ip/save")
def save_ip(data: IPRequest):
    fake_db.append({
        "ip": data.ip,
        "domain": data.domain,
        "userId": data.userId
    })
    return {"status": "saved"}


# 🔹 GET HISTORY
@router.get("/ip/history")
def get_history(userId: str):
    user_history = [x for x in fake_db if x["userId"] == userId]
    return user_history[::-1]  # latest first