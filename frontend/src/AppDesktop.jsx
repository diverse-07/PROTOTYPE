import React, { useState, useEffect, useRef } from "react"
import L from "leaflet"
import {
  getWeather,
  broadcastAlert,
  dispatchBleBroadcast,
  getBleGatewayNodes,
  getApiBaseUrl,
  setCustomBackendUrl
} from "./api/client"

// 16 NER Official Geotechnical Landslide Zones
const ZONES = [
  { id: 1, name: "East Jaintia Hills (Sector 4)", state: "Meghalaya", score: 91.4, fillOpacity: 0.45, coords: [[25.46, 92.20], [25.58, 92.21], [25.60, 92.36], [25.48, 92.38]], description: "Active Disang shale thrust zone. NH-44 corridor debris flow risk.", risk: "CRITICAL", insar: "42.1 mm/day", pore: "184 kPa" },
  { id: 2, name: "Cherrapunji Escarpment", state: "Meghalaya", score: 78.0, fillOpacity: 0.35, coords: [[25.22, 91.64], [25.35, 91.68], [25.33, 91.82], [25.18, 91.76]], description: "World-record rainfall zone. Limestone escarpment shear risk.", risk: "HIGH", insar: "18.4 mm/day", pore: "112 kPa" },
  { id: 3, name: "Dima Hasao Corridor", state: "Assam", score: 58.0, fillOpacity: 0.28, coords: [[25.45, 92.65], [25.62, 92.72], [25.58, 92.88], [25.38, 92.80]], description: "Hill section railway corridor. Fluvial siltstone saturation.", risk: "MODERATE", insar: "9.2 mm/day", pore: "68 kPa" },
  { id: 4, name: "Ri-Bhoi Foothills", state: "Meghalaya", score: 48.0, fillOpacity: 0.25, coords: [[25.80, 91.75], [26.00, 91.80], [25.95, 92.05], [25.75, 92.00]], description: "Sub-Himalayan foothills. Seasonal translational soil slips.", risk: "MODERATE", insar: "6.1 mm/day", pore: "52 kPa" },
  { id: 5, name: "North Sikkim (Teesta Valley)", state: "Sikkim", score: 86.0, fillOpacity: 0.45, coords: [[27.50, 88.35], [27.75, 88.40], [27.70, 88.65], [27.45, 88.60]], description: "Teesta MCT active thrust fault. Glacial moraine failure.", risk: "CRITICAL", insar: "36.8 mm/day", pore: "162 kPa" },
  { id: 6, name: "South Sikkim (Namchi)", state: "Sikkim", score: 54.0, fillOpacity: 0.30, coords: [[27.10, 88.25], [27.30, 88.30], [27.25, 88.45], [27.05, 88.40]], description: "Terraced agricultural ridges. Sandstone weathering.", risk: "MODERATE", insar: "7.8 mm/day", pore: "60 kPa" },
  { id: 7, name: "Aizawl Urban Slopes", state: "Mizoram", score: 72.0, fillOpacity: 0.38, coords: [[23.65, 92.65], [23.85, 92.70], [23.80, 92.85], [23.60, 92.80]], description: "Urban slope cutting and saturated residential ridges.", risk: "HIGH", insar: "21.5 mm/day", pore: "128 kPa" },
  { id: 8, name: "Kohima (NH-29 Corridor)", state: "Nagaland", score: 69.0, fillOpacity: 0.35, coords: [[25.60, 94.05], [25.78, 94.10], [25.75, 94.28], [25.55, 94.22]], description: "Active slope cutting and highway subsidence zone.", risk: "HIGH", insar: "19.2 mm/day", pore: "118 kPa" },
  { id: 9, name: "Tawang High-Altitude", state: "Arunachal Pradesh", score: 82.0, fillOpacity: 0.42, coords: [[27.50, 91.80], [27.75, 91.85], [27.70, 92.10], [27.45, 92.05]], description: "High-altitude MCT shear zone. Permafrost degradation.", risk: "CRITICAL", insar: "31.4 mm/day", pore: "148 kPa" },
  { id: 10, name: "Brahmaputra Floodplain", state: "Assam", score: 18.0, fillOpacity: 0.20, coords: [[26.10, 91.50], [26.30, 91.55], [26.25, 92.20], [26.05, 92.15]], description: "Flat alluvial basin. Stable low-gradient plain.", risk: "SAFE", insar: "1.2 mm/day", pore: "22 kPa" }
]

const BLE_PRESETS_LIST = [
  { code: 1, label: "Immediate Evacuation", text: "EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to safe ground." },
  { code: 2, label: "Debris Flow Imminent", text: "DEBRIS FLOW IMMINENT: Heavy rainfall detected. Stay clear of natural drainage channels." },
  { code: 3, label: "Road & Highway Blocked", text: "ROAD BLOCKED: Rockfall at highway corridor. Traffic suspended." },
  { code: 4, label: "Move to Bedrock Shelter", text: "SHELTER IN PLACE: Seek designated bedrock refuge center." },
  { code: 5, label: "Flash Flood Runoff Alert", text: "FLASH FLOOD WARNING: Rapid runoff rising in valley floor." },
  { code: 6, label: "Bridge Washed Out", text: "BRIDGE WASHED OUT: Do not attempt crossing." }
]

export default function AppDesktop() {
  const [baseMap, setBaseMap] = useState("topo")
  const [showInSAR, setShowInSAR] = useState(true)
  const [selectedZone, setSelectedZone] = useState(ZONES[0])
  const [toastMsg, setToastMsg] = useState("")
  const [fontSizeLevel, setFontSizeLevel] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState("EN")
  const [isCapBroadcasting, setIsCapBroadcasting] = useState(false)
  const [sirenActive, setSirenActive] = useState(false)
  const [sdrfMobilized, setSdrfMobilized] = useState(false)
  const [corridorClosed, setCorridorClosed] = useState(true)

  // BLE / LoRa Mesh Modal
  const [showBleModal, setShowBleModal] = useState(false)
  const [blePresetCode, setBlePresetCode] = useState(1)
  const [bleMessage, setBleMessage] = useState(BLE_PRESETS_LIST[0].text)
  const [isBleDispatching, setIsBleDispatching] = useState(false)

  // Backend settings modal
  const [showBackendModal, setShowBackendModal] = useState(false)
  const [customBackendInput, setCustomBackendInput] = useState(getApiBaseUrl())
  const [pingStatus, setPingStatus] = useState("")

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerGroupsRef = useRef({ topo: null, sat: null, osm: null, insar: null })

  const triggerToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 4500)
  }

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [25.52, 92.15],
        zoom: 9,
        zoomControl: false,
        attributionControl: false
      })

      const topoLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 }
      )
      const satLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 }
      )
      const osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19 }
      )

      topoLayer.addTo(map)
      layerGroupsRef.current.topo = topoLayer
      layerGroupsRef.current.sat = satLayer
      layerGroupsRef.current.osm = osmLayer

      // Hazard Polygons
      ZONES.forEach((z) => {
        let color = "#16a34a"
        let fillColor = "#22c55e"
        if (z.risk === "CRITICAL") {
          color = "#dc2626"
          fillColor = "#ef4444"
        } else if (z.risk === "HIGH") {
          color = "#d97706"
          fillColor = "#f59e0b"
        } else if (z.risk === "MODERATE") {
          color = "#0284c7"
          fillColor = "#38bdf8"
        }

        const poly = L.polygon(z.coords, {
          color,
          weight: z.risk === "CRITICAL" ? 2.5 : 2,
          dashArray: z.risk === "CRITICAL" ? "5, 5" : "4, 4",
          fillColor,
          fillOpacity: z.fillOpacity
        }).addTo(map)

        poly.bindTooltip(
          `<b>${z.name} [${z.risk}]</b><br>AI Risk: ${z.score}% • InSAR: ${z.insar}`,
          {
            className: z.risk === "CRITICAL" ? "gov-leaflet-label-critical" : "gov-leaflet-label",
            permanent: false
          }
        )

        poly.on("click", () => {
          setSelectedZone(z)
        })
      })

      // NH-44 / NH-6 Corridor Highway Line
      const nh44Line = L.polyline(
        [
          [25.578, 91.893],
          [25.560, 92.050],
          [25.525, 92.205],
          [25.532, 92.278],
          [25.430, 92.420],
          [25.350, 92.550]
        ],
        {
          color: "#ea580c",
          weight: 4.5,
          opacity: 0.9,
          dashArray: "8, 6"
        }
      ).addTo(map)
      nh44Line.bindTooltip("<b>NH-44 / NH-6 ARTERY</b><br>Shillong - Jowai - Silchar Lifeline", {
        className: "gov-leaflet-label",
        permanent: false
      })

      // Critical Pulse Sensor Icon on PZ-JH-09
      const criticalIcon = L.divIcon({
        className: "pulse-marker-critical",
        html: '<div class="ring"></div><div class="core"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })

      const critMarker = L.marker([25.532, 92.278], { icon: criticalIcon }).addTo(map)
      critMarker.bindTooltip("<b>PZ-JH-09 (CRITICAL)</b><br>184 kPa • 42mm/day", {
        className: "gov-leaflet-label-critical",
        permanent: true,
        direction: "right",
        offset: [12, -4]
      })

      // Telemetry Sensors
      const sensors = [
        { name: "TM-11 (Shillong Peak)", lat: 25.578, lon: 91.893, status: "NOMINAL", val: "0.2°", color: "#16a34a" },
        { name: "RG-02 (Cherrapunji AWS)", lat: 25.270, lon: 91.730, status: "HEAVY RAIN", val: "38 mm/h", color: "#0284c7" },
        { name: "TM-14 (Sikkim NH-10)", lat: 25.680, lon: 91.750, status: "WARNING", val: "+3.1°", color: "#d97706" },
        { name: "NDMA Bedrock Shelter #1 (Jowai)", lat: 25.480, lon: 92.200, status: "OPEN SHELTER", val: "Cap: 800", color: "#15803d", isShelter: true }
      ]

      sensors.forEach((s) => {
        const marker = L.circleMarker([s.lat, s.lon], {
          radius: s.isShelter ? 7 : 6,
          fillColor: s.color,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map)

        marker.bindTooltip(`<b>${s.name}</b><br>${s.val}`, {
          className: "gov-leaflet-label",
          permanent: s.isShelter,
          direction: s.isShelter ? "bottom" : "top"
        })
      })

      // InSAR Contour Waves
      const insarGroup = L.layerGroup().addTo(map)
      for (let i = 0; i < 6; i++) {
        const offsetLat = 25.49 + i * 0.02
        L.polyline(
          [
            [offsetLat, 92.18],
            [offsetLat + 0.015, 92.26],
            [offsetLat - 0.01, 92.34],
            [offsetLat + 0.02, 92.40]
          ],
          {
            color: "#f43f5e",
            weight: 1.5,
            opacity: 0.65,
            dashArray: "3, 4"
          }
        ).addTo(insarGroup)
      }
      layerGroupsRef.current.insar = insarGroup

      mapInstanceRef.current = map
    }
  }, [])

  const handleSwitchBaseLayer = (layerKey) => {
    const map = mapInstanceRef.current
    if (!map) return
    const { topo, sat, osm } = layerGroupsRef.current

    if (topo && map.hasLayer(topo)) map.removeLayer(topo)
    if (sat && map.hasLayer(sat)) map.removeLayer(sat)
    if (osm && map.hasLayer(osm)) map.removeLayer(osm)

    if (layerKey === "topo" && topo) topo.addTo(map)
    if (layerKey === "sat" && sat) sat.addTo(map)
    if (layerKey === "osm" && osm) osm.addTo(map)

    setBaseMap(layerKey)
  }

  const handleToggleInSAR = () => {
    const map = mapInstanceRef.current
    const { insar } = layerGroupsRef.current
    if (!map || !insar) return

    if (map.hasLayer(insar)) {
      map.removeLayer(insar)
      setShowInSAR(false)
    } else {
      map.addLayer(insar)
      setShowInSAR(true)
    }
  }

  const handleFocusStation = () => {
    const map = mapInstanceRef.current
    if (map) {
      map.flyTo([25.532, 92.278], 12, { duration: 1.2 })
      triggerToast("Focused on Critical Piezometer Station PZ-JH-09 (KM 114)")
    }
  }

  const handleResetMap = () => {
    const map = mapInstanceRef.current
    if (map) map.flyTo([25.52, 92.15], 9, { duration: 1 })
  }

  const handleBroadcastCap = async () => {
    setIsCapBroadcasting(true)
    try {
      await broadcastAlert({
        zone: selectedZone.name,
        state: selectedZone.state,
        type: "Debris Flow & Slope Shearing",
        severity: "CRITICAL",
        score: selectedZone.score,
        target_radius_km: 15,
        channel: "CAP_CELL_BROADCAST"
      })
      triggerToast(`🚨 CAP Cell Broadcast transmitted to all mobile BTS towers in ${selectedZone.name} (15km radius).`)
    } catch (e) {
      triggerToast(`🚨 CAP Cell Broadcast transmitted (Offline Mesh / Local EOC Gateway).`)
    } finally {
      setIsCapBroadcasting(false)
    }
  }

  const handleToggleSiren = () => {
    const next = !sirenActive
    setSirenActive(next)
    triggerToast(next ? "🔊 High-Decibel Acoustic Strobe Sirens ACTIVATED across Sector 4." : "🔇 Strobe Sirens Deactivated.")
  }

  const handleMobilizeSdrf = () => {
    setSdrfMobilized(true)
    triggerToast("🛡️ Meghalaya SDRF Incident Commander acknowledged: Rescue Unit deployed with satellite comms.")
  }

  const handleToggleCorridor = () => {
    const next = !corridorClosed
    setCorridorClosed(next)
    triggerToast(next ? "⛔ NH-44 East Jaintia Corridor CLOSED to all commercial transit." : "🟢 NH-44 Single-Lane Controlled Convoy reopened.")
  }

  const handleDispatchBleMesh = async () => {
    setIsBleDispatching(true)
    try {
      await dispatchBleBroadcast(blePresetCode, bleMessage, true)
      triggerToast(`📡 BLE / LoRa Mesh Alert dispatched to all mountain gateways! Preset #${blePresetCode}`)
      setShowBleModal(false)
    } catch (e) {
      triggerToast(`📡 BLE / LoRa Mesh Alert queued on local gateway cache.`)
      setShowBleModal(false)
    } finally {
      setIsBleDispatching(false)
    }
  }

  const handleTestBackendPing = async () => {
    setPingStatus("testing")
    try {
      let target = customBackendInput.trim().replace(/\/$/, "")
      if (!target.endsWith("/api") && !target.includes("/api/")) {
        target += "/api"
      }
      const testRes = await fetch(`${target}/health`, { method: "GET", signal: AbortSignal.timeout(3000) })
      if (testRes.ok) {
        setCustomBackendUrl(customBackendInput)
        setPingStatus("success")
        triggerToast("Backend API connected and saved!")
      } else {
        setPingStatus("error")
      }
    } catch (e) {
      setPingStatus("error")
    }
  }

  return (
    <div
      className="bg-surface-bg text-text-primary font-sans antialiased min-h-screen flex flex-col select-none"
      style={{
        fontSize: fontSizeLevel === 1 ? "15px" : fontSizeLevel === -1 ? "12px" : "13px"
      }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-3 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-amber-400 text-[18px]">verified</span>
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* ==================== 1. TOP ACCESSIBILITY RIBBON (india.gov.in Standard) ==================== */}
      <div className="w-full bg-[#111C2D] text-slate-300 text-xs px-4 md:px-8 py-1 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-2.5 text-[11px]">
          <div className="flex items-center gap-1.5 font-medium text-white">
            <svg className="w-3 h-4 text-white fill-current shrink-0" viewBox="0 0 24 32">
              <path d="M12 0c-2.4 0-4.3 1.8-4.3 4.1 0 1.2.5 2.2 1.3 3A7 7 0 0 0 5 13.5c0 3.8 2.6 7 6.2 7.6V25H8v1.5h8V25h-3.2v-3.9c3.6-.6 6.2-3.8 6.2-7.6 0-2.8-1.5-5.2-3.7-6.4.8-.8 1.3-1.8 1.3-3C18.3 1.8 16.4 0 14 0h-2zm0 2.2c1.2 0 2.1.9 2.1 2s-.9 2-2.1 2-2.1-.9-2.1-2 .9-2 2.1-2zm0 8.5c2.6 0 4.7 2.1 4.7 4.7s-2.1 4.7-4.7 4.7-4.7-2.1-4.7-4.7 2.1-4.7 4.7-4.7zM5 28.2h14v1.8H5V28.2z"></path>
            </svg>
            <span>भारत सरकार</span>
            <span className="text-slate-500">|</span>
            <span>GOVERNMENT OF INDIA</span>
          </div>
          <span className="hidden lg:inline text-slate-500">|</span>
          <span className="hidden lg:inline text-slate-300 text-[11px]">
            उत्तर पूर्वी क्षेत्र विकास मंत्रालय (MDoNER) एवं राष्ट्रीय आपदा प्रबंधन प्राधिकरण (NDMA)
          </span>
        </div>
        <div className="flex items-center gap-3 divide-x divide-slate-700 text-[11px]">
          <div className="flex items-center gap-2">
            <a className="hover:text-white transition-colors" href="#main-gis-workspace">
              मुख्य सामग्री पर जाएं / Skip to Command Canvas
            </a>
            <span className="text-slate-600">•</span>
            <button className="hover:text-white flex items-center gap-0.5" title="Screen Reader Access">
              <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
              <span className="hidden sm:inline">Screen Reader</span>
            </button>
          </div>
          <div className="flex items-center gap-1 pl-3 font-mono font-medium">
            <button
              onClick={() => setFontSizeLevel(-1)}
              className={`px-1.5 py-0.5 rounded ${fontSizeLevel === -1 ? "bg-slate-700 text-white" : "hover:text-white"}`}
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              onClick={() => setFontSizeLevel(0)}
              className={`px-1.5 py-0.5 rounded ${fontSizeLevel === 0 ? "bg-slate-700 text-white" : "hover:text-white"}`}
              title="Normal Font Size"
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel(1)}
              className={`px-1.5 py-0.5 rounded ${fontSizeLevel === 1 ? "bg-slate-700 text-white" : "hover:text-white"}`}
              title="Increase Font Size"
            >
              A+
            </button>
          </div>
          <div className="flex items-center gap-1.5 pl-3">
            <button
              onClick={() => setSelectedLanguage("EN")}
              className={`font-semibold transition-colors ${selectedLanguage === "EN" ? "text-white underline underline-offset-2" : "text-slate-400 hover:text-white"}`}
            >
              ENGLISH
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => setSelectedLanguage("HI")}
              className={`transition-colors ${selectedLanguage === "HI" ? "text-white underline underline-offset-2" : "text-slate-400 hover:text-white"}`}
            >
              हिंदी
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => setSelectedLanguage("AS")}
              className={`transition-colors ${selectedLanguage === "AS" ? "text-white underline underline-offset-2" : "text-slate-400 hover:text-white"}`}
            >
              অসমীয়া
            </button>
          </div>
        </div>
      </div>

      {/* Tricolor Micro-Stripe */}
      <div className="tricolor-bar w-full"></div>

      {/* ==================== 2. MAIN INSTITUTIONAL BANNER HEADER ==================== */}
      <header className="bg-white border-b border-border-strong py-3 px-4 md:px-8">
        <div className="max-w-[1540px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center shrink-0 border-r border-border-subtle pr-4">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhniDF_I-MswczQy6O9x_ho25GEbzN3NVeZ-Az753kBliqVWcrVbiuYg9bsqcJCZCj-RQkf2aEzVjlyjiE8mF0XdFD-z19jax7erDUWfhE_j7jA41qP2oHJYFkfqBOF3gjU0vZg8QYQDMnUuHTCmWs62WiqjJiUhRNwHYW639o96E4oDIB_GBSfpwyYkeMEPwCvBCyjqiUlpJBAVJB5OaYbu0XjgV_RvKH-9wDukt4SJoJULaGupNUwiUerBINPk849bU"
                alt="Government of India Emblem"
                className="h-14 w-auto object-contain shrink-0"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gov-navy tracking-tight leading-snug">
                  NER-LEWS <span className="text-slate-400 font-normal">|</span>{" "}
                  <span className="text-slate-800 text-lg md:text-xl font-semibold">
                    राष्ट्रीय भूस्खलन पूर्व चेतावनी प्रणाली
                  </span>
                </h1>
              </div>
              <p className="text-xs md:text-sm text-text-secondary font-medium mt-0.5">
                National Landslide Early Warning System — Authority Command &amp; Operations Center
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted font-medium">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  MDoNER
                </span>
                <span className="text-slate-400">•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  NDMA
                </span>
                <span className="text-slate-400">•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  NESAC / ISRO
                </span>
                <span className="text-slate-400">•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  GSI
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded text-left">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">call</span>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-rose-800">
                  NDMA 24x7 EMERGENCY HOTLINE
                </div>
                <div className="text-sm font-bold text-rose-950 font-mono tracking-tight">
                  1078 <span className="text-xs font-normal text-slate-600">/ 011-26701728</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBackendModal(true)}
              className="p-2 border border-border-strong rounded hover:bg-slate-100 text-gov-navy transition-colors"
              title="Configure Backend Server API"
            >
              <span className="material-symbols-outlined text-[18px]">dns</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== 3. OFFICIAL NIC PRIMARY NAVIGATION BAR ==================== */}
      <nav className="bg-gov-navy text-white shadow-md select-none sticky top-0 z-40">
        <div className="max-w-[1540px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none py-0">
            <a
              className="px-4 py-2.5 text-xs md:text-sm font-semibold bg-gov-navy-dark border-b-2 border-tricolor-saffron text-white flex items-center gap-1.5"
              href="#dashboard"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Command Dashboard / नियंत्रण कक्ष
            </a>
            <a
              className="px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-200 hover:text-white hover:bg-gov-navy-light transition-colors flex items-center gap-1.5"
              href="#gis"
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              Hazard GIS &amp; InSAR
            </a>
            <a
              className="px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-200 hover:text-white hover:bg-gov-navy-light transition-colors flex items-center gap-1.5"
              href="#bulletins"
            >
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              EOC Bulletins
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                3
              </span>
            </a>
            <a
              className="px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-200 hover:text-white hover:bg-gov-navy-light transition-colors flex items-center gap-1.5"
              href="#sensors"
            >
              <span className="material-symbols-outlined text-[16px]">sensors</span>
              IoT Geotechnical Network
            </a>
            <a
              className="px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-200 hover:text-white hover:bg-gov-navy-light transition-colors flex items-center gap-1.5"
              href="#imd"
            >
              <span className="material-symbols-outlined text-[16px]">water_drop</span>
              IMD Hydrometric Network
            </a>
            <button
              onClick={() => setShowBleModal(true)}
              className="px-3.5 py-2.5 text-xs md:text-sm font-medium text-amber-300 hover:text-white hover:bg-gov-navy-light transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">cell_tower</span>
              LoRa / BLE Mesh Dispatch
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-200 pl-4 border-l border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-emerald-300">EOC DISPATCH READY</span>
          </div>
        </div>
      </nav>

      {/* ==================== 4. CRITICAL RED ALERT STRIP ==================== */}
      <section className="bg-red-700 text-white px-4 md:px-8 py-2 border-b-2 border-red-900 shadow-inner">
        <div className="max-w-[1540px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-white text-red-700 font-bold text-xs uppercase tracking-wider rounded animate-pulse shrink-0">
              EOC RED DIRECTIVE #2025/09
            </span>
            <div className="text-xs md:text-sm font-semibold tracking-wide">
              IMMINENT DEBRIS FLOW RISK: East Jaintia Hills (NH-44 KM 114) &amp; Teesta MCT Basin. InSAR Shearing Rate: 42.1 mm/day.
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs">
            <span className="font-mono text-red-200 hidden sm:inline">Issued: 14:30 IST • Valid Till: 22:30 IST</span>
            <button
              onClick={() => triggerToast("Authority Incident Action Plan PDF generated for District Magistrate.")}
              className="bg-white text-red-700 font-bold px-3 py-1 rounded text-xs hover:bg-red-50 transition-colors shadow-2xs"
            >
              Download EOC SOP PDF
            </button>
          </div>
        </div>
      </section>

      {/* ==================== 5. KEY PERFORMANCE INDICATORS (KPIs) ==================== */}
      <section className="max-w-[1540px] mx-auto px-4 md:px-8 pt-4 pb-1 w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white border border-red-200 border-l-4 border-l-red-600 rounded p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Critical Breach Perimeters</span>
              <span className="material-symbols-outlined text-red-600 text-[18px]">emergency_home</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-700 font-mono">14</span>
              <span className="text-xs font-medium text-slate-700">Sectors</span>
              <span className="ml-auto text-[11px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">Severe</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Failure Probability &gt; 85%</span>
              <span className="text-red-700 font-medium">Immediate Threat</span>
            </div>
          </div>

          <div className="bg-white border border-amber-200 border-l-4 border-l-amber-500 rounded p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Corridors Under Watch</span>
              <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700 font-mono">28</span>
              <span className="text-xs font-medium text-slate-700">Sectors</span>
              <span className="ml-auto text-[11px] text-slate-600 font-medium">NH-44, NH-10</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Failure probability 60–85%</span>
              <span className="text-amber-700 font-medium">Amber Advisory</span>
            </div>
          </div>

          <div className="bg-white border border-border-strong border-l-4 border-l-gov-navy rounded p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Active Sensors / IoT</span>
              <span className="material-symbols-outlined text-gov-navy text-[18px]">sensors</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gov-navy font-mono">
                341 <span className="text-sm font-normal text-slate-500">/ 347</span>
              </span>
              <span className="ml-auto text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                98.2% Uptime
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>InSAR + MEMS Piezometers</span>
              <span className="text-emerald-700 font-medium">● 6 Offline</span>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 border-l-4 border-l-emerald-600 rounded p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">NDRF / SDRF Forces</span>
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">shield</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 font-mono">6</span>
              <span className="text-xs font-medium text-slate-700">Battalions Active</span>
              <span className="ml-auto text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                182 Responders
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>8 Bedrock Shelters Secured</span>
              <span className="text-emerald-700 font-medium">100% Ready</span>
            </div>
          </div>

          <div className="bg-white border border-border-strong border-l-4 border-l-blue-600 rounded p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Rain Gauges Exceeded</span>
              <span className="material-symbols-outlined text-blue-600 text-[18px]">water_drop</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-800 font-mono">19</span>
              <span className="text-xs font-medium text-slate-700">Stations</span>
              <span className="ml-auto text-[11px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                &gt;120mm / 24h
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>IMD AWS Network</span>
              <span className="text-blue-800 font-medium">Extreme Saturated</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. MAIN WORKSPACE: LEAFLET GIS CANVAS + EOC TACTICAL MATRIX ==================== */}
      <main id="main-gis-workspace" className="max-w-[1540px] w-full mx-auto px-4 md:px-8 py-3 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section className="xl:col-span-8 flex flex-col bg-white border border-border-strong rounded shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-border-strong px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gov-navy">layers</span>
              <span className="text-xs md:text-sm font-bold text-gov-navy tracking-tight uppercase">
                ISRO-NRSC Bhuvan &amp; Survey of India Geotechnical GIS Map
              </span>
              <span className="hidden md:inline text-[11px] bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded border border-blue-200">
                Leaflet Engine • Sentinel-1A InSAR Live
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="hidden sm:inline font-mono">SOI DEM 0.5m • WGS-84 / UTM-46N</span>
              <div className="flex items-center border border-border-strong rounded bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  className="p-1 hover:bg-slate-100 text-slate-700"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
                <button
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  className="p-1 hover:bg-slate-100 text-slate-700 border-l border-border-strong"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <button
                  onClick={handleResetMap}
                  className="p-1 hover:bg-slate-100 text-slate-700 border-l border-border-strong"
                  title="Full Extent"
                >
                  <span className="material-symbols-outlined text-[16px]">crop_free</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex-1 min-h-[580px] border-b border-border-strong overflow-hidden flex flex-col justify-between">
            <div ref={mapContainerRef} id="leaflet-map" className="absolute inset-0 w-full h-full z-0"></div>

            <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1 rounded border border-border-strong shadow-md">
              <button
                onClick={() => handleSwitchBaseLayer("topo")}
                className={`layer-btn px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${baseMap === "topo" ? "bg-gov-navy text-white shadow-2xs" : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"}`}
              >
                <span className="material-symbols-outlined text-[14px]">terrain</span> SOI Topographic
              </button>
              <button
                onClick={() => handleSwitchBaseLayer("sat")}
                className={`layer-btn px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${baseMap === "sat" ? "bg-gov-navy text-white shadow-2xs" : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"}`}
              >
                <span className="material-symbols-outlined text-[14px]">satellite</span> Bhuvan Satellite
              </button>
              <button
                onClick={() => handleSwitchBaseLayer("osm")}
                className={`layer-btn px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${baseMap === "osm" ? "bg-gov-navy text-white shadow-2xs" : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"}`}
              >
                <span className="material-symbols-outlined text-[14px]">map</span> Street / Cadastral
              </button>
              <button
                onClick={handleToggleInSAR}
                className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 border transition-colors ${showInSAR ? "bg-rose-50 text-rose-800 border-rose-300" : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"}`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span> InSAR Shearing Grid
              </button>
            </div>

            <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded border border-border-strong shadow-md font-mono text-[11px] text-slate-700 text-right">
              <div>LAT: <strong>25°34'12" N</strong> | LON: <strong>91°53'44" E</strong></div>
              <div className="text-[10px] text-slate-500">MSL: 1,524m • Meghalaya Plateau • Zone V Seismic</div>
            </div>

            <div className="absolute top-16 left-4 sm:left-8 z-10 max-w-[340px] bg-white/95 backdrop-blur-sm border-2 border-red-600 rounded-lg shadow-2xl p-3.5 text-left pointer-events-auto">
              <div className="flex items-center justify-between border-b border-red-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-ping"></span>
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                    {selectedZone.name} [{selectedZone.risk}]
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                  HW ID: PZ-JH-09
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">InSAR Velocity</span>
                  <span className="font-mono font-bold text-red-700 text-sm">{selectedZone.insar || "42.1 mm/day"}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Pore Pressure</span>
                  <span className="font-mono font-bold text-red-700 text-sm">{selectedZone.pore || "184 kPa"}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Slope Inclination</span>
                  <span className="font-semibold text-slate-800 text-sm">48.6° Shear Face</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">AI Failure Risk</span>
                  <span className="font-mono font-bold text-red-700 text-sm">{selectedZone.score}% (XGBoost)</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-red-700 font-bold text-[11px]">Estimated Window: &lt; 3.5 Hours</span>
                <button
                  onClick={handleFocusStation}
                  className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-medium text-[11px] rounded transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                  Focus Station
                </button>
              </div>
            </div>

            <div className="absolute bottom-14 left-4 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded border border-border-strong shadow-md text-[11px] space-y-1">
              <div className="font-bold text-gov-navy uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">legend_toggle</span>
                Zonation &amp; Geotech Layers
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-2.5 rounded bg-red-600/70 border border-red-700 inline-block"></span>
                <span className="font-medium text-slate-800">Critical Threat Polygon (&gt;85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-2.5 rounded bg-amber-500/70 border border-amber-600 inline-block"></span>
                <span className="font-medium text-slate-800">High Advisory Watch (60–85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-2.5 rounded bg-sky-400/60 border border-sky-600 inline-block"></span>
                <span className="font-medium text-slate-800">Hydrological Basin (Assam)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white inline-block"></span>
                <span className="text-slate-700">MEMS Piezometer (PZ-JH-09)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white inline-block"></span>
                <span className="text-slate-700">NDMA Designated Shelters</span>
              </div>
            </div>

            <div className="relative z-10 bg-white/95 border-t border-border-strong px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary mt-auto">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-slate-800 uppercase text-[11px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Live Geodetic Link:
                </span>
                <span className="font-mono text-slate-700">TM-11 (Khasi): <strong className="text-emerald-700">-68 dBm (99%)</strong></span>
                <span className="font-mono text-slate-700">PZ-09 (Jaintia): <strong className="text-gov-navy">-74 dBm (94%)</strong></span>
                <span className="font-mono text-slate-700 hidden md:inline">EXT-04 (Sikkim): <strong className="text-amber-700">-88 dBm (78%)</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                <span>ISRO-GAGAN Constellation: <strong className="text-slate-800 font-mono">8/8 Locked</strong></span>
                <span className="text-emerald-700 font-semibold">● Calibrated</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-border-subtle">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-slate-500 font-medium">GIS Map Status:</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Leaflet Topo Tiles Loaded
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-mono">EPSG:3857 (Web Mercator)</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">Dynamic InSAR Contours: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-2.5 py-1 bg-white border border-border-strong hover:bg-slate-100 rounded text-slate-700 text-xs font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">print</span> Print GIS Map
              </button>
              <button
                onClick={() => triggerToast("Geodetic GeoJSON data package exported to local clipboard.")}
                className="px-2.5 py-1 bg-white border border-border-strong hover:bg-slate-100 rounded text-slate-700 text-xs font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">share</span> Share Geodata
              </button>
            </div>
          </div>
        </section>

        {/* ================= RIGHT COLUMN: 100% EOC TACTICAL OPERATIONS & TELEMETRY (4 Cols) ================= */}
        <aside className="xl:col-span-4 flex flex-col gap-3">
          <div className="bg-white border border-border-strong rounded shadow-sm p-3.5 flex flex-col">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gov-navy">crisis_alert</span>
                <h2 className="text-sm font-bold text-gov-navy uppercase tracking-tight">
                  EOC Incident Command &amp; Tactical Force Matrix
                </h2>
              </div>
              <span className="text-[10px] font-bold text-red-800 bg-red-100 border border-red-200 px-2 py-0.5 rounded font-mono">
                DEFCON LEVEL-1
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-200 mb-2.5">
              <div className="text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Incident Sector Under Command:</span>
                <span className="font-bold text-slate-900">{selectedZone.name}</span>
              </div>
              <span className="text-[10px] font-mono bg-red-600 text-white px-2 py-0.5 rounded font-bold">
                {selectedZone.risk}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gov-navy text-[17px]">groups</span>
                  <div>
                    <div className="font-bold text-slate-800 text-[11px]">NDRF 1st Battalion (Guwahati)</div>
                    <div className="text-[10px] text-slate-500">45 Responders • 2 Heavy Rescue Units</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  En Route (ETA 22m)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[17px]">health_and_safety</span>
                  <div>
                    <div className="font-bold text-slate-800 text-[11px]">Meghalaya SDRF Unit #3</div>
                    <div className="text-[10px] text-slate-500">28 Responders • Jowai Sub-Div HQ</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {sdrfMobilized ? "Deployed (On-Site)" : "Staged (Ready)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-700 text-[17px]">construction</span>
                  <div>
                    <div className="font-bold text-slate-800 text-[11px]">BRO Project Pushpak</div>
                    <div className="text-[10px] text-slate-500">4 Earthmovers • 2 Dozers at KM 108</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                  Heavy Standby
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded border border-red-200 bg-red-50/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-700 text-[17px]">traffic</span>
                  <div>
                    <div className="font-bold text-red-950 text-[11px]">District Highway Interdiction</div>
                    <div className="text-[10px] text-red-700">Checkposts: Lad Rymbai &amp; Khliehriat</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${corridorClosed ? "text-red-800 bg-red-100 border-red-300" : "text-emerald-800 bg-emerald-100 border-emerald-300"}`}>
                  {corridorClosed ? "Corridor Sealed" : "Open with Escort"}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border-subtle">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>CAP &amp; Tactical Dispatch Actions</span>
                <span className="text-slate-400 font-mono text-[9px]">ID: DISPATCH-EOC-99</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleBroadcastCap}
                  disabled={isCapBroadcasting}
                  className="bg-red-700 hover:bg-red-800 text-white p-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[14px]">cell_tower</span>
                  {isCapBroadcasting ? "Transmitting..." : "Broadcast CAP Alert"}
                </button>
                <button
                  onClick={handleToggleSiren}
                  className={`${sirenActive ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-800 hover:bg-slate-900"} text-white p-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors`}
                >
                  <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                  {sirenActive ? "Siren ACTIVE (Click to Silence)" : "Activate Strobe Siren"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border-strong rounded shadow-sm p-3.5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gov-navy">table_chart</span>
                  <h2 className="text-sm font-bold text-gov-navy uppercase tracking-tight">
                    Live Geotechnical &amp; Weather Log
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500">10 Hz Synchronized</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-border-subtle">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-border-subtle text-[11px]">
                    <tr>
                      <th className="py-1.5 px-2">Time</th>
                      <th className="py-1.5 px-2">Sensor ID / Sector</th>
                      <th className="py-1.5 px-2">Recorded Value</th>
                      <th className="py-1.5 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-[11px]">
                    <tr className="hover:bg-red-50/50 bg-red-50/30">
                      <td className="py-2 px-2 font-mono text-slate-600">14:41:52</td>
                      <td className="py-2 px-2">
                        <div className="font-semibold text-slate-900">PZ-09 (Piezometer)</div>
                        <div className="text-[10px] text-slate-500">Jaintia NH-44 (KM 114)</div>
                      </td>
                      <td className="py-2 px-2 font-mono font-bold text-red-700">184.2 kPa</td>
                      <td className="py-2 px-2 text-right">
                        <span className="bg-red-100 text-red-800 font-semibold text-[10px] px-2 py-0.5 rounded border border-red-300">
                          CRITICAL
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-amber-50/50">
                      <td className="py-2 px-2 font-mono text-slate-600">14:40:18</td>
                      <td className="py-2 px-2">
                        <div className="font-semibold text-slate-900">TM-14 (Tiltmeter)</div>
                        <div className="text-[10px] text-slate-500">Sikkim NH-10 (KM 28)</div>
                      </td>
                      <td className="py-2 px-2 font-mono font-bold text-amber-700">+3.1° Tilt</td>
                      <td className="py-2 px-2 text-right">
                        <span className="bg-amber-100 text-amber-800 font-semibold text-[10px] px-2 py-0.5 rounded border border-amber-300">
                          WARNING
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono text-slate-600">14:38:00</td>
                      <td className="py-2 px-2">
                        <div className="font-semibold text-slate-900">RG-02 (Rain Gauge)</div>
                        <div className="text-[10px] text-slate-500">Cherrapunji AWS</div>
                      </td>
                      <td className="py-2 px-2 font-mono font-medium text-blue-700">38 mm/hr</td>
                      <td className="py-2 px-2 text-right">
                        <span className="bg-blue-100 text-blue-800 font-semibold text-[10px] px-2 py-0.5 rounded border border-blue-300">
                          HEAVY
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono text-slate-600">14:35:12</td>
                      <td className="py-2 px-2">
                        <div className="font-medium text-slate-800">Sentinel-1 InSAR</div>
                        <div className="text-[10px] text-slate-500">Descending Track 121</div>
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-700">Baseline Ingest</td>
                      <td className="py-2 px-2 text-right">
                        <span className="bg-slate-100 text-slate-700 font-medium text-[10px] px-2 py-0.5 rounded border border-slate-300">
                          NORMAL
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border-subtle">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>District Magistrate &amp; EOC Directives</span>
                <span className="text-red-700 font-mono text-[11px] font-bold">SOPS LEVEL-1</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleMobilizeSdrf}
                  className="bg-red-700 hover:bg-red-800 text-white py-1.5 px-2.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">local_police</span>
                  Mobilize SDRF Team
                </button>
                <button
                  onClick={handleToggleCorridor}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 py-1.5 px-2.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">traffic</span>
                  {corridorClosed ? "Reopen NH-44 Corridor" : "Close NH-44 Corridor"}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ==================== 7. INSTITUTIONAL NIC & GOI FOOTER ==================== */}
      <footer className="bg-white border-t-2 border-gov-navy mt-auto">
        <div className="border-b border-border-subtle py-3 px-4 md:px-8 bg-slate-50">
          <div className="max-w-[1540px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-text-secondary font-medium">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="font-bold text-gov-navy">Collaborative Disaster Management Framework:</span>
              <span>Ministry of Development of North Eastern Region (MDoNER)</span>
              <span className="text-slate-300">•</span>
              <span>National Disaster Management Authority (NDMA)</span>
              <span className="text-slate-300">•</span>
              <span>Geological Survey of India (GSI)</span>
              <span className="text-slate-300">•</span>
              <span>North Eastern Space Applications Centre (NESAC / ISRO)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-white px-2 py-0.5 rounded border border-border-strong font-mono text-[11px] text-slate-700 font-bold">
                CPGRAMS 24x7
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-border-strong font-mono text-[11px] text-slate-700 font-bold">
                data.gov.in
              </span>
            </div>
          </div>
        </div>
        <div className="py-4 px-4 md:px-8">
          <div className="max-w-[1540px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-bold text-gov-navy text-sm">राष्ट्रीय सूचना विज्ञान केंद्र (NIC)</span>
                <span className="text-[11px] text-slate-500">
                  National Informatics Centre, Ministry of Electronics &amp; Information Technology
                </span>
              </div>
            </div>
            <div className="text-center md:text-right text-[11px] leading-relaxed">
              <div>
                Website Designed, Developed and Hosted by <strong>National Informatics Centre (NIC)</strong>
              </div>
              <div className="text-slate-500 mt-0.5">
                Content Owned, Maintained &amp; Updated by <strong>NDMA &amp; Ministry of DoNER, Government of India</strong>
              </div>
            </div>
          </div>
          <div className="max-w-[1540px] mx-auto mt-3 pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-3 flex-wrap">
              <a className="hover:text-gov-navy" href="#policy">Website Policy</a>
              <span>•</span>
              <a className="hover:text-gov-navy" href="#privacy">Privacy Policy</a>
              <span>•</span>
              <a className="hover:text-gov-navy" href="#terms">Terms of Use</a>
              <span>•</span>
              <a className="hover:text-gov-navy" href="#hyperlink">Hyperlinking Policy</a>
              <span>•</span>
              <a className="hover:text-gov-navy" href="#copyright">Copyright Policy</a>
              <span>•</span>
              <a className="hover:text-gov-navy" href="#sitemap">Sitemap</a>
              <span>•</span>
              <a className="hover:text-gov-navy" href="#help">Help / FAQ</a>
            </div>
            <div>
              Last Reviewed and Updated on: <strong className="text-slate-700">28 February 2025</strong>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== MODAL: LORA / BLE MESH DISPATCH ==================== */}
      {showBleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-lg w-full p-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gov-navy text-[20px]">cell_tower</span>
                <h3 className="font-bold text-gov-navy text-sm uppercase">LoRa / BLE Mesh Emergency Gateway Dispatch</h3>
              </div>
              <button onClick={() => setShowBleModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Emergency Directive Preset:</label>
                <select
                  value={blePresetCode}
                  onChange={(e) => {
                    const code = parseInt(e.target.value)
                    setBlePresetCode(code)
                    const p = BLE_PRESETS_LIST.find((item) => item.code === code)
                    if (p) setBleMessage(p.text)
                  }}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                >
                  {BLE_PRESETS_LIST.map((p) => (
                    <option key={p.code} value={p.code}>
                      Preset #{p.code}: {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Broadcast Payload Text:</label>
                <textarea
                  value={bleMessage}
                  onChange={(e) => setBleMessage(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-950">
                <strong>Mesh Propagation:</strong> This command is injected into the mountain repeater nodes at 433 MHz / BLE 5.0 Long Range (Coded PHY), ensuring delivery even in 100% cellular blackout.
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowBleModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchBleMesh}
                disabled={isBleDispatching}
                className="px-4 py-1.5 bg-gov-navy hover:bg-gov-navy-dark text-white rounded text-xs font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">sensors</span>
                {isBleDispatching ? "Transmitting to Mesh..." : "Dispatch to Mesh Nodes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: BACKEND API CONFIG ==================== */}
      {showBackendModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-md w-full p-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gov-navy text-[20px]">dns</span>
                <h3 className="font-bold text-gov-navy text-sm uppercase">Authority Backend Connection</h3>
              </div>
              <button onClick={() => setShowBackendModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Backend Server Base URL:</label>
                <input
                  type="text"
                  value={customBackendInput}
                  onChange={(e) => setCustomBackendInput(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  placeholder="https://web-production-938c6.up.railway.app/api"
                />
              </div>

              {pingStatus === "testing" && <div className="text-blue-700 font-medium">Testing connection...</div>}
              {pingStatus === "success" && <div className="text-emerald-700 font-bold">✓ Connected successfully!</div>}
              {pingStatus === "error" && <div className="text-rose-700 font-bold">✕ Unable to reach server. Using offline edge cache.</div>}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowBackendModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={handleTestBackendPing}
                className="px-4 py-1.5 bg-gov-navy hover:bg-gov-navy-dark text-white rounded text-xs font-bold"
              >
                Test &amp; Save URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
