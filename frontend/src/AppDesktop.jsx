import React, { useState, useEffect, useCallback } from "react"
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from "react-leaflet"
import { getWeather, broadcastAlert, dispatchBleBroadcast, getBleGatewayNodes, getApiBaseUrl, setCustomBackendUrl } from "./api/client"

function ZoomWatcher({ onZoomChange }) {
  const map = useMap()
  useEffect(() => {
    const handler = () => onZoomChange(map.getZoom())
    map.on('zoomend', handler)
    return () => map.off('zoomend', handler)
  }, [map, onZoomChange])
  return null
}

function getColor(score) {
  if (score >= 80) return '#d32f2f'
  if (score >= 65) return '#ff7043'
  if (score >= 45) return '#fbc02d'
  if (score >= 25) return '#7cb342'
  return '#2e7d32'
}

const ZONES = [
  { id:1, name:"Jaintia Hills, Meghalaya", score:87, fillOpacity:0.65, coords:[[25.20,92.30],[25.00,92.00],[24.85,92.40],[25.05,92.70],[25.20,92.30]], description:"Active Disang shale thrust zone. NH-44 corridor debris flow risk.", risk:"CRITICAL" },
  { id:2, name:"Sohra / Cherrapunji, Meghalaya", score:74, fillOpacity:0.55, coords:[[25.40,91.60],[25.20,91.40],[25.10,91.70],[25.30,91.90],[25.40,91.60]], description:"World-record rainfall. Limestone escarpment failure.", risk:"HIGH" },
  { id:3, name:"Ri-Bhoi District, Meghalaya", score:52, fillOpacity:0.45, coords:[[26.00,91.70],[25.70,91.50],[25.60,92.00],[25.90,92.20],[26.00,91.70]], description:"Sub-Himalayan foothills. Seasonal translational soil slips.", risk:"MODERATE" },
  { id:4, name:"Brahmaputra Valley, Assam", score:18, fillOpacity:0.30, coords:[[26.50,91.20],[26.10,90.80],[25.95,92.00],[26.40,92.50],[26.50,91.20]], description:"Flat alluvial floodplain. Very low slope gradient.", risk:"SAFE" },
  { id:5, name:"Barak Valley, Assam", score:32, fillOpacity:0.38, coords:[[25.00,92.60],[24.70,92.30],[24.55,92.80],[24.80,93.10],[25.00,92.60]], description:"Rolling hills. Flash flood risk in peak monsoon.", risk:"LOW" },
  { id:6, name:"North Sikkim", score:83, fillOpacity:0.65, coords:[[28.00,88.40],[27.60,88.10],[27.40,88.50],[27.70,88.80],[28.00,88.40]], description:"Teesta MCT active fault. Glacial moraine instability.", risk:"CRITICAL" },
  { id:7, name:"South Sikkim", score:55, fillOpacity:0.45, coords:[[27.40,88.40],[27.10,88.20],[27.00,88.55],[27.25,88.75],[27.40,88.40]], description:"Namchi terraced ridges. Sandstone weathering.", risk:"MODERATE" },
  { id:8, name:"Aizawl East, Mizoram", score:71, fillOpacity:0.55, coords:[[23.85,92.60],[23.65,92.40],[23.55,92.80],[23.75,93.00],[23.85,92.60]], description:"Urban hill cutting. Saturated residential slopes.", risk:"HIGH" },
  { id:9, name:"Lunglei District, Mizoram", score:48, fillOpacity:0.42, coords:[[23.10,92.80],[22.75,92.60],[22.65,93.00],[22.95,93.20],[23.10,92.80]], description:"Longitudinal valley ridges. Moderate soil saturation.", risk:"MODERATE" },
  { id:10, name:"Kohima District, Nagaland", score:68, fillOpacity:0.52, coords:[[25.80,94.00],[25.55,93.75],[25.45,94.20],[25.65,94.45],[25.80,94.00]], description:"NH-29 corridor. Active slope cutting and subsidence.", risk:"HIGH" },
  { id:11, name:"Mon District, Nagaland", score:29, fillOpacity:0.38, coords:[[27.00,95.00],[26.60,94.75],[26.50,95.20],[26.80,95.45],[27.00,95.00]], description:"Forested gentle slopes. Low historical slide frequency.", risk:"LOW" },
  { id:12, name:"Imphal East, Manipur", score:15, fillOpacity:0.28, coords:[[24.95,93.90],[24.70,93.65],[24.60,94.05],[24.85,94.25],[24.95,93.90]], description:"Loktak basin floor. Flat stable alluvial terrain.", risk:"SAFE" },
  { id:13, name:"Senapati District, Manipur", score:50, fillOpacity:0.43, coords:[[25.40,93.90],[25.10,93.65],[24.95,94.10],[25.25,94.35],[25.40,93.90]], description:"Hill district terraced agriculture. Seasonal erosion.", risk:"MODERATE" },
  { id:14, name:"Tawang District, Arunachal Pradesh", score:81, fillOpacity:0.65, coords:[[27.75,91.95],[27.45,91.65],[27.30,92.05],[27.60,92.35],[27.75,91.95]], description:"High-altitude MCT zone. Permafrost degradation.", risk:"CRITICAL" },
  { id:15, name:"Itanagar, Arunachal Pradesh", score:45, fillOpacity:0.42, coords:[[27.20,93.65],[26.95,93.40],[26.85,93.80],[27.10,94.00],[27.20,93.65]], description:"Tertiary sandstone hills. Urban slope cutting.", risk:"MODERATE" },
  { id:16, name:"Agartala Plains, Tripura", score:12, fillOpacity:0.28, coords:[[23.95,91.20],[23.70,91.00],[23.60,91.40],[23.85,91.60],[23.95,91.20]], description:"Flat river basin. Very stable alluvial terrain.", risk:"SAFE" },
]

const SENSORS = [
  { lat:25.05, lng:92.12, name:"SNR-ML-001 Jaintia Hills", status:"Online", reading:"87% moisture 12mm/hr" },
  { lat:25.28, lng:91.72, name:"SNR-ML-002 Sohra", status:"Online", reading:"180mm/24hr" },
  { lat:27.60, lng:88.45, name:"SNR-SK-004 North Sikkim", status:"Online", reading:"4.2mm displacement" },
  { lat:23.73, lng:92.72, name:"SNR-MZ-012 Aizawl", status:"Degraded", reading:"88% moisture" },
  { lat:25.67, lng:94.11, name:"SNR-NL-007 Kohima", status:"Online", reading:"76mm/24hr" },
  { lat:24.80, lng:92.75, name:"SNR-AS-019 Barak", status:"Online", reading:"Level: HIGH" },
  { lat:25.27, lng:94.02, name:"SNR-MN-003 Senapati", status:"Offline", reading:"Last: 2hrs ago" },
  { lat:27.59, lng:91.86, name:"SNR-AR-008 Tawang", status:"Online", reading:"68mm/24hr -2C" },
]

const BLE_PRESETS_LIST = [
  { code: 1, label: "Immediate Evacuation", text: "EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to safe ground." },
  { code: 2, label: "Debris Flow Imminent", text: "DEBRIS FLOW IMMINENT: Heavy rainfall detected. Stay clear of natural drainage channels." },
  { code: 3, label: "Road & Highway Blocked", text: "ROAD BLOCKED: Rockfall at highway corridor. Traffic suspended." },
  { code: 4, label: "Move to Bedrock Shelter", text: "SHELTER IN PLACE: Seek designated bedrock refuge center." },
  { code: 5, label: "Flash Flood Runoff Alert", text: "FLASH FLOOD WARNING: Rapid runoff rising in valley floor." },
  { code: 6, label: "Bridge Washed Out", text: "BRIDGE WASHED OUT: Do not attempt crossing." },
]

const INDIA_BOUNDS = [[6.0, 68.0], [38.0, 98.0]]
const NER_CENTER = [25.5, 92.8]
const TERRAIN_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
const SAT_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
const SAT_LABELS_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"

function getIST() {
  return new Date().toLocaleString("en-IN", { timeZone:"Asia/Kolkata", hour12:false,
    hour:"2-digit", minute:"2-digit", second:"2-digit", day:"2-digit", month:"short", year:"numeric" })
}
export default function AppDesktop() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [currentTime, setCurrentTime] = useState(getIST())
  const [mapType, setMapType] = useState("terrain")
  const [currentZoom, setCurrentZoom] = useState(7)
  const [userLocation, setUserLocation] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [userSafetyResult, setUserSafetyResult] = useState(null)
  const [rainfallMultiplier, setRainfallMultiplier] = useState(1.0)
  const [showMonitoringSensors, setShowMonitoringSensors] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showBleModal, setShowBleModal] = useState(false)
  const [showBackendModal, setShowBackendModal] = useState(false)
  const [customBackendInput, setCustomBackendInput] = useState(getApiBaseUrl())
  const [pingStatus, setPingStatus] = useState("")
  const [bleZone, setBleZone] = useState("Jaintia Hills")
  const [bleSeverity, setBleSeverity] = useState("CRITICAL")
  const [blePresetCode, setBlePresetCode] = useState(1)
  const [bleMessage, setBleMessage] = useState("EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to safe ground.")
  const [bleGateways, setBleGateways] = useState([])
  const [isBleDispatching, setIsBleDispatching] = useState(false)
  const [sendBleMesh, setSendBleMesh] = useState(true)
  const [toastMsg, setToastMsg] = useState("")

  const handleTestBackendPing = async () => {
    setPingStatus("testing")
    try {
      let target = customBackendInput.trim().replace(/\/$/, "")
      if (!target.endsWith("/api") && !target.includes("/api/")) {
        target += "/api"
      }
      const res = await fetch(`${target}/weather?lat=25.44&lng=92.21`, { signal: AbortSignal.timeout(3500) })
      if (res.ok) {
        setPingStatus("connected")
        showToast("✅ Backend Server responsive!")
      } else {
        setPingStatus("error")
        showToast(`⚠️ Server responded with HTTP ${res.status}`)
      }
    } catch(err) {
      setPingStatus("failed")
      showToast("❌ Could not reach server. Check IP & port.")
    }
  }

  const handleSaveBackendUrl = () => {
    setCustomBackendUrl(customBackendInput.trim())
    setShowBackendModal(false)
    showToast("✅ Backend Server saved! Reloading...")
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
  const [sendSms, setSendSms] = useState(true)
  const [notifyNdrf, setNotifyNdrf] = useState(true)
  const [closeHighway, setCloseHighway] = useState(false)
  const [alertHospital, setAlertHospital] = useState(true)
  const [sendPush, setSendPush] = useState(true)
  const [reportName, setReportName] = useState("")
  const [reportPhone, setReportPhone] = useState("")
  const [reportLoc, setReportLoc] = useState("")
  const [reportType, setReportType] = useState("crack")
  const [reportDesc, setReportDesc] = useState("")
  const [citizenReports, setCitizenReports] = useState([
    { id:1, title:"Cracks in retaining wall near school", desc:"Large cracks appeared after last night rain. Water seeping through.", loc:"Dawki Road, Meghalaya", time:"2 hrs ago", status:"pending" },
    { id:2, title:"Road subsidence on NH-29 near Kohima", desc:"30cm dip in road surface. Vehicles avoiding the section.", loc:"Kohima Bypass, Nagaland", time:"5 hrs ago", status:"verified" },
    { id:3, title:"Mudflow debris blocking paddy field", desc:"Small debris flow from hillside blocked irrigation channel.", loc:"Senapati, Manipur", time:"Yesterday", status:"verified" },
  ])
  const [liveSoil, setLiveSoil] = useState(87)
  const [liveDisp, setLiveDisp] = useState(4.2)
  const [liveRain, setLiveRain] = useState(12)

  // IST Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(getIST()), 1000)
    return () => clearInterval(t)
  }, [])

  // Live sensor simulation
  useEffect(() => {
    const t = setInterval(() => {
      setLiveSoil(v => Math.min(99, Math.max(60, v + (Math.random()-0.45)*2)))
      setLiveDisp(v => Math.min(8, Math.max(0.5, v + (Math.random()-0.4)*0.3)))
      setLiveRain(v => Math.min(25, Math.max(5, v + (Math.random()-0.45)*1.5)))
    }, 2500)
    return () => clearInterval(t)
  }, [])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3500)
  }, [])

  const handleGetLocation = useCallback(async () => {
    setLocLoading(true)
    setUserSafetyResult(null)
    const process = async (lat, lng) => {
      setUserLocation({ lat, lng })
      const w = await getWeather(lat, lng)
      const dist = (z) => Math.sqrt((z.coords[0][0]-lat)**2+(z.coords[0][1]-lng)**2)
      const nearest = ZONES.reduce((a,b) => dist(a)<dist(b)?a:b)
      const rain = w.precipitation || 0
      const simScore = Math.min(Math.round(nearest.score*(rain>30?1.2:rain>15?1.1:1.0)),99)
      const status = simScore>=80?"CRITICAL":simScore>=45?"CAUTION":"SAFE"
      setUserSafetyResult({
        status, riskScore:simScore, zoneName:nearest.name,
        rain:rain.toFixed(1), temp:(w.temperature||22).toFixed(1), wind:(w.wind||8).toFixed(1),
        message: status==="CRITICAL" ? "Evacuate immediately. High slope failure probability."
          : status==="CAUTION" ? "Stay alert. Avoid hillside roads and streams."
          : "Terrain is stable. Continue monitoring weather updates.",
        color: status==="CRITICAL"?"#d32f2f":status==="CAUTION"?"#e67e22":"#2e7d32"
      })
      setLocLoading(false)
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => process(p.coords.latitude,p.coords.longitude), () => process(26.1445,91.7362))
    } else { process(26.1445,91.7362) }
  }, [])

  const fetchGateways = useCallback(async () => {
    try {
      const data = await getBleGatewayNodes()
      if (data && data.nodes) setBleGateways(data.nodes)
    } catch (e) {}
  }, [])

  useEffect(() => {
    fetchGateways()
    const interval = setInterval(fetchGateways, 8000)
    return () => clearInterval(interval)
  }, [fetchGateways])

  const handleSelectBlePreset = (code) => {
    setBlePresetCode(code)
    const found = BLE_PRESETS_LIST.find(p => p.code === code)
    if (found) {
      setBleMessage(found.text)
    }
  }

  const handleDispatchBleBroadcast = async () => {
    setIsBleDispatching(true)
    try {
      const res = await dispatchBleBroadcast({
        zone_name: bleZone,
        severity: bleSeverity,
        risk_score: bleSeverity === "CRITICAL" ? 88 : (bleSeverity === "HIGH" ? 72 : 55),
        preset_code: blePresetCode,
        message: bleMessage,
        target_gateway: "all"
      })
      setShowBleModal(false)
      showToast(`📡 BLE Broadcast Dispatched to Primary Phone! ID: ${res.dispatch_id || "BLE-RELAY"} (${res.primary_gateways_notified || 1} Gateway notified)`)
    } catch (err) {
      showToast("Failed to dispatch BLE broadcast.")
    } finally {
      setIsBleDispatching(false)
    }
  }

  const handleExecuteEmergency = useCallback(async () => {
    const channels = []
    if (sendSms) channels.push("sms")
    if (notifyNdrf) channels.push("ndrf")
    if (closeHighway) channels.push("highway")
    if (alertHospital) channels.push("medical")
    if (sendPush) channels.push("push")
    if (sendBleMesh) channels.push("ble_mesh")

    const res = await broadcastAlert({ zone_name:"Jaintia Hills", severity:"CRITICAL", message:"Evacuate immediately. Debris flow imminent.", channels, population_affected:1250 })

    if (sendBleMesh) {
      dispatchBleBroadcast({
        zone_name: "Jaintia Hills",
        severity: "CRITICAL",
        risk_score: 87,
        preset_code: 1,
        message: "Evacuate immediately. Debris flow imminent."
      })
    }

    setShowModal(false)
    showToast("Emergency dispatched. ID: " + (res.dispatch_id||"AEGIS-EXEC") + (sendBleMesh ? " (BLE Mesh Active)" : ""))
  }, [sendSms,notifyNdrf,closeHighway,alertHospital,sendPush,sendBleMesh,showToast])

  const handleReportSubmit = useCallback((e) => {
    e.preventDefault()
    setCitizenReports(r => [{
      id:r.length+1, title:reportType.toUpperCase()+": "+reportLoc,
      desc:reportDesc||"Reported by citizen.", loc:reportLoc, time:"Just now", status:"pending"
    },...r])
    setReportName(""); setReportPhone(""); setReportLoc(""); setReportDesc("")
    showToast("Report submitted. Field team will verify within 2 hours.")
  }, [reportType,reportLoc,reportDesc,showToast])


  return (
    <div style={{ minHeight:"100vh", background:"#eef1f5" }}>
      {/* HEADER */}
      <div className="govt-header">
        <img src="/logo.jpg" alt="Team AEGIS Emblem" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:"2px solid #c59b27",flexShrink:0}} />
        <div className="header-text">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <h1>NER Landslide Early Warning System</h1>
            <span style={{background:"#c59b27",color:"#0d2240",fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:3,letterSpacing:"0.8px"}}>TEAM AEGIS</span>
          </div>
          <p>Ministry of Development of North Eastern Region (MDoNER) &nbsp;|&nbsp; Government of India &nbsp;|&nbsp; Developed by <strong style={{color:"#c59b27"}}>Team AEGIS</strong></p>
        </div>
        <div className="header-right">
          <div style={{fontFamily:"Consolas,monospace",fontSize:12}}>{currentTime}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
            <button
              onClick={()=>setShowBackendModal(true)}
              style={{background:"rgba(255,255,255,0.14)",border:"1px solid rgba(255,255,255,0.3)",color:"#ffffff",borderRadius:4,padding:"2px 8px",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}
              title="Configure FastAPI Backend & Cloud Mesh Connection"
            >
              <span>📡</span>
              <span>Backend: {getApiBaseUrl()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="main-nav">
        {[["dashboard","Dashboard"],["map","Risk Map"],["predictions","AI Predictions"],["alerts","Alerts",7],["sensors","Sensors"],["rainfall","Rainfall"],["report","Citizen Reports"],["analytics","Analytics"]].map(([tab,label,badge]) => (
          <button key={tab} className={activeTab===tab?"active":""} onClick={()=>setActiveTab(tab)}>
            {label}{badge&&<span className="alert-count">{badge}</span>}
          </button>
        ))}
      </nav>

      <div className="portal-container">

        {/* ===== DASHBOARD ===== */}
        {activeTab==="dashboard" && <section>
          <div className="alert-strip">
            <span className="live-dot"/>
            <div style={{flex:1}}><strong>Active Warning:</strong> High landslide risk — Jaintia Hills, Meghalaya. 180mm/24hr. AI confidence: 87%. Evacuation advisory issued for 3 villages.</div>
            <button className="portal-btn portal-btn-red portal-btn-sm" onClick={()=>setActiveTab("alerts")}>View Alerts</button>
            <button className="portal-btn portal-btn-sm" style={{background:"#0284c7",color:"white",fontWeight:600,display:"flex",alignItems:"center",gap:4}} onClick={()=>setShowBleModal(true)}>📡 Start BLE Message Broadcast</button>
          </div>
          <div className="stat-row">
            <div className="stat-box red"><div className="label">Critical Zones</div><div className="value">12</div><div className="sub">+3 since yesterday</div></div>
            <div className="stat-box orange"><div className="label">High Risk Zones</div><div className="value">28</div><div className="sub">Across 6 states</div></div>
            <div className="stat-box blue"><div className="label">Active Sensors</div><div className="value">341/347</div><div className="sub">98.2% uptime</div></div>
            <div className="stat-box green"><div className="label">Evacuated Safely</div><div className="value">2,340</div><div className="sub">0 casualties this season</div></div>
            <div className="stat-box"><div className="label">Alerts Resolved</div><div className="value">156</div><div className="sub">This monsoon season</div></div>
          </div>
          <div className="two-col">
            {/* DASHBOARD MAP */}
            <div className="portal-card">
              <div className="card-title">
                <span><span className="live-dot"/> Live Risk Map ��� NER Susceptibility Zones</span>
                <div style={{display:"flex",gap:6}}>
                  <button className={"portal-btn portal-btn-sm"+(mapType==="terrain"?" portal-btn-blue":"")} onClick={()=>setMapType("terrain")}>Terrain</button>
                  <button className={"portal-btn portal-btn-sm"+(mapType==="satellite"?" portal-btn-blue":"")} onClick={()=>setMapType("satellite")}>Satellite</button>
                  <button className="portal-btn portal-btn-sm" onClick={()=>setActiveTab("map")}>Full Map</button>
                </div>
              </div>
              <div style={{height:400,width:"100%"}}>
                <MapContainer center={NER_CENTER} zoom={7} minZoom={5} maxZoom={16} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0} style={{height:"100%",width:"100%"}}>
                  <ZoomWatcher onZoomChange={setCurrentZoom}/>
                  <TileLayer key={`dash-tile-${mapType}`} url={mapType==="satellite"?SAT_URL:TERRAIN_URL} maxZoom={19} keepBuffer={12} updateWhenIdle={false} />
                  {mapType==="satellite" && <TileLayer key="dash-labels" url={SAT_LABELS_URL} maxZoom={19} opacity={0.85} keepBuffer={12} />}
                  {ZONES.map(z=>{
                    const c=getColor(z.score)
                    return <Polygon key={z.id} positions={z.coords} pathOptions={{color:c,fillColor:c,fillOpacity:0.50,weight:1.5}}>
                      <Popup><div style={{minWidth:180}}><h4 style={{color:c,margin:"0 0 4px"}}>{z.name}</h4><p style={{fontSize:11,color:"#555",margin:"0 0 6px"}}>{z.description}</p><div style={{fontSize:12}}>Risk: <b style={{color:c}}>{z.risk} ({z.score}%)</b></div></div></Popup>
                    </Polygon>
                  })}
                  {userLocation&&<CircleMarker center={[userLocation.lat,userLocation.lng]} radius={9} pathOptions={{color:"#fff",fillColor:userSafetyResult?.color||"#1a3c6e",fillOpacity:1,weight:3}}><Popup><strong>Your Location</strong><br/>{userSafetyResult?.status}</Popup></CircleMarker>}
                </MapContainer>
              </div>
              <div className="map-legend">
                {[["#d32f2f","Critical"],["#ff7043","High"],["#fbc02d","Moderate"],["#7cb342","Low"],["#2e7d32","Safe"]].map(([c,l])=><span key={c}><span className="dot" style={{background:c}}/>{l}</span>)}
              </div>
            </div>

            {/* CITIZEN SAFETY */}
            <div className="portal-card">
              <div className="card-title">Citizen Real-Time Location Safety Analyzer</div>
              <div className="card-body">
                <p style={{fontSize:12,color:"#666",marginBottom:16,lineHeight:1.5}}>Click below to detect your current GPS location. The system evaluates whether you are in a safe zone or at risk from an active landslide hazard using live weather and geological data.</p>
                <button className="portal-btn portal-btn-blue" style={{width:"100%",padding:10,fontSize:13,marginBottom:16}} onClick={handleGetLocation} disabled={locLoading}>
                  {locLoading?"Detecting location and analyzing risk...":"Detect My Location and Verify Safety"}
                </button>
                {userSafetyResult&&<div className="safety-card" style={{borderColor:userSafetyResult.color,background:userSafetyResult.color+"18"}}>
                  <div style={{fontSize:32,marginBottom:8}}>{userSafetyResult.status==="SAFE"?"\u2705":userSafetyResult.status==="CRITICAL"?"\uD83D\uDEA8":"\u26A0\uFE0F"}</div>
                  <div style={{fontSize:18,fontWeight:800,color:userSafetyResult.color,marginBottom:4}}>
                    {userSafetyResult.status==="SAFE"?"YOU ARE IN A SAFE ZONE":userSafetyResult.status==="CRITICAL"?"CRITICAL LANDSLIDE RISK":"CAUTION ��� WATCH ZONE"}
                  </div>
                  <div style={{fontSize:12,color:"#555",marginBottom:12}}>{userSafetyResult.message}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                    {[["Rain",userSafetyResult.rain+" mm/hr"],["Temp",userSafetyResult.temp+"C"],["Wind",userSafetyResult.wind+" km/h"]].map(([l,v])=>(
                      <div key={l} style={{background:"#fff",border:"1px solid #eee",borderRadius:4,padding:8,textAlign:"center"}}><div style={{fontSize:11,color:"#888"}}>{l}</div><div style={{fontWeight:700}}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:"#777"}}>Zone: <strong>{userSafetyResult.zoneName}</strong> &mdash; Score: <strong style={{color:userSafetyResult.color}}>{userSafetyResult.riskScore}%</strong></div>
                  {userLocation&&<div style={{fontSize:10,color:"#aaa",marginTop:4}}>{userLocation.lat.toFixed(4)}N {userLocation.lng.toFixed(4)}E</div>}
                </div>}
                {!userSafetyResult&&!locLoading&&<div style={{textAlign:"center",color:"#bbb",padding:32,fontSize:13}}>Your safety status will appear here</div>}
              </div>
            </div>
          </div>
        </section>}

        {/* ===== RISK MAP ===== */}
        {activeTab==="map"&&<section>
          <div className="portal-card" style={{marginBottom:12}}>
            <div className="card-body" style={{padding:"12px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <strong style={{fontSize:13,color:"#1a3c6e",whiteSpace:"nowrap"}}>
                  Rainfall Stress-Test: {rainfallMultiplier.toFixed(1)}x
                  {rainfallMultiplier>1.5?" ��� EXTREME CLOUDBURST SIMULATION":rainfallMultiplier>1?" ��� Elevated Monsoon":"��� Baseline"}
                </strong>
                <input type="range" min={0.5} max={2.5} step={0.1} value={rainfallMultiplier} onChange={e=>setRainfallMultiplier(parseFloat(e.target.value))} style={{flex:1,minWidth:180,accentColor:"#c59b27"}}/>
                <button className="portal-btn portal-btn-sm" onClick={()=>setRainfallMultiplier(1.0)}>Reset</button>
              </div>
            </div>
          </div>
          <div className="portal-card">
            <div className="card-title">
              GIS Risk Map ��� NER Landslide Susceptibility (AI-LEWS)
              <div style={{display:"flex",gap:6}}>
                <button className={"portal-btn portal-btn-sm"+(showMonitoringSensors?" portal-btn-blue":"")} onClick={()=>setShowMonitoringSensors(v=>!v)}>
                  {showMonitoringSensors?"Hide Sensors":"Show Sensors"}
                </button>
                <button className={"portal-btn portal-btn-sm"+(mapType==="terrain"?" portal-btn-blue":"")} onClick={()=>setMapType("terrain")}>Terrain</button>
                <button className={"portal-btn portal-btn-sm"+(mapType==="satellite"?" portal-btn-blue":"")} onClick={()=>setMapType("satellite")}>Satellite</button>
              </div>
            </div>
            <div style={{height:580,width:"100%"}}>
              <MapContainer center={NER_CENTER} zoom={7} minZoom={5} maxZoom={16} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0} style={{height:"100%",width:"100%"}}>
                <ZoomWatcher onZoomChange={setCurrentZoom}/>
                <TileLayer key={`risk-tile-${mapType}`} url={mapType==="satellite"?SAT_URL:TERRAIN_URL} maxZoom={19} keepBuffer={12} updateWhenIdle={false} />
                {mapType==="satellite" && <TileLayer key="risk-labels" url={SAT_LABELS_URL} maxZoom={19} opacity={0.85} keepBuffer={12} />}
                {ZONES.map(z=>{
                  const sim=Math.min(Math.round(z.score*(rainfallMultiplier>1?1+(rainfallMultiplier-1)*0.6:rainfallMultiplier)),99)
                  const c=getColor(sim)
                  return <Polygon key={"m"+z.id} positions={z.coords} pathOptions={{color:c,fillColor:c,fillOpacity:0.52,weight:1.5}}>
                    <Popup><div style={{minWidth:220}}>
                      <span style={{display:"inline-block",padding:"2px 8px",borderRadius:3,fontSize:11,fontWeight:700,color:"#fff",background:c,marginBottom:6}}>
                        {sim>=80?"CRITICAL":sim>=65?"HIGH":sim>=45?"MODERATE":sim>=25?"LOW":"SAFE"} ��� {sim}%
                      </span>
                      <h4 style={{margin:"0 0 4px",color:"#1a3c6e"}}>{z.name}</h4>
                      <p style={{fontSize:11,color:"#555",lineHeight:1.4}}>{z.description}</p>
                      {rainfallMultiplier!==1&&<div style={{fontSize:11,color:"#c0392b",marginTop:4}}>Simulated {rainfallMultiplier.toFixed(1)}x rainfall stress</div>}
                    </div></Popup>
                  </Polygon>
                })}
                {showMonitoringSensors&&SENSORS.map((s,i)=>(
                  <CircleMarker key={i} center={[s.lat,s.lng]} radius={7} pathOptions={{color:"#fff",fillColor:s.status==="Online"?"#27ae60":s.status==="Degraded"?"#e67e22":"#c0392b",fillOpacity:1,weight:2}}>
                    <Popup><strong>{s.name}</strong><br/><small>{s.status}</small><br/><small>{s.reading}</small></Popup>
                  </CircleMarker>
                ))}
                {userLocation&&<CircleMarker center={[userLocation.lat,userLocation.lng]} radius={10} pathOptions={{color:"#fff",fillColor:userSafetyResult?.color||"#1a3c6e",fillOpacity:1,weight:3}}><Popup><strong>Your Location</strong></Popup></CircleMarker>}
              </MapContainer>
            </div>
            <div className="map-legend">
              {[["#d32f2f","Critical (>=80%) Thrust Fault"],["#ff7043","High (65-79%) Steep Escarpment"],["#fbc02d","Moderate (45-64%) Ridge"],["#7cb342","Low (25-44%) Foothills"],["#2e7d32","Safe (<25%) Plains"]].map(([c,l])=><span key={c}><span className="dot" style={{background:c}}/>{l}</span>)}
            </div>
          </div>
        </section>}

        {/* ===== AI PREDICTIONS ===== */}
        {activeTab==="predictions"&&<section>
          <div className="portal-card" style={{marginBottom:12}}>
            <div className="card-body" style={{fontSize:12,color:"#555"}}>
              <strong>Model:</strong> LandslideNet v3.2 (XGBoost + SHAP ensemble) &nbsp;|&nbsp; <strong>Accuracy:</strong> 89.3% &nbsp;|&nbsp; <strong>ROC-AUC:</strong> 0.92 &nbsp;|&nbsp; <strong>Retrained:</strong> Daily 00:00 IST
            </div>
          </div>
          <div className="two-col-eq">
            {[
              {name:"Jaintia Hills, Meghalaya",coords:"25.05N 92.12E",sev:"CRITICAL",score:87,rain:"180mm",soil:"92%",slope:"38deg",seismic:"1.8",desc:"High probability debris flow. 3 villages at risk. Saturated Disang shale. NH-44 closure advisory.",color:"#c0392b",eta:"4-6 hrs",pop:1250},
              {name:"Gangtok South, Sikkim",coords:"27.33N 88.61E",sev:"CRITICAL",score:82,rain:"155mm",soil:"89%",slope:"42deg",seismic:"2.1",desc:"Inclinometer reading 4.2mm displacement. Teesta MCT micro-seismic activity detected.",color:"#c0392b",eta:"6-8 hrs",pop:890},
              {name:"Aizawl East, Mizoram",coords:"23.73N 92.72E",sev:"HIGH",score:71,rain:"132mm",soil:"84%",slope:"30deg",seismic:"0.6",desc:"Critical soil saturation in residential hillside. Retaining wall cracks reported by citizens.",color:"#e67e22",eta:"12-18 hrs",pop:560},
              {name:"Kohima NH-29, Nagaland",coords:"25.67N 94.11E",sev:"HIGH",score:68,rain:"115mm",soil:"79%",slope:"28deg",seismic:"0.4",desc:"Historical landslide corridor. Road subsidence pattern and slope undercutting observed.",color:"#e67e22",eta:"24-36 hrs",pop:0},
              {name:"Ri-Bhoi District, Meghalaya",coords:"25.75N 91.95E",sev:"MODERATE",score:52,rain:"98mm",soil:"68%",slope:"22deg",seismic:"0.2",desc:"Sub-Himalayan foothills with seasonal translational slips.",color:"#f39c12",eta:"48 hrs+",pop:320},
              {name:"Tawang, Arunachal Pradesh",coords:"27.59N 91.86E",sev:"MODERATE",score:45,rain:"68mm",soil:"52%",slope:"25deg",seismic:"0.9",desc:"High altitude MCT zone. Moderate rainfall. Routine monitoring active.",color:"#27ae60",eta:"--",pop:0},
            ].map((p,i)=>(
              <div key={i} className="pred-card" style={{borderLeft:"4px solid "+p.color}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><h4 style={{margin:"0 0 2px"}}>{p.name}</h4><div style={{fontSize:11,color:"#888"}}>{p.coords}</div></div>
                  <span className={"tag tag-"+p.sev.toLowerCase()}>{p.sev} {p.score}%</span>
                </div>
                <p style={{fontSize:12,color:"#666",margin:"8px 0",lineHeight:1.4}}>{p.desc}</p>
                <div className="pred-factors">
                  <div className="factor"><div className="val" style={{color:p.color}}>{p.rain}</div><div className="lbl">Rainfall</div></div>
                  <div className="factor"><div className="val" style={{color:p.color}}>{p.soil}</div><div className="lbl">Soil Sat.</div></div>
                  <div className="factor"><div className="val">{p.slope}</div><div className="lbl">Slope</div></div>
                  <div className="factor"><div className="val">{p.seismic}</div><div className="lbl">Seismic</div></div>
                </div>
                <div style={{display:"flex",gap:12,fontSize:11,color:"#888",marginTop:6}}>
                  <span>ETA: {p.eta}</span>{p.pop>0&&<span>Pop at risk: {p.pop.toLocaleString()}</span>}
                </div>
                <div className="conf-bar"><div className="conf-fill" style={{width:p.score+"%",background:p.color}}/></div>
              </div>
            ))}
          </div>
        </section>}

        {/* ===== ALERTS ===== */}
        {activeTab==="alerts"&&<section>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{fontSize:16,fontWeight:600,color:"#1a3c6e"}}>Active Alerts — NER Region</h3>
            <div style={{display:"flex",gap:8}}>
              <button className="portal-btn portal-btn-red portal-btn-sm" onClick={()=>setShowModal(true)}>Send Mass Alert</button>
              <button className="portal-btn portal-btn-sm" style={{background:"#0284c7",color:"white",fontWeight:600,display:"flex",alignItems:"center",gap:6}} onClick={()=>setShowBleModal(true)}>📡 Start BLE Message Broadcast</button>
              <button className="portal-btn portal-btn-sm" onClick={()=>showToast("Exported to CSV.")}>Export CSV</button>
            </div>
          </div>
          <div className="portal-card">
            <table className="portal-table">
              <thead><tr><th>Level</th><th>Location</th><th>State</th><th>Type</th><th>AI Score</th><th>Population</th><th>Time</th><th>Action</th></tr></thead>
              <tbody>
                {[["CRITICAL","Jaintia Hills","Meghalaya","Debris Flow","87%","1,250","3 min ago"],
                  ["CRITICAL","Gangtok South","Sikkim","Slope Failure","82%","890","18 min ago"],
                  ["HIGH","NH-6 Kohima","Nagaland","Road Blockage","73%","--","45 min ago"],
                  ["HIGH","Barak Valley","Assam","Flash Flood","68%","3,400","1 hr ago"],
                  ["MODERATE","Aizawl East","Mizoram","Soil Saturation","55%","560","2 hr ago"],
                  ["MODERATE","Imphal West","Manipur","Terrain Shift","48%","320","3 hr ago"],
                  ["LOW","Agartala Road","Tripura","Minor Crack","22%","--","5 hr ago"],
                ].map(([sev,loc,state,type,score,pop,time],i)=>(
                  <tr key={i}>
                    <td><span className={"tag tag-"+sev.toLowerCase()}>{sev}</span></td>
                    <td>{loc}</td><td>{state}</td><td>{type}</td>
                    <td><strong style={{color:sev==="CRITICAL"?"#c0392b":sev==="HIGH"?"#e67e22":"#2980b9"}}>{score}</strong></td>
                    <td>{pop}</td><td style={{color:"#999"}}>{time}</td>
                    <td>{["CRITICAL","HIGH"].includes(sev)
                      ?<button className="portal-btn portal-btn-red portal-btn-sm" onClick={()=>setShowModal(true)}>Respond</button>
                      :<button className="portal-btn portal-btn-sm" onClick={()=>showToast("Viewing "+loc)}>View</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>}

        {/* ===== SENSORS ===== */}
        {activeTab==="sensors"&&<section>
          <div className="stat-row" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            <div className="stat-box green"><div className="label">Online</div><div className="value">341</div><div className="sub">Fully operational</div></div>
            <div className="stat-box orange"><div className="label">Degraded</div><div className="value">4</div><div className="sub">Partial data</div></div>
            <div className="stat-box red"><div className="label">Offline</div><div className="value">2</div><div className="sub">Field team dispatched</div></div>
            <div className="stat-box blue"><div className="label">Total Deployed</div><div className="value">347</div><div className="sub">NER network</div></div>
          </div>
          <div className="sensor-boxes">
            <div className="sensor-box"><div className="s-label">Soil Moisture ��� SNR-ML-001</div><div className="s-value">{liveSoil.toFixed(1)}%</div><div className="s-unit">Jaintia Hills, Meghalaya ��� LIVE</div></div>
            <div className="sensor-box"><div className="s-label">Slope Displacement ��� SNR-SK-004</div><div className="s-value">{liveDisp.toFixed(2)}mm</div><div className="s-unit">North Sikkim Inclinometer ��� LIVE</div></div>
            <div className="sensor-box"><div className="s-label">Rainfall Intensity ��� SNR-ML-002</div><div className="s-value">{liveRain.toFixed(1)}mm/hr</div><div className="s-unit">Sohra Tipping Gauge ��� LIVE</div></div>
          </div>
          <div className="portal-card">
            <div className="card-title">Sensor Network Status ��� NER</div>
            <table className="portal-table">
              <thead><tr><th>Sensor ID</th><th>Location</th><th>State</th><th>Type</th><th>Status</th><th>Last Reading</th></tr></thead>
              <tbody>
                {[["SNR-ML-001","Jaintia Hills","Meghalaya","Soil Moisture + Rain","Online","87% 12mm/hr"],
                  ["SNR-ML-002","Sohra","Meghalaya","Tipping Bucket Rain","Online","180mm/24hr"],
                  ["SNR-SK-004","Gangtok South","Sikkim","Inclinometer","Online","4.2mm displacement"],
                  ["SNR-MZ-012","Aizawl East","Mizoram","Soil Moisture","Degraded","88% (partial)"],
                  ["SNR-NL-007","Kohima NH-29","Nagaland","Rain + Camera","Online","76mm/24hr"],
                  ["SNR-AS-019","Barak Valley","Assam","Water Level + Seismic","Online","Level: HIGH"],
                  ["SNR-MN-003","Senapati","Manipur","Ground Displacement","Offline","Last: 2hrs ago"],
                  ["SNR-AR-008","Tawang Pass","Arunachal Pradesh","Weather + Seismic","Online","68mm 0.9 seismic"],
                ].map(([id,loc,st,type,status,reading])=>(
                  <tr key={id}>
                    <td><code style={{fontSize:11}}>{id}</code></td>
                    <td>{loc}</td><td>{st}</td><td>{type}</td>
                    <td><span className={"tag tag-"+status.toLowerCase()}>{status}</span></td>
                    <td style={{fontSize:11,color:"#666"}}>{reading}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>}

        {/* ===== RAINFALL ===== */}
        {activeTab==="rainfall"&&<section>
          <div className="portal-card">
            <div className="card-title">7-Day Rainfall ��� Jaintia Hills, Meghalaya (mm)</div>
            <div className="card-body">
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:200,marginBottom:16}}>
                {[["27 Aug",45,"#27ae60"],["28 Aug",62,"#2980b9"],["29 Aug",88,"#2980b9"],["30 Aug",120,"#e67e22"],["31 Aug",95,"#e67e22"],["1 Sep",145,"#c0392b"],["2 Sep",180,"#c0392b"]].map(([day,val,col])=>(
                  <div key={day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%"}}>
                    <span style={{fontSize:11,marginBottom:2,fontWeight:600}}>{val}</span>
                    <div style={{width:"80%",height:(val/200*100)+"%",background:col,borderRadius:"2px 2px 0 0",minHeight:4}}/>
                    <span style={{fontSize:10,color:"#999",marginTop:4}}>{day}</span>
                  </div>
                ))}
              </div>
              <p style={{fontSize:12,color:"#c0392b",fontWeight:600}}>Total 7-day accumulation: 735mm ��� 340% of seasonal normal. Critical landslide threshold breached.</p>
            </div>
          </div>
          <div className="portal-card">
            <div className="card-title">Current 24h Rainfall ��� NER Station Network</div>
            <div className="card-body">
              {[["Sohra / Cherrapunji, Meghalaya","180mm","#c0392b",90],["Jaintia Hills, Meghalaya","155mm","#c0392b",78],["North Sikkim","120mm","#e67e22",60],["Kohima, Nagaland","76mm","#e67e22",38],["Imphal East, Manipur","45mm","#27ae60",23]].map(([loc,val,col,pct])=>(
                <div key={loc} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span>{loc}</span><span style={{fontWeight:700,color:col}}>{val}</span></div>
                  <div style={{background:"#eef0f3",borderRadius:3,height:20,overflow:"hidden"}}>
                    <div style={{width:pct+"%",height:"100%",background:col,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6,color:"white",fontSize:11,fontWeight:600}}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>}

        {/* ===== CITIZEN REPORTS ===== */}
        {activeTab==="report"&&<section>
          <div className="two-col">
            <div className="portal-card">
              <div className="card-title">Submit Field Observation Report</div>
              <div className="card-body">
                <form onSubmit={handleReportSubmit}>
                  <div className="form-row">
                    <div className="portal-field"><label>Your Name</label><input value={reportName} onChange={e=>setReportName(e.target.value)} placeholder="Full name"/></div>
                    <div className="portal-field"><label>Phone Number</label><input value={reportPhone} onChange={e=>setReportPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"/></div>
                  </div>
                  <div className="portal-field" style={{marginBottom:12}}><label>Location / Landmark</label><input value={reportLoc} onChange={e=>setReportLoc(e.target.value)} placeholder="Village, district, state" required/></div>
                  <div className="form-row">
                    <div className="portal-field"><label>Observation Type</label>
                      <select value={reportType} onChange={e=>setReportType(e.target.value)}>
                        <option value="crack">Cracks in slope or road</option>
                        <option value="mudflow">Mud or debris flow</option>
                        <option value="subsidence">Road or ground subsidence</option>
                        <option value="trees">Tilting trees or poles</option>
                        <option value="water">Unusual water seepage</option>
                        <option value="sound">Unusual rumbling sounds</option>
                      </select>
                    </div>
                    <div className="portal-field"><label>Date and Time</label><input type="datetime-local"/></div>
                  </div>
                  <div className="portal-field" style={{marginBottom:14}}><label>Description</label><textarea rows={3} value={reportDesc} onChange={e=>setReportDesc(e.target.value)} placeholder="Describe what you observed in detail..."/></div>
                  <button type="submit" className="portal-btn portal-btn-blue" style={{width:"100%",padding:10}}>Submit Field Report</button>
                </form>
              </div>
            </div>
            <div className="portal-card">
              <div className="card-title">Recent Reports <span style={{fontSize:11,color:"#999",fontWeight:400}}>{citizenReports.filter(r=>r.status==="pending").length} pending</span></div>
              <div className="card-body">
                {citizenReports.map(r=>(
                  <div key={r.id} style={{padding:"12px 0",borderBottom:"1px solid #eef0f3"}}>
                    <h4 style={{fontSize:13,fontWeight:600,margin:"0 0 4px"}}>{r.title}</h4>
                    <p style={{fontSize:12,color:"#666",margin:"0 0 6px"}}>{r.desc}</p>
                    <div style={{display:"flex",gap:12,fontSize:11,color:"#888",flexWrap:"wrap"}}>
                      <span>{r.loc}</span>
                      <span className={"tag tag-"+(r.status==="verified"?"online":"pending")}>{r.status==="verified"?"Verified":"Pending"}</span>
                      <span>{r.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>}

        {/* ===== ANALYTICS ===== */}
        {activeTab==="analytics"&&<section>
          <div className="stat-row" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            <div className="stat-box green"><div className="label">Lives Saved 2026</div><div className="value">2,340</div><div className="sub">Zero casualties this monsoon</div></div>
            <div className="stat-box blue"><div className="label">Avg Response Time</div><div className="value">23 min</div><div className="sub">67% faster than manual</div></div>
            <div className="stat-box orange"><div className="label">Prediction Accuracy</div><div className="value">89.3%</div><div className="sub">ROC-AUC: 0.92</div></div>
            <div className="stat-box"><div className="label">Total Predictions</div><div className="value">1,847</div><div className="sub">This monsoon season</div></div>
          </div>
          <div className="two-col-eq">
            <div className="portal-card">
              <div className="card-title">State-wise Alerts ��� 2026 Monsoon Season</div>
              <div className="card-body">
                {[["Meghalaya",92,"#c0392b"],["Sikkim",78,"#e67e22"],["Mizoram",65,"#e67e22"],["Nagaland",54,"#2980b9"],["Manipur",48,"#2980b9"],["Assam",42,"#2980b9"],["Arunachal Pradesh",30,"#27ae60"],["Tripura",18,"#27ae60"]].map(([st,v,c])=>(
                  <div key={st} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span>{st}</span><span>{v}</span></div>
                    <div style={{background:"#eef0f3",borderRadius:3,height:20,overflow:"hidden"}}>
                      <div style={{width:v+"%",height:"100%",background:c,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6,color:"white",fontSize:11,fontWeight:600}}>{v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="portal-card">
              <div className="card-title">System Performance Metrics</div>
              <div className="card-body">
                <table className="portal-table">
                  <thead><tr><th>Metric</th><th>Value</th><th>Status</th></tr></thead>
                  <tbody>
                    {[["Model Accuracy","89.3%","Online"],["ROC-AUC Score","0.92","Online"],["False Positive Rate","7.2%","Pending"],["Sensor Uptime","98.2%","Online"],["Alert Latency","2.3 sec","Online"],["SMS Delivery Rate","96.8%","Online"]].map(([m,v,s])=>(
                      <tr key={m}><td>{m}</td><td><strong>{v}</strong></td><td><span className={"tag tag-"+s.toLowerCase()}>{s}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>}

      </div>{/* end portal-container */}

      {/* ===== OFFICIAL TEAM AEGIS FOOTER ===== */}
      <footer style={{marginTop:32,padding:"20px",background:"#1a3c6e",color:"#e2e8f0",fontSize:12,borderTop:"3px solid #c59b27"}}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="/logo.jpg" alt="AEGIS" style={{width:36,height:36,borderRadius:"50%",border:"1.5px solid #c59b27"}}/>
            <div>
              <strong style={{color:"#fff",fontSize:13}}>NER-LEWS v2.0 ��� Team AEGIS</strong>
              <div style={{color:"#cbd5e1",fontSize:11}}>Smart India Hackathon Initiative ��� Disaster Risk Reduction</div>
            </div>
          </div>
          <div style={{color:"#94a3b8",fontSize:11}}>Data: GSI NLSM ��� IMD AWS ��� Open-Meteo ��� In-Situ Geotechnical Telemetry</div>
          <div style={{color:"#c59b27",fontWeight:600}}>Government of India {new Date().getFullYear()}</div>
        </div>
      </footer>

      {/* ===== EMERGENCY MODAL ��� 5 clean checkboxes, zero API keys ===== */}
      {showModal&&<div className="modal-bg show">
        <div className="modal-box">
          <div className="modal-head">
            <h3>Emergency Response ��� Jaintia Hills</h3>
            <button className="modal-close" onClick={()=>setShowModal(false)}>x</button>
          </div>
          <div className="modal-content">
            <div style={{background:"#f9f9f9",padding:12,borderRadius:4,marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
                <div><span style={{color:"#888"}}>Risk Level:</span> <strong style={{color:"#c0392b"}}>CRITICAL ��� 87%</strong></div>
                <div><span style={{color:"#888"}}>ETA:</span> <strong>4-6 hours</strong></div>
                <div><span style={{color:"#888"}}>Population:</span> <strong>1,250 residents</strong></div>
                <div><span style={{color:"#888"}}>Villages:</span> <strong>Shnongpdeng, Dawki, Laitkynsew</strong></div>
              </div>
            </div>
            <p style={{fontSize:13,fontWeight:600,marginBottom:8}}>Select emergency response actions:</p>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {[
                [sendSms,setSendSms,"Send SMS Alert","Automated priority broadcast to 1,250 residents"],
                [notifyNdrf,setNotifyNdrf,"Notify NDRF and SDRF","Mobilize 1st Bn Guwahati Quick Response Team"],
                [closeHighway,setCloseHighway,"Close NH-44 Highway","Deploy traffic diversion barriers immediately"],
                [alertHospital,setAlertHospital,"Alert Medical Facilities","Dawki Civil Hospital and Relief Camp"],
                [sendPush,setSendPush,"Mobile Push Alert and Emergency Siren","Direct broadcast to all subscriber cell towers"],
                [sendBleMesh,setSendBleMesh,"Offline BLE Radio Mesh Broadcast","Commands Primary Phone to broadcast 2.4GHz BLE signal to citizens with no SIM/Wi-Fi"],
              ].map(([val,setter,title,desc])=>(
                <label key={title} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,padding:8,background:"#f9f9f9",borderRadius:3,cursor:"pointer",border:"1px solid #eee"}}>
                  <input type="checkbox" checked={val} onChange={e=>setter(e.target.checked)}/>
                  <div><strong>{title}</strong> <span style={{color:"#666",fontWeight:400}}>({desc})</span></div>
                </label>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="portal-btn portal-btn-red" onClick={handleExecuteEmergency} style={{flex:1,padding:10}}>Execute All Selected Actions</button>
              <button className="portal-btn" onClick={()=>setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>}

      {/* ===== BLE MESSAGE BROADCAST MODAL (WEB TO OFFLINE MESH) ===== */}
      {showBleModal && (
        <div className="modal-bg show">
          <div className="modal-box" style={{maxWidth: 580}}>
            <div className="modal-head" style={{background:"#0d2240",color:"white",padding:"14px 18px",borderRadius:"6px 6px 0 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{background:"#0284c7",padding:"6px 10px",borderRadius:4,fontSize:18}}>📡</div>
                <div>
                  <h3 style={{margin:0,fontSize:16,color:"#fff"}}>Start BLE Message Broadcast</h3>
                  <div style={{fontSize:11,color:"#93c5fd"}}>Web Trigger ➔ Primary Phone Relay ➔ 2.4GHz BLE Radio to Offline Citizens (No SIM / Wi-Fi)</div>
                </div>
              </div>
              <button className="modal-close" onClick={()=>setShowBleModal(false)} style={{color:"#fff"}}>x</button>
            </div>
            
            <div className="modal-content" style={{padding:20}}>
              {/* PRIMARY PHONE GATEWAY STATUS */}
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:6,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:"#16a34a",boxShadow:"0 0 8px #16a34a"}} />
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#166534"}}>
                      {bleGateways.length > 0 ? `${bleGateways.length} Primary Gateway Phone(s) Connected` : "Primary Gateway Phone (Listening on Web Channel)"}
                    </div>
                    <div style={{fontSize:11,color:"#15803d"}}>
                      Hardware BLE Advertiser Ready • Android 2.4GHz Radio Bridge
                    </div>
                  </div>
                </div>
                <button className="portal-btn portal-btn-sm" onClick={fetchGateways} style={{fontSize:10,padding:"3px 8px"}}>Refresh</button>
              </div>

              {/* TARGET ZONE & SEVERITY */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:4}}>TARGET HAZARD ZONE</label>
                  <select 
                    value={bleZone} 
                    onChange={e => setBleZone(e.target.value)}
                    style={{width:"100%",padding:"8px 10px",borderRadius:4,border:"1px solid #cbd5e1",fontSize:13}}
                  >
                    {ZONES.map(z => <option key={z.id} value={z.name}>{z.name} ({z.risk})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:4}}>SEVERITY LEVEL</label>
                  <select 
                    value={bleSeverity} 
                    onChange={e => setBleSeverity(e.target.value)}
                    style={{width:"100%",padding:"8px 10px",borderRadius:4,border:"1px solid #cbd5e1",fontSize:13,fontWeight:700,color:bleSeverity==="CRITICAL"?"#dc2626":"#d97706"}}
                  >
                    <option value="CRITICAL">🔴 CRITICAL (Level 4 - Instant Siren)</option>
                    <option value="HIGH">🟠 HIGH (Level 3 - Warning Siren)</option>
                    <option value="MODERATE">🟡 MODERATE (Level 2 - Advisory)</option>
                  </select>
                </div>
              </div>

              {/* HIGH PRIORITY PRESET DIRECTIVES */}
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:4}}>
                  HIGH-PRIORITY DISASTER PRESET (Instant 1-Byte Compressed Transmission)
                </label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:6}}>
                  {BLE_PRESETS_LIST.map(p => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handleSelectBlePreset(p.code)}
                      style={{
                        padding:"8px 10px",
                        fontSize:11,
                        fontWeight:600,
                        textAlign:"left",
                        borderRadius:4,
                        border: blePresetCode === p.code ? "2px solid #0284c7" : "1px solid #e2e8f0",
                        background: blePresetCode === p.code ? "#e0f2fe" : "#f8fafc",
                        color: blePresetCode === p.code ? "#0369a1" : "#334155",
                        cursor:"pointer"
                      }}
                    >
                      #{p.code} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MESSAGE TEXTAREA */}
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#475569"}}>BROADCAST MESSAGE PAYLOAD</label>
                  <span style={{fontSize:10,color:"#0284c7",fontWeight:600}}>
                    Optimized 24-byte BLE PDU + GATT Char 0xAE62 ({bleMessage.length} chars)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={bleMessage}
                  onChange={e => setBleMessage(e.target.value)}
                  style={{width:"100%",padding:10,borderRadius:4,border:"1px solid #cbd5e1",fontSize:13,boxSizing:"border-box",lineHeight:1.4}}
                  placeholder="Enter life-safety evacuation directive..."
                />
              </div>

              {/* PAYLOAD TELEMETRY CARD */}
              <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:4,padding:"8px 12px",marginBottom:16,fontSize:11,color:"#64748b"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span>BLE Packet Standard:</span>
                  <strong style={{color:"#0f172a"}}>AEGIS 2.4GHz ServiceData (0xAE61)</strong>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span>Transmission Flow:</span>
                  <strong style={{color:"#059669"}}>Web &rarr; Backend API &rarr; Primary Phone &rarr; 0 KB Radio Broadcast</strong>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{display:"flex",gap:10}}>
                <button 
                  className="portal-btn" 
                  onClick={handleDispatchBleBroadcast} 
                  disabled={isBleDispatching}
                  style={{flex:1,padding:12,background:"#0284c7",color:"white",fontWeight:700,fontSize:14,borderRadius:4,boxShadow:"0 4px 12px rgba(2,132,199,0.3)"}}
                >
                  {isBleDispatching ? "⏳ Dispatched to Primary Phone..." : "📡 Transmit Web-to-BLE Broadcast"}
                </button>
                <button className="portal-btn" onClick={()=>setShowBleModal(false)} style={{padding:"12px 18px"}}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== BACKEND SETTINGS MODAL ===== */}
      {showBackendModal && (
        <div className="modal-bg show">
          <div className="modal-box" style={{maxWidth: 520}}>
            <div className="modal-head" style={{background:"#0d2240",color:"white",padding:"14px 18px",borderRadius:"6px 6px 0 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{background:"#1e40af",padding:"6px 10px",borderRadius:4,fontSize:18}}>⚙️</div>
                <div>
                  <h3 style={{margin:0,fontSize:16,color:"#fff"}}>Backend Server Configuration</h3>
                  <div style={{fontSize:11,color:"#93c5fd"}}>Configure API and WebSocket connections for Authority Portal</div>
                </div>
              </div>
              <button className="modal-close" onClick={()=>setShowBackendModal(false)} style={{color:"#fff"}}>x</button>
            </div>
            
            <div className="modal-content" style={{padding:20}}>
              <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:4,padding:"10px 14px",marginBottom:14}}>
                <div style={{fontSize:11,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Current Active Endpoint:</div>
                <div style={{fontSize:13,fontWeight:700,color:"#0f172a",fontFamily:"monospace",marginTop:2}}>{getApiBaseUrl()}</div>
              </div>

              <div style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#475569",marginBottom:4}}>CUSTOM BACKEND SERVER URL</label>
                <input
                  type="text"
                  value={customBackendInput}
                  onChange={e=>setCustomBackendInput(e.target.value)}
                  placeholder="http://127.0.0.1:8000 or http://192.168.1.15:8000"
                  style={{width:"100%",padding:8,borderRadius:4,border:"1px solid #cbd5e1",fontSize:13,boxSizing:"border-box"}}
                />
              </div>

              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:4}}>QUICK PRESETS:</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <button type="button" className="portal-btn portal-btn-sm" onClick={()=>setCustomBackendInput("/api")}>💻 Local Proxy (/api)</button>
                  <button type="button" className="portal-btn portal-btn-sm" onClick={()=>setCustomBackendInput("http://127.0.0.1:8000")}>🖥️ Localhost (8000)</button>
                  <button type="button" className="portal-btn portal-btn-sm" onClick={()=>setCustomBackendInput("https://diverse-07.github.io/PROTOTYPE")}>🌐 Cloud / GitHub Pages</button>
                </div>
              </div>

              <div style={{display:"flex",gap:10}}>
                <button
                  type="button"
                  className="portal-btn"
                  onClick={handleTestBackendPing}
                  style={{flex:1,padding:10,background:"#f1f5f9",color:"#334155",border:"1px solid #cbd5e1",fontWeight:600}}
                >
                  {pingStatus === "testing" ? "Pinging..." : "⚡ Test Ping"}
                </button>
                <button
                  type="button"
                  className="portal-btn portal-btn-blue"
                  onClick={handleSaveBackendUrl}
                  style={{flex:1,padding:10,fontWeight:700}}
                >
                  💾 Save &amp; Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TOAST ===== */}
      <div style={{position:"fixed",bottom:20,right:20,background:"#27ae60",color:"white",padding:"10px 18px",borderRadius:4,fontSize:13,fontWeight:500,transform:toastMsg?"translateY(0)":"translateY(80px)",opacity:toastMsg?1:0,transition:"all 0.3s ease",zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,0.15)",maxWidth:340,lineHeight:1.4}}>
        {toastMsg}
      </div>
    </div>
  )
}

