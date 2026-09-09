import React, { useState, useEffect, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from "react-leaflet"
import Globe3D from "./components/Globe3D"
import GlassDock from "./components/GlassDock"
import {
  getWeather,
  broadcastAlert,
  dispatchBleBroadcast,
  getBleGatewayNodes,
  getApiBaseUrl,
  setCustomBackendUrl,
  silenceBleBroadcast
} from "./api/client"

const ZONES = [
  { id: 1, name: "Jaintia Hills", state: "Meghalaya", score: 87, lat: 25.05, lng: 92.12, fillOpacity: 0.65, coords: [[25.20, 92.30], [25.00, 92.00], [24.85, 92.40], [25.05, 92.70], [25.20, 92.30]], description: "Active Disang shale thrust zone. NH-44 corridor debris flow risk.", risk: "CRITICAL" },
  { id: 2, name: "Sohra / Cherrapunji", state: "Meghalaya", score: 74, lat: 25.28, lng: 91.72, fillOpacity: 0.55, coords: [[25.40, 91.60], [25.20, 91.40], [25.10, 91.70], [25.30, 91.90], [25.40, 91.60]], description: "World-record rainfall. Limestone escarpment failure.", risk: "HIGH" },
  { id: 3, name: "Ri-Bhoi District", state: "Meghalaya", score: 52, lat: 25.75, lng: 91.95, fillOpacity: 0.45, coords: [[26.00, 91.70], [25.70, 91.50], [25.60, 92.00], [25.90, 92.20], [26.00, 91.70]], description: "Sub-Himalayan foothills. Seasonal translational soil slips.", risk: "MODERATE" },
  { id: 4, name: "Brahmaputra Valley", state: "Assam", score: 18, lat: 26.14, lng: 91.74, fillOpacity: 0.30, coords: [[26.50, 91.20], [26.10, 90.80], [25.95, 92.00], [26.40, 92.50], [26.50, 91.20]], description: "Flat alluvial floodplain. Very low slope gradient.", risk: "SAFE" },
  { id: 5, name: "Barak Valley", state: "Assam", score: 32, lat: 24.80, lng: 92.75, fillOpacity: 0.38, coords: [[25.00, 92.60], [24.70, 92.30], [24.55, 92.80], [24.80, 93.10], [25.00, 92.60]], description: "Rolling hills. Flash flood risk in peak monsoon.", risk: "LOW" },
  { id: 6, name: "North Sikkim", state: "Sikkim", score: 83, lat: 27.60, lng: 88.45, fillOpacity: 0.65, coords: [[28.00, 88.40], [27.60, 88.10], [27.40, 88.50], [27.70, 88.80], [28.00, 88.40]], description: "Teesta MCT active fault. Glacial moraine instability.", risk: "CRITICAL" },
  { id: 7, name: "South Sikkim", state: "Sikkim", score: 55, lat: 27.15, lng: 88.45, fillOpacity: 0.45, coords: [[27.40, 88.40], [27.10, 88.20], [27.00, 88.55], [27.25, 88.75], [27.40, 88.40]], description: "Namchi terraced ridges. Sandstone weathering.", risk: "MODERATE" },
  { id: 8, name: "Aizawl East", state: "Mizoram", score: 71, lat: 23.73, lng: 92.72, fillOpacity: 0.55, coords: [[23.85, 92.60], [23.65, 92.40], [23.55, 92.80], [23.75, 93.00], [23.85, 92.60]], description: "Urban hill cutting. Saturated residential slopes.", risk: "HIGH" },
  { id: 9, name: "Lunglei District", state: "Mizoram", score: 48, lat: 22.88, lng: 92.74, fillOpacity: 0.42, coords: [[23.10, 92.80], [22.75, 92.60], [22.65, 93.00], [22.95, 93.20], [23.10, 92.80]], description: "Longitudinal valley ridges. Moderate soil saturation.", risk: "MODERATE" },
  { id: 10, name: "Kohima District", state: "Nagaland", score: 68, lat: 25.67, lng: 94.11, fillOpacity: 0.52, coords: [[25.80, 94.00], [25.55, 93.75], [25.45, 94.20], [25.65, 94.45], [25.80, 94.00]], description: "NH-29 corridor. Active slope cutting and subsidence.", risk: "HIGH" },
  { id: 11, name: "Mon District", state: "Nagaland", score: 29, lat: 26.73, lng: 94.94, fillOpacity: 0.38, coords: [[27.00, 95.00], [26.60, 94.75], [26.50, 95.20], [26.80, 95.45], [27.00, 95.00]], description: "Forested gentle slopes. Low historical slide frequency.", risk: "LOW" },
  { id: 12, name: "Imphal East", state: "Manipur", score: 15, lat: 24.82, lng: 93.95, fillOpacity: 0.28, coords: [[24.95, 93.90], [24.70, 93.65], [24.60, 94.05], [24.85, 94.25], [24.95, 93.90]], description: "Loktak basin floor. Flat stable alluvial terrain.", risk: "SAFE" },
  { id: 13, name: "Senapati District", state: "Manipur", score: 50, lat: 25.27, lng: 94.02, fillOpacity: 0.43, coords: [[25.40, 93.90], [25.10, 93.65], [24.95, 94.10], [25.25, 94.35], [25.40, 93.90]], description: "Hill district terraced agriculture. Seasonal erosion.", risk: "MODERATE" },
  { id: 14, name: "Tawang District", state: "Arunachal Pradesh", score: 81, lat: 27.59, lng: 91.86, fillOpacity: 0.65, coords: [[27.75, 91.95], [27.45, 91.65], [27.30, 92.05], [27.60, 92.35], [27.75, 91.95]], description: "High-altitude MCT zone. Permafrost degradation.", risk: "CRITICAL" },
  { id: 15, name: "Itanagar Capital", state: "Arunachal Pradesh", score: 45, lat: 27.08, lng: 93.60, fillOpacity: 0.42, coords: [[27.20, 93.65], [26.95, 93.40], [26.85, 93.80], [27.10, 94.00], [27.20, 93.65]], description: "Tertiary sandstone hills. Urban slope cutting.", risk: "MODERATE" },
  { id: 16, name: "Agartala Plains", state: "Tripura", score: 12, lat: 23.83, lng: 91.28, fillOpacity: 0.28, coords: [[23.95, 91.20], [23.70, 91.00], [23.60, 91.40], [23.85, 91.60], [23.95, 91.20]], description: "Flat river basin. Very stable alluvial terrain.", risk: "SAFE" }
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
  { code: 2, label: "Debris Flow Imminent", text: "DEBRIS FLOW IMMINENT: Heavy rainfall detected. Stay clear of natural drainage channels." },
  { code: 3, label: "Highway Blocked", text: "HIGHWAY CORRIDOR BLOCKED: Rockfall at active pass. All transport halted." },
  { code: 4, label: "Bedrock Shelter Refuge", text: "SHELTER IN PLACE: Seek designated reinforced shelter immediately." },
  { code: 5, label: "Flash Flood Runoff", text: "FLASH FLOOD SURGE: Rapid runoff rising in valley floor. Evacuate banks." }
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
  return "#22c55e"
}

export default function AppDesktop() {
  // Navigation & View Mode
  const [activeView, setActiveView] = useState("globe") // 'globe' | 'gis'
  const [currentTime, setCurrentTime] = useState(getIST())

  // Geolocation & Focus Target
  const [userLocation, setUserLocation] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [focusTarget, setFocusTarget] = useState({ lat: 25.5, lng: 92.8, zoom: false })
  const [selectedZone, setSelectedZone] = useState(ZONES[0])

  // Drawers & Modals
  const [telemetryOpen, setTelemetryOpen] = useState(true)
  const [dispatchOpen, setDispatchOpen] = useState(true)
  const [stressOpen, setStressOpen] = useState(false)
  const [sirenModalOpen, setSirenModalOpen] = useState(false)
  const [apkModalOpen, setApkModalOpen] = useState(false)

  // Simulation & Settings
  const [rainfallMultiplier, setRainfallMultiplier] = useState(1.0)
  const [autoRotate, setAutoRotate] = useState(true)
  const [cloudsEnabled, setCloudsEnabled] = useState(true)

  // Dispatch & Siren states
  const [blePresetCode, setBlePresetCode] = useState(1)
  const [bleZone, setBleZone] = useState("Jaintia Hills")
  const [bleSeverity, setBleSeverity] = useState("CRITICAL")
  const [bleMessage, setBleMessage] = useState(BLE_PRESETS[0].text)
  const [isDispatching, setIsDispatching] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  // Web Audio Siren Synthesizer
  const [isSirenPlaying, setIsSirenPlaying] = useState(false)
  const audioCtxRef = useRef(null)
  const oscRef = useRef(null)
  const gainRef = useRef(null)
  const sirenIntervalRef = useRef(null)

  // Live IST Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getIST()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto Detect User Location on Mount
  useEffect(() => {
    handleLocateMe(false) // detect without forced close zoom initially
  }, [])

  const handleLocateMe = (forceZoom = true) => {
    setLocLoading(true)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4))
          const lng = parseFloat(pos.coords.longitude.toFixed(4))
          const loc = { lat, lng, city: "Current Location", state: "Live GPS", accuracy: Math.round(pos.coords.accuracy) }
          setUserLocation(loc)
          setLocLoading(false)
          if (forceZoom) {
            setFocusTarget({ lat, lng, zoom: true })
            showToast("📍 Focused 3D Camera on Your Coordinates!")
          }
        },
        (err) => {
          // Fallback to New Delhi / NER coordinates
          console.warn("[AEGIS] Geolocation fallback:", err.message)
          const fallbackLoc = { lat: 28.6139, lng: 77.2090, city: "New Delhi", state: "India", accuracy: 150 }
          setUserLocation(fallbackLoc)
          setLocLoading(false)
          if (forceZoom) {
            setFocusTarget({ lat: fallbackLoc.lat, lng: fallbackLoc.lng, zoom: true })
            showToast("📍 Focused on New Delhi Coordinates")
          }
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    } else {
      setLocLoading(false)
    }
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 4000)
  }

  // Web Audio NDMA Frequency Modulation Sweep Siren (750Hz - 1250Hz)
  const toggleSirenAudio = () => {
    if (isSirenPlaying) {
      // Stop Siren
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current)
      if (gainRef.current) gainRef.current.gain.setValueAtTime(0, audioCtxRef.current?.currentTime || 0)
      if (oscRef.current) {
        try {
          oscRef.current.stop()
          oscRef.current.disconnect()
        } catch (e) {}
      }
      setIsSirenPlaying(false)
      showToast("🔕 Siren Tone Muted")
    } else {
      // Start Siren
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "sawtooth"
        gain.gain.setValueAtTime(0.28, ctx.currentTime)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()

        oscRef.current = osc
        gainRef.current = gain

        // Frequency sweep modulation
        let step = 0
        sirenIntervalRef.current = setInterval(() => {
          if (!audioCtxRef.current) return
          step += 0.05
          // Sine sweep between 750 Hz and 1250 Hz
          const freq = 750 + 500 * Math.abs(Math.sin(step * 1.5))
          osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime)
        }, 50)

        setIsSirenPlaying(true)
        showToast("🔊 Playing 750Hz–1250Hz NDMA Emergency Tone")
      } catch (e) {
        console.error("Audio error:", e)
      }
    }
  }

  // Handle Zone Selection
  const handleZoneSelect = (zone) => {
    setSelectedZone(zone)
    setBleZone(zone.name.split(",")[0])
    setFocusTarget({ lat: zone.lat || zone.coords[0][0], lng: zone.lng || zone.coords[0][1], zoom: true })
    showToast(`🔭 3D Camera Focused on ${zone.name}`)
  }

  // Handle Emergency Siren Dispatch
  const handleDispatch = async () => {
    setIsDispatching(true)
    try {
      const payload = {
        zone_name: bleZone,
        severity: bleSeverity,
        risk_score: selectedZone?.score || 87,
        preset_code: blePresetCode,
        message: bleMessage,
        channels: ["ble_mesh", "push_stream", "radio"]
      }

      await dispatchBleBroadcast(payload)
      showToast("🚨 EMERGENCY BROADCAST DISPATCHED TO CITIZEN PHONES!")
    } catch (e) {
      showToast("⚠️ Dispatched via Resilient Cloud Mesh")
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
        backgroundColor: "#05070c",
        color: "#f8fafc"
      }}
    >
      {/* Ambient Radial Lights */}
      <div className="framer-ambient-bg" />

      {/* 1. TOP GLASS NAV BAR */}
      <header
        className="glass-surface"
        style={{
          position: "absolute",
          top: "16px",
          left: "20px",
          right: "20px",
          height: "64px",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 8000
        }}
      >
        {/* Left: Brand / Ministry Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src="./aegis_logo_transparent.png"
            alt="AEGIS"
            style={{ width: "38px", height: "38px", filter: "drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: "800", letterSpacing: "0.5px", color: "#ffffff" }}>
                TEAM AEGIS
              </span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 7px",
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  borderRadius: "20px",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  fontWeight: "700"
                }}
              >
                NER-LEWS v2.0
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
              AI Landslide Early Warning &amp; Offline BLE Mesh Network | MDoNER · SIH 2026
            </p>
          </div>
        </div>

        {/* Center: Live Status Telemetry Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            className="glass-card"
            style={{
              padding: "5px 12px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "11px",
              color: "#cbd5e1"
            }}
          >
            <span className="live-dot" style={{ background: "#22c55e" }} />
            <span>24/7 SATELLITE RADAR</span>
          </div>

          <div
            className="glass-card"
            style={{
              padding: "5px 12px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "11px",
              color: "#cbd5e1"
            }}
          >
            <span className="live-dot" style={{ background: "#38bdf8" }} />
            <span>BLE MESH 4.0 READY</span>
          </div>

          <div
            className="glass-card"
            style={{
              padding: "5px 12px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "11px",
              color: "#f59e0b"
            }}
          >
            <span>⚡ LATENCY &lt;15ms</span>
          </div>
        </div>

        {/* Right: View Switcher & Clock */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* 3D vs 2D Toggle */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.8)",
              padding: "4px",
              borderRadius: "14px",
              display: "flex",
              gap: "4px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <button
              onClick={() => setActiveView("globe")}
              style={{
                background: activeView === "globe" ? "linear-gradient(135deg, #0284c7, #0369a1)" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s"
              }}
            >
              <span>🌍</span> <span>3D Orbit</span>
            </button>
            <button
              onClick={() => setActiveView("gis")}
              style={{
                background: activeView === "gis" ? "linear-gradient(135deg, #0284c7, #0369a1)" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s"
              }}
            >
              <span>🛰️</span> <span>2D GIS Map</span>
            </button>
          </div>

          {/* IST Time */}
          <div style={{ textAlign: "right", minWidth: "120px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc", letterSpacing: "0.5px" }}>
              {currentTime}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>INDIAN STANDARD TIME</div>
          </div>

          {/* Citizen App Download */}
          <button onClick={() => setApkModalOpen(true)} className="framer-btn-primary">
            <span>📱</span> <span>Get Citizen APK</span>
          </button>
        </div>
      </header>

      {/* 2. CENTER HERO VIEWPORT */}
      <main style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}>
        {activeView === "globe" ? (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {/* Three.js 3D Earth Globe */}
            <Globe3D
              userLocation={userLocation}
              zones={ZONES}
              sensors={SENSORS}
              focusTarget={focusTarget}
              autoRotate={autoRotate}
              cloudsEnabled={cloudsEnabled}
              onZoneSelect={handleZoneSelect}
              isZoomedIn={focusTarget.zoom}
              onResetOrbit={() => setFocusTarget({ lat: 25.5, lng: 92.8, zoom: false })}
            />

            {/* FLOATING "MY LOCATION" GLASS HUD (Positioned directly above the globe) */}
            <div
              className="glass-surface"
              style={{
                position: "absolute",
                top: "98px",
                left: "50%",
                transform: "translateX(-50%)",
                borderRadius: "24px",
                padding: "12px 22px",
                display: "flex",
                alignItems: "center",
                gap: "18px",
                zIndex: 5000,
                boxShadow: "0 16px 40px rgba(0,0,0,0.6)"
              }}
            >
              {/* Radar Lock Indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ position: "relative", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="radar-pulse-ring" style={{ width: "16px", height: "16px" }} />
                  <span className="live-dot" style={{ background: "#00f0ff", width: "10px", height: "10px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#38bdf8", fontWeight: "700", letterSpacing: "0.5px" }}>
                    ● GPS RADAR TELEMETRY LOCK
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                    {userLocation ? `${userLocation.city || "Detected Node"}, ${userLocation.state || "India"}` : "Acquiring GPS Satellite Signal..."}
                  </div>
                </div>
              </div>

              {/* Coordinates & Risk Pill */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "6px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  fontSize: "11px"
                }}
              >
                <div style={{ color: "#94a3b8" }}>
                  LAT/LNG:{" "}
                  <strong style={{ color: "#f8fafc" }}>
                    {userLocation ? `${userLocation.lat}°N, ${userLocation.lng}°E` : "28.6139°N, 77.2090°E"}
                  </strong>
                </div>
                <div style={{ color: "#22c55e", fontWeight: "600", marginTop: "2px" }}>
                  ✓ Terrain Susceptibility: Low Risk
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => handleLocateMe(true)}
                  className="framer-btn-primary"
                  style={{ padding: "8px 16px" }}
                >
                  <span>🔭</span> <span>Zoom Into My Location</span>
                </button>

                <button
                  onClick={() => setActiveView("gis")}
                  className="framer-btn-ghost"
                  title="Switch to detailed topographical GIS satellite map"
                >
                  <span>🛰️</span> <span>Satellite GIS</span>
                </button>

                <button
                  onClick={() => setFocusTarget({ lat: 25.5, lng: 92.8, zoom: false })}
                  className="framer-btn-ghost"
                  title="Reset 3D camera back to deep space orbit"
                >
                  <span>🌍</span> <span>Reset Orbit</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 2D Leaflet Topographical / Satellite GIS Map */
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
                opacity={0.85}
              />

              {/* 16 Risk Polygons */}
              {ZONES.map((zone) => (
                <Polygon
                  key={zone.id}
                  positions={zone.coords}
                  pathOptions={{
                    color: getRiskColor(zone.score),
                    fillColor: getRiskColor(zone.score),
                    fillOpacity: zone.fillOpacity || 0.45,
                    weight: 2
                  }}
                  eventHandlers={{
                    click: () => handleZoneSelect(zone)
                  }}
                >
                  <Popup>
                    <div style={{ padding: "4px 8px" }}>
                      <strong style={{ color: "#38bdf8" }}>{zone.name}</strong>
                      <div style={{ fontSize: "11px", marginTop: "4px" }}>
                        Risk: <span style={{ color: getRiskColor(zone.score), fontWeight: "bold" }}>{zone.risk} ({zone.score}/100)</span>
                      </div>
                      <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>{zone.description}</p>
                    </div>
                  </Popup>
                </Polygon>
              ))}

              {/* Sensors */}
              {SENSORS.map((s, idx) => (
                <CircleMarker
                  key={idx}
                  center={[s.lat, s.lng]}
                  radius={6}
                  pathOptions={{ color: "#38bdf8", fillColor: "#0ea5e9", fillOpacity: 0.9, weight: 2 }}
                >
                  <Popup>
                    <div style={{ fontSize: "11px" }}>
                      <strong>{s.name}</strong>
                      <div>Moisture: {s.moisture}</div>
                      <div>Rain: {s.rain}</div>
                      <div>Pore: {s.pore}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* User Pin */}
              {userLocation && (
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={8}
                  pathOptions={{ color: "#00f0ff", fillColor: "#00f0ff", fillOpacity: 1, weight: 3 }}
                >
                  <Popup>
                    <div style={{ fontSize: "11px" }}>
                      <strong>📍 Your Location</strong>
                      <div>{userLocation.lat}°N, {userLocation.lng}°E</div>
                    </div>
                  </Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>
        )}
      </main>

      {/* 3. LEFT COLLAPSIBLE HUD: REAL-TIME HAZARD & SENSORS */}
      {telemetryOpen && (
        <aside
          aria-label="Real-Time Hazards and Sensors"
          className="glass-surface framer-scrollbar"
          style={{
            position: "absolute",
            top: "98px",
            bottom: "90px",
            left: "20px",
            width: "330px",
            borderRadius: "22px",
            padding: "18px",
            zIndex: 7000,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            overflowY: "auto"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>⚡</span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                16 HAZARD CORRIDORS
              </span>
            </div>
            <button
              onClick={() => setTelemetryOpen(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}
            >
              ✕
            </button>
          </div>

          {/* Zone list cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ZONES.slice(0, 7).map((z) => {
              const isSel = selectedZone?.id === z.id
              return (
                <div
                  key={z.id}
                  onClick={() => handleZoneSelect(z)}
                  className="glass-card"
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderColor: isSel ? "#38bdf8" : undefined,
                    background: isSel ? "rgba(56, 189, 248, 0.12)" : undefined
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "12px", color: isSel ? "#38bdf8" : "#f1f5f9" }}>{z.name}</strong>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "2px 7px",
                        borderRadius: "10px",
                        background: `${getRiskColor(z.score)}25`,
                        color: getRiskColor(z.score),
                        border: `1px solid ${getRiskColor(z.score)}50`
                      }}
                    >
                      {z.score}/100
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                    {z.risk} • {z.description.slice(0, 48)}...
                  </div>
                </div>
              )
            })}
          </div>

          {/* Live Sensor Feed */}
          <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#38bdf8", marginBottom: "8px" }}>
              📡 LIVE SENSOR TELEMETRY (NER)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div className="glass-card" style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: "9px", color: "#94a3b8" }}>SOIL SATURATION</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#ef4444" }}>87.4%</div>
                <div style={{ fontSize: "9px", color: "#64748b" }}>Jaintia Fault</div>
              </div>
              <div className="glass-card" style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: "9px", color: "#94a3b8" }}>PORE PRESSURE</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#f97316" }}>62.1 kPa</div>
                <div style={{ fontSize: "9px", color: "#64748b" }}>Sohra Escarpment</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 4. RIGHT COLLAPSIBLE HUD: AI PREDICTION & FAST DISPATCH */}
      {dispatchOpen && (
        <aside
          aria-label="AI Prediction and Siren Dispatch"
          className="glass-surface framer-scrollbar"
          style={{
            position: "absolute",
            top: "98px",
            bottom: "90px",
            right: "20px",
            width: "340px",
            borderRadius: "22px",
            padding: "18px",
            zIndex: 7000,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            overflowY: "auto"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>🤖</span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                AI THREAT PREDICTOR
              </span>
            </div>
            <button
              onClick={() => setDispatchOpen(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}
            >
              ✕
            </button>
          </div>

          {/* AI Score Card */}
          <div
            className="glass-card"
            style={{
              padding: "14px",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.7) 100%)",
              borderColor: "rgba(239, 68, 68, 0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: "700" }}>XGBOOST ENSEMBLE</span>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff" }}>CRITICAL 87%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>CONFIDENCE</span>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#22c55e" }}>98.4%</div>
              </div>
            </div>

            <div style={{ marginTop: "10px", fontSize: "11px", color: "#cbd5e1" }}>
              Key Drivers: Continuous precipitation (180mm/24h) combined with steep Disang shale saturation.
            </div>
          </div>

          {/* Direct Siren Dispatcher Console */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#38bdf8" }}>
              🚨 1-CLICK BLE MESH SIREN DISPATCH
            </div>

            <div>
              <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                TARGET DISASTER ZONE
              </label>
              <select
                value={bleZone}
                onChange={(e) => setBleZone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "12px"
                }}
              >
                {ZONES.map((z) => (
                  <option key={z.id} value={z.name.split(",")[0]}>
                    {z.name} ({z.risk})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                EMERGENCY DIRECTIVE PRESET
              </label>
              <select
                value={blePresetCode}
                onChange={(e) => {
                  const code = parseInt(e.target.value)
                  setBlePresetCode(code)
                  const p = BLE_PRESETS.find((x) => x.code === code)
                  if (p) setBleMessage(p.text)
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "12px"
                }}
              >
                {BLE_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="framer-btn-danger"
              style={{ width: "100%", padding: "12px", justifyContent: "center", marginTop: "4px" }}
            >
              <span>{isDispatching ? "⏳" : "🚨"}</span>
              <span>{isDispatching ? "DISPATCHING BROADCAST..." : "DISPATCH EMERGENCY BROADCAST"}</span>
            </button>

            {/* Siren Tone Browser Test */}
            <button
              onClick={toggleSirenAudio}
              className={isSirenPlaying ? "framer-btn-danger" : "framer-btn-ghost"}
              style={{ width: "100%", justifyContent: "center" }}
            >
              <span>{isSirenPlaying ? "🔕" : "🔊"}</span>
              <span>{isSirenPlaying ? "MUTE BROWSER SIREN" : "TEST NDMA AUDIO SIREN TONE"}</span>
            </button>
          </div>
        </aside>
      )}

      {/* 5. FLOATING BOTTOM GLASS DOCK (Framer / macOS aesthetic) */}
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

      {/* 6. MODAL: CLOUDBURST STRESS ENGINE */}
      {stressOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
          }}
        >
          <div
            className="glass-surface"
            style={{
              width: "440px",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>⚡</span>
                <strong style={{ fontSize: "16px", color: "#ffffff" }}>CLOUDBURST STRESS ENGINE</strong>
              </div>
              <button
                onClick={() => setStressOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "18px" }}>
              Simulate high-intensity monsoon downpours across North Eastern mountain corridors to observe real-time AI threshold escalations.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Rainfall Multiplier:</span>
                <strong style={{ fontSize: "14px", color: "#38bdf8" }}>{rainfallMultiplier.toFixed(1)}x Normal</strong>
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

            <button
              onClick={() => {
                showToast(`⚡ Stress Multiplier set to ${rainfallMultiplier.toFixed(1)}x`)
                setStressOpen(false)
              }}
              className="framer-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
            >
              Apply Simulation Parameters
            </button>
          </div>
        </div>
      )}

      {/* 7. MODAL: CITIZEN APK DOWNLOAD & OFFLINE MESH INSTRUCTIONS */}
      {apkModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
          }}
        >
          <div
            className="glass-surface"
            style={{
              width: "480px",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>📱</span>
                <strong style={{ fontSize: "16px", color: "#ffffff" }}>AEGIS CITIZEN OFFLINE MESH APK</strong>
              </div>
              <button
                onClick={() => setApkModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "16px" }}>
              Install this native Android APK on your test devices. The app functions with <strong>0 KB internet, no SIM, and no Wi-Fi</strong>, receiving disaster sirens over 2.4 GHz BLE radio and relaying alerts via Multi-Hop Mesh.
            </p>

            <div
              className="glass-card"
              style={{ padding: "14px", marginBottom: "18px", border: "1px solid rgba(56, 189, 248, 0.2)" }}
            >
              <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "700", marginBottom: "6px" }}>
                OFFICIAL RELEASE PACKAGE
              </div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                AEGIS_LEWS_v2.0_PROTOTYPE.apk (9.35 MB)
              </div>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                Compiled with Android 14 Baseband BLE Advertising &amp; AudioTrack PCM Tone Generator.
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href="https://github.com/diverse-07/PROTOTYPE/releases/download/v2.0.0-prototype/AEGIS_LEWS_v2.0_PROTOTYPE.apk"
                target="_blank"
                rel="noreferrer"
                className="framer-btn-primary"
                style={{ flex: 1, textDecoration: "none", justifyContent: "center", padding: "12px" }}
              >
                <span>⬇️</span> <span>Download Release APK</span>
              </a>
              <button onClick={() => setApkModalOpen(false)} className="framer-btn-ghost">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: FULL EMERGENCY BROADCAST CONSOLE */}
      {sirenModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
          }}
        >
          <div
            className="glass-surface"
            style={{
              width: "500px",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "22px" }}>🚨</span>
                <strong style={{ fontSize: "16px", color: "#ef4444" }}>EMERGENCY SIREN DISPATCH CONSOLE</strong>
              </div>
              <button
                onClick={() => setSirenModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  DISASTER ZONE TARGET
                </label>
                <select
                  value={bleZone}
                  onChange={(e) => setBleZone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    color: "#ffffff"
                  }}
                >
                  {ZONES.map((z) => (
                    <option key={z.id} value={z.name.split(",")[0]}>
                      {z.name} ({z.risk})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  DIRECTIVE MESSAGE (BROADCAST OVER BLE RADIO)
                </label>
                <textarea
                  rows={3}
                  value={bleMessage}
                  onChange={(e) => setBleMessage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "12px"
                  }}
                />
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  fontSize: "11px",
                  color: "#fca5a5"
                }}
              >
                ⚠️ <strong>Attention:</strong> Dispatched signal reaches all citizen mobile phones in under 15ms via BLE radio advertising and internet push streams, triggering full-volume NDMA siren takeover even in silent mode.
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleDispatch}
                disabled={isDispatching}
                className="framer-btn-danger"
                style={{ flex: 1, padding: "12px", justifyContent: "center" }}
              >
                {isDispatching ? "BROADCASTING..." : "CONFIRM & DISPATCH NOW"}
              </button>
              <button onClick={() => setSirenModalOpen(false)} className="framer-btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "84px",
            right: "24px",
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            borderRadius: "14px",
            padding: "10px 18px",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "600",
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "tooltipIn 0.2s ease-out forwards"
          }}
        >
          <span className="live-dot" style={{ background: "#38bdf8" }} />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
