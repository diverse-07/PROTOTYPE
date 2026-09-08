try:
    from backend.database import SessionLocal
    from backend.models import Sensor, Zone, Report
except ImportError:
    from database import SessionLocal
    from models import Sensor, Zone, Report

ZONES = [
    ("Jaintia Hills", "Meghalaya", "CRITICAL", 87, 25.05, 92.12, "Active thrust zone, Disang shale, NH-44 corridor. Debris flow risk."),
    ("Sohra / Cherrapunji", "Meghalaya", "HIGH", 74, 25.28, 91.72, "World-record rainfall zone. Steep limestone escarpments."),
    ("Ri-Bhoi District", "Meghalaya", "MODERATE", 52, 25.75, 91.95, "Sub-Himalayan foothills. Seasonal translational soil slips."),
    ("Brahmaputra Valley", "Assam", "SAFE", 18, 26.14, 91.74, "Flat alluvial floodplain. Very low slope gradient."),
    ("Barak Valley", "Assam", "LOW", 32, 24.80, 92.75, "Rolling hills transitioning to valley. Flash flood risk."),
    ("North Sikkim", "Sikkim", "CRITICAL", 83, 27.60, 88.45, "Teesta MCT active fault. Glacial moraine instability."),
    ("South Sikkim", "Sikkim", "MODERATE", 55, 27.15, 88.45, "Namchi terraced ridges. Sandstone weathering."),
    ("Aizawl East", "Mizoram", "HIGH", 71, 23.73, 92.72, "Urban hill cutting. Saturated residential slopes."),
    ("Lunglei District", "Mizoram", "MODERATE", 48, 22.88, 92.74, "Longitudinal valley ridges. Moderate saturation risk."),
    ("Kohima District", "Nagaland", "HIGH", 68, 25.67, 94.11, "NH-29 corridor. Active slope cutting and subsidence."),
    ("Mon District", "Nagaland", "LOW", 29, 26.73, 94.94, "Forested gentle slopes. Low historical slide record."),
    ("Imphal East", "Manipur", "SAFE", 15, 24.82, 93.95, "Loktak basin floor. Flat terrain, stable alluvium."),
    ("Senapati District", "Manipur", "MODERATE", 50, 25.27, 94.02, "Hill district with terraced agriculture. Seasonal erosion."),
    ("Tawang District", "Arunachal Pradesh", "CRITICAL", 81, 27.59, 91.86, "High-altitude MCT zone. Permafrost degradation and rockfall."),
    ("Itanagar Capital", "Arunachal Pradesh", "MODERATE", 45, 27.08, 93.60, "Tertiary sandstone hills. Urban slope cutting."),
    ("Agartala Plains", "Tripura", "SAFE", 12, 23.83, 91.28, "Flat river basin. Very stable alluvial plains."),
]

SENSORS = [
    ("SNR-ML-001", "Jaintia Hills", "Meghalaya", "Soil Moisture + Rain Gauge", "Online", "87% moisture, 12mm/hr", 78),
    ("SNR-ML-002", "Sohra Station", "Meghalaya", "Tipping Bucket Rain Gauge", "Online", "180mm/24hr", 91),
    ("SNR-SK-004", "Gangtok South", "Sikkim", "Inclinometer", "Online", "4.2mm displacement", 65),
    ("SNR-SK-005", "North Sikkim MCT", "Sikkim", "Seismic + Piezometer", "Online", "Seismic: 1.8, PWP: 42kPa", 82),
    ("SNR-MZ-012", "Aizawl East", "Mizoram", "Soil Moisture", "Degraded", "88% moisture", 23),
    ("SNR-MZ-013", "Lunglei Ridge", "Mizoram", "Rain Gauge + Camera", "Online", "65mm/24hr", 77),
    ("SNR-NL-007", "Kohima NH-29", "Nagaland", "Rain Gauge + Camera", "Online", "76mm/24hr", 82),
    ("SNR-AS-019", "Barak Valley", "Assam", "Water Level + Seismic", "Online", "Level: HIGH, Seismic: 0.5", 91),
    ("SNR-AS-020", "Silchar Station", "Assam", "IMD Rain Gauge", "Online", "52mm/24hr", 88),
    ("SNR-MN-003", "Senapati", "Manipur", "Ground Displacement", "Offline", "Last: 2hrs ago", 5),
    ("SNR-MN-004", "Imphal East", "Manipur", "Water Level", "Online", "Normal: 0.8m", 94),
    ("SNR-AR-008", "Tawang Pass", "Arunachal Pradesh", "Weather Station + Seismic", "Online", "68mm/24hr, -2C, Seismic: 0.9", 94),
    ("SNR-AR-009", "Itanagar", "Arunachal Pradesh", "Soil Moisture", "Online", "61% moisture", 79),
    ("SNR-TR-002", "Agartala", "Tripura", "Rain Gauge", "Online", "45mm/24hr", 88),
    ("SNR-TR-003", "North Tripura", "Tripura", "Soil Moisture + Rain", "Online", "55mm/24hr, 72% moisture", 83),
    ("SNR-NL-008", "Mon District", "Nagaland", "Rain Gauge", "Online", "38mm/24hr", 91),
    ("SNR-ML-003", "Ri-Bhoi", "Meghalaya", "Inclinometer", "Online", "0.8mm displacement", 87),
    ("SNR-SK-006", "South Sikkim", "Sikkim", "Soil Moisture", "Online", "69% moisture", 71),
    ("SNR-MZ-014", "Aizawl Central", "Mizoram", "Camera + Rain", "Degraded", "Camera offline, Rain: 72mm", 31),
    ("SNR-AR-010", "East Kameng", "Arunachal Pradesh", "Weather Station", "Online", "44mm/24hr, 18C", 89),
]

def run_seed():
    db = SessionLocal()
    try:
        if db.query(Sensor).count() == 0:
            for s in SENSORS:
                db.add(Sensor(sensor_id=s[0], location=s[1], state=s[2], sensor_type=s[3], status=s[4], last_reading=s[5], battery=s[6]))
        if db.query(Zone).count() == 0:
            for z in ZONES:
                db.add(Zone(name=z[0], state=z[1], risk_level=z[2], score=z[3], lat=z[4], lng=z[5], description=z[6]))
        if db.query(Report).count() == 0:
            db.add(Report(report_type="Tension Crack (30cm)", location="NH-44 Dawki Road", description="Fissure widening after continuous rainfall.", lat=25.20, lng=92.05, status="verified"))
            db.add(Report(report_type="Debris Flow Slurry", location="Kohima Bypass NH-29", description="Slurry overrunning roadway embankment.", lat=25.67, lng=94.11, status="verified"))
        db.commit()
    finally:
        db.close()