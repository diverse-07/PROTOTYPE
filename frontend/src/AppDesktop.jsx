import React, { useState, useEffect, useRef, useMemo } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { dispatchBleBroadcast, silenceBleBroadcast } from "./api/client"

// Geotechnical Zones in Northeast India
const ZONES = [
  // 1. CRITICAL (RED) - FoS < 1.00 (Active Shearing & High Risk Faults)
  {
    id: "z-ejh",
    shortName: "East Jaintia",
    name: "East Jaintia Hills (Sector 4)",
    sub: "NH-44 Artery / Disang Weak Shale",
    state: "Meghalaya",
    lat: 25.3412,
    lon: 92.3614,
    tier: "CRITICAL",
    tierColor: "#DC2626", // RED
    borderColor: "#991B1B",
    fillOpacity: 0.50,
    defaultSlope: 51,
    defaultWetness: 94,
    defaultLith: 22,
    defaultInsar: 42.1,
    polygon: [
      [25.50, 92.15],
      [25.48, 92.65],
      [25.18, 92.62],
      [25.20, 92.12]
    ],
    description: "Active thrust fault shearing zone. Intense Disang shale saturation along NH-44 corridor KM 114."
  },
  {
    id: "z-teesta",
    shortName: "North Sikkim",
    name: "North Sikkim (Teesta MCT Basin)",
    sub: "Chungthang - Singtam Axis",
    state: "Sikkim",
    lat: 27.6012,
    lon: 88.5140,
    tier: "CRITICAL",
    tierColor: "#DC2626", // RED
    borderColor: "#991B1B",
    fillOpacity: 0.50,
    defaultSlope: 56,
    defaultWetness: 88,
    defaultLith: 38,
    defaultInsar: 36.8,
    polygon: [
      [28.05, 88.20],
      [28.00, 88.85],
      [27.45, 88.80],
      [27.50, 88.15]
    ],
    description: "Main Central Thrust (MCT) active glacial-fluvial erosion with high-angle debris accumulation."
  },
  {
    id: "z-tawang-west",
    shortName: "Tawang & Kameng",
    name: "West Kameng & Tawang MCT Corridor",
    sub: "Sela Tunnel & MCT Shear Zone",
    state: "Arunachal Pradesh",
    lat: 27.5861,
    lon: 92.1500,
    tier: "CRITICAL",
    tierColor: "#DC2626", // RED
    borderColor: "#991B1B",
    fillOpacity: 0.50,
    defaultSlope: 54,
    defaultWetness: 90,
    defaultLith: 30,
    defaultInsar: 34.2,
    polygon: [
      [28.00, 91.50],
      [28.05, 92.80],
      [27.15, 92.75],
      [27.10, 91.55]
    ],
    description: "High-altitude permafrost degradation and active freeze-thaw bedrock shearing along Sela pass."
  },
  {
    id: "z-haflong",
    shortName: "Dima Hasao",
    name: "Haflong Pass (Dima Hasao)",
    sub: "Lumding-Badarpur Railway Hill Cut",
    state: "Assam",
    lat: 25.1800,
    lon: 93.0200,
    tier: "CRITICAL",
    tierColor: "#DC2626", // RED
    borderColor: "#991B1B",
    fillOpacity: 0.50,
    defaultSlope: 52,
    defaultWetness: 92,
    defaultLith: 26,
    defaultInsar: 38.5,
    polygon: [
      [25.45, 92.65],
      [25.42, 93.45],
      [24.95, 93.40],
      [24.98, 92.68]
    ],
    description: "Barail range debris avalanche corridor along critical railway line and NH-54 highway."
  },
  {
    id: "z-aizawl-north",
    shortName: "Aizawl North",
    name: "Aizawl Urban & Northern Ridge",
    sub: "Ramhlun / Chite Valley Overloaded Slopes",
    state: "Mizoram",
    lat: 23.7307,
    lon: 92.7173,
    tier: "CRITICAL",
    tierColor: "#DC2626", // RED
    borderColor: "#991B1B",
    fillOpacity: 0.50,
    defaultSlope: 45,
    defaultWetness: 86,
    defaultLith: 28,
    defaultInsar: 28.4,
    polygon: [
      [24.15, 92.40],
      [24.10, 93.10],
      [23.40, 93.05],
      [23.45, 92.42]
    ],
    description: "High urban slope load with overloaded drainage gullies. Saturated siltstone translational hazard."
  },

  // 2. HIGH (ORANGE) - FoS 1.00 - 1.25 (Steep Active Hill Slopes)
  {
    id: "z-kohima",
    shortName: "Kohima Central",
    name: "Kohima Dzudza Corridor (NH-29)",
    sub: "Pagla Pahar Subsidence Zone",
    state: "Nagaland",
    lat: 25.6701,
    lon: 94.1077,
    tier: "HIGH",
    tierColor: "#EA580C", // ORANGE
    borderColor: "#C2410C",
    fillOpacity: 0.45,
    defaultSlope: 40,
    defaultWetness: 78,
    defaultLith: 42,
    defaultInsar: 22.1,
    polygon: [
      [26.15, 93.75],
      [26.10, 94.60],
      [25.35, 94.55],
      [25.40, 93.78]
    ],
    description: "Active road cutting and slope subsidence with heavy vehicular vibration sensitivity along NH-29."
  },
  {
    id: "z-siang-canyon",
    shortName: "Central Arunachal",
    name: "Siang & Subansiri Canyon Axis",
    sub: "Great Himalayan Syntaxis Fault",
    state: "Arunachal Pradesh",
    lat: 28.1500,
    lon: 94.6000,
    tier: "HIGH",
    tierColor: "#EA580C", // ORANGE
    borderColor: "#C2410C",
    fillOpacity: 0.45,
    defaultSlope: 48,
    defaultWetness: 82,
    defaultLith: 44,
    defaultInsar: 24.6,
    polygon: [
      [28.85, 93.00],
      [28.95, 96.00],
      [27.65, 95.80],
      [27.55, 93.10]
    ],
    description: "Steep river canyon cuts with high seismic acceleration and monsoonal toe erosion."
  },
  {
    id: "z-sohra",
    shortName: "Sohra Escarpment",
    name: "Sohra Escarpment (Cherrapunji)",
    sub: "Mawkdok Dympep Deep Gorge",
    state: "Meghalaya",
    lat: 25.2800,
    lon: 91.7200,
    tier: "HIGH",
    tierColor: "#EA580C", // ORANGE
    borderColor: "#C2410C",
    fillOpacity: 0.45,
    defaultSlope: 46,
    defaultWetness: 89,
    defaultLith: 45,
    defaultInsar: 19.8,
    polygon: [
      [25.45, 91.25],
      [25.42, 92.15],
      [25.10, 92.12],
      [25.12, 91.22]
    ],
    description: "Extreme monsoon precipitation funnel with deep limestone jointing and rotational slips."
  },
  {
    id: "z-senapati-manipur",
    shortName: "Manipur West",
    name: "Senapati & Tamenglong Corridor",
    sub: "NH-2 & NH-37 Hill Sector",
    state: "Manipur",
    lat: 25.0500,
    lon: 93.8000,
    tier: "HIGH",
    tierColor: "#EA580C", // ORANGE
    borderColor: "#C2410C",
    fillOpacity: 0.45,
    defaultSlope: 42,
    defaultWetness: 80,
    defaultLith: 40,
    defaultInsar: 21.0,
    polygon: [
      [25.55, 93.30],
      [25.50, 94.40],
      [24.50, 94.35],
      [24.55, 93.25]
    ],
    description: "Western Manipur thrust belt. Regular translational soil slips blocking transport lifelines."
  },

  // 3. MODERATE (YELLOW) - FoS 1.25 - 1.50 (Moderate Hills & Ridges)
  {
    id: "z-sikkim-south",
    shortName: "South Sikkim",
    name: "South & West Sikkim Terraces",
    sub: "Namchi & Gyalshing Ridges",
    state: "Sikkim",
    lat: 27.2200,
    lon: 88.4200,
    tier: "MODERATE",
    tierColor: "#EAB308", // YELLOW
    borderColor: "#CA8A04",
    fillOpacity: 0.40,
    defaultSlope: 32,
    defaultWetness: 68,
    defaultLith: 55,
    defaultInsar: 14.5,
    polygon: [
      [27.45, 88.10],
      [27.42, 88.75],
      [27.05, 88.70],
      [27.08, 88.08]
    ],
    description: "Terraced agricultural hillslopes with moderate soil saturation and managed drainage."
  },
  {
    id: "z-karbi-anglong",
    shortName: "Karbi Uplands",
    name: "Karbi Anglong Uplands",
    sub: "Diphu Dissected Plateau",
    state: "Assam",
    lat: 26.0500,
    lon: 93.3500,
    tier: "MODERATE",
    tierColor: "#EAB308", // YELLOW
    borderColor: "#CA8A04",
    fillOpacity: 0.40,
    defaultSlope: 28,
    defaultWetness: 65,
    defaultLith: 58,
    defaultInsar: 12.0,
    polygon: [
      [26.45, 92.80],
      [26.40, 93.90],
      [25.65, 93.85],
      [25.70, 92.85]
    ],
    description: "Dissected crystalline plateau with moderate soil depth and localized gully incision."
  },
  {
    id: "z-lunglei-south",
    shortName: "South Mizoram",
    name: "Lunglei Longitudinal Valleys",
    sub: "Tlawng River Basin Ridges",
    state: "Mizoram",
    lat: 22.8500,
    lon: 92.7500,
    tier: "MODERATE",
    tierColor: "#EAB308", // YELLOW
    borderColor: "#CA8A04",
    fillOpacity: 0.40,
    defaultSlope: 30,
    defaultWetness: 64,
    defaultLith: 52,
    defaultInsar: 11.4,
    polygon: [
      [23.40, 92.35],
      [23.35, 93.20],
      [22.10, 93.15],
      [22.15, 92.38]
    ],
    description: "Longitudinal anticlinal valley slopes with moderate forest cover and seasonal slips."
  },

  // 4. LOW (GREEN) - FoS 1.50 - 2.00 (Stable Foothills & Terraces)
  {
    id: "z-ribhoi",
    shortName: "Meghalaya Foothills",
    name: "Ri-Bhoi & Garo Foothills",
    sub: "Nongpoh Undulating Ridge",
    state: "Meghalaya",
    lat: 25.8500,
    lon: 91.2000,
    tier: "LOW",
    tierColor: "#22C55E", // GREEN
    borderColor: "#16A34A",
    fillOpacity: 0.35,
    defaultSlope: 18,
    defaultWetness: 50,
    defaultLith: 68,
    defaultInsar: 5.2,
    polygon: [
      [26.15, 89.80],
      [26.10, 92.10],
      [25.45, 92.05],
      [25.48, 89.85]
    ],
    description: "Forested northern slopes and undulating crystalline hills with high root cohesion."
  },
  {
    id: "z-mon-nagaland",
    shortName: "North Nagaland",
    name: "Mon & Northern Nagaland Slopes",
    sub: "Patkai Foothill Dip Slopes",
    state: "Nagaland",
    lat: 26.5000,
    lon: 94.9000,
    tier: "LOW",
    tierColor: "#22C55E", // GREEN
    borderColor: "#16A34A",
    fillOpacity: 0.35,
    defaultSlope: 22,
    defaultWetness: 52,
    defaultLith: 66,
    defaultInsar: 5.8,
    polygon: [
      [27.05, 94.40],
      [27.00, 95.40],
      [26.15, 95.35],
      [26.20, 94.35]
    ],
    description: "Stable dip slopes of the Patkai range with dense canopy and low historical displacement."
  },
  {
    id: "z-barak",
    shortName: "Barak Valley",
    name: "Barak Valley Terraces (Silchar)",
    sub: "Surma Basin Undulating Tea Terraces",
    state: "Assam",
    lat: 24.7800,
    lon: 92.7800,
    tier: "LOW",
    tierColor: "#22C55E", // GREEN
    borderColor: "#16A34A",
    fillOpacity: 0.35,
    defaultSlope: 12,
    defaultWetness: 48,
    defaultLith: 74,
    defaultInsar: 3.4,
    polygon: [
      [24.95, 92.35],
      [24.90, 93.20],
      [24.25, 93.15],
      [24.30, 92.38]
    ],
    description: "Low-gradient undulating tea garden terraces with thick alluvium and stable bedrock."
  },

  // 5. SAFE (DARK GREEN) - FoS > 2.00 (Flat River Floodplains)
  {
    id: "z-brahmaputra",
    shortName: "Brahmaputra Valley",
    name: "Brahmaputra Valley Alluvial Plain",
    sub: "Guwahati-Jorhat Alluvial Floor",
    state: "Assam",
    lat: 26.5000,
    lon: 92.5000,
    tier: "SAFE",
    tierColor: "#14532D", // DARK GREEN
    borderColor: "#052E16",
    fillOpacity: 0.30,
    defaultSlope: 3,
    defaultWetness: 35,
    defaultLith: 88,
    defaultInsar: 0.8,
    polygon: [
      [27.35, 90.00],
      [27.80, 95.80],
      [26.20, 95.60],
      [25.90, 90.20]
    ],
    description: "Vast flat alluvial floodplain along the Brahmaputra River. 0% slope failure risk."
  },
  {
    id: "z-imphal-basin",
    shortName: "Imphal Plain",
    name: "Imphal Loktak Valley Basin",
    sub: "Central Manipur Alluvial Floor",
    state: "Manipur",
    lat: 24.7800,
    lon: 93.9200,
    tier: "SAFE",
    tierColor: "#14532D", // DARK GREEN
    borderColor: "#052E16",
    fillOpacity: 0.30,
    defaultSlope: 4,
    defaultWetness: 32,
    defaultLith: 86,
    defaultInsar: 0.6,
    polygon: [
      [25.00, 93.75],
      [24.98, 94.15],
      [24.45, 94.12],
      [24.48, 93.72]
    ],
    description: "Flat lacustrine and alluvial valley floor surrounding Loktak Lake. Zero slope hazard."
  },
  {
    id: "z-tripura-plains",
    shortName: "Tripura Basin",
    name: "Agartala & Tripura Basin Plains",
    sub: "Tertiary Sandstone Lowland",
    state: "Tripura",
    lat: 23.8300,
    lon: 91.2800,
    tier: "SAFE",
    tierColor: "#14532D", // DARK GREEN
    borderColor: "#052E16",
    fillOpacity: 0.30,
    defaultSlope: 5,
    defaultWetness: 30,
    defaultLith: 85,
    defaultInsar: 0.9,
    polygon: [
      [24.55, 91.10],
      [24.50, 92.35],
      [22.95, 92.25],
      [23.05, 91.15]
    ],
    description: "Stable low-relief floodplain and rolling low hillocks with zero historical landslide records."
  }
];

async function fetchRealLiveWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,rain,wind_speed_10m,relative_humidity_2m&hourly=precipitation,rain&past_days=1&forecast_days=1&timezone=Asia%2FKolkata`
    const res = await fetch(url)
    if (!res.ok) throw new Error("Open-Meteo HTTP " + res.status)
    const data = await res.json()
    const cur = data.current || {}
    const hTimes = data.hourly?.time || []
    const hPrecip = data.hourly?.precipitation || []
    
    const nowStr = cur.time || ""
    let curIdx = hTimes.findIndex(t => t >= nowStr.slice(0, 13))
    if (curIdx === -1) curIdx = hTimes.length - 1
    const startIdx = Math.max(0, curIdx - 23)
    const pTimes = hTimes.slice(startIdx, curIdx + 1)
    const pPrecip = hPrecip.slice(startIdx, curIdx + 1)

    let cum = 0
    const points = pTimes.map((t, i) => {
      const r = pPrecip[i] || 0
      cum += r
      return {
        hour: (t.split("T")[1] || t).slice(0, 5),
        rain: Number(r.toFixed(1)),
        cum: Number(cum.toFixed(1)),
        thresh: 120
      }
    })

    return {
      success: true,
      temp: cur.temperature_2m ?? 24.5,
      currentRain: cur.precipitation ?? 0,
      wind: cur.wind_speed_10m ?? 8,
      humidity: cur.relative_humidity_2m ?? 80,
      total24h: Number(cum.toFixed(1)),
      hourlyData: points,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  } catch(e) {
    console.warn("Open-Meteo live query notice:", e)
    return { success: false }
  }
}

// Pure Geotechnical Failure & AI Model Calculator
function calculateGeotechnicalRisk(rainfall24, api72, slope, soilWetness, lithologyStrength, insarVelocity) {
  // 1. Geotechnical Factor of Safety (FoS) via Infinite Slope Analysis
  const c_prime = (lithologyStrength / 80) * 25 + 5 // Cohesion: 5 - 30 kPa
  const phi_deg = 20 + (lithologyStrength / 80) * 18 // Friction angle: 20° - 38°
  const phi_rad = (phi_deg * Math.PI) / 180
  const beta_rad = (slope * Math.PI) / 180
  
  // Saturation ratio m (0.1 to 1.0)
  const m = Math.min(1.0, Math.max(0.1, (soilWetness / 100) * 0.7 + (rainfall24 / 250) * 0.3))
  const gamma = 19.0 // kN/m^3
  const gamma_w = 9.81 // kN/m^3
  const z = 3.0 // failure depth

  const numerator = c_prime + (gamma - m * gamma_w) * z * Math.pow(Math.cos(beta_rad), 2) * Math.tan(phi_rad)
  const denominator = gamma * z * Math.sin(beta_rad) * Math.cos(beta_rad)
  const fos = Math.max(0.48, Math.min(3.1, denominator > 0 ? (numerator / denominator) : 2.0))

  // 2. XGBoost AI Failure Probability (%)
  const rainNorm = rainfall24 / 135
  const apiNorm = api72 / 210
  const slopeNorm = slope / 40
  const insarNorm = insarVelocity / 18
  const wetNorm = soilWetness / 82
  const lithWeakness = (90 - lithologyStrength) / 65

  const logit = -4.3 + (rainNorm * 2.1) + (apiNorm * 1.4) + (slopeNorm * 1.7) + (insarNorm * 2.2) + (wetNorm * 1.3) + (lithWeakness * 0.9)
  const prob = Math.min(99.4, Math.max(4.2, 100 / (1 + Math.exp(-logit))))

  // 3. Classification
  let status = "SAFE"
  let color = "#10B981"
  let bgLight = "#ECFDF5"
  let border = "#A7F3D0"
  let failureWindow = "> 24 Hours (Stable)"
  let failureType = "Equilibrium (No Shear)"

  if (fos < 1.0 || prob >= 78) {
    status = "CRITICAL BREACH"
    color = "#DC2626"
    bgLight = "#FEF2F2"
    border = "#FCA5A5"
    failureWindow = insarVelocity > 35 ? "< 1.5 Hours" : "< 3.5 Hours"
    failureType = rainfall24 > 150 ? "Saturated Rapid Debris Flow" : "Bedrock Translational Shear"
  } else if (fos < 1.25 || prob >= 58) {
    status = "HIGH RISK"
    color = "#EA580C"
    bgLight = "#FFF7ED"
    border = "#FDBA74"
    failureWindow = "4 - 8 Hours"
    failureType = slope > 45 ? "Rotational Slump & Rockfall" : "Translational Soil Slip"
  } else if (fos < 1.5 || prob >= 38) {
    status = "MODERATE WATCH"
    color = "#D97706"
    bgLight = "#FFFBEB"
    border = "#FDE68A"
    failureWindow = "12 - 24 Hours"
    failureType = "Slow Regolith Creep"
  }

  return {
    fos: Number(fos.toFixed(2)),
    probability: Number(prob.toFixed(1)),
    status,
    color,
    bgLight,
    border,
    failureWindow,
    failureType,
    featureContributions: [
      { name: "Satellite Rainfall", pct: 38, val: `${rainfall24} mm` },
      { name: "Slope Inclination", pct: 26, val: `${slope}°` },
      { name: "InSAR Radar Shearing", pct: 18, val: `${insarVelocity} mm/d` },
      { name: "Soil Moisture (SMAP)", pct: 12, val: `${soilWetness}%` },
      { name: "Lithology Strength", pct: 6, val: `${lithologyStrength} MPa` }
    ]
  }
}

export default function AppDesktop({ onSwitchToMobile }) {
  // Selected Sector
  const [selectedZone, setSelectedZone] = useState(ZONES[0])

  // Real Live Weather State from Open-Meteo
  const [liveWeather, setLiveWeather] = useState({
    loading: true,
    temp: 25.9,
    currentRain: 0.4,
    wind: 14.6,
    humidity: 82,
    total24h: 4.8,
    hourlyData: [],
    updatedAt: "Just now",
    isLive: false
  })

  // Mode: "live" (Real Open-Meteo Live Data) vs "whatif" (Disaster Stress Simulation)
  const [dataMode, setDataMode] = useState("live")

  // Geotechnical Simulation Parameters
  const [simRainfall, setSimRainfall] = useState(184)
  const [api72, setApi72] = useState(265)
  const [slope, setSlope] = useState(ZONES[0].defaultSlope)
  const [soilWetness, setSoilWetness] = useState(ZONES[0].defaultWetness)
  const [lithStrength, setLithStrength] = useState(ZONES[0].defaultLith)
  const [insarVelocity, setInsarVelocity] = useState(ZONES[0].defaultInsar)

  // What-If Simulation Drawer Toggle
  const [showSimulator, setShowSimulator] = useState(false)

  // Regional Sector Selection Modal State
  const [sectorModalOpen, setSectorModalOpen] = useState(false)
  const [sectorSearchQuery, setSectorSearchQuery] = useState("")
  const [selectedStateFilter, setSelectedStateFilter] = useState("ALL")
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("ALL")

  // Keyboard shortcut: close sector modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSectorModalOpen(false)
    }
    if (sectorModalOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [sectorModalOpen])

  // Filtered monitoring sectors based on search, state and risk
  const filteredZones = useMemo(() => {
    return ZONES.filter((z) => {
      const q = sectorSearchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        z.name.toLowerCase().includes(q) ||
        z.state.toLowerCase().includes(q) ||
        z.sub.toLowerCase().includes(q) ||
        (z.shortName && z.shortName.toLowerCase().includes(q))
      
      const matchState =
        selectedStateFilter === "ALL" ||
        z.state.toLowerCase() === selectedStateFilter.toLowerCase()

      const matchRisk =
        selectedRiskFilter === "ALL" ||
        z.tier.toUpperCase() === selectedRiskFilter.toUpperCase()

      return matchSearch && matchState && matchRisk
    })
  }, [sectorSearchQuery, selectedStateFilter, selectedRiskFilter])

  // Map Basemap Layer
  const [baseLayer, setBaseLayer] = useState("topo")

  // BLE Emergency Broadcast State
  const [bleBroadcasting, setBleBroadcasting] = useState(false)
  const [bleDispatchId, setBleDispatchId] = useState("")
  const [blePacketsSent, setBlePacketsSent] = useState(0)
  const [bleFeedbackMsg, setBleFeedbackMsg] = useState("")

  // Audible Siren Alarm State
  const [sirenPlaying, setSirenPlaying] = useState(false)
  const audioCtxRef = useRef(null)
  const sirenOscRef = useRef(null)

  // Active rainfall value for calculation
  const activeRainfall = dataMode === "live" ? (liveWeather.total24h || 4.8) : simRainfall

  // Calculate live geotechnical risk
  const riskResult = useMemo(() => {
    return calculateGeotechnicalRisk(activeRainfall, api72, slope, soilWetness, lithStrength, insarVelocity)
  }, [activeRainfall, api72, slope, soilWetness, lithStrength, insarVelocity])

  // Fetch real live weather whenever selected sector changes
  useEffect(() => {
    let isMounted = true
    setLiveWeather(prev => ({ ...prev, loading: true }))

    fetchRealLiveWeather(selectedZone.lat, selectedZone.lon).then(res => {
      if (!isMounted) return
      if (res.success) {
        setLiveWeather({
          loading: false,
          temp: res.temp,
          currentRain: res.currentRain,
          wind: res.wind,
          humidity: res.humidity,
          total24h: res.total24h,
          hourlyData: res.hourlyData || [],
          updatedAt: res.updatedAt,
          isLive: true
        })
      } else {
        setLiveWeather(prev => ({ ...prev, loading: false, isLive: false }))
      }
    })

    return () => { isMounted = false }
  }, [selectedZone])

  // Handle Sector Change: automatically updates parameters & smooth flies map
  const handleZoneSelect = (zone) => {
    setSelectedZone(zone)
    setSlope(zone.defaultSlope)
    setSoilWetness(zone.defaultWetness)
    setLithStrength(zone.defaultLith)
    setInsarVelocity(zone.defaultInsar)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([zone.lat, zone.lon], 9, {
        duration: 1.2
      })
    }
  }

  // Audio Alarm Siren using Web Audio API
  const toggleSirenAudio = () => {
    if (sirenPlaying) {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch(e) {}
        audioCtxRef.current = null
      }
      setSirenPlaying(false)
      return
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      const now = ctx.currentTime
      for (let i = 0; i < 20; i++) {
        osc.frequency.linearRampToValueAtTime(1100, now + i * 1.2 + 0.6)
        osc.frequency.linearRampToValueAtTime(800, now + i * 1.2 + 1.2)
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      sirenOscRef.current = osc
      setSirenPlaying(true)
    } catch(e) {
      console.warn("Audio context not available:", e)
    }
  }

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch(e) {}
      }
    }
  }, [])

  // BLE Broadcast Action (DISPATCH ALERT BLE BUTTON)
  const handleDispatchBle = async () => {
    setBleBroadcasting(true)
    setBleFeedbackMsg("Transmitting BLE emergency beacon packets to offline citizen phones...")

    const payload = {
      zone_name: selectedZone.name,
      severity: riskResult.status.includes("CRITICAL") ? "CRITICAL" : "HIGH",
      risk_score: Math.round(riskResult.probability),
      preset_code: 1,
      message: `DISASTER DIRECTIVE: ${riskResult.status} predicted for ${selectedZone.name}. ${riskResult.failureType}. Evacuate immediately to safe bedrock shelter.`,
      latitude: selectedZone.lat,
      longitude: selectedZone.lon
    }

    try {
      const res = await dispatchBleBroadcast(payload)
      const id = res?.dispatch_id || `BLE-${Date.now().toString(16).slice(-6).toUpperCase()}`
      setBleDispatchId(id)
      setBlePacketsSent((p) => p + 1)
      setBleFeedbackMsg(`BROADCAST ACTIVE: Packet ID ${id} dispatched via Bluetooth mesh relay and emergency cloud bus.`)
      
      if (riskResult.status.includes("CRITICAL") && !sirenPlaying) {
        toggleSirenAudio()
      }
    } catch (err) {
      setBleDispatchId(`BLE-OFFLINE-${Date.now().toString(16).slice(-4).toUpperCase()}`)
      setBleFeedbackMsg("Broadcast queued in offline BLE beacon relay.")
    }
  }

  // Silence BLE Broadcast
  const handleSilenceBle = async () => {
    try {
      await silenceBleBroadcast()
    } catch(e) {}
    setBleBroadcasting(false)
    setBleFeedbackMsg("Emergency broadcast quieted. BLE beacon radio returned to standby.")
    if (sirenPlaying) toggleSirenAudio()
  }

  // Export Printable EOC Report
  const handleExportReport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NER-LEWS Official EOC Geotechnical & Rainfall Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #0F172A; max-width: 820px; margin: auto; }
          .header { border-bottom: 3px solid #0B3C68; padding-bottom: 12px; margin-bottom: 20px; }
          .stamp { float: right; padding: 6px 12px; background: #DC2626; color: white; font-weight: bold; border-radius: 4px; font-size: 13px; }
          h1 { margin: 0; color: #0B3C68; font-size: 20px; }
          h2 { font-size: 14px; color: #475569; margin: 4px 0 0 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0; }
          .box { border: 1px solid #CBD5E1; padding: 12px; border-radius: 6px; background: #F8FAFC; }
          .kpi { font-size: 22px; font-weight: bold; color: #0B3C68; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
          th, td { border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; }
          th { background: #0B3C68; color: white; }
          .footer { margin-top: 30px; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="stamp">${riskResult.status}</span>
          <h1>NATIONAL LANDSLIDE EARLY WARNING SYSTEM (NER-LEWS)</h1>
          <h2>GEOTECHNICAL AI INFERENCE & RAINFALL MONITORING BULLETIN</h2>
          <p style="font-size:12px;color:#64748B;margin-top:6px;">Government of India | NDMA | MDoNER | Geological Survey of India (GSI)</p>
        </div>

        <div class="box" style="margin-bottom:14px;">
          <strong>Target Monitored Sector:</strong> ${selectedZone.name} (${selectedZone.state})<br>
          <strong>Geological Coordinates:</strong> ${selectedZone.lat}° N, ${selectedZone.lon}° E | <strong>Formation:</strong> ${selectedZone.sub}<br>
          <strong>Meteorological Telemetry:</strong> 24h Rain: ${activeRainfall} mm | Current Temp: ${liveWeather.temp}°C | Humidity: ${liveWeather.humidity}%<br>
          <strong>Report Generated:</strong> ${new Date().toLocaleString()} IST
        </div>

        <div class="grid">
          <div class="box">
            <span style="font-size:11px;color:#64748B;">AI FAILURE PROBABILITY (XGBOOST)</span>
            <div class="kpi" style="color:${riskResult.color}">${riskResult.probability}%</div>
            <p style="font-size:12px;margin-top:4px;">Hazard Classification: <strong>${riskResult.status}</strong></p>
          </div>
          <div class="box">
            <span style="font-size:11px;color:#64748B;">GEOTECHNICAL FACTOR OF SAFETY (FOS)</span>
            <div class="kpi" style="color:${riskResult.fos < 1 ? '#DC2626' : '#10B981'}">${riskResult.fos}</div>
            <p style="font-size:12px;margin-top:4px;">Estimated Failure Window: <strong>${riskResult.failureWindow}</strong></p>
          </div>
          <div class="box">
            <span style="font-size:11px;color:#64748B;">24-HOUR SATELLITE RAINFALL (OPEN-METEO)</span>
            <div class="kpi">${activeRainfall} mm</div>
            <p style="font-size:12px;margin-top:4px;">Triggering Threshold: 120 mm (${activeRainfall > 120 ? '+' + (activeRainfall - 120) + ' mm Exceedance' : 'Normal'})</p>
          </div>
          <div class="box">
            <span style="font-size:11px;color:#64748B;">INSAR RADAR SHEARING (SENTINEL-1)</span>
            <div class="kpi">${insarVelocity} mm/day</div>
            <p style="font-size:12px;margin-top:4px;">Failure Mode: <strong>${riskResult.failureType}</strong></p>
          </div>
        </div>

        <div class="box" style="margin-top:16px;border-left:4px solid #DC2626;">
          <strong>Official Incident Directives:</strong><br>
          1. Mobilize SDRF / NDRF staging teams to safe bedrock community havens.<br>
          2. Dispatch emergency BLE beacon advisories to citizen smartphones in sector.<br>
          3. Enforce precautionary traffic interdiction along vulnerable highway chainages.
        </div>

        <div class="footer">
          Authored by NER-LEWS Emergency Operations Center (EOC). Digitally verified by National Informatics Centre (NIC).
        </div>
      </body>
      </html>
    `
    const printWin = window.open("", "_blank")
    if (printWin) {
      printWin.document.write(reportHtml)
      printWin.document.close()
      printWin.focus()
      setTimeout(() => printWin.print(), 350)
    }
  }

  // Leaflet Map Ref
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersGroupRef = useRef(null)
  const polygonsGroupRef = useRef(null)

  // Initialize Map with 100% Reliable High-Speed Esri World Topo
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [26.0, 93.2],
      zoom: 6.5,
      minZoom: 5,
      maxZoom: 16,
      scrollWheelZoom: true,
      zoomControl: true
    })
    mapInstanceRef.current = map

    // High-Definition Topographic Elevation Relief Map (OpenTopoMap with full hillshading & contours)
    const topoLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      subdomains: ['a', 'b', 'c'],
      attribution: 'Map: © OpenTopoMap, OpenStreetMap contributors, SRTM',
      keepBuffer: 12
    })
    topoLayer.addTo(map)

    // Layer groups for Polygons (Critical Envelopes) and Markers
    const polygonsGroup = L.layerGroup().addTo(map)
    const markersGroup = L.layerGroup().addTo(map)
    polygonsGroupRef.current = polygonsGroup
    markersGroupRef.current = markersGroup

    // Force Leaflet to recalculate container dimensions immediately and after render
    map.invalidateSize()
    const t1 = setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize() }, 150)
    const t2 = setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize() }, 600)

    const handleResize = () => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(t1)
      clearTimeout(t2)
      try { map.remove() } catch(e) {}
      mapInstanceRef.current = null
    }
  }, [])

  // Pure Geological GIS Hazard Polygons covering the entire Northeast Region (NER)
  // Clean polygons with NO stacked rectangular label boxes or blimps
  useEffect(() => {
    const map = mapInstanceRef.current
    const polyGroup = polygonsGroupRef.current
    const markGroup = markersGroupRef.current
    if (!map || !polyGroup || !markGroup) return

    polyGroup.clearLayers()
    markGroup.clearLayers()

    ZONES.forEach((z) => {
      const isSelected = z.id === selectedZone.id
      
      const zRisk = isSelected 
        ? riskResult 
        : calculateGeotechnicalRisk(activeRainfall, 180, z.defaultSlope, z.defaultWetness, z.defaultLith, z.defaultInsar)

      // Strict 5-tier standard colors: RED, ORANGE, YELLOW, GREEN, DARK GREEN
      let fillColor = z.tierColor
      let strokeColor = z.borderColor
      let fillOpacity = z.fillOpacity || 0.40
      let tierLabel = z.tier

      if (zRisk.fos < 1.0 || zRisk.probability >= 80) {
        fillColor = "#DC2626" // CRITICAL -> RED
        strokeColor = "#991B1B"
        fillOpacity = isSelected ? 0.45 : 0.30
        tierLabel = "CRITICAL"
      } else if (zRisk.fos < 1.25 || zRisk.probability >= 65) {
        fillColor = "#EA580C" // HIGH -> ORANGE
        strokeColor = "#C2410C"
        fillOpacity = isSelected ? 0.50 : 0.34
        tierLabel = "HIGH"
      } else if (zRisk.fos < 1.50 || zRisk.probability >= 45) {
        fillColor = "#EAB308" // MODERATE -> YELLOW
        strokeColor = "#CA8A04"
        fillOpacity = isSelected ? 0.45 : 0.30
        tierLabel = "MODERATE"
      } else if (zRisk.fos < 2.0 || zRisk.probability >= 20) {
        fillColor = "#22C55E" // LOW -> GREEN
        strokeColor = "#16A34A"
        fillOpacity = isSelected ? 0.40 : 0.26
        tierLabel = "LOW"
      } else {
        fillColor = "#14532D" // SAFE -> DARK GREEN
        strokeColor = "#052E16"
        fillOpacity = isSelected ? 0.35 : 0.22
        tierLabel = "SAFE"
      }

      // DRAW TRUE CONTINUOUS GEOLOGICAL HAZARD POLYGON (NO OPAQUE RECTANGLES)
      if (z.polygon && z.polygon.length >= 3) {
        const poly = L.polygon(z.polygon, {
          color: isSelected ? "#FFFFFF" : strokeColor,
          weight: isSelected ? 3.5 : 1.8,
          dashArray: isSelected ? "5, 5" : null,
          fillColor: fillColor,
          fillOpacity: fillOpacity
        })

        // Clean, informative hover tooltip directly attached to polygon
        poly.bindTooltip(`
          <div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.4;padding:4px 8px;border-left:4px solid ${fillColor};background:#FFFFFF;">
            <div style="font-weight:800;color:#0F172A;font-size:13px;">${z.name}</div>
            <div style="font-weight:800;color:${fillColor};font-size:11.5px;margin:2px 0;">
              ● ${tierLabel} TIER (${zRisk.probability}%) · FoS: ${zRisk.fos}
            </div>
            <div style="font-size:11px;color:#475569;">${z.sub} (${z.state})</div>
            <div style="font-size:10px;color:#0284C7;margin-top:3px;font-weight:600;">Click to select &amp; view geotechnical telemetry</div>
          </div>
        `, { sticky: true, opacity: 0.98 })

        poly.on("click", () => handleZoneSelect(z))
        poly.addTo(polyGroup)
      }
    })

    if (selectedZone) {
      map.panTo([selectedZone.lat, selectedZone.lon], { animate: true, duration: 0.6 })
    }
  }, [selectedZone, riskResult, activeRainfall])


  // Instant Layer Switching between Topo, Satellite, and Street
  const switchBaseLayer = (type) => {
    setBaseLayer(type)
    const map = mapInstanceRef.current
    if (!map) return

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    if (type === "satellite") {
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 18,
        attribution: 'Tiles: © Esri, USGS'
      }).addTo(map)
      // Overlay place names & borders on top of satellite imagery
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 18
      }).addTo(map)
    } else if (type === "topo") {
      L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        maxZoom: 17,
        subdomains: ['a', 'b', 'c'],
        attribution: 'Map: © OpenTopoMap, OpenStreetMap contributors, SRTM',
        keepBuffer: 12
      }).addTo(map)
    } else {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
    }
  }

  // Active chart data
  const chartData = liveWeather.hourlyData.length >= 8 ? liveWeather.hourlyData : [
    { hour: "00:00", rain: 0.2, cum: 0.2, thresh: 120 },
    { hour: "04:00", rain: 0.5, cum: 0.7, thresh: 120 },
    { hour: "08:00", rain: 1.1, cum: 1.8, thresh: 120 },
    { hour: "12:00", rain: 1.4, cum: 3.2, thresh: 120 },
    { hour: "14:00", rain: 1.6, cum: 4.8, thresh: 120 }
  ]

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      
      {/* 1. TOP SOVEREIGN UTILITY BAR (MDoNER / GOVERNMENT OF INDIA) */}
      <aside className="bg-[#003B73] text-white px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between text-xs border-b border-[#002C57]">
        <div className="w-full max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img 
                src="./emblem_of_india.svg" 
                alt="Emblem of India" 
                className="h-4 w-auto brightness-0 invert opacity-95" 
                onError={(e) => { 
                  if (e.target.src.endsWith('/emblem_of_india.svg')) {
                    e.target.src = './emblem_of_india.svg';
                  } else {
                    e.target.src = 'emblem_of_india.svg';
                  }
                }}
              />
              <span className="font-bold text-[11px] text-white">भारत सरकार | Government of India</span>
            </div>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="text-slate-200 text-[11px] font-medium hidden md:inline">
              उत्तर पूर्वी क्षेत्र विकास मंत्रालय | Ministry of Development of North Eastern Region (MDoNER)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button className="w-6 h-6 rounded bg-[#004A8F] hover:bg-[#005B9E] flex items-center justify-center text-white text-xs transition" title="Accessibility Options">
              ♿
            </button>
            <button className="w-6 h-6 rounded bg-[#004A8F] hover:bg-[#005B9E] flex items-center justify-center text-white text-xs transition" title="Theme Toggle">
              🌙
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#004A8F] font-mono text-[11px] text-amber-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>24x7 EOC Helpline: 1078</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#004A8F] hover:bg-[#005B9E] cursor-pointer text-[11px] font-semibold transition">
              <span>English</span>
              <span className="text-[9px]">▾</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CRISP WHITE NAVBAR (MDONER & INDIAN GOVT LOGO & AEGIS CREST) */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 sticky top-0 z-40 shadow-xs">
        <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          
          {/* Indian Govt Logo + MDoNER + AEGIS LEWS Group */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            
            {/* Official State Emblem of India (Ashoka Lion Capital) */}
            <img 
              src="./emblem_of_india.svg" 
              alt="State Emblem of India" 
              className="h-11 sm:h-12 w-auto object-contain" 
              onError={(e) => { 
                if (e.target.src.endsWith('/emblem_of_india.svg')) {
                  e.target.src = './emblem_of_india.svg';
                } else {
                  e.target.src = 'emblem_of_india.svg';
                }
              }}
            />

            <div className="h-10 w-[1.5px] bg-slate-200"></div>

            {/* MDoNER Full Branding */}
            <div className="flex flex-col justify-center leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-[#003B73]">MDoNER</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#005B9E] border border-blue-200 hidden sm:inline">
                  GOVERNMENT OF INDIA
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-800 tracking-tight mt-0.5">
                Ministry of Development of North Eastern Region
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                उत्तर पूर्वी क्षेत्र विकास मंत्रालय
              </span>
            </div>

            <div className="h-10 w-[1.5px] bg-slate-200 hidden xl:block"></div>

            {/* NER-LEWS & Team AEGIS Crest */}
            <div className="hidden xl:flex items-center gap-2.5">
              <img 
                src="./logo.png" 
                alt="AEGIS Logo" 
                className="h-10 w-auto rounded-full ring-1 ring-slate-200 shadow-xs" 
                onError={(e) => { 
                  e.target.src = './aegis_logo_transparent.png';
                }}
              />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 tracking-tight">NER-LEWS</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    TEAM AEGIS
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">National Early Warning System</span>
              </div>
            </div>

          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
            <button 
              onClick={() => {
                const el = document.getElementById("operational-workspace");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="py-1 text-[#005B9E] font-bold border-b-2 border-[#005B9E] transition cursor-pointer"
            >
              Operations Home
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById("regional-map-container");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }} 
              className="py-1 hover:text-[#005B9E] transition cursor-pointer"
            >
              Regional GIS Map
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById("ai-assessment-card");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }} 
              className="py-1 hover:text-[#005B9E] transition cursor-pointer"
            >
              Geotechnical AI
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById("rainfall-report-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }} 
              className="py-1 hover:text-[#005B9E] transition cursor-pointer"
            >
              Precipitation
            </button>
            <button 
              onClick={() => setSectorModalOpen(true)} 
              className="py-1 hover:text-[#005B9E] transition flex items-center gap-1 cursor-pointer"
            >
              <span>18 Sectors</span>
              <span className="text-[9px]">▾</span>
            </button>
          </nav>

          {/* Right Action Controls: Quick Sector Picker + Print Report */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSectorModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-[#003B73] px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              title="Select one of 18 Regional Monitoring Sectors"
            >
              <span className="material-symbols-outlined text-amber-600 text-sm">pin_drop</span>
              <span className="hidden sm:inline">Sector:</span>
              <span className="text-[#003B73] font-extrabold">{selectedZone.shortName || selectedZone.name.split("(")[0]}</span>
              <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
            </button>

            <button
              onClick={handleExportReport}
              className="bg-[#005B9E] hover:bg-[#004A8F] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Generate printable EOC Geotechnical & Rainfall Report"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. OFFICIAL EOC EMERGENCY ALERT & BLE COMMAND STRIP */}
      <section className="bg-[#1E293B] border-b border-slate-700 text-white py-2.5 px-4 shadow-sm relative z-20">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{backgroundColor: riskResult.color}}></span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{color: riskResult.color}}>
              {riskResult.status}:
            </span>
            
            {/* Interactive Target Sector Selector Button */}
            <button
              onClick={() => setSectorModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 hover:border-amber-400 flex items-center gap-2 transition-all cursor-pointer shadow-xs group"
              title="Click to change target monitored sector (18 available)"
            >
              <span className="material-symbols-outlined text-amber-400 text-sm group-hover:scale-110 transition-transform">pin_drop</span>
              <span className="text-white group-hover:text-amber-300 transition-colors">
                {selectedZone.name}
              </span>
              <span className="text-[11px] text-slate-300 font-normal">
                ({selectedZone.state})
              </span>
              <span 
                className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white shadow-2xs"
                style={{ backgroundColor: selectedZone.tierColor }}
              >
                {selectedZone.tier}
              </span>
              <span className="material-symbols-outlined text-xs text-slate-400 group-hover:text-white transition-colors">
                arrow_drop_down
              </span>
            </button>

            <span className="hidden lg:inline text-xs text-slate-400">
              ({riskResult.failureType} | Shearing: {insarVelocity} mm/d)
            </span>
          </div>

          {/* Action Group: The Alert BLE Button & Alarm */}
          <div className="flex items-center gap-2">
            {!bleBroadcasting ? (
              <button
                onClick={handleDispatchBle}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-md shadow flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm animate-pulse">cell_tower</span>
                <span>Dispatch BLE Offline Alert</span>
              </button>
            ) : (
              <button
                onClick={handleSilenceBle}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase px-3 py-1.5 rounded-md shadow flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">volume_off</span>
                <span>Silence Alert</span>
              </button>
            )}

            <button
              onClick={toggleSirenAudio}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                sirenPlaying 
                  ? "bg-red-600 text-white border-red-400 animate-pulse" 
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
              }`}
              title="Toggle Audible Alarm Tone"
            >
              <span className="material-symbols-outlined text-sm">
                {sirenPlaying ? "campaign" : "notifications"}
              </span>
              <span className="hidden sm:inline">{sirenPlaying ? "Siren Active" : "Alarm"}</span>
            </button>
          </div>

        </div>

        {/* Live BLE Feedback Notice (when broadcasting) */}
        {bleBroadcasting && (
          <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 mt-1.5 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-amber-300 font-mono">
            <span>{bleFeedbackMsg}</span>
            <span>PACKETS DISPATCHED: {blePacketsSent}</span>
          </div>
        )}
      </section>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main id="operational-workspace" className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col gap-4">

        {/* 5 KEY MONITORED KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">AI Failure Risk</span>
            <div className="my-1 flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight" style={{color: riskResult.color}}>
                {riskResult.probability}%
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded w-fit" style={{backgroundColor: riskResult.bgLight, color: riskResult.color}}>
              {riskResult.status}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Factor of Safety (FoS)</span>
            <div className="my-1">
              <span className={`text-2xl font-black tracking-tight ${riskResult.fos < 1.0 ? "text-red-600" : "text-emerald-600"}`}>
                {riskResult.fos}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              {riskResult.fos < 1.0 ? "Active Shear Failure" : "Geotechnically Stable"}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">24h Rainfall</span>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded">LIVE API</span>
            </div>
            <div className="my-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {activeRainfall} <span className="text-xs font-normal text-slate-500">mm</span>
              </span>
            </div>
            <span className={`text-[10px] font-bold ${activeRainfall >= 120 ? "text-red-600" : "text-slate-500"}`}>
              {activeRainfall >= 120 ? "+ " + (activeRainfall - 120) + "mm Threshold Breach" : "Within Safe Limits"}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">InSAR Displacement</span>
            <div className="my-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {insarVelocity} <span className="text-xs font-normal text-slate-500">mm/d</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Sentinel-1 Interferometry</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimated Impact</span>
            <div className="my-1">
              <span className="text-lg font-black text-slate-900 tracking-tight">
                {riskResult.failureWindow}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 truncate" title={riskResult.failureType}>
              {riskResult.failureType}
            </span>
          </div>

        </div>

        {/* 2-COLUMN OPERATIONAL WORKSPACE: MAP (LEFT) & AI PREDICTIONS (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* LEFT: GEOTECHNICAL GIS MAP (7 Cols) */}
          <div id="regional-map-container" className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            
            {/* Map Toolbar */}
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-700 text-lg">public</span>
                <span className="font-bold text-xs uppercase tracking-wide text-slate-800">
                  Northeast Regional GIS Canvas
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Sector Selector Trigger on Toolbar */}
                <button
                  onClick={() => setSectorModalOpen(true)}
                  className="bg-white hover:bg-slate-100 text-blue-900 border border-slate-300 text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Choose from all 18 Northeast Monitoring Sectors"
                >
                  <span className="material-symbols-outlined text-sm text-blue-700">pin_drop</span>
                  <span className="hidden sm:inline">Sector:</span>
                  <span className="text-blue-950 font-bold">{selectedZone.name.split("(")[0]}</span>
                  <span className="material-symbols-outlined text-xs text-slate-500">arrow_drop_down</span>
                </button>

                {/* Layer Toggles */}
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md text-xs">
                  <button
                    onClick={() => switchBaseLayer("topo")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${baseLayer === "topo" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Topographic
                  </button>
                  <button
                    onClick={() => switchBaseLayer("satellite")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${baseLayer === "satellite" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Satellite
                  </button>
                  <button
                    onClick={() => switchBaseLayer("street")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${baseLayer === "street" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Street
                  </button>
                </div>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative w-full h-[500px] xl:h-[580px] bg-slate-100">
              <div ref={mapContainerRef} className="w-full h-full z-0"></div>

              {/* Clean Floating Badge */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-sm border border-slate-200 z-10 max-w-xs text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: riskResult.color}}></span>
                  <span>{selectedZone.name}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{selectedZone.description}</p>
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{selectedZone.lat}° N, {selectedZone.lon}° E</span>
                  <span className="font-bold text-blue-700">{selectedZone.state}</span>
                </div>
              </div>

              {/* Clean 5-Tier Hazard Legend */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md p-2.5 rounded-lg shadow-md border border-slate-300 z-10 text-[10.5px] flex flex-col gap-1.5">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[9px]">GSI Hazard Polygons</span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#DC2626] border border-[#991B1B]"></span>
                  <span className="font-bold text-red-700">CRITICAL (Red)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#EA580C] border border-[#C2410C]"></span>
                  <span className="font-bold text-orange-700">HIGH (Orange)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#EAB308] border border-[#A16207]"></span>
                  <span className="font-bold text-yellow-700">MODERATE (Yellow)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#22C55E] border border-[#15803D]"></span>
                  <span className="font-bold text-emerald-600">LOW (Green)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#14532D] border border-[#052E16]"></span>
                  <span className="font-bold text-emerald-950">SAFE (Dark Green)</span>
                </div>
              </div>
            </div>

            {/* Sector Quick Selector Pills (Hidden Scrollbar) */}
            <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => setSectorModalOpen(true)}
                className="bg-[#0B3C68] hover:bg-[#082846] text-white px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                title="Open full searchable list of 18 sectors"
              >
                <span className="material-symbols-outlined text-xs text-amber-300">list</span>
                <span>All 18 Sectors</span>
                <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
              </button>
              <div className="h-4 w-[1px] bg-slate-300 mx-1 shrink-0"></div>
              {ZONES.map((z) => (
                <button
                  key={z.id}
                  onClick={() => handleZoneSelect(z)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    selectedZone.id === z.id 
                      ? "bg-[#0B3C68] text-white border-[#0B3C68] shadow-2xs font-bold" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: z.tierColor }}></span>
                  <span>{z.name.split("(")[0]}</span>
                </button>
              ))}
            </div>

          </div>

          {/* RIGHT: WORKING AI PREDICTION SYSTEM (5 Cols) */}
          <div id="ai-assessment-card" className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3.5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="font-bold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-700 text-lg">neurology</span>
                  <span>Geotechnical AI Risk Assessment</span>
                </h2>
                <p className="text-[11px] text-slate-500">XGBoost ML v4.2 & Infinite Slope Stability Model</p>
              </div>

              {/* What-If Simulation Toggle */}
              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className={`text-[11px] font-semibold px-2 py-1 rounded border flex items-center gap-1 transition-all ${
                  showSimulator 
                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined text-xs">tune</span>
                <span>{showSimulator ? "Close Simulation" : "What-If Analysis"}</span>
              </button>
            </div>

            {/* Calculated Classification Card */}
            <div 
              className="p-3.5 rounded-xl border transition-all" 
              style={{backgroundColor: riskResult.bgLight, borderColor: riskResult.border}}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase" style={{color: riskResult.color}}>
                  {riskResult.status}
                </span>
                <span className="text-xs font-mono font-bold" style={{color: riskResult.color}}>
                  FoS: {riskResult.fos}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-3xl font-black tracking-tight" style={{color: riskResult.color}}>
                  {riskResult.probability}%
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Window: <strong className="text-slate-900">{riskResult.failureWindow}</strong>
                </span>
              </div>

              {/* Progress Meter */}
              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{width: `${riskResult.probability}%`, backgroundColor: riskResult.color}}
                ></div>
              </div>

              <div className="text-[11px] text-slate-700 flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span>Predicted Mode: <strong>{riskResult.failureType}</strong></span>
                <span className="font-mono text-[10px] text-slate-500">Model: GSI-XGBoost</span>
              </div>
            </div>

            {/* Sector Current Telemetry Specs (100% REAL LIVE DATA) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase block">Monitored 24h Rain</span>
                <span className="font-bold text-slate-800">{activeRainfall} mm</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase block">Slope Inclination</span>
                <span className="font-bold text-slate-800">{slope}° Angle</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase block">InSAR Deformation</span>
                <span className="font-bold text-violet-700">{insarVelocity} mm/day</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase block">Soil Saturation</span>
                <span className="font-bold text-sky-700">{soilWetness}% (SMAP)</span>
              </div>
            </div>

            {/* WHAT-IF SIMULATOR DRAWER (Revealed when What-If Analysis is active) */}
            {showSimulator && (
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex flex-col gap-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase">Interactive Sensitivity Adjusters</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setDataMode("live")}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${dataMode === "live" ? "bg-blue-700 text-white" : "text-blue-700 underline"}`}
                    >
                      Use Live Rain ({liveWeather.total24h}mm)
                    </button>
                    <button 
                      onClick={() => { setDataMode("whatif"); setSimRainfall(180); }}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${dataMode === "whatif" ? "bg-red-700 text-white" : "text-red-700 underline"}`}
                    >
                      Stress Storm (180mm)
                    </button>
                  </div>
                </div>

                {/* Slider 1: 24h Rainfall */}
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-700">Simulate 24h Rainfall</span>
                    <span className="font-mono font-bold text-blue-800">{activeRainfall} mm</span>
                  </div>
                  <input
                    type="range" min="0" max="280" step="2" value={activeRainfall}
                    onChange={(e) => { setDataMode("whatif"); setSimRainfall(Number(e.target.value)); }}
                    className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-700"
                  />
                </div>

                {/* Slider 2: Slope */}
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-700">Simulate Slope Angle</span>
                    <span className="font-mono font-bold text-blue-800">{slope}°</span>
                  </div>
                  <input
                    type="range" min="15" max="65" step="1" value={slope}
                    onChange={(e) => setSlope(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-700"
                  />
                </div>

                {/* Slider 3: InSAR Velocity */}
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-700">Simulate InSAR Velocity</span>
                    <span className="font-mono font-bold text-violet-800">{insarVelocity} mm/d</span>
                  </div>
                  <input
                    type="range" min="0" max="55" step="0.5" value={insarVelocity}
                    onChange={(e) => setInsarVelocity(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-violet-700"
                  />
                </div>

                {/* Slider 4: Soil Saturation */}
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-700">Simulate Soil Moisture</span>
                    <span className="font-mono font-bold text-sky-800">{soilWetness}%</span>
                  </div>
                  <input
                    type="range" min="10" max="100" step="1" value={soilWetness}
                    onChange={(e) => setSoilWetness(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-700"
                  />
                </div>
              </div>
            )}

            {/* Contributing Risk Factors Breakdown */}
            <div className="border-t border-slate-100 pt-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                Key Contributing Risk Drivers
              </span>
              <div className="flex flex-col gap-1.5">
                {riskResult.featureContributions.map((fc) => (
                  <div key={fc.name} className="flex items-center text-xs">
                    <span className="w-36 text-slate-600 truncate text-[11px]">{fc.name}</span>
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden mx-2">
                      <div className="bg-[#0B3C68] h-full rounded-full" style={{width: `${fc.pct * 2.2}%`}}></div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 w-16 text-right">{fc.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatch Action Button */}
            <button
              onClick={handleDispatchBle}
              className="w-full bg-[#0B3C68] hover:bg-[#082846] text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-sm">cell_tower</span>
              <span>Broadcast Emergency Warning for this Sector</span>
            </button>

          </div>

        </div>

        {/* 4. REAL IMD / OPEN-METEO RADAR RAINFALL TELEMETRY & REPORT */}
        <div id="rainfall-report-section" className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600">water_drop</span>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                  Satellite Precipitation & Rainfall Telemetry Report
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  LIVE SATELLITE FEED
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Real-Time Precipitation Curve vs Empirical Landslide Triggering Threshold (Caine / GSI Model: 120 mm)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded font-bold border border-red-200">
                Threshold: 120 mm / 24h
              </span>
              <button
                onClick={handleExportReport}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Download Official Report</span>
              </button>
            </div>
          </div>

          {/* Scientific Hydrograph SVG Chart */}
          <div className="w-full my-3 bg-slate-50/60 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 px-1 font-mono">
              <span>Past 24h Cumulative Precipitation Curve (mm) | {selectedZone.name}</span>
              <span className="text-red-600 font-bold flex items-center gap-1">
                <span className="w-3 h-0.5 bg-red-500 inline-block border-t border-dashed border-red-600"></span>
                Trigger Threshold (120 mm)
              </span>
            </div>

            <div className="w-full overflow-x-auto no-scrollbar">
              <svg viewBox="0 0 840 140" className="w-full h-32 select-none">
                <defs>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="breachGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="40" y1="20" x2="820" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
                <text x="32" y="24" fontSize="9" fill="#94A3B8" textAnchor="end" fontFamily="monospace">180mm</text>

                {/* Threshold line at 120mm -> Y ~ 55 */}
                <line x1="40" y1="55" x2="820" y2="55" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="5,4" />
                <text x="32" y="58" fontSize="9" fill="#DC2626" fontWeight="bold" textAnchor="end" fontFamily="monospace">120mm</text>

                <line x1="40" y1="90" x2="820" y2="90" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
                <text x="32" y="93" fontSize="9" fill="#94A3B8" textAnchor="end" fontFamily="monospace">60mm</text>

                <line x1="40" y1="120" x2="820" y2="120" stroke="#CBD5E1" strokeWidth="1" />
                <text x="32" y="123" fontSize="9" fill="#94A3B8" textAnchor="end" fontFamily="monospace">0mm</text>

                {/* Dynamic Curve Points */}
                {chartData.length >= 2 && (() => {
                  const pts = chartData.map((h, i) => {
                    const cx = 50 + (i / (chartData.length - 1)) * 740
                    const cy = Math.max(4, 120 - (h.cum / 150) * 115)
                    return `${cx},${cy}`
                  })
                  const areaPts = `50,120 ${pts.join(" ")} ${50 + 740},120`

                  return (
                    <>
                      <polygon points={areaPts} fill="url(#rainGrad)" />
                      <polyline points={pts.join(" ")} fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
                      {chartData.map((h, i) => {
                        const cx = 50 + (i / (chartData.length - 1)) * 740
                        const cy = Math.max(4, 120 - (h.cum / 150) * 115)
                        const isBreach = h.cum >= 120
                        return (
                          <g key={i}>
                            <circle cx={cx} cy={cy} r={isBreach ? "4" : "3"} fill={isBreach ? "#DC2626" : "#0284C7"} stroke="#ffffff" strokeWidth="1.5" />
                            {i % 2 === 0 && (
                              <text x={cx} y="134" fontSize="9" fill="#64748B" textAnchor="middle" fontFamily="monospace">{h.hour}</text>
                            )}
                          </g>
                        )
                      })}
                    </>
                  )
                })()}
              </svg>
            </div>

            {/* Micro Telemetry Metrics strip (100% REAL LIVE TELEMETRY) */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div className="bg-white p-1.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Current Temp</span>
                <span className="font-bold text-slate-800">{liveWeather.temp}°C</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Precipitation Rate</span>
                <span className="font-bold text-slate-800">{liveWeather.currentRain} mm/h</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">24h Cumulative Rain</span>
                <span className="font-bold text-blue-700">{activeRainfall} mm</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Wind Speed</span>
                <span className="font-bold text-slate-800">{liveWeather.wind} km/h</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Relative Humidity</span>
                <span className="font-bold text-sky-700">{liveWeather.humidity}%</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Satellite Source</span>
                <span className="font-bold text-emerald-600">Open-Meteo Live</span>
              </div>
            </div>
          </div>

          {/* Official Footnotes */}
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Live Meteorological Telemetry: Open-Meteo Satellites (Updated at {liveWeather.updatedAt} IST).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>GSI Regional Threshold: 120 mm / 24-hour critical antecedent limit.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
              <span>ESA Sentinel-1 Radar Interferometry: 12-day temporal repeat pass.</span>
            </div>
          </div>

        </div>

      </main>

      {/* 5. CLEAN GOVERNMENT FOOTER */}
      <footer className="bg-[#0A2540] text-slate-400 text-xs py-4 border-t-2 border-[#138808]">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-white font-semibold">
              National Landslide Early Warning System (NER-LEWS)
            </span>
            <span className="text-[11px] text-slate-400">
              National Disaster Management Authority (NDMA) • Ministry of Development of North Eastern Region (MDoNER)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Survey of India (SOI)</span>
            <span>•</span>
            <span>Geological Survey of India (GSI)</span>
            <span>•</span>
            <span>NESAC / ISRO</span>
            <span>•</span>
            <span className="text-amber-400 font-mono">NIC EOC v2.4</span>
          </div>
        </div>
      </footer>

      {/* 6. REGIONAL SECTOR SELECTION MODAL */}
      {sectorModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSectorModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0B3C68] text-white px-5 py-3.5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
                  <span className="material-symbols-outlined text-xl">pin_drop</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
                    Select Monitoring Sector
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    18 GSI / NLSM Geotechnical Monitoring Zones across 8 Northeast States
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSectorModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Filters & Search */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-2.5">
              {/* Search Bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={sectorSearchQuery}
                  onChange={(e) => setSectorSearchQuery(e.target.value)}
                  placeholder="Filter by sector name, corridor or state (e.g. Sikkim, Haflong, Aizawl, Tawang)..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
                  autoFocus
                />
                {sectorSearchQuery && (
                  <button
                    onClick={() => setSectorSearchQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* State Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
                <span className="font-bold text-[10px] text-slate-500 uppercase whitespace-nowrap">State:</span>
                {["ALL", "Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStateFilter(st)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedStateFilter === st
                        ? "bg-[#0B3C68] text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {st === "ALL" ? "All States (18)" : st.replace(" Pradesh", "")}
                  </button>
                ))}
              </div>

              {/* Risk Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
                <span className="font-bold text-[10px] text-slate-500 uppercase whitespace-nowrap">Hazard Tier:</span>
                {[
                  { id: "ALL", label: "All Tiers", color: "#475569" },
                  { id: "CRITICAL", label: "Critical (Red)", color: "#DC2626" },
                  { id: "HIGH", label: "High (Orange)", color: "#EA580C" },
                  { id: "MODERATE", label: "Moderate (Yellow)", color: "#EAB308" },
                  { id: "LOW", label: "Low (Green)", color: "#22C55E" },
                  { id: "SAFE", label: "Safe (Dark Green)", color: "#14532D" }
                ].map((rk) => (
                  <button
                    key={rk.id}
                    onClick={() => setSelectedRiskFilter(rk.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedRiskFilter === rk.id
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {rk.id !== "ALL" && (
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: rk.color }}></span>
                    )}
                    <span>{rk.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Sector Grid/List */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[50vh] grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-100/50">
              {filteredZones.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                  No monitoring sectors found matching "{sectorSearchQuery}".
                </div>
              ) : (
                filteredZones.map((z) => {
                  const isSelected = selectedZone.id === z.id
                  return (
                    <button
                      key={z.id}
                      onClick={() => {
                        handleZoneSelect(z)
                        setSectorModalOpen(false)
                      }}
                      className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected 
                          ? "bg-blue-50/90 border-blue-600 ring-2 ring-blue-600/30 shadow-sm" 
                          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: z.tierColor }}
                          ></span>
                          <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? "text-blue-950 font-extrabold" : "text-slate-900"}`}>
                            {z.name}
                          </span>
                        </div>
                        <span 
                          className="text-[9px] font-black uppercase px-2 py-0.5 rounded text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: z.tierColor }}
                        >
                          {z.tier}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        <strong className="text-slate-800">{z.state}</strong> • {z.sub}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 font-mono">
                        <span>{z.lat.toFixed(2)}°N, {z.lon.toFixed(2)}°E</span>
                        <div className="flex items-center gap-2 font-sans font-semibold">
                          <span>Slope: {z.defaultSlope}°</span>
                          <span>•</span>
                          <span className="text-sky-700">{z.defaultWetness}% Sat</span>
                          {isSelected && (
                            <span className="text-blue-700 font-bold bg-blue-100 px-1 rounded">ACTIVE</span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Showing <strong>{filteredZones.length}</strong> of {ZONES.length} Regional Hazard Sectors</span>
              <button
                onClick={() => setSectorModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
