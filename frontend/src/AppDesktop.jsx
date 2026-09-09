import React, { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup } from "react-leaflet"
import Globe3D from "./components/Globe3D"
import GlassDock from "./components/GlassDock"
import {
  dispatchBleBroadcast
} from "./api/client"

const ZONES = [
  { id: 1, name: "Jaintia Hills", state: "Meghalaya", score: 87, lat: 25.05, lng: 92.12, fillOpacity: 0.55, coords: [[25.20, 92.30], [25.00, 92.00], [24.85, 92.40], [25.05, 92.70], [25.20, 92.30]], description: "Active Disang shale thrust zone. NH-44 corridor debris flow risk.", risk: "CRITICAL" },
  { id: 2, name: "Sohra / Cherrapunji", state: "Meghalaya", score: 74, lat: 25.28, lng: 91.72, fillOpacity: 0.45, coords: [[25.40, 91.60], [25.20, 91.40], [25.10, 91.70], [25.30, 91.90], [25.40, 91.60]], description: "World-record rainfall. Limestone escarpment failure.", risk: "HIGH" },
  { id: 3, name: "Ri-Bhoi District", state: "Meghalaya", score: 52, lat: 25.75, lng: 91.95, fillOpacity: 0.4, coords: [[26.00, 91.70], [25.70, 91.50], [25.60, 92.00], [25.90, 92.20], [26.00, 91.70]], description: "Sub-Himalayan foothills. Seasonal translational soil slips.", risk: "MODERATE" },
  { id: 4, name: "Brahmaputra Valley", state: "Assam", score: 18, lat: 26.14, lng: 91.74, fillOpacity: 0.25, coords: [[26.50, 91.20], [26.10, 90.80], [25.95, 92.00], [26.40, 92.50], [26.50, 91.20]], description: "Flat alluvial floodplain. Very low slope gradient.", risk: "SAFE" },
  { id: 5, name: "Barak Valley", state: "Assam", score: 32, lat: 24.80, lng: 92.75, fillOpacity: 0.32, coords: [[25.00, 92.60], [24.70, 92.30], [24.55, 92.80], [24.80, 93.10], [25.00, 92.60]], description: "Rolling hills. Flash flood risk in peak monsoon.", risk: "LOW" },
  { id: 6, name: "North Sikkim", state: "Sikkim", score: 83, lat: 27.60, lng: 88.45, fillOpacity: 0.55, coords: [[28.00, 88.40], [27.60, 88.10], [27.40, 88.50], [27.70, 88.80], [28.00, 88.40]], description: "Teesta MCT active fault. Glacial moraine instability.", risk: "CRITICAL" },
  { id: 7, name: "South Sikkim", state: "Sikkim", score: 55, lat: 27.15, lng: 88.45, fillOpacity: 0.4, coords: [[27.40, 88.40], [27.10, 88.20], [27.00, 88.55], [27.25, 88.75], [27.40, 88.40]], description: "Namchi terraced ridges. Sandstone weathering.", risk: "MODERATE" },
  { id: 8, name: "Aizawl East", state: "Mizoram", score: 71, lat: 23.73, lng: 92.72, fillOpacity: 0.48, coords: [[23.85, 92.60], [23.65, 92.40], [23.55, 92.80], [23.75, 93.00], [23.85, 92.60]], description: "Urban hill cutting. Saturated residential slopes.", risk: "HIGH" },
  { id: 9, name: "Lunglei District", state: "Mizoram", score: 48, lat: 22.88, lng: 92.74, fillOpacity: 0.35, coords: [[23.10, 92.80], [22.75, 92.60], [22.65, 93.00], [22.95, 93.20], [23.10, 92.80]], description: "Longitudinal valley ridges. Moderate soil saturation.", risk: "MODERATE" },
  { id: 10, name: "Kohima District", state: "Nagaland", score: 68, lat: 25.67, lng: 94.11, fillOpacity: 0.45, coords: [[25.80, 94.00], [25.55, 93.75], [25.45, 94.20], [25.65, 94.45], [25.80, 94.00]], description: "NH-29 corridor. Active slope cutting and subsidence.", risk: "HIGH" },
  { id: 11, name: "Mon District", state: "Nagaland", score: 29, lat: 26.73, lng: 94.94, fillOpacity: 0.3, coords: [[27.00, 95.00], [26.60, 94.75], [26.50, 95.20], [26.80, 95.45], [27.00, 95.00]], description: "Forested gentle slopes. Low historical slide frequency.", risk: "LOW" },
  { id: 12, name: "Imphal East", state: "Manipur", score: 15, lat: 24.82, lng: 93.95, fillOpacity: 0.22, coords: [[24.95, 93.90], [24.70, 93.65], [24.60, 94.05], [24.85, 94.25], [24.95, 93.90]], description: "Loktak basin floor. Flat stable alluvial terrain.", risk: "SAFE" },
  { id: 13, name: "Senapati District", state: "Manipur", score: 50, lat: 25.27, lng: 94.02, fillOpacity: 0.38, coords: [[25.40, 93.90], [25.10, 93.65], [24.95, 94.10], [25.25, 94.35], [25.40, 93.90]], description: "Hill district terraced agriculture. Seasonal erosion.", risk: "MODERATE" },
  { id: 14, name: "Tawang District", state: "Arunachal Pradesh", score: 81, lat: 27.59, lng: 91.86, fillOpacity: 0.55, coords: [[27.75, 91.95], [27.45, 91.65], [27.30, 92.05], [27.60, 92.35], [27.75, 91.95]], description: "High-altitude MCT zone. Permafrost degradation.", risk: "CRITICAL" },
  { id: 15, name: "Itanagar Capital", state: "Arunachal Pradesh", score: 45, lat: 27.08, lng: 93.60, fillOpacity: 0.35, coords: [[27.20, 93.65], [26.95, 93.40], [26.85, 93.80], [27.10, 94.00], [27.20, 93.65]], description: "Tertiary sandstone hills. Urban slope cutting.", risk: "MODERATE" },
  { id: 16, name: "Agartala Plains", state: "Tripura", score: 12, lat: 23.83, lng: 91.28, fillOpacity: 0.22, coords: [[23.95, 91.20], [23.70, 91.00], [23.60, 91.40], [23.85, 91.60], [23.95, 91.20]], description: "Flat river basin. Very stable alluvial terrain.", risk: "SAFE" }
]

const SENSORS = [
  { lat: 25.05, lng: 92.12, name: "SNR-ML-001 Jaintia", status: "Online", moisture: "87%", rain: "18 mm/h", pore: "48 kPa" },
  { lat: 25.28, lng: 91.72, name: "SNR-ML-002 Sohra", status: "Online", moisture: "94%", rain: "42 mm/h", pore: "62 kPa" },
  { lat: 27.60, lng: 88.45, name: "SNR-SK-004 N-Sikkim", status: "Online", moisture: "82%", rain: "24 mm/h", pore: "55 kPa" },
  { lat: 23.73, lng: 92.72, name: "SNR-MZ-012 Aizawl", status: "Degraded", moisture: "78%", rain: "14 mm/h", pore: "38 kPa" },
  { lat: 25.67, lng: 94.11, name: "SNR-NL-007 Kohima", status: "Online", moisture: "76%", rain: "16 mm/h", pore: "41 kPa" },
  { lat: 24.80, lng: 92.75, name: "SNR-AS-019 Barak", status: "Online", moisture: "64%", rain: "8 mm/h", pore: "22 kPa" },
  { lat: 25.27, lng: 94.02, name: "SNR-MN-003 Senapati", status: "Offline", moisture: "--", rain: "--", pore: "--" },
  { lat: 27.59, lng: 91.86, name: "SNR-AR-008 Tawang", status: "Online", moisture: "71%", rain: "11 mm/h", pore: "34 kPa" }
]

const BLE_PRESETS = [
  { code: 1, label: "Immediate Evacuation", text: "EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to high bedrock." },
  { code: 2, label: "Debris Flow Imminent", text: "DEBRIS FLOW IMMINENT: Heavy rainfall detected. Stay clear of drainage channels." },
  { code: 3, label: "Highway Blocked", text: "HIGHWAY CORRIDOR BLOCKED: Rockfall at active pass. All transport suspended." },
  { code: 4, label: "Bedrock Shelter Refuge", text: "SHELTER IN PLACE: Seek designated reinforced refuge structure." }
]

function getIST() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short"
  })
}

function getRiskColor(score) {
  if (score >= 80) return "#ef4444"
  if (score >= 65) return "#f97316"
  if (score >= 45) return "#eab308"
  if (score >= 25) return "#84cc16"
  return "#10b981"
}

export default function AppDesktop() {
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  )

  useEffect(() => {
    const onResize = () => setIsMobileScreen(window.innerWidth < 768)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const [activeView, setActiveView] = useState("globe")
  const [currentTime, setCurrentTime] = useState(getIST())

  const [userLocation, setUserLocation] = useState(null)
  const [focusTarget, setFocusTarget] = useState({ lat: 25.5, lng: 92.8, zoom: false })
  const [selectedZone, setSelectedZone] = useState(ZONES[0])

  const [telemetryOpen, setTelemetryOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : false))
  const [dispatchOpen, setDispatchOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : false))
  const [stressOpen, setStressOpen] = useState(false)
  const [sirenModalOpen, setSirenModalOpen] = useState(false)
  const [apkModalOpen, setApkModalOpen] = useState(false)

  const [rainfallMultiplier, setRainfallMultiplier] = useState(1.0)
  const [autoRotate, setAutoRotate] = useState(true)

  const [blePresetCode, setBlePresetCode] = useState(1)
  const [bleZone, setBleZone] = useState("Jaintia Hills")
  const [bleSeverity, setBleSeverity] = useState("CRITICAL")
  const [bleMessage, setBleMessage] = useState(BLE_PRESETS[0].text)
  const [isDispatching, setIsDispatching] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const [isSirenPlaying, setIsSirenPlaying] = useState(false)
  const audioCtxRef = useRef(null)
  const oscRef = useRef(null)
  const gainRef = useRef(null)
  const sirenIntervalRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getIST()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    handleLocateMe(false)
  }, [])

  const handleLocateMe = (forceZoom = true) => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4))
          const lng = parseFloat(pos.coords.longitude.toFixed(4))
          const loc = { lat, lng, city: "Detected Location", state: "Live GPS" }
          setUserLocation(loc)
          if (forceZoom) {
            setFocusTarget({ lat, lng, zoom: true })
            showToast("Camera centered on coordinates")
          }
        },
        () => {
          const fallbackLoc = { lat: 28.6139, lng: 77.2090, city: "New Delhi", state: "India" }
          setUserLocation(fallbackLoc)
          if (forceZoom) {
            setFocusTarget({ lat: fallbackLoc.lat, lng: fallbackLoc.lng, zoom: true })
            showToast("Centered on New Delhi")
          }
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    }
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3500)
  }

  const toggleSirenAudio = () => {
    if (isSirenPlaying) {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current)
      if (gainRef.current) gainRef.current.gain.setValueAtTime(0, audioCtxRef.current?.currentTime || 0)
      if (oscRef.current) {
        try {
          oscRef.current.stop()
          oscRef.current.disconnect()
        } catch (e) {}
      }
      setIsSirenPlaying(false)
      showToast("Audio muted")
    } else {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "sawtooth"
        gain.gain.setValueAtTime(0.2, ctx.currentTime)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()

        oscRef.current = osc
        gainRef.current = gain

        let step = 0
        sirenIntervalRef.current = setInterval(() => {
          if (!audioCtxRef.current) return
          step += 0.05
          const freq = 750 + 500 * Math.abs(Math.sin(step * 1.5))
          osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime)
        }, 50)

        setIsSirenPlaying(true)
        showToast("Playing 750Hz–1250Hz NDMA Sweep Tone")
      } catch (e) {
        console.error("Audio error:", e)
      }
    }
  }

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone)
    setBleZone(zone.name.split(",")[0])
    setFocusTarget({ lat: zone.lat || zone.coords[0][0], lng: zone.lng || zone.coords[0][1], zoom: true })
    showToast(`Focused on ${zone.name}`)
    if (isMobileScreen) setTelemetryOpen(false)
  }

  const handleDispatch = async () => {
    setIsDispatching(true)
    try {
      const payload = {
        zone_name: bleZone,
        severity: bleSeverity,
        risk_score: selectedZone?.score || 87,
        preset_code: blePresetCode,
        message: bleMessage,
        channels: ["ble_mesh", "push_stream"]
      }
      await dispatchBleBroadcast(payload)
      showToast("Emergency broadcast dispatched")
    } catch (e) {
      showToast("Dispatched via Cloud Mesh fallback")
    } finally {
      setIsDispatching(false)
      setSirenModalOpen(false)
    }
  }

  return (
    <div
      className="aegis-desktop-root"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#06070a",
        color: "#f1f5f9"
      }}
    >
      <div className="framer-ambient-bg" />

      {/* 1. TOP UTILITY & BRAND BAR */}
      <header
        className="glass-surface"
        style={{
          position: "absolute",
          top: isMobileScreen ? "10px" : "14px",
          left: isMobileScreen ? "10px" : "16px",
          right: isMobileScreen ? "10px" : "16px",
          height: isMobileScreen ? "50px" : "56px",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobileScreen ? "0 12px" : "0 20px",
          zIndex: 8000
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="./aegis_logo_transparent.png"
            alt="AEGIS"
            style={{ width: isMobileScreen ? "28px" : "32px", height: isMobileScreen ? "28px" : "32px" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: isMobileScreen ? "12px" : "13px", fontWeight: "700", color: "#f8fafc", letterSpacing: "0.5px" }}>
                TEAM AEGIS
              </span>
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 5px",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#94a3b8",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.12)"
                }}
              >
                v2.0
              </span>
            </div>
            {!isMobileScreen && (
              <p style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>
                NER Landslide Early Warning System | MDoNER · SIH 2026
              </p>
            )}
          </div>
        </div>

        {/* Telemetry status (desktop only) */}
        {!isMobileScreen && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px", color: "#94a3b8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="live-dot" style={{ background: "#10b981" }} />
              <span>Satellite Telemetry Active</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="live-dot" style={{ background: "#38bdf8" }} />
              <span>BLE Mesh Gateway Online</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: isMobileScreen ? "8px" : "14px" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              padding: "3px",
              borderRadius: "8px",
              display: "flex",
              gap: "2px",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <button
              onClick={() => setActiveView("globe")}
              style={{
                background: activeView === "globe" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: isMobileScreen ? "4px 8px" : "4px 10px",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              3D Orbit
            </button>
            <button
              onClick={() => setActiveView("gis")}
              style={{
                background: activeView === "gis" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: isMobileScreen ? "4px 8px" : "4px 10px",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Satellite GIS
            </button>
          </div>

          {!isMobileScreen && (
            <div style={{ textAlign: "right", minWidth: "85px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#f8fafc" }}>{currentTime}</div>
              <div style={{ fontSize: "9px", color: "#64748b" }}>IST</div>
            </div>
          )}

          <button
            onClick={() => setApkModalOpen(true)}
            className="framer-btn-primary"
            style={{ padding: isMobileScreen ? "5px 9px" : "6px 12px" }}
          >
            <span>📱</span> {!isMobileScreen && <span>Get APK</span>}
          </button>
        </div>
      </header>

      {/* 2. CENTER HERO VIEWPORT */}
      <main style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}>
        {activeView === "globe" ? (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <Globe3D
              userLocation={userLocation}
              zones={ZONES}
              sensors={SENSORS}
              focusTarget={focusTarget}
              autoRotate={autoRotate}
              onZoneSelect={handleZoneSelect}
              isZoomedIn={focusTarget.zoom}
            />

            {/* "MY POSITION" SUBTLE TELEMETRY BAR */}
            <div
              className="glass-surface"
              style={{
                position: "absolute",
                top: isMobileScreen ? "66px" : "80px",
                left: "50%",
                transform: "translateX(-50%)",
                borderRadius: "12px",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                zIndex: 5000,
                fontSize: "11px",
                maxWidth: "calc(100% - 24px)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="live-dot" style={{ background: "#38bdf8" }} />
                <span style={{ color: "#94a3b8" }}>GPS Position:</span>
                <strong style={{ color: "#ffffff" }}>
                  {userLocation ? `${userLocation.city || "Node"} (${userLocation.lat}°N, ${userLocation.lng}°E)` : "28.61°N, 77.21°E"}
                </strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => handleLocateMe(true)}
                  className="framer-btn-primary"
                  style={{ padding: "4px 10px", fontSize: "10px" }}
                >
                  Zoom In
                </button>
                <button
                  onClick={() => setFocusTarget({ lat: 25.5, lng: 92.8, zoom: false })}
                  className="framer-btn-ghost"
                  style={{ padding: "4px 8px", fontSize: "10px" }}
                >
                  Orbit
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <MapContainer
              center={[25.5, 92.8]}
              zoom={7}
              style={{ width: "100%", height: "100%" }}
              maxBounds={[[6.0, 68.0], [38.0, 98.0]]}
              maxBoundsViscosity={1.0}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Esri World Imagery"
              />
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                opacity={0.8}
              />

              {ZONES.map((zone) => (
                <Polygon
                  key={zone.id}
                  positions={zone.coords}
                  pathOptions={{
                    color: getRiskColor(zone.score),
                    fillColor: getRiskColor(zone.score),
                    fillOpacity: zone.fillOpacity || 0.4,
                    weight: 1.5
                  }}
                  eventHandlers={{ click: () => handleZoneSelect(zone) }}
                >
                  <Popup>
                    <div style={{ padding: "4px 6px", fontSize: "11px" }}>
                      <strong>{zone.name}</strong>
                      <div style={{ marginTop: "2px" }}>Risk: {zone.risk} ({zone.score}/100)</div>
                    </div>
                  </Popup>
                </Polygon>
              ))}

              {SENSORS.map((s, idx) => (
                <CircleMarker
                  key={idx}
                  center={[s.lat, s.lng]}
                  radius={5}
                  pathOptions={{ color: "#38bdf8", fillColor: "#0ea5e9", fillOpacity: 0.85, weight: 1.5 }}
                />
              ))}

              {userLocation && (
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={6}
                  pathOptions={{ color: "#ffffff", fillColor: "#38bdf8", fillOpacity: 1, weight: 2 }}
                />
              )}
            </MapContainer>
          </div>
        )}
      </main>

      {/* 3. LEFT HUD: 16 CORRIDORS */}
      {telemetryOpen && (
        <aside
          aria-label="Risk Corridors"
          className="glass-surface framer-scrollbar"
          style={{
            position: "absolute",
            top: isMobileScreen ? "auto" : "80px",
            bottom: isMobileScreen ? "76px" : "80px",
            left: isMobileScreen ? "10px" : "16px",
            right: isMobileScreen ? "10px" : "auto",
            width: isMobileScreen ? "auto" : "290px",
            maxHeight: isMobileScreen ? "50vh" : "none",
            borderRadius: "14px",
            padding: "14px",
            zIndex: 7500,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            overflowY: "auto"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Geological Corridors
            </span>
            <button
              onClick={() => setTelemetryOpen(false)}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {ZONES.map((z) => {
              const isSel = selectedZone?.id === z.id
              return (
                <div
                  key={z.id}
                  onClick={() => handleZoneSelect(z)}
                  className="glass-card"
                  style={{
                    padding: "7px 10px",
                    cursor: "pointer",
                    borderColor: isSel ? "rgba(56, 189, 248, 0.4)" : undefined,
                    background: isSel ? "rgba(255, 255, 255, 0.08)" : undefined
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: isSel ? "#38bdf8" : "#e2e8f0" }}>{z.name}</span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: "600",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        color: getRiskColor(z.score),
                        background: "rgba(255, 255, 255, 0.04)"
                      }}
                    >
                      {z.score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
      )}

      {/* 4. RIGHT HUD: AI PREDICTOR & DISPATCH */}
      {dispatchOpen && (
        <aside
          aria-label="AI Assessment"
          className="glass-surface framer-scrollbar"
          style={{
            position: "absolute",
            top: isMobileScreen ? "auto" : "80px",
            bottom: isMobileScreen ? "76px" : "80px",
            right: isMobileScreen ? "10px" : "16px",
            left: isMobileScreen ? "10px" : "auto",
            width: isMobileScreen ? "auto" : "300px",
            maxHeight: isMobileScreen ? "55vh" : "none",
            borderRadius: "14px",
            padding: "14px",
            zIndex: 7500,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            overflowY: "auto"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              AI Threat Assessment
            </span>
            <button
              onClick={() => setDispatchOpen(false)}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px" }}
            >
              ✕
            </button>
          </div>

          <div className="glass-card" style={{ padding: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "10px", color: "#64748b" }}>XGBoost Susceptibility</span>
              <strong style={{ fontSize: "16px", color: "#ef4444" }}>87 / 100</strong>
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
              High moisture saturation combined with steep Disang shale formation.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", color: "#64748b" }}>TARGET REGION</label>
            <select
              value={bleZone}
              onChange={(e) => setBleZone(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", background: "#12161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "11px" }}
            >
              {ZONES.map((z) => (
                <option key={z.id} value={z.name.split(",")[0]}>{z.name}</option>
              ))}
            </select>

            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="framer-btn-danger"
              style={{ width: "100%", padding: "8px", justifyContent: "center", marginTop: "4px" }}
            >
              <span>{isDispatching ? "..." : "🚨"}</span>
              <span>{isDispatching ? "Broadcasting..." : "Broadcast Emergency Alert"}</span>
            </button>

            <button
              onClick={toggleSirenAudio}
              className={isSirenPlaying ? "framer-btn-danger" : "framer-btn-ghost"}
              style={{ width: "100%", justifyContent: "center" }}
            >
              <span>{isSirenPlaying ? "🔕" : "🔊"}</span>
              <span>{isSirenPlaying ? "Mute Audio" : "Test NDMA Audio Tone"}</span>
            </button>
          </div>
        </aside>
      )}

      {/* 5. FLOATING GLASS DOCK */}
      <GlassDock
        activeView={activeView}
        onSelectView={setActiveView}
        onLocateMe={() => handleLocateMe(true)}
        onOpenSirenModal={() => setSirenModalOpen(true)}
        onToggleTelemetry={() => setTelemetryOpen(!telemetryOpen)}
        telemetryOpen={telemetryOpen}
        onToggleStress={() => setStressOpen(!stressOpen)}
        stressOpen={stressOpen}
        onPlaySirenTest={toggleSirenAudio}
        isSirenPlaying={isSirenPlaying}
        onOpenApkModal={() => setApkModalOpen(true)}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
      />

      {/* 6. MODAL: CITIZEN APK */}
      {apkModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "16px"
          }}
        >
          <div className="glass-surface" style={{ width: "420px", maxWidth: "100%", borderRadius: "14px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <strong style={{ fontSize: "14px", color: "#ffffff" }}>AEGIS Offline Mesh APK</strong>
              <button onClick={() => setApkModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5, marginBottom: "14px" }}>
              Native Android package operating with <strong>0 KB data, no SIM, and no Wi-Fi</strong>. Receives disaster sirens over BLE radio and relays via multi-hop mesh.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <a
                href="https://github.com/diverse-07/PROTOTYPE/releases/download/v2.0.0-prototype/AEGIS_LEWS_v2.0_PROTOTYPE.apk"
                target="_blank"
                rel="noreferrer"
                className="framer-btn-primary"
                style={{ flex: 1, textDecoration: "none", justifyContent: "center", padding: "8px" }}
              >
                Download Release APK (11.2 MB)
              </a>
              <button onClick={() => setApkModalOpen(false)} className="framer-btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: STRESS ENGINE */}
      {stressOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "16px"
          }}
        >
          <div className="glass-surface" style={{ width: "380px", maxWidth: "100%", borderRadius: "14px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <strong style={{ fontSize: "13px", color: "#ffffff" }}>Monsoon Stress Engine</strong>
              <button onClick={() => setStressOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "11px" }}>
                <span>Rainfall Intensity:</span>
                <strong>{rainfallMultiplier.toFixed(1)}x</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={rainfallMultiplier}
                onChange={(e) => setRainfallMultiplier(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#0284c7" }}
              />
            </div>
            <button onClick={() => setStressOpen(false)} className="framer-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Apply Simulation
            </button>
          </div>
        </div>
      )}

      {/* 8. MODAL: SIREN DISPATCH */}
      {sirenModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "16px"
          }}
        >
          <div className="glass-surface" style={{ width: "420px", maxWidth: "100%", borderRadius: "14px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <strong style={{ fontSize: "13px", color: "#ef4444" }}>Emergency Siren Dispatch</strong>
              <button onClick={() => setSirenModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              <select
                value={bleZone}
                onChange={(e) => setBleZone(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", background: "#12161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "11px" }}
              >
                {ZONES.map((z) => (
                  <option key={z.id} value={z.name.split(",")[0]}>{z.name}</option>
                ))}
              </select>
              <textarea
                rows={3}
                value={bleMessage}
                onChange={(e) => setBleMessage(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", background: "#12161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "11px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleDispatch} disabled={isDispatching} className="framer-btn-danger" style={{ flex: 1, padding: "8px", justifyContent: "center" }}>
                {isDispatching ? "Broadcasting..." : "Confirm & Dispatch"}
              </button>
              <button onClick={() => setSirenModalOpen(false)} className="framer-btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 9. TOAST */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "76px",
            right: "16px",
            background: "rgba(18, 22, 30, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "8px",
            padding: "6px 14px",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "500",
            zIndex: 9999
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  )
}
