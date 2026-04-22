from fastapi import APIRouter, Query
from app.services.abuseipdb import fetch_blacklist, check_ip
import socket
import re

router = APIRouter()
 
# HELPERS
def is_valid_ip(value: str):
    ip_regex = r"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\." \
               r"(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\." \
               r"(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\." \
               r"(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
    return re.match(ip_regex, value)


def resolve_domain(domain: str):
    try:
        print(f"🌐 Resolving domain: {domain}")

        # Get ALL IPs
        host_info = socket.gethostbyname_ex(domain)
        ips = host_info[2]

        print(f"✅ Resolved IPs: {ips}")

        return ips[0] if ips else None  # use first for now

    except Exception as e:
        print("❌ Domain resolution failed:", str(e))
        return None

# THREATS LIST
@router.get("/threats")
def get_threats(
    min_score: int = Query(0, ge=0, le=100),
    country: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    print("🚀 THREATS ROUTE RUNNING")

    raw_data, is_rate_limited = fetch_blacklist()

    if not raw_data:
        is_rate_limited = True

    filtered = [
        {
            "ip": t.get("ipAddress"),
            "abuse_score": t.get("abuseConfidenceScore"),
            "country": t.get("countryCode"),
            "isp": t.get("isp"),
        }
        for t in raw_data
        if t.get("abuseConfidenceScore", 0) >= min_score
        and (not country or t.get("countryCode") == country)
    ]

    total = len(filtered)
    paginated = filtered[offset : offset + limit]

    return {
        "total": total,
        "count": len(paginated),
        "results": paginated,
        "meta": {
            "rate_limited": is_rate_limited
        }
    }

#  SMART IP / DOMAIN CHECK
@router.get("/check-ip")
def check_single_ip(ip: str):
    print(f"🔍 Input received: {ip}")

    original_input = ip

    # STEP 1: If NOT IP → resolve domain
    if not is_valid_ip(ip):
        resolved_ip = resolve_domain(ip)

        if not resolved_ip:
            return {
                "status": "error",
                "message": "Invalid domain or unable to resolve"
            }

        ip = resolved_ip

    # STEP 2: Call AbuseIPDB
    result = check_ip(ip)

    if result.get("error") == "rate_limited":
        return {
            "status": "rate_limited",
            "message": "API limit reached. Try later."
        }

    if result.get("error"):
        return {
            "status": "error",
            "message": "Failed to fetch IP data"
        }

    # STEP 3: Return enriched result
    return {
        "status": "success",
        "data": {
            **result,
            "input": original_input,   # this is what user typed
            "resolved_ip": ip         # actual scanned IP
        }
    }