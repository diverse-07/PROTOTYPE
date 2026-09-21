import os
import sys
from build_docs import render_cover_page, compile_pdf, DOCS_DIR
from generate_engineering_docs_pdf import COMMON_CSS

cover_html = render_cover_page(
    doc_type="API SPECIFICATION &amp; INTERFACE CONTROL DOCUMENT (ICD)",
    title="AEGIS-LEWS v2.0: Comprehensive API &amp; Protocol Specification",
    subtitle="RESTful Web Services, Real-Time WebSockets, and Bluetooth LE GATT Radio Mesh Specifications",
    doc_id="API-ICD-NER-LEWS-2026",
    version="2.0.4-RELEASE",
    classification="RESTRICTED OFFICIAL / HACKATHON JURY EVALUATION",
    author="AEGIS Platform API Architecture Group",
    reviewer="National Disaster Communications Standards Committee",
    date_str="September 2026"
)

API_BODY = """
<h1>1. API Architecture &amp; Global Conventions</h1>
<p>
The AEGIS-LEWS API suite provides high-throughput, low-latency interoperability between Earth observation telemetry pipelines, emergency operation center command consoles, and sovereign mobile field nodes.
</p>

<h3>1.1 Base Environment URLs</h3>
<ul>
    <li><strong>Production Cloud (Render Live):</strong> <code>https://aegis-lews.onrender.com/api</code></li>
    <li><strong>Production WebSocket Bus:</strong> <code>wss://aegis-lews.onrender.com/ws/mesh-bus</code></li>
    <li><strong>Local Edge Development:</strong> <code>http://127.0.0.1:8000/api</code></li>
    <li><strong>Public Resilient Mesh Fallback:</strong> <code>https://ntfy.sh/ner_landslide_alert</code></li>
</ul>

<h3>1.2 Standard HTTP Response Envelope</h3>
<p>All successful REST API responses return standard JSON payloads with ISO-8601 timestamps:</p>
<pre>
{
  "status": "success",
  "timestamp": 1790012469.341,
  "execution_time_ms": 14.2,
  "data": { ... }
}
</pre>

<h3>1.3 Standard HTTP Status Codes</h3>
<table class="data-table">
    <thead>
        <tr>
            <th style="width: 15%;">HTTP Status</th>
            <th style="width: 25%;">Meaning</th>
            <th style="width: 60%;">Condition Triggered</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>200 OK</code></td>
            <td>Success</td>
            <td>Telemetry retrieved, FoS model executed, or node queried successfully.</td>
        </tr>
        <tr>
            <td><code>201 Created</code></td>
            <td>Dispatched / Registered</td>
            <td>BLE broadcast initiated or edge gateway registered into active mesh pool.</td>
        </tr>
        <tr>
            <td><code>400 Bad Request</code></td>
            <td>Validation Error</td>
            <td>Coordinates outside monitored bounds or invalid geotechnical parameters.</td>
        </tr>
        <tr>
            <td><code>401 Unauthorized</code></td>
            <td>Authentication Failure</td>
            <td>Missing or invalid EOC Officer credentials (expected: <code>prototype</code>).</td>
        </tr>
        <tr>
            <td><code>503 Unavailable</code></td>
            <td>Service Degraded</td>
            <td>Cloud database down; client automatically transitions to resilient ntfy.sh fallback.</td>
        </tr>
    </tbody>
</table>

<h1>2. Core RESTful Endpoints</h1>

<h3>2.1 Weather &amp; Orographic Precipitation Telemetry</h3>
<p><strong><code>GET /weather</code></strong> &mdash; Ingests live precipitation, atmospheric pressure, and soil saturation indices.</p>
<table class="data-table">
    <thead>
        <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>lat</code></td>
            <td>Float</td>
            <td>Yes</td>
            <td>Latitude in decimal degrees (e.g., <code>25.4484</code> for Jaintia Hills).</td>
        </tr>
        <tr>
            <td><code>lng</code></td>
            <td>Float</td>
            <td>Yes</td>
            <td>Longitude in decimal degrees (e.g., <code>92.2152</code>).</td>
        </tr>
    </tbody>
</table>
<p><strong>Sample Response (200 OK):</strong></p>
<pre>
{
  "latitude": 25.4484,
  "longitude": 92.2152,
  "elevation_m": 1280.0,
  "current": {
    "precipitation_mm": 5.2,
    "rainfall_24h_mm": 64.8,
    "soil_moisture_index": 0.88,
    "temperature_c": 19.4,
    "wind_speed_kmh": 14.5
  },
  "status": "Within Safe Limits",
  "source": "Open-Meteo Orographic Ingestion Engine"
}
</pre>

<h3>2.2 Geotechnical Slope Stability Evaluation</h3>
<p><strong><code>GET /risk/evaluate</code></strong> &mdash; Computes dynamic Factor of Safety (FoS) and slope failure probability.</p>
<p><strong>Sample Request Query:</strong> <code>/risk/evaluate?slope=52&wetness=92&insar=42.1&cohesion=22</code></p>
<p><strong>Sample Response (200 OK):</strong></p>
<pre>
{
  "factor_of_safety": 0.67,
  "failure_probability_pct": 99.4,
  "status": "CRITICAL BREACH",
  "color": "#DC2626",
  "failure_type": "Active Translational Shear",
  "estimated_impact_hours": 1.2,
  "shear_velocity_mm_day": 42.1,
  "geomechanical_metrics": {
    "driving_stress_kpa": 148.6,
    "resisting_strength_kpa": 99.5,
    "pore_pressure_ratio_ru": 0.44
  },
  "evacuation_directive": "EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to safe ground."
}
</pre>

<h3>2.3 Emergency BLE Broadcast Dispatch</h3>
<p><strong><code>POST /alerts/ble-broadcast</code></strong> &mdash; Triggers immediate EOC hardware beacon broadcast sequence.</p>
<p><strong>Sample Request Payload (JSON):</strong></p>
<pre>
{
  "zone_name": "West Kameng &amp; Tawang MCT Corridor",
  "severity": "CRITICAL",
  "risk_score": 99,
  "preset_code": 1,
  "message": "CRITICAL BREACH: Tawang Axis FoS=0.67. Active shear failure. Evacuate immediately.",
  "target_gateway": "all",
  "latitude": 27.5860,
  "longitude": 91.8650
}
</pre>
<p><strong>Sample Response (201 Created):</strong></p>
<pre>
{
  "status": "dispatched",
  "dispatch_id": "BLE-RELAY-E4F92A",
  "zone": "West Kameng &amp; Tawang MCT Corridor",
  "severity": "CRITICAL",
  "risk_score": 99,
  "preset_code": 1,
  "primary_gateways_notified": 4,
  "websockets_active": 1,
  "detail": "Signal dispatched to Primary Gateway phone. BLE radio advertisement initiated for offline peers."
}
</pre>

<h1>3. Real-Time WebSockets Protocol</h1>
<p>
The platform maintains a bi-directional WebSocket telemetry stream for instant synchronization between the cloud inference pipeline and connected authority dashboards:
</p>
<ul>
    <li><strong>Connection Endpoint:</strong> <code>wss://aegis-lews.onrender.com/ws/mesh-bus</code></li>
    <li><strong>Heartbeat Interval:</strong> 15 seconds (<code>{ "type": "PING" }</code> &rarr; <code>{ "type": "PONG" }</code>)</li>
</ul>
<p><strong>Inbound Disaster Alert Broadcast Frame:</strong></p>
<pre>
{
  "event": "DISASTER_BREACH_TRIGGER",
  "dispatch_id": "BLE-RELAY-98B10C",
  "zone": "Jaintia Hills Sector 8 (NH-44)",
  "severity": "CRITICAL",
  "fos": 0.62,
  "preset_code": 1,
  "message": "EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to safe ground.",
  "coords": [25.4484, 92.2152],
  "dispatched_at": "2026-09-21 23:46:14 IST"
}
</pre>

<h1>4. Bluetooth LE (BLE) GATT Radio Interface Control</h1>
<p>
The sovereign hardware radio interface exposes standard Bluetooth SIG compliant service structures:
</p>
<table class="data-table">
    <thead>
        <tr>
            <th>GATT Entity</th>
            <th>UUID</th>
            <th>Permissions</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Sovereign Service</strong></td>
            <td><code>0000AE61-0000-1000-8000-00805F9B34FB</code></td>
            <td>N/A</td>
            <td>Primary AEGIS Emergency Signaling Service (Advertised in BLE Channels 37, 38, 39).</td>
        </tr>
        <tr>
            <td><strong>Full Directive Char</strong></td>
            <td><code>0000AE62-0000-1000-8000-00805F9B34FB</code></td>
            <td>READ (Unauthenticated)</td>
            <td>Returns complete UTF-8 evacuation text to connecting rescue devices and civil defence radios.</td>
        </tr>
    </tbody>
</table>

<h3>4.1 Standard Preset Emergency Directive Codes</h3>
<table class="data-table">
    <thead>
        <tr>
            <th style="width: 15%;">Preset Code</th>
            <th style="width: 30%;">Title</th>
            <th style="width: 55%;">Standard Canonical Directive Text</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>0x01</code></td>
            <td>EVACUATE IMMEDIATELY</td>
            <td>EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to safe ground.</td>
        </tr>
        <tr>
            <td><code>0x02</code></td>
            <td>DEBRIS FLOW IMMINENT</td>
            <td>DEBRIS FLOW IMMINENT: Heavy rainfall detected. Stay clear of natural drainage channels.</td>
        </tr>
        <tr>
            <td><code>0x03</code></td>
            <td>ROAD BLOCKED</td>
            <td>ROAD BLOCKED: Rockfall at highway corridor. Traffic suspended.</td>
        </tr>
        <tr>
            <td><code>0x04</code></td>
            <td>SHELTER IN PLACE</td>
            <td>SHELTER IN PLACE: Seek designated bedrock refuge center.</td>
        </tr>
        <tr>
            <td><code>0x05</code></td>
            <td>FLASH FLOOD WARNING</td>
            <td>FLASH FLOOD WARNING: Rapid runoff rising in valley floor.</td>
        </tr>
        <tr>
            <td><code>0x06</code></td>
            <td>BRIDGE WASHED OUT</td>
            <td>BRIDGE WASHED OUT: Do not attempt crossing.</td>
        </tr>
    </tbody>
</table>
"""

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AEGIS-LEWS v2.0 - API Specification &amp; Interface Control Document (ICD)</title>
<style>
{COMMON_CSS}
</style>
</head>
<body>
{cover_html}
{API_BODY}
</body>
</html>
"""

if __name__ == "__main__":
    compile_pdf(full_html, "04_API_DOCUMENTATION_AEGIS_LEWS.pdf")
