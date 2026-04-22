import time
import requests
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

API_KEY = os.getenv("ABUSEIPDB_API_KEY")

if not API_KEY:
    raise RuntimeError("❌ ABUSEIPDB_API_KEY is missing")

# AbuseIPDB endpoint
URL = "https://api.abuseipdb.com/api/v2/blacklist"

CACHE_TTL = 1800  # 30 minutes

_cache = {
    "timestamp": 0,
    "data": None
}

# Fallback data (used when rate limited)
FALLBACK_DATA = [
    {
        "ipAddress": "8.8.8.8",
        "abuseConfidenceScore": 80,
        "countryCode": "US",
        "isp": "Google"
    },
    {
        "ipAddress": "1.1.1.1",
        "abuseConfidenceScore": 75,
        "countryCode": "AU",
        "isp": "Cloudflare"
    },
    {
        "ipAddress": "45.33.32.156",
        "abuseConfidenceScore": 90,
        "countryCode": "RU",
        "isp": "Linode"
    }
]


def fetch_blacklist():
    now = time.time()
    is_rate_limited = False

    # 1. Use cache if valid
    if _cache["data"] and now - _cache["timestamp"] < CACHE_TTL:
        print("⚡ Using cached data")
        return _cache["data"], False

    headers = {
        "Key": API_KEY,
        "Accept": "application/json"
    }

    params = {
        "confidenceMinimum": 50,
        "limit": 50
    }

    try:
        print("🚀 Calling AbuseIPDB API...")

        response = requests.get(
            URL,
            headers=headers,
            params=params,
            timeout=10
        )

        print("📡 Status Code:", response.status_code)

        # RATE LIMIT CASE
        if response.status_code == 429:
            print("⚠️ Rate limited! Using fallback data...")
            is_rate_limited = True

            return (_cache["data"] or FALLBACK_DATA), True

        # SUCCESS
        response.raise_for_status()

        data = response.json().get("data", [])

        print("✅ Fetched threats:", len(data))

        _cache["data"] = data
        _cache["timestamp"] = now

        return data, False

    except Exception as e:
        print("❌ AbuseIPDB error:", str(e))

        return (_cache["data"] or FALLBACK_DATA), True
    
def check_ip(ip: str):
    headers = {
        "Key": API_KEY,
        "Accept": "application/json"
    }

    params = {
        "ipAddress": ip,
        "maxAgeInDays": 90
    }

    try:
        print(f"🔍 Checking IP: {ip}")

        response = requests.get(
            "https://api.abuseipdb.com/api/v2/check",
            headers=headers,
            params=params,
            timeout=10
        )

        print("📡 Status Code:", response.status_code)

        if response.status_code == 429:
            return {
                "error": "rate_limited"
            }

        response.raise_for_status()

        data = response.json()["data"]

        return {
            "ip": data.get("ipAddress"),
            "abuse_score": data.get("abuseConfidenceScore"),
            "country": data.get("countryCode"),
            "isp": data.get("isp"),
            "usageType": data.get("usageType"),
            "domain": data.get("domain"),
            "totalReports": data.get("totalReports"),
        }

    except Exception as e:
        print("❌ Check IP error:", str(e))
        return {"error": "failed"}