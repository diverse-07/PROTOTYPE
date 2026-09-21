import os
import sys
from build_docs import render_cover_page, compile_pdf, DOCS_DIR
from generate_engineering_docs_pdf import COMMON_CSS

cover_html = render_cover_page(
    doc_type="SOFTWARE &amp; TECHNICAL DESIGN DOCUMENT (SDD / TDD)",
    title="AEGIS-LEWS v2.0: System Architecture &amp; Engineering Blueprint",
    subtitle="Mathematical Geotechnical Models, 2.4 GHz BLE Mesh Protocols, and Sovereign Edge Cyberinfrastructure",
    doc_id="SDD-TDD-NER-LEWS-2026",
    version="2.0.4-RELEASE",
    classification="RESTRICTED OFFICIAL / HACKATHON JURY EVALUATION",
    author="AEGIS Core Architecture &amp; RF Engineering Team",
    reviewer="Chief Technical Directorate, National Disaster Management Cyberinfrastructure",
    date_str="September 2026"
)

SDD_BODY = """
<h1>1. Architectural Overview &amp; 4-Tier Decomposition</h1>
<p>
The AEGIS-LEWS platform is architectured as a sovereign, four-tier hybrid computing system designed to guarantee continuous operational availability from high-altitude orbital sensors down to battery-powered citizen smartphones in disconnected Himalayan ravines:
</p>

<table class="data-table">
    <thead>
        <tr>
            <th style="width: 18%;">Layer</th>
            <th style="width: 25%;">Component</th>
            <th style="width: 25%;">Technologies</th>
            <th style="width: 32%;">Primary Operational Function</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Tier 1: Space &amp; In-Situ</strong></td>
            <td>Earth Observation &amp; Hydro-Meteorological</td>
            <td>Copernicus Sentinel-1 InSAR, Open-Meteo, IMD Doppler Radar</td>
            <td>Line-of-sight displacement velocities ($v_{LOS}$) and orographic precipitation ingestion.</td>
        </tr>
        <tr>
            <td><strong>Tier 2: Cloud Engine</strong></td>
            <td>Geotechnical Computation &amp; State Command</td>
            <td>FastAPI, Uvicorn, NumPy/SciPy, Render Cloud Container</td>
            <td>Infinite slope stability calculations, 18-sector hazard scoring, WebSocket telemetry bus.</td>
        </tr>
        <tr>
            <td><strong>Tier 3: Resilient Bus</strong></td>
            <td>Emergency Dispatch &amp; Gateway Mesh</td>
            <td>WebSockets (RFC 6455), Public Emergency Mesh (ntfy.sh), MQTT</td>
            <td>Zero-latency dispatch fan-out to active gateway phones and regional EOC command centers.</td>
        </tr>
        <tr>
            <td><strong>Tier 4: Sovereign Edge</strong></td>
            <td>Autonomous Citizen Node &amp; Hardware Siren</td>
            <td>Android Capacitor, Java BLE Mesh, AudioTrack PCM, Local Flash Cache</td>
            <td>Zero-internet 2.4 GHz BLE peer-to-peer relay, GPS safety radar, lockscreen emergency takeover.</td>
        </tr>
    </tbody>
</table>

<h1>2. Physics-Informed Geotechnical Model &amp; Risk Mathematics</h1>
<p>
Unlike naive machine-learning models that behave as unexplainable black boxes, AEGIS-LEWS couples deterministic geomechanical limit-equilibrium equations with satellite and atmospheric inputs:
</p>

<h3>2.1 Infinite Slope Stability &amp; Dynamic Factor of Safety</h3>
<p>
For translational bedrock landslides characteristic of the Northeast Himalayas, the dynamic Factor of Safety ($FoS$) is formulated as:
</p>
<div class="formula-box">
FoS = [ c' + (&gamma;&middot;z - &gamma;_w&middot;h_w)&middot;cos&sup2;&beta;&middot;tan&phi;' ] / [ &gamma;&middot;z&middot;sin&beta;&middot;cos&beta; + F_seismic ]
</div>
<p>Where:</p>
<ul>
    <li><code>c'</code> = Effective soil/rock cohesion (kPa)</li>
    <li><code>&gamma;</code> = Moist unit weight of colluvial overburden (kN/m&sup3;)</li>
    <li><code>&gamma;_w</code> = Unit weight of water (9.81 kN/m&sup3;)</li>
    <li><code>z</code> = Regolith slip plane depth (meters)</li>
    <li><code>h_w</code> = Dynamic perched groundwater table height driven by cumulative rainfall (meters)</li>
    <li><code>&beta;</code> = Local terrain slope angle (degrees, derived from 30m SRTM DEM)</li>
    <li><code>&phi;'</code> = Effective angle of internal shearing resistance (degrees)</li>
    <li><code>F_seismic</code> = Pseudo-static seismic acceleration force ($k_h \cdot \gamma z$)</li>
</ul>

<h3>2.2 InSAR Displacement Velocity Coupling</h3>
<p>
Satellite interferometric line-of-sight velocity ($v_{LOS}$, mm/day) from Sentinel-1 radar constellations provides ground-truth kinematics of active slope creeping:
</p>
<div class="formula-box">
Shear_Strain_Rate (&epsilon;') = |v_LOS| / z_shear
<br>
Failure_Probability = 1.0 - ( 1.0 / ( 1.0 + exp( -k &middot; (1.0 - FoS) + &lambda;&middot;|v_LOS| ) ) )
</div>
<p>
When cumulative precipitation drives $h_w \to z$ and satellite interferometry registers an accelerated creep rate ($v_{LOS} &gt; 25$ mm/day), the failure probability breaches <strong>95%</strong>, automatically tripping the emergency broadcast pipeline.
</p>

<h1>3. Bluetooth LE Mesh Network Architecture &amp; RF Protocol</h1>
<p>
To ensure communication survivability during total infrastructure collapse, AEGIS-LEWS implements a custom sovereign broadcast protocol over standard 2.4 GHz BLE advertising physical channels (Channels 37, 38, and 39):
</p>

<h3>3.1 Dedicated Sovereign Service &amp; Characteristic UUIDs</h3>
<ul>
    <li><strong>Sovereign Mesh Service UUID:</strong> <code>0000AE61-0000-1000-8000-00805F9B34FB</code> (Allocated for AEGIS emergency signaling)</li>
    <li><strong>Full Directive GATT Characteristic UUID:</strong> <code>0000AE62-0000-1000-8000-00805F9B34FB</code> (Readable by connecting rescue devices)</li>
</ul>

<h3>3.2 Custom 20-Byte Binary Protocol Data Unit (PDU) Layout</h3>
<p>
Because standard BLE advertising packets are hard-limited to 31 bytes by legacy Bluetooth specifications, the emergency broadcast is packed into an ultra-dense 20-byte binary frame injected into <code>ServiceData</code>:
</p>

<table class="data-table">
    <thead>
        <tr>
            <th style="width: 12%;">Byte Index</th>
            <th style="width: 20%;">Field Name</th>
            <th style="width: 15%;">Data Type</th>
            <th style="width: 53%;">Description &amp; Bit Allocation</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>[0]</code></td>
            <td>Magic Byte</td>
            <td>Uint8</td>
            <td>Always <code>0xAE</code> (Identifies legitimate AEGIS sovereign emergency frame).</td>
        </tr>
        <tr>
            <td><code>[1]</code></td>
            <td>Packet Type</td>
            <td>Uint8</td>
            <td><code>0x01</code>: SOS | <code>0x02</code>: Warning | <code>0x03</code>: Beacon | <code>0x04</code>: WebRelay.</td>
        </tr>
        <tr>
            <td><code>[2]</code></td>
            <td>Risk Score</td>
            <td>Uint8</td>
            <td>0 to 100 percentage integer representing failure probability.</td>
        </tr>
        <tr>
            <td><code>[3..4]</code></td>
            <td>Node ID Hash</td>
            <td>Int16 (Big-Endian)</td>
            <td>Deterministic hash of transmitting device ID (suppresses self-echoes).</td>
        </tr>
        <tr>
            <td><code>[5..8]</code></td>
            <td>Latitude</td>
            <td>Int32 (Big-Endian)</td>
            <td>WGS-84 coordinate encoded as <code>lat &times; 100,000</code> (precision &plusmn;1.1 meter).</td>
        </tr>
        <tr>
            <td><code>[9..12]</code></td>
            <td>Longitude</td>
            <td>Int32 (Big-Endian)</td>
            <td>WGS-84 coordinate encoded as <code>lon &times; 100,000</code> (precision &plusmn;1.1 meter).</td>
        </tr>
        <tr>
            <td><code>[13]</code></td>
            <td>Packed Meta</td>
            <td>Uint8</td>
            <td>Upper 4 bits: Severity Code (1=Safe..4=Critical) | Lower 4 bits: Preset Code (1-6).</td>
        </tr>
        <tr>
            <td><code>[14..19]</code></td>
            <td>Text Snippet</td>
            <td>Byte[6] UTF-8</td>
            <td>Truncated zone name or directive summary for legacy non-GATT devices.</td>
        </tr>
    </tbody>
</table>

<h3>3.3 Autonomous Multi-Hop Flood Routing</h3>
<div class="callout warning">
    <div class="callout-title">Valley Flood Algorithm</div>
    1. A citizen device receives an emergency frame on BLE channel 37/38/39.<br>
    2. The packet is decoded; if <code>Magic == 0xAE</code> and <code>NodeHash != CurrentDeviceHash</code>, processing begins.<br>
    3. If <code>Severity &ge; HIGH</code>, the native siren sounds and the device immediately schedules a <strong>low-latency advertising cycle</strong>.<br>
    4. The device re-broadcasts the identical payload with an incremented hop counter for 45 seconds.<br>
    5. This propagates the alarm down the mountain gorge from vehicle to vehicle over distances exceeding 2.5 km.
</div>

<h1>4. Native Android Subsystem Design</h1>
<p>
The Android native integration layer (<code>aegis.lews.v2</code>) bridges the Capacitor web application to low-level Linux kernel and Android framework APIs:
</p>

<h3>4.1 AegisSirenService (Persistent Foreground Engine)</h3>
<ul>
    <li>Runs as an un-killable Android Foreground Service typed as <code>dataSync | connectedDevice</code> (Android 14+ compliant).</li>
    <li>Maintains a <code>PowerManager.PARTIAL_WAKE_LOCK</code> ensuring CPU execution persists even when the device enters deep Doze mode.</li>
    <li>Directly controls <code>AudioTrack</code> in streaming mode, generating mathematical sine/sawtooth sound oscillations (750 Hz &harr; 1250 Hz) at 44.1 kHz sample rate to avoid reliance on external media decoders.</li>
</ul>

<h3>4.2 AegisBleMeshManager (Hardware Radio Controller)</h3>
<ul>
    <li>Binds to <code>BluetoothLeScanner</code> and <code>BluetoothLeAdvertiser</code> using Android 12+ permissions with <code>neverForLocation</code> assertion.</li>
    <li>Maintains an in-memory <code>ConcurrentHashMap</code> of discovered peers, dynamically computing relative distance using the Log-Distance Path Loss model:
        <code>Distance = 10^((TxPower - RSSI) / (20 &middot; n))</code>.
    </li>
    <li>Exposes high-speed asynchronous bindings to the React webview via the <code>@JavascriptInterface AegisBleBridge</code>.</li>
</ul>

<h1>5. System Sequence Workflows</h1>

<h3>5.1 Critical Breach Alert Dispatch Workflow</h3>
<pre>
[Geotechnical Ingestion Engine]
         |
         | (1) Compute FoS = 0.67 (Breach Detected in Tawang Corridor)
         v
[FastAPI Backend (/alerts/ble-broadcast)]
         |
         +----&gt; [WebSocket Broadcast] ---&gt; [EOC Authority Portal: Red Alert Banner]
         |
         +----&gt; [ntfy.sh Emergency Bus] --&gt; [Internet Connected Gateway Phones]
                                                      |
                                                      v
                                            [AegisBleMeshManager]
                                                      |
                                                      | (2) Start BLE Advertising (0xAE61)
                                                      v
                                            [2.4 GHz Physical Radio RF Burst]
                                                      |
                                                      v
                                            [Offline Citizen Phone (Zero SIM/Wi-Fi)]
                                                      |
                                                      | (3) Intercept Frame (Magic: 0xAE)
                                                      v
                                            [Full-Screen Siren Wakeup &amp; Local Mesh Relay]
</pre>
"""

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AEGIS-LEWS v2.0 - Software &amp; Technical Design Document (SDD/TDD)</title>
<style>
{COMMON_CSS}
</style>
</head>
<body>
{cover_html}
{SDD_BODY}
</body>
</html>
"""

if __name__ == "__main__":
    compile_pdf(full_html, "03_SDD_TDD_AEGIS_LEWS.pdf")
