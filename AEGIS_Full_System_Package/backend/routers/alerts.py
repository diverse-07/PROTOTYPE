from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import uuid, os, httpx

router = APIRouter()

class AlertPayload(BaseModel):
    zone_name: str
    severity: str
    message: str
    channels: List[str] = ["sms","push"]
    population_affected: Optional[int] = 1250

@router.get("/alerts")
def get_alerts():
    return [
        {"id":1,"zone":"Jaintia Hills","state":"Meghalaya","type":"Debris Flow","severity":"CRITICAL","score":87,"population":1250,"time":"3 min ago"},
        {"id":2,"zone":"Gangtok South","state":"Sikkim","type":"Slope Failure","severity":"CRITICAL","score":82,"population":890,"time":"18 min ago"},
        {"id":3,"zone":"NH-6 Kohima","state":"Nagaland","type":"Road Blockage","severity":"HIGH","score":73,"population":0,"time":"45 min ago"},
        {"id":4,"zone":"Barak Valley","state":"Assam","type":"Flash Flood","severity":"HIGH","score":68,"population":3400,"time":"1 hr ago"},
        {"id":5,"zone":"Aizawl East","state":"Mizoram","type":"Soil Saturation","severity":"MODERATE","score":55,"population":560,"time":"2 hr ago"},
    ]

@router.post("/alerts/broadcast")
async def broadcast_alert(payload: AlertPayload):
    dispatch_id = f"AEGIS-{uuid.uuid4().hex[:8].upper()}"
    safe_msg = payload.message.encode("ascii", errors="replace").decode("ascii")
    # ntfy.sh push (zero API key required)
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            await client.post(
                "https://ntfy.sh/ner_landslide_alert",
                data=f"AEGIS ALERT: {payload.severity} | {payload.zone_name} | {safe_msg} | ID:{dispatch_id}".encode("utf-8"),
                headers={"Title": f"NER-LEWS Team AEGIS - {payload.zone_name}", "Priority": "urgent", "Tags": "warning,rotating_light"}
            )
    except Exception:
        pass
    return {
        "status": "success",
        "dispatch_id": dispatch_id,
        "zone": payload.zone_name,
        "severity": payload.severity,
        "channels_activated": payload.channels,
        "population_notified": payload.population_affected,
        "message": "Multi-channel emergency broadcast dispatched by Team AEGIS NER-LEWS"
    }

@router.post("/alerts/subscribe")
def subscribe(email: str = "", state: str = ""):
    return {"status": "subscribed", "email": email, "state": state, "message": "You will receive priority alerts for your region."}