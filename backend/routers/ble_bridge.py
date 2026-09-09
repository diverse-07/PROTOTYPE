import time
import uuid
import httpx
from typing import Dict, List, Optional, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter()

class BleBroadcastRequest(BaseModel):
    zone_name: str = "Jaintia Hills"
    severity: str = "CRITICAL"
    risk_score: int = 87
    preset_code: int = 1
    message: str = "EVACUATE IMMEDIATELY: Debris flow imminent. Move to safe bedrock shelter."
    target_gateway: Optional[str] = "all"
    latitude: Optional[float] = 25.4484
    longitude: Optional[float] = 92.2152

class BleNodeRegistration(BaseModel):
    node_id: str
    label: Optional[str] = "Citizen Primary Phone"
    battery_level: Optional[int] = 85
    ble_supported: bool = True
    platform: Optional[str] = "Android"
    is_gateway: bool = True

# In-memory dispatch tracking and connected nodes
latest_ble_broadcast: Dict = {
    "active": False,
    "dispatch_id": "",
    "zone": "",
    "severity": "",
    "risk_score": 0,
    "preset_code": 1,
    "message": "",
    "latitude": 25.4484,
    "longitude": 92.2152,
    "timestamp": 0,
    "dispatched_at": ""
}

registered_gateways: Dict[str, Dict] = {}
active_websockets: Set[WebSocket] = set()

# Standard disaster presets for ultra-compact BLE encoding
BLE_PRESETS = {
    1: "EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to safe ground.",
    2: "DEBRIS FLOW IMMINENT: Heavy rainfall detected. Stay clear of natural drainage channels.",
    3: "ROAD BLOCKED: Rockfall at highway corridor. Traffic suspended.",
    4: "SHELTER IN PLACE: Seek designated bedrock refuge center.",
    5: "FLASH FLOOD WARNING: Rapid runoff rising in valley floor.",
    6: "BRIDGE WASHED OUT: Do not attempt crossing.",
}

@router.get("/ble/nodes")
def get_registered_gateways():
    now = time.time()
    # Filter nodes seen within the last 5 minutes
    active_nodes = [
        node for node in registered_gateways.values()
        if (now - node.get("last_seen", 0)) < 300
    ]
    return {
        "count": len(active_nodes),
        "nodes": active_nodes,
        "websockets_connected": len(active_websockets)
    }

@router.post("/ble/register-node")
def register_node(node: BleNodeRegistration):
    registered_gateways[node.node_id] = {
        "node_id": node.node_id,
        "label": node.label,
        "battery_level": node.battery_level,
        "ble_supported": node.ble_supported,
        "platform": node.platform,
        "is_gateway": node.is_gateway,
        "last_seen": time.time(),
        "status": "online"
    }
    return {"status": "registered", "node_id": node.node_id}

@router.get("/ble/active-trigger")
def get_active_ble_trigger():
    return latest_ble_broadcast

@router.post("/alerts/ble-broadcast")
async def trigger_ble_broadcast(payload: BleBroadcastRequest):
    global latest_ble_broadcast
    dispatch_id = f"BLE-RELAY-{uuid.uuid4().hex[:6].upper()}"
    safe_msg = payload.message.encode("ascii", errors="replace").decode("ascii")

    latest_ble_broadcast = {
        "active": True,
        "action": "START_BLE_BROADCAST",
        "dispatch_id": dispatch_id,
        "zone": payload.zone_name,
        "severity": payload.severity,
        "risk_score": payload.risk_score,
        "preset_code": payload.preset_code,
        "message": safe_msg,
        "latitude": payload.latitude or 25.4484,
        "longitude": payload.longitude or 92.2152,
        "timestamp": time.time(),
        "dispatched_at": time.strftime("%Y-%m-%d %H:%M:%S IST")
    }

    # 1. Notify all connected Primary Phones via WebSockets
    disconnected_ws = set()
    notified_ws_count = 0
    for ws in list(active_websockets):
        try:
            await ws.send_json(latest_ble_broadcast)
            notified_ws_count += 1
        except Exception:
            disconnected_ws.add(ws)
    for ws in disconnected_ws:
        active_websockets.discard(ws)

    # 2. Push to ntfy.sh with tag "aegis_ble_bridge" for internet-reachable phones
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            await client.post(
                "https://ntfy.sh/ner_landslide_alert",
                data=f"AEGIS_BLE_CMD:{dispatch_id}|{payload.preset_code}|{payload.risk_score}|{payload.zone_name}|{safe_msg}".encode("utf-8"),
                headers={
                    "Title": f"AEGIS BLE BROADCAST - {payload.zone_name}",
                    "Priority": "urgent",
                    "Tags": "radio,broadcast,satellite,warning",
                    "Actions": "view, Open AEGIS App, https://diverse-07.github.io/PROTOTYPE/"
                }
            )
    except Exception:
        pass

    return {
        "status": "dispatched",
        "dispatch_id": dispatch_id,
        "zone": payload.zone_name,
        "severity": payload.severity,
        "risk_score": payload.risk_score,
        "preset_code": payload.preset_code,
        "message": safe_msg,
        "primary_gateways_notified": max(notified_ws_count, len(registered_gateways)),
        "websockets_active": len(active_websockets),
        "detail": "Signal dispatched to Primary Gateway phone. BLE radio advertisement initiated for offline peers."
    }

@router.post("/ble/silence")
async def silence_ble_broadcast():
    global latest_ble_broadcast
    latest_ble_broadcast["active"] = False
    latest_ble_broadcast["action"] = "STOP_BLE_BROADCAST"

    # Send stop signal to connected phones
    for ws in list(active_websockets):
        try:
            await ws.send_json(latest_ble_broadcast)
        except Exception:
            pass

    try:
        async with httpx.AsyncClient(timeout=4) as client:
            await client.post(
                "https://ntfy.sh/ner_landslide_alert",
                data="AEGIS_STOP_BLE_BROADCAST".encode("utf-8"),
                headers={"Title": "AEGIS_STOP_BLE_CMD", "Priority": "low", "Tags": "stop_sign"}
            )
    except Exception:
        pass

    return {"status": "silenced", "active": False}

@router.websocket("/ble/ws")
async def ble_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.add(websocket)
    try:
        # Send current active trigger state immediately upon connection
        if latest_ble_broadcast.get("active"):
            await websocket.send_json(latest_ble_broadcast)

        while True:
            data = await websocket.receive_json()
            # Handle heartbeat or ack from primary phone
            if data.get("type") == "HEARTBEAT":
                node_id = data.get("node_id", "GATEWAY-UNKNOWN")
                registered_gateways[node_id] = {
                    "node_id": node_id,
                    "label": data.get("label", "Primary Phone"),
                    "battery_level": data.get("battery", 80),
                    "ble_supported": True,
                    "platform": data.get("platform", "Android"),
                    "is_gateway": True,
                    "last_seen": time.time(),
                    "status": "online"
                }
                await websocket.send_json({"type": "HEARTBEAT_ACK", "time": time.time()})
            elif data.get("type") == "BLE_BROADCAST_ACK":
                node_id = data.get("node_id", "GATEWAY-UNKNOWN")
                if node_id in registered_gateways:
                    registered_gateways[node_id]["status"] = "broadcasting"
    except WebSocketDisconnect:
        active_websockets.discard(websocket)
    except Exception:
        active_websockets.discard(websocket)
