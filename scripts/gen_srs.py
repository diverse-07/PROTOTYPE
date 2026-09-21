import os
import sys
from build_docs import render_cover_page, compile_pdf, DOCS_DIR
from generate_engineering_docs_pdf import COMMON_CSS

cover_html = render_cover_page(
    doc_type="SOFTWARE REQUIREMENTS SPECIFICATION (SRS)",
    title="AEGIS-LEWS v2.0: Software Requirements Specification",
    subtitle="Compliant with IEEE Std 830-1998 for Mission-Critical Landslide Early Warning &amp; Autonomous Mesh Systems",
    doc_id="SRS-IEEE830-NER-LEWS-2026",
    version="2.0.4-RELEASE",
    classification="RESTRICTED OFFICIAL / HACKATHON JURY EVALUATION",
    author="AEGIS Software Architecture &amp; Quality Engineering Group",
    reviewer="National Disaster Management Division Technical Directorate",
    date_str="September 2026"
)

SRS_BODY = """
<h1>1. Introduction</h1>

<h3>1.1 Purpose</h3>
<p>
This Software Requirements Specification (SRS) document defines the complete functional, non-functional, interface, and performance specifications for the <strong>Autonomous Geotechnical Early Warning System (AEGIS-LEWS v2.0)</strong>. It establishes the verifiable baseline for development, automated testing, quality assurance, and government deployment across the North Eastern Region (NER) of India.
</p>

<h3>1.2 Scope of the System</h3>
<p>
AEGIS-LEWS is an end-to-end, multi-tier cyber-physical early warning platform that continuously ingests satellite interferometric synthetic aperture radar (InSAR), orographic precipitation, and lithological geotechnical parameters to predict catastrophic slope failures. The system encompasses:
</p>
<ul>
    <li>An <strong>EOC Authority Command Portal</strong> providing real-time 18-sector GIS hazard heatmaps, geotechnical factor-of-safety simulators, and emergency dispatch controls.</li>
    <li>A <strong>FastAPI Resilient Backend</strong> executing physics-informed slope stability calculations and managing cloud-to-edge message routing.</li>
    <li>A <strong>Capacitor Native Android Application</strong> running an autonomous 2.4 GHz Bluetooth Low Energy (BLE) peer-to-peer mesh radio and hardware siren wake service.</li>
</ul>

<h3>1.3 Definitions, Acronyms, and Abbreviations</h3>
<table class="data-table">
    <thead>
        <tr>
            <th style="width: 20%;">Term / Acronym</th>
            <th style="width: 80%;">Definition</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>BLE</strong></td>
            <td>Bluetooth Low Energy (2.4 GHz ISM band protocol for ultra-low power wireless communication).</td>
        </tr>
        <tr>
            <td><strong>EOC</strong></td>
            <td>Emergency Operation Center (Disaster command room operated by SDMA/NDMA/MDoNER).</td>
        </tr>
        <tr>
            <td><strong>FoS</strong></td>
            <td>Factor of Safety (Ratio of shear strength to shear stress along a critical slip surface).</td>
        </tr>
        <tr>
            <td><strong>GSI</strong></td>
            <td>Geological Survey of India (National nodal agency for landslide hazard zonation).</td>
        </tr>
        <tr>
            <td><strong>InSAR</strong></td>
            <td>Interferometric Synthetic Aperture Radar (Satellite radar measuring millimeter-scale surface displacement).</td>
        </tr>
        <tr>
            <td><strong>PDU</strong></td>
            <td>Protocol Data Unit (Binary structure transmitted over BLE advertising channels).</td>
        </tr>
        <tr>
            <td><strong>v_LOS</strong></td>
            <td>Line-of-Sight velocity of ground surface deformation derived from satellite radar interferometry.</td>
        </tr>
    </tbody>
</table>

<h3>1.4 References</h3>
<ul>
    <li>IEEE Std 830-1998: <em>IEEE Recommended Practice for Software Requirements Specifications</em>.</li>
    <li>National Disaster Management Guidelines: <em>Management of Landslides and Snow Avalanches</em> (NDMA, Govt. of India).</li>
    <li>GSI National Landslide Susceptibility Mapping (NLSM) Compendium, Geological Survey of India.</li>
    <li>Bluetooth Core Specification Version 5.3, Bluetooth Special Interest Group (SIG).</li>
</ul>

<h1>2. Overall Description</h1>

<h3>2.1 Product Perspective</h3>
<p>
AEGIS-LEWS operates as an edge-cloud hybrid disaster intelligence network. When internet connectivity is active, the central FastAPI server synthesizes cloud telemetry and distributes updates to web portals and mobile phones via WebSockets and HTTPS. When infrastructure is severed, individual Android devices autonomously form a ad-hoc 2.4 GHz radio mesh using direct Bluetooth hardware transceivers, completely bypassing public networks.
</p>

<h3>2.2 User Characteristics</h3>
<ul>
    <li><strong>EOC Authority Operators:</strong> Technically proficient in disaster response workflows and GIS interfaces; requires clear visual hierarchy and 1-click execution.</li>
    <li><strong>End Citizens &amp; Commuters:</strong> General public, rural residents, truck drivers; requires extreme simplicity, zero configuration, zero internet dependency, and audible multilingual voice guidance.</li>
</ul>

<h3>2.3 Design Constraints &amp; Limitations</h3>
<ul>
    <li><strong>RF Packet Boundary:</strong> Legacy BLE 4.x/5.x advertisement packets permit a maximum payload of <strong>31 bytes</strong>. All emergency metadata must be packed into a binary structure &le; 20 bytes.</li>
    <li><strong>Operating System Energy Governance:</strong> Android Doze Mode and battery optimization aggressively kill background threads. The mobile subsystem must maintain a persistent foreground service with partial CPU wake-locks.</li>
    <li><strong>Hardware InSAR Latency:</strong> Satellite repeat cycles range from 6 to 12 days (Sentinel-1). Real-time interpolation must be dynamically scaled by short-term rainfall intensity curves.</li>
</ul>

<h1>3. Specific Functional Requirements</h1>

<h3>3.1 Geotechnical Computation &amp; Ingestion Subsystem</h3>
<ul>
    <li><strong>SRS-FR-01:</strong> The system shall calculate the dynamic Factor of Safety (FoS) using the infinite slope equilibrium equation:
    <code>FoS = [c' + (&gamma;&middot;z - &gamma;_w&middot;h_w)&middot;cos&sup2;&beta;&middot;tan&phi;'] / [&gamma;&middot;z&middot;sin&beta;&middot;cos&beta;]</code>.</li>
    <li><strong>SRS-FR-02:</strong> The calculation engine shall accept the following input variables per sector:
        <ul>
            <li>Slope Angle (&beta;): 0&deg; to 80&deg;</li>
            <li>Effective Cohesion (c'): 5 to 50 kPa</li>
            <li>Angle of Internal Friction (&phi;'): 15&deg; to 45&deg;</li>
            <li>Soil Thickness (z): 1.0 to 10.0 m</li>
            <li>Groundwater Table Height (h_w): 0.0 to z meters</li>
            <li>InSAR Line-of-Sight Velocity (v_LOS): -100 to +100 mm/day</li>
        </ul>
    </li>
    <li><strong>SRS-FR-03:</strong> When FoS falls below 1.0, the sector status shall be flagged as <code>CRITICAL BREACH</code> with an estimated time-to-detachment &lt; 1.5 hours.</li>
</ul>

<h3>3.2 Authority EOC Command Center Subsystem</h3>
<ul>
    <li><strong>SRS-FR-04:</strong> The EOC portal shall render an interactive Leaflet/MapLibre GIS canvas depicting all 18 regional monitoring zones with official GSI hazard polygon boundaries.</li>
    <li><strong>SRS-FR-05:</strong> The user shall be capable of selecting any monitored zone to inspect live 24-hour rainfall, InSAR velocity, soil wetness, and factor-of-safety telemetry.</li>
    <li><strong>SRS-FR-06:</strong> The system shall provide an authentication gatekeeper requiring valid Officer Credentials (<code>prototype</code> / <code>prototype</code>) before granting command access.</li>
    <li><strong>SRS-FR-07:</strong> The command strip shall provide a dedicated <strong>"Dispatch BLE Offline Alert"</strong> button that initiates an immediate hardware radio broadcast sequence across all active gateways.</li>
    <li><strong>SRS-FR-08:</strong> The portal shall support 1-click generation of printable official geotechnical and rainfall audit reports formatted to NIC/NDMA standards.</li>
</ul>

<h3>3.3 Bluetooth LE Autonomous Mesh Subsystem</h3>
<ul>
    <li><strong>SRS-FR-09:</strong> The mobile client shall instantiate a dedicated BLE advertiser using Sovereign Service UUID <code>0000AE61-0000-1000-8000-00805F9B34FB</code>.</li>
    <li><strong>SRS-FR-10:</strong> The advertisement payload shall conform to the following 20-byte binary specification:
        <ul>
            <li>Byte 0: Magic Header (<code>0xAE</code>)</li>
            <li>Byte 1: Packet Type (<code>0x01</code>=SOS, <code>0x02</code>=Warning, <code>0x03</code>=Beacon, <code>0x04</code>=WebRelay)</li>
            <li>Byte 2: Risk Probability Score (0-100)</li>
            <li>Bytes 3-4: Node Identifier Numeric Hash (Int16)</li>
            <li>Bytes 5-8: Encoded Latitude (Int32, lat &times; 100,000)</li>
            <li>Bytes 9-12: Encoded Longitude (Int32, lon &times; 100,000)</li>
            <li>Byte 13: Packed Metadata (Severity Code [4 bits] | Preset Directive Code [4 bits])</li>
            <li>Bytes 14-19: UTF-8 Text Snippet (6 bytes max)</li>
        </ul>
    </li>
    <li><strong>SRS-FR-11:</strong> When an emergency packet is received by a non-broadcasting peer, the device shall automatically switch into BLE Advertiser mode to re-transmit the packet, achieving autonomous multi-hop coverage without human intervention.</li>
    <li><strong>SRS-FR-12:</strong> The mesh manager shall drop self-transmitted packets and enforce a 3.5-second deduplication cooldown to prevent cascade loop storms.</li>
</ul>

<h3>3.4 Native Siren &amp; Emergency Wake Subsystem</h3>
<ul>
    <li><strong>SRS-FR-13:</strong> Upon receipt of a CRITICAL BREACH packet, the native Android service shall issue a full-screen intent (<code>USE_FULL_SCREEN_INTENT</code>) to immediately turn on the device display and dismiss keyguards.</li>
    <li><strong>SRS-FR-14:</strong> The siren service shall generate raw PCM synthetic wails (750 Hz to 1250 Hz) directly via <code>android.media.AudioTrack</code>, guaranteeing audible alarms even if storage or media files are inaccessible.</li>
    <li><strong>SRS-FR-15:</strong> The service shall vibrate the phone continuously using the disaster pulse cadence: 1000ms ON, 300ms OFF, 1000ms ON, 300ms OFF, 1500ms ON, 500ms OFF.</li>
</ul>

<h1>4. Non-Functional Requirements (NFR)</h1>

<table class="data-table">
    <thead>
        <tr>
            <th>Category</th>
            <th>Requirement Identifier</th>
            <th>Specification &amp; Benchmark Criteria</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Performance</strong></td>
            <td>NFR-PERF-01</td>
            <td>Geotechnical FoS computation latency shall not exceed <strong>50 milliseconds</strong> per zone evaluation.</td>
        </tr>
        <tr>
            <td><strong>Performance</strong></td>
            <td>NFR-PERF-02</td>
            <td>BLE peer discovery and packet decoding latency shall be &lt; <strong>350 milliseconds</strong> within 25 meters line-of-sight.</td>
        </tr>
        <tr>
            <td><strong>Availability</strong></td>
            <td>NFR-AVAIL-01</td>
            <td>The citizen mobile app shall maintain <strong>99.999% availability</strong> in zero-internet offline mode via local cache.</td>
        </tr>
        <tr>
            <td><strong>Reliability</strong></td>
            <td>NFR-REL-01</td>
            <td>Under 100% cellular and Wi-Fi blackout, emergency alert packet delivery across 2 mesh hops shall exceed <strong>92.0%</strong>.</td>
        </tr>
        <tr>
            <td><strong>Security</strong></td>
            <td>NFR-SEC-01</td>
            <td>All external REST endpoints and WebSockets shall enforce TLS 1.3 encryption and conform to NIC-CERT-IN Level-4 guidelines.</td>
        </tr>
        <tr>
            <td><strong>Energy Consumption</strong></td>
            <td>NFR-PWR-01</td>
            <td>Continuous background BLE mesh scanning shall consume &lt; <strong>2.0% battery capacity per hour</strong> on standard 4000mAh cells.</td>
        </tr>
    </tbody>
</table>
"""

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AEGIS-LEWS v2.0 - Software Requirements Specification (SRS)</title>
<style>
{COMMON_CSS}
</style>
</head>
<body>
{cover_html}
{SRS_BODY}
</body>
</html>
"""

if __name__ == "__main__":
    compile_pdf(full_html, "02_SRS_AEGIS_LEWS.pdf")
