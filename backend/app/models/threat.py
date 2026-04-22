from pydantic import BaseModel
from typing import Optional

class Threat(BaseModel):
    ip_address: str
    abuse_score: int
    country: Optional[str]
    isp: Optional[str]
    domain: Optional[str]
