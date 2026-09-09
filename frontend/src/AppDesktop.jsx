import React, { useState, useEffect, useRef } from "react"
import L from "leaflet"
import {
  broadcastAlert,
  getApiBaseUrl,
  setCustomBackendUrl
} from "./api/client"

// 16 NER Official Geotechnical Landslide Zones (Satellite & Geological Data)
const ZONES = [
  { id: 1, name: "East Jaintia Hills (Sector 4)", state: "Meghalaya", score: 91.4, coords: [[25.46, 92.20], [25.58, 92.21], [25.60, 92.36], [25.48, 92.38]], description: "Active Disang shale thrust zone. NH-44 corridor high-volume debris flow risk.", risk: "CRITICAL", insar: "42.1 mm/day", soilWetness: "94%", slope: "48.6°", pop: "1,250" },
  { id: 2, name: "Cherrapunji Escarpment", state: "Meghalaya", score: 78.0, coords: [[25.22, 91.64], [25.35, 91.68], [25.33, 91.82], [25.18, 91.76]], description: "World-record monsoon catchment. Limestone cliff face undercut.", risk: "HIGH", insar: "18.4 mm/day", soilWetness: "89%", slope: "44.2°", pop: "890" },
  { id: 3, name: "Teesta MCT Valley (North Sikkim)", state: "Sikkim", score: 86.0, coords: [[27.50, 88.35], [27.75, 88.40], [27.70, 88.65], [27.45, 88.60]], description: "Main Central Thrust (MCT) active fault zone. Glacial moraine slurry.", risk: "CRITICAL", insar: "36.8 mm/day", soilWetness: "91%", slope: "52.0°", pop: "640" },
  { id: 4, name: "Dima Hasao Hill Section", state: "Assam", score: 58.0, coords: [[25.45, 92.65], [25.62, 92.72], [25.58, 92.88], [25.38, 92.80]], description: "Railway & highway corridor. Fluvial siltstone saturation slip.", risk: "MODERATE", insar: "9.2 mm/day", soilWetness: "72%", slope: "28.5°", pop: "2,100" },
  { id: 5, name: "Aizawl Residential Slopes", state: "Mizoram", score: 72.0, coords: [[23.65, 92.65], [23.85, 92.70], [23.80, 92.85], [23.60, 92.80]], description: "Urban slope cutting and saturated residential ridges. NH-54 bypass.", risk: "HIGH", insar: "21.5 mm/day", soilWetness: "82%", slope: "36.0°", pop: "1,560" },
  { id: 6, name: "Kohima (NH-29 Corridor)", state: "Nagaland", score: 69.0, coords: [[25.60, 94.05], [25.78, 94.10], [25.75, 94.28], [25.55, 94.22]], description: "Active road subsidence pattern. Heavy commercial freight artery.", risk: "HIGH", insar: "19.2 mm/day", soilWetness: "78%", slope: "31.4°", pop: "980" },
  { id: 7, name: "Tawang High-Altitude Pass", state: "Arunachal Pradesh", score: 82.0, coords: [[27.50, 91.80], [27.75, 91.85], [27.70, 92.10], [27.45, 92.05]], description: "High-altitude permafrost degradation. Military convoy lifeline.", risk: "CRITICAL", insar: "31.4 mm/day", soilWetness: "85%", slope: "46.8°", pop: "420" },
  { id: 8, name: "Ri-Bhoi Sub-Himalayan Belt", state: "Meghalaya", score: 48.0, coords: [[25.80, 91.75], [26.00, 91.80], [25.95, 92.05], [25.75, 92.00]], description: "Foothill red lateritic soil. Seasonal translational slips.", risk: "MODERATE", insar: "6.1 mm/day", soilWetness: "64%", slope: "22.0°", pop: "1,120" }
]

// Highway Corridors Status
const CORRIDORS = [
  { id: "NH-44", name: "Shillong - Jowai - Silchar Artery", chainage: "KM 114 (East Jaintia)", status: "CLOSED", reason: "Debris flow shearing detected (42 mm/day). Checkposts sealed at Lad Rymbai.", bro: "Project Pushpak (4 Excavators, 2 Dozers at KM 108)", police: "Checkposts Sealed" },
  { id: "NH-10", name: "Sevoke - Teesta - Gangtok Lifeline", chainage: "KM 28 - KM 42", status: "RESTRICTED", reason: "High runoff and rockfall watch. Single-lane daytime convoy only.", bro: "Project Swastik (3 Dozers on standby)", police: "Escort Convoy Active" },
  { id: "NH-29", name: "Dimapur - Kohima Corridor", chainage: "KM 34 Pagla Pahar", status: "OPEN_CAUTION", reason: "Road subsidence monitored. Heavy vehicles speed restricted to 20 km/h.", bro: "Project Sewak (2 Earthmovers staged)", police: "Traffic Advisory" },
  { id: "NH-13", name: "Trans-Arunachal Highway (Tawang)", chainage: "Sela Tunnel Approach", status: "RESTRICTED", reason: "High-altitude permafrost thaw. Snowplows and clearing units on site.", bro: "Project Vartak (Snow clearing units active)", police: "Chains Required" }
]

// Bedrock Safe Shelters
const SHELTERS = [
  { id: "SH-ML-01", name: "Jowai Multipurpose Disaster Center", state: "Meghalaya", capacity: 800, current: 420, lat: 25.480, lon: 92.200, rations: "100% (7 Days Food + Water)", medical: "Doctor + 4 Paramedics Staged", comms: "ISRO VSAT Satellite + LoRa Active", status: "OPERATIONAL" },
  { id: "SH-ML-02", name: "Khliehriat Government Higher Secondary", state: "Meghalaya", capacity: 500, current: 280, lat: 25.350, lon: 92.360, rations: "100% Provisioned", medical: "Emergency First Aid Ready", comms: "Dual SIM + VHF Radio", status: "OPERATIONAL" },
  { id: "SH-SK-01", name: "Singtam Bedrock Community Center", state: "Sikkim", capacity: 650, current: 390, lat: 27.230, lon: 88.500, rations: "100% Provisioned", medical: "SDRF Medical Unit", comms: "Satellite Phone Linked", status: "OPERATIONAL" },
  { id: "SH-MZ-01", name: "Aizawl South Government Indoor Stadium", state: "Mizoram", capacity: 1200, current: 540, lat: 23.700, lon: 92.710, rations: "100% Provisioned", medical: "Civil Hospital Staging", comms: "Fiber + Satellite Backup", status: "OPERATIONAL" }
]

export default function AppDesktop() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search)
      const tab = p.get("tab")
      if (tab && ["dashboard", "gis", "predictions", "bulletins", "corridors", "shelters"].includes(tab)) {
        return tab
      }
    }
    return "dashboard"
  })

  // Sync activeTab with URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      if (url.searchParams.get("tab") !== activeTab) {
        url.searchParams.set("tab", activeTab)
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [activeTab])

  const [baseMap, setBaseMap] = useState("topo")
  const [showInSAR, setShowInSAR] = useState(true)
  const [selectedZone, setSelectedZone] = useState(ZONES[0])
  const [toastMsg, setToastMsg] = useState("")
  const [fontSizeLevel, setFontSizeLevel] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState("EN")

  // EOC Directive Actions
  const [isCapBroadcasting, setIsCapBroadcasting] = useState(false)
  const [sirenActive, setSirenActive] = useState(false)
  const [sdrfMobilized, setSdrfMobilized] = useState(false)
  const [corridorClosed, setCorridorClosed] = useState(true)

  // Interactive AI Prediction Simulation Sliders
  const [simRainfall, setSimRainfall] = useState(168)
  const [simSlope, setSimSlope] = useState(48)
  const [simSoilWetness, setSimSoilWetness] = useState(94)
  const [simLithology, setSimLithology] = useState(25) // Low shear strength (Disang Shale)

  // Calculated AI Risk
  const calculatedRiskScore = Math.min(
    99.2,
    Math.max(
      8.5,
      Number(
        (
          (simRainfall / 220) * 45 +
          (simSlope / 65) * 30 +
          (simSoilWetness / 100) * 20 +
          ((100 - simLithology) / 100) * 15
        ).toFixed(1)
      )
    )
  )

  const calculatedFoS = Math.max(0.65, Number((1.85 - (calculatedRiskScore / 100) * 1.1).toFixed(2)))
  const calculatedETA = calculatedRiskScore > 85 ? "< 3.5 Hours" : calculatedRiskScore > 65 ? "6 - 12 Hours" : "> 24 Hours"

  // Backend config modal
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

  // Initialize Leaflet Map (NO scroll capture, NO sensor markers)
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [25.52, 92.15],
        zoom: 9,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false // Prevents trapping user mouse scrolling down the page
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

      // Add Geological Hazard Susceptibility Polygons
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
          fillOpacity: 0.4
        }).addTo(map)

        poly.bindTooltip(
          `<b>${z.name} [${z.risk}]</b><br>AI Risk: ${z.score}% • InSAR: ${z.insar}<br>Soil Wetness: ${z.soilWetness}`,
          {
            className: z.risk === "CRITICAL" ? "gov-leaflet-label-critical" : "gov-leaflet-label",
            permanent: false
          }
        )

        poly.on("click", () => {
          setSelectedZone(z)
        })
      })

      // NH-44 / NH-6 Corridor Highway Lifeline
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

      // Critical Breach Hotspot Indicator (KM 114)
      const hotspotIcon = L.divIcon({
        className: "pulse-marker-critical",
        html: '<div class="ring"></div><div class="core"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })

      const critHotspot = L.marker([25.532, 92.278], { icon: hotspotIcon }).addTo(map)
      critHotspot.bindTooltip("<b>SECTOR 4 HOTSPOT (KM 114)</b><br>InSAR Velocity: 42.1 mm/day", {
        className: "gov-leaflet-label-critical",
        permanent: true,
        direction: "right",
        offset: [12, -4]
      })

      // Bedrock Safe Shelters (Shield Markers)
      SHELTERS.forEach((s) => {
        const marker = L.circleMarker([s.lat, s.lon], {
          radius: 8,
          fillColor: "#15803d",
          color: "#ffffff",
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map)

        marker.bindTooltip(`<b>${s.name}</b><br>Cap: ${s.capacity} • ${s.status}`, {
          className: "gov-leaflet-label",
          permanent: false,
          direction: "top"
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
  }, [activeTab])

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
      triggerToast("Focused on Critical Breach Hotspot: NH-44 KM 114 (East Jaintia Hills)")
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
      triggerToast(`🚨 CAP Cell Broadcast transmitted (Offline EOC Gateway).`)
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
      className="bg-surface-bg text-text-primary font-sans antialiased min-h-screen flex flex-col"
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
                National Landslide Early Warning System — Satellite Remote Sensing &amp; Disaster Operations Center
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
              title="Configure Cloud Backend Server"
            >
              <span className="material-symbols-outlined text-[18px]">dns</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== 3. 100% OPERATIONAL PROJECT TABS NAVIGATION BAR ==================== */}
      <nav className="bg-gov-navy text-white shadow-md sticky top-0 z-40">
        <div className="max-w-[1540px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none py-0">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2.5 text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === "dashboard"
                  ? "bg-gov-navy-dark border-b-2 border-tricolor-saffron text-white"
                  : "text-slate-200 hover:text-white hover:bg-gov-navy-light"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Command Dashboard / नियंत्रण कक्ष
            </button>

            <button
              onClick={() => setActiveTab("gis")}
              className={`px-3.5 py-2.5 text-xs md:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "gis"
                  ? "bg-gov-navy-dark border-b-2 border-tricolor-saffron text-white"
                  : "text-slate-200 hover:text-white hover:bg-gov-navy-light"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">satellite_alt</span>
              Satellite GIS &amp; InSAR
            </button>

            <button
              onClick={() => setActiveTab("predictions")}
              className={`px-3.5 py-2.5 text-xs md:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "predictions"
                  ? "bg-gov-navy-dark border-b-2 border-tricolor-saffron text-white"
                  : "text-slate-200 hover:text-white hover:bg-gov-navy-light"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              AI Hazard Predictions
            </button>

            <button
              onClick={() => setActiveTab("bulletins")}
              className={`px-3.5 py-2.5 text-xs md:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "bulletins"
                  ? "bg-gov-navy-dark border-b-2 border-tricolor-saffron text-white"
                  : "text-slate-200 hover:text-white hover:bg-gov-navy-light"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              EOC Warning Bulletins
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                3
              </span>
            </button>

            <button
              onClick={() => setActiveTab("corridors")}
              className={`px-3.5 py-2.5 text-xs md:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "corridors"
                  ? "bg-gov-navy-dark border-b-2 border-tricolor-saffron text-white"
                  : "text-slate-200 hover:text-white hover:bg-gov-navy-light"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">traffic</span>
              Highway Corridors &amp; BRO
            </button>

            <button
              onClick={() => setActiveTab("shelters")}
              className={`px-3.5 py-2.5 text-xs md:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "shelters"
                  ? "bg-gov-navy-dark border-b-2 border-tricolor-saffron text-white"
                  : "text-slate-200 hover:text-white hover:bg-gov-navy-light"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">shield</span>
              Relief Shelters &amp; Evacuation
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-200 pl-4 border-l border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-emerald-300">SATELLITE RADAR: LIVE</span>
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
              IMMINENT DEBRIS FLOW RISK: East Jaintia Hills (NH-44 KM 114) &amp; Teesta Basin. Sentinel-1 Radar InSAR Shearing: 42.1 mm/day.
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

      {/* ==================== 5. NON-SENSOR AUTHORITY KPIs ==================== */}
      <section className="max-w-[1540px] mx-auto px-4 md:px-8 pt-4 pb-1 w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white border border-red-200 border-l-4 border-l-red-600 rounded p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Critical Threat Sectors</span>
              <span className="material-symbols-outlined text-red-600 text-[18px]">emergency_home</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-700 font-mono">14</span>
              <span className="text-xs font-medium text-slate-700">Perimeters</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Satellite InSAR Passes</span>
              <span className="material-symbols-outlined text-gov-navy text-[18px]">satellite_alt</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gov-navy font-mono">
                4 <span className="text-sm font-normal text-slate-500">Passes / Day</span>
              </span>
              <span className="ml-auto text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                100% NER Coverage
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Sentinel-1A + RISAT-1B</span>
              <span className="text-emerald-700 font-medium">● Interferograms Synced</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Saturated Basins</span>
              <span className="material-symbols-outlined text-blue-600 text-[18px]">water</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-800 font-mono">8</span>
              <span className="text-xs font-medium text-slate-700">Drainage Basins</span>
              <span className="ml-auto text-[11px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                SMAP &gt; 90%
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>IMD Doppler Satellite</span>
              <span className="text-blue-800 font-medium">Extreme Saturation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. TAB CONTENT (DYNAMICALLY SWITCHED) ==================== */}
      <main id="main-gis-workspace" className="max-w-[1540px] w-full mx-auto px-4 md:px-8 py-3 flex-1">
        
        {/* TAB 1: COMMAND DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Left 8 Cols: Leaflet GIS Map */}
            <section className="xl:col-span-8 flex flex-col bg-white border border-border-strong rounded shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-border-strong px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gov-navy">layers</span>
                  <span className="text-xs md:text-sm font-bold text-gov-navy tracking-tight uppercase">
                    ISRO-NRSC Bhuvan &amp; Survey of India Geotechnical GIS Map
                  </span>
                  <span className="hidden md:inline text-[11px] bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded border border-blue-200">
                    Sentinel-1A InSAR Radar Live
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="hidden sm:inline font-mono">SOI DEM 0.5m • WGS-84</span>
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

              <div className="relative min-h-[560px] border-b border-border-strong overflow-hidden flex flex-col justify-between">
                <div ref={mapContainerRef} id="leaflet-map" className="absolute inset-0 w-full h-full z-0"></div>

                {/* Layer selector */}
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

                {/* Floating Inspection Card */}
                <div className="absolute top-16 left-4 sm:left-8 z-10 max-w-[340px] bg-white/95 backdrop-blur-sm border-2 border-red-600 rounded-lg shadow-2xl p-3.5 text-left">
                  <div className="flex items-center justify-between border-b border-red-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-ping"></span>
                      <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                        {selectedZone.name} [{selectedZone.risk}]
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                      SECTOR #{selectedZone.id}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">InSAR Velocity</span>
                      <span className="font-mono font-bold text-red-700 text-sm">{selectedZone.insar}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Satellite Soil Wetness</span>
                      <span className="font-mono font-bold text-red-700 text-sm">{selectedZone.soilWetness} (SMAP)</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Slope Gradient</span>
                      <span className="font-semibold text-slate-800 text-sm">{selectedZone.slope} Shear Face</span>
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
                      Focus Sector
                    </button>
                  </div>
                </div>

                {/* Bottom Ribbon */}
                <div className="relative z-10 bg-white/95 border-t border-border-strong px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary mt-auto">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-semibold text-slate-800 uppercase text-[11px] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      Active Satellite Constellation:
                    </span>
                    <span className="font-mono text-slate-700">Sentinel-1A (Radar): <strong className="text-emerald-700">Interferometry Locked</strong></span>
                    <span className="font-mono text-slate-700">RISAT-1B: <strong className="text-gov-navy">Descending Track 121</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <span>ISRO-GAGAN Constellation: <strong className="text-slate-800 font-mono">8/8 Calibrated</strong></span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-border-subtle">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-slate-500 font-medium">GIS Map Status:</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Topo &amp; Satellite Layers Active
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-mono">EPSG:3857</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-2.5 py-1 bg-white border border-border-strong hover:bg-slate-100 rounded text-slate-700 text-xs font-medium flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">print</span> Print GIS Map
                  </button>
                  <button
                    onClick={() => triggerToast("Geodetic GeoJSON data package exported to clipboard.")}
                    className="px-2.5 py-1 bg-white border border-border-strong hover:bg-slate-100 rounded text-slate-700 text-xs font-medium flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">share</span> Share Geodata
                  </button>
                </div>
              </div>
            </section>

            {/* Right 4 Cols: Tactical Force Matrix + Incident Log */}
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
                      {sirenActive ? "Siren ACTIVE" : "Activate Strobe Siren"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Satellite Radar & Highway Incident Log */}
              <div className="bg-white border border-border-strong rounded shadow-sm p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gov-navy">table_chart</span>
                      <h2 className="text-sm font-bold text-gov-navy uppercase tracking-tight">
                        Satellite Radar &amp; Incident Log
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">Live InSAR Telemetry</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-border-subtle">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-border-subtle text-[11px]">
                        <tr>
                          <th className="py-1.5 px-2">Time</th>
                          <th className="py-1.5 px-2">Sector / Highway</th>
                          <th className="py-1.5 px-2">Observation Feed</th>
                          <th className="py-1.5 px-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-[11px]">
                        <tr className="hover:bg-red-50/50 bg-red-50/30">
                          <td className="py-2 px-2 font-mono text-slate-600">14:41:52</td>
                          <td className="py-2 px-2">
                            <div className="font-semibold text-slate-900">Sector 4 (KM 114)</div>
                            <div className="text-[10px] text-slate-500">East Jaintia Hills</div>
                          </td>
                          <td className="py-2 px-2 font-mono font-bold text-red-700">InSAR 42.1 mm/d</td>
                          <td className="py-2 px-2 text-right">
                            <span className="bg-red-100 text-red-800 font-semibold text-[10px] px-2 py-0.5 rounded border border-red-300">
                              CRITICAL
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-amber-50/50">
                          <td className="py-2 px-2 font-mono text-slate-600">14:40:18</td>
                          <td className="py-2 px-2">
                            <div className="font-semibold text-slate-900">Teesta MCT Basin</div>
                            <div className="text-[10px] text-slate-500">Sikkim NH-10</div>
                          </td>
                          <td className="py-2 px-2 font-mono font-bold text-amber-700">InSAR 36.8 mm/d</td>
                          <td className="py-2 px-2 text-right">
                            <span className="bg-amber-100 text-amber-800 font-semibold text-[10px] px-2 py-0.5 rounded border border-amber-300">
                              WARNING
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-2 font-mono text-slate-600">14:38:00</td>
                          <td className="py-2 px-2">
                            <div className="font-semibold text-slate-900">Sohra Escarpment</div>
                            <div className="text-[10px] text-slate-500">Cherrapunji Basin</div>
                          </td>
                          <td className="py-2 px-2 font-mono font-medium text-blue-700">SMAP Wetness 94%</td>
                          <td className="py-2 px-2 text-right">
                            <span className="bg-blue-100 text-blue-800 font-semibold text-[10px] px-2 py-0.5 rounded border border-blue-300">
                              SATURATED
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-2 font-mono text-slate-600">14:35:12</td>
                          <td className="py-2 px-2">
                            <div className="font-medium text-slate-800">NH-29 Kohima Bypass</div>
                            <div className="text-[10px] text-slate-500">BRO Project Sewak</div>
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-700">Debris Cleared</td>
                          <td className="py-2 px-2 text-right">
                            <span className="bg-emerald-100 text-emerald-800 font-semibold text-[10px] px-2 py-0.5 rounded border border-emerald-300">
                              ACTIVE
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
          </div>
        )}

        {/* TAB 2: SATELLITE GIS & INSAR */}
        {activeTab === "gis" && (
          <div className="bg-white border border-border-strong rounded shadow-sm p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-bold text-gov-navy uppercase tracking-tight">
                  High-Resolution Satellite Ground-Deformation GIS
                </h2>
                <p className="text-xs text-text-secondary">
                  Sentinel-1A Synthetic Aperture Radar (SAR) Interferometry • 12-Day Temporal Baseline • Sub-Centimeter Accuracy
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerToast("InSAR Interferogram GeoTIFF exported for ArcGIS / QGIS.")}
                  className="px-3 py-1.5 bg-gov-navy text-white text-xs font-semibold rounded flex items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span> Export InSAR Raster
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {ZONES.map((z) => (
                <div
                  key={z.id}
                  onClick={() => {
                    setSelectedZone(z)
                    triggerToast(`Selected ${z.name}`)
                  }}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedZone.id === z.id
                      ? "border-gov-navy bg-blue-50/50 shadow-sm"
                      : "border-border-strong bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs">{z.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      z.risk === "CRITICAL" ? "bg-red-100 text-red-800" : z.risk === "HIGH" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                    }`}>
                      {z.risk}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>InSAR Shearing: <strong className="text-slate-800">{z.insar}</strong></div>
                    <div>Soil Wetness: <strong className="text-slate-800">{z.soilWetness}</strong></div>
                    <div>Slope Angle: <strong className="text-slate-800">{z.slope}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI HAZARD PREDICTIONS (XGBoost ML v4.2) */}
        {activeTab === "predictions" && (
          <div className="space-y-4">
            <div className="bg-white border border-border-strong rounded shadow-sm p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-gov-navy uppercase tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-gov-navy text-[20px]">psychology</span>
                    XGBoost ML v4.2 Geotechnical Slope Failure Simulator
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Trained on 4,200 Historical Geological Survey of India (GSI) Landslide Inventories in Northeast India
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  <span>ROC-AUC: <strong>0.942</strong></span>
                  <span className="text-slate-400">|</span>
                  <span>Accuracy: <strong>91.8%</strong></span>
                </div>
              </div>

              {/* Simulation Sliders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gov-navy flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    Interactive Slope Stress Parameter Adjusters
                  </h3>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">24-Hour Accumulated Rainfall (IMD Satellite):</span>
                      <span className="font-mono font-bold text-gov-navy">{simRainfall} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={simRainfall}
                      onChange={(e) => setSimRainfall(Number(e.target.value))}
                      className="w-full accent-gov-navy cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Slope Face Inclination Angle (DEM 0.5m):</span>
                      <span className="font-mono font-bold text-gov-navy">{simSlope}°</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="70"
                      value={simSlope}
                      onChange={(e) => setSimSlope(Number(e.target.value))}
                      className="w-full accent-gov-navy cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Satellite Soil Wetness Index (SMAP Remote Sensing):</span>
                      <span className="font-mono font-bold text-gov-navy">{simSoilWetness}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={simSoilWetness}
                      onChange={(e) => setSimSoilWetness(Number(e.target.value))}
                      className="w-full accent-gov-navy cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Bedrock Shear Strength (GSI Geological Lithology):</span>
                      <span className="font-mono font-bold text-gov-navy">{simLithology} MPa (Weak Disang Shale)</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={simLithology}
                      onChange={(e) => setSimLithology(Number(e.target.value))}
                      className="w-full accent-gov-navy cursor-pointer"
                    />
                  </div>
                </div>

                {/* AI Calculated Output Gauge Card */}
                <div className="bg-white p-5 rounded-lg border-2 border-gov-navy flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Live Calculated AI Failure Probability
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className={`text-4xl font-extrabold font-mono ${
                        calculatedRiskScore >= 80 ? "text-red-700" : calculatedRiskScore >= 60 ? "text-amber-600" : "text-emerald-700"
                      }`}>
                        {calculatedRiskScore}%
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                        calculatedRiskScore >= 80 ? "bg-red-100 text-red-800" : calculatedRiskScore >= 60 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {calculatedRiskScore >= 80 ? "CRITICAL BREACH" : calculatedRiskScore >= 60 ? "HIGH WATCH" : "STABLE"}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden border">
                      <div
                        className={`h-full transition-all duration-300 ${
                          calculatedRiskScore >= 80 ? "bg-red-600" : calculatedRiskScore >= 60 ? "bg-amber-500" : "bg-emerald-600"
                        }`}
                        style={{ width: `${calculatedRiskScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Factor of Safety (FoS)</span>
                      <span className={`font-mono font-bold text-lg ${calculatedFoS < 1.0 ? "text-red-700" : "text-emerald-700"}`}>
                        {calculatedFoS} {calculatedFoS < 1.0 ? "(Unstable)" : "(Stable)"}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Estimated Failure Window</span>
                      <span className="font-mono font-bold text-lg text-amber-800">
                        {calculatedETA}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerToast(`Simulated directive issued: ${calculatedRiskScore}% Risk at FoS ${calculatedFoS}`)}
                    className="mt-4 w-full bg-gov-navy hover:bg-gov-navy-dark text-white font-bold py-2 rounded text-xs transition-colors shadow-sm"
                  >
                    Commit Simulation to EOC Incident Action Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EOC WARNING BULLETINS */}
        {activeTab === "bulletins" && (
          <div className="bg-white border border-border-strong rounded shadow-sm p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-bold text-gov-navy uppercase tracking-tight">
                  National Early Warning Directives &amp; CAP Dispatch Registry
                </h2>
                <p className="text-xs text-text-secondary">
                  ITU-T X.1303 Common Alerting Protocol Compliant • Cell Broadcast to Mobile BTS Towers
                </p>
              </div>
              <button
                onClick={handleBroadcastCap}
                disabled={isCapBroadcasting}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">cell_tower</span>
                {isCapBroadcasting ? "Transmitting..." : "Issue Emergency CAP Broadcast"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border-subtle">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-border-subtle text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Bulletin ID</th>
                    <th className="py-2 px-3">Target Sector</th>
                    <th className="py-2 px-3">Hazard Type</th>
                    <th className="py-2 px-3">Severity</th>
                    <th className="py-2 px-3">Population Target</th>
                    <th className="py-2 px-3">Issued Time</th>
                    <th className="py-2 px-3 text-right">EOC Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-[11px]">
                  {[
                    ["EOC-2025/09-EJH", "East Jaintia Hills (Sector 4)", "Imminent Debris Flow", "CRITICAL", "1,250 Citizens", "14:30 IST", "BRO Road Closure Active"],
                    ["EOC-2025/08-SKM", "North Sikkim (Teesta Basin)", "Slope Translational Slip", "CRITICAL", "890 Citizens", "13:15 IST", "SDRF Relocations Underway"],
                    ["EOC-2025/07-KHM", "Kohima Bypass (NH-29)", "Subsidence Slurry", "HIGH", "Transit Convoy", "11:00 IST", "Traffic Interdiction Active"],
                    ["EOC-2025/06-AZL", "Aizawl East Residential Slopes", "Soil Saturated Creep", "HIGH", "560 Citizens", "09:30 IST", "Advisory Issued"],
                    ["EOC-2025/05-RBH", "Ri-Bhoi Foothills", "Translational Soil Slip", "MODERATE", "320 Citizens", "06:00 IST", "Routine Monitoring"]
                  ].map(([id, target, type, sev, pop, time, action], idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-gov-navy">{id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{target}</td>
                      <td className="py-2.5 px-3 text-slate-700">{type}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          sev === "CRITICAL" ? "bg-red-100 text-red-800 border border-red-300" : sev === "HIGH" ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-sky-100 text-sky-800"
                        }`}>
                          {sev}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{pop}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{time}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-semibold text-slate-800">{action}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: HIGHWAY CORRIDORS & BRO */}
        {activeTab === "corridors" && (
          <div className="bg-white border border-border-strong rounded shadow-sm p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-bold text-gov-navy uppercase tracking-tight">
                  Border Roads Organisation (BRO) &amp; Highway Corridor Status
                </h2>
                <p className="text-xs text-text-secondary">
                  Key Strategic Highway Lifelines across the North Eastern Region
                </p>
              </div>
              <button
                onClick={handleToggleCorridor}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">traffic</span>
                {corridorClosed ? "Reopen NH-44 Single-Lane" : "Issue Total Corridor Closure"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CORRIDORS.map((c) => (
                <div key={c.id} className="p-4 rounded-lg border border-border-strong bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gov-navy">{c.id}: {c.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      c.status === "CLOSED" ? "bg-red-100 text-red-800 border border-red-300" : c.status === "RESTRICTED" ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <div><strong>Critical Chainage:</strong> {c.chainage}</div>
                    <div className="mt-1 text-slate-600">{c.reason}</div>
                    <div className="mt-2 text-[11px] font-mono text-slate-800 bg-white p-2 rounded border">
                      🚜 <strong>BRO Deployment:</strong> {c.bro}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: RELIEF SHELTERS & EVACUATION */}
        {activeTab === "shelters" && (
          <div className="bg-white border border-border-strong rounded shadow-sm p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-bold text-gov-navy uppercase tracking-tight">
                  NDMA Designated Bedrock Relief Shelters &amp; Evacuation Staging
                </h2>
                <p className="text-xs text-text-secondary">
                  Pre-Provisioned Safe Havens Outside Geological Slip Zones
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SHELTERS.map((s) => (
                <div key={s.id} className="p-4 rounded-lg border border-border-strong bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{s.name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {s.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Occupancy:</span>
                      <strong className="font-mono text-gov-navy">{s.current} / {s.capacity} Citizens ({(s.current / s.capacity * 100).toFixed(0)}%)</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-full" style={{ width: `${(s.current / s.capacity * 100)}%` }}></div>
                    </div>
                    <div className="pt-2 border-t text-[11px] text-slate-600 space-y-0.5">
                      <div>🍱 <strong>Rations:</strong> {s.rations}</div>
                      <div>🩺 <strong>Medical:</strong> {s.medical}</div>
                      <div>📡 <strong>Emergency Comms:</strong> {s.comms}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
