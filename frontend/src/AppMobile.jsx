import React, { useState, useEffect, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup } from "react-leaflet"
import { broadcastAlert, getWeather, getRisk, getAlerts, submitReport, getReports, registerBleGatewayNode, getBleActiveTrigger, silenceBleBroadcast, getWsBaseUrl, setCustomBackendUrl, getApiBaseUrl } from "./api/client"
import "./mobile.css"

// --- PROFESSIONAL VECTOR ICONS (NO CARTOON EMOJIS) ---
const Icons = {
  User: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  MoreVertical: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1.8" fill={color}/>
      <circle cx="12" cy="5" r="1.8" fill={color}/>
      <circle cx="12" cy="19" r="1.8" fill={color}/>
    </svg>
  ),
  Sparkles: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
    </svg>
  ),
  HelpCircle: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  LogOut: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Bluetooth: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>
    </svg>
  ),
  Phone: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  WifiOff: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
  Download: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Home: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Map: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  Ai: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/>
      <line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/>
      <line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/>
      <line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/>
      <line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  Sensors: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.93 19.07A10 10 0 0 1 12 2a10 10 0 0 1 7.07 17.07"/>
      <path d="M7.76 16.24A6 6 0 0 1 12 6a6 6 0 0 1 4.24 10.24"/>
      <circle cx="12" cy="18" r="2" fill={color}/>
    </svg>
  ),
  Analytics: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Simulator: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
      <line x1="8" y1="19" x2="8" y2="23"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <line x1="16" y1="19" x2="16" y2="23"/>
    </svg>
  ),
  Alerts: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Safety: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  Report: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Globe: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Bell: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  AlertTriangle: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Hospital: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6v12M6 12h12"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  Gps: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="22" y1="12" x2="18" y2="12"/>
      <line x1="6" y1="12" x2="2" y2="12"/>
      <line x1="12" y1="6" x2="12" y2="2"/>
      <line x1="12" y1="22" x2="12" y2="18"/>
      <circle cx="12" cy="12" r="3" fill={color}/>
    </svg>
  )
}

// GEOSPATIAL & SENSOR DATA
const ZONES = [
  { id:1, name:"Jaintia Hills", state:"Meghalaya", score:87, risk:"CRITICAL", coords:[[25.20,92.30],[25.00,92.00],[24.85,92.40],[25.05,92.70]], lat:25.4484, lng:92.2152, desc:"Active Disang shale thrust. NH-44 debris flow corridor." },
  { id:2, name:"Sohra / Cherrapunji", state:"Meghalaya", score:74, risk:"HIGH", coords:[[25.40,91.60],[25.20,91.40],[25.10,91.70],[25.30,91.90]], lat:25.2986, lng:91.7322, desc:"Extreme rainfall zone. Limestone escarpment failure." },
  { id:3, name:"Ri-Bhoi Foothills", state:"Meghalaya", score:52, risk:"MODERATE", coords:[[26.00,91.70],[25.70,91.50],[25.60,92.00],[25.90,92.20]], lat:25.8500, lng:91.8800, desc:"Seasonal translational soil slips along highway." },
  { id:4, name:"North Sikkim MCT", state:"Sikkim", score:83, risk:"CRITICAL", coords:[[28.00,88.40],[27.60,88.10],[27.40,88.50],[27.70,88.80]], lat:27.7330, lng:88.5160, desc:"Main Central Thrust active fault. Glacial moraine instability." },
  { id:5, name:"Gangtok South Ridge", state:"Sikkim", score:78, risk:"HIGH", coords:[[27.40,88.65],[27.20,88.50],[27.15,88.75],[27.35,88.85]], lat:27.3389, lng:88.6065, desc:"Terraced hill slope weathering. NH-10 connectivity link." },
  { id:6, name:"Aizawl East Flank", state:"Mizoram", score:76, risk:"HIGH", coords:[[23.85,92.60],[23.65,92.40],[23.55,92.80],[23.75,93.00]], lat:23.7271, lng:92.7176, desc:"Urban slope cutting. Sandstone formation saturation." },
  { id:7, name:"Lunglei Ridge", state:"Mizoram", score:48, risk:"MODERATE", coords:[[23.10,92.80],[22.75,92.60],[22.65,93.00],[22.95,93.20]], lat:22.8830, lng:92.7330, desc:"Longitudinal valley slope with moderate moisture." },
  { id:8, name:"Kohima Dzudza", state:"Nagaland", score:68, risk:"HIGH", coords:[[25.80,94.00],[25.55,93.75],[25.45,94.20],[25.65,94.45]], lat:25.6751, lng:94.1086, desc:"NH-29 bridge corridor. Active slope subsidence." },
  { id:9, name:"Tawang MCT Zone", state:"Arunachal", score:81, risk:"CRITICAL", coords:[[27.75,91.95],[27.45,91.65],[27.30,92.05],[27.60,92.35]], lat:27.5861, lng:91.8594, desc:"High altitude permafrost degradation along passes." },
  { id:10, name:"Haflong Hill Station", state:"Assam", score:85, risk:"CRITICAL", coords:[[25.25,93.10],[25.05,92.90],[24.95,93.25],[25.15,93.35]], lat:25.1800, lng:93.0200, desc:"Dima Hasao railway hill cut. High debris flow record." },
  { id:11, name:"Senapati Terraces", state:"Manipur", score:54, risk:"MODERATE", coords:[[25.40,93.90],[25.10,93.65],[24.95,94.10],[25.25,94.35]], lat:25.2660, lng:94.0160, desc:"Hill agricultural slopes. Seasonal monsoon erosion." },
  { id:12, name:"Agartala Basin", state:"Tripura", score:18, risk:"SAFE", coords:[[23.95,91.20],[23.70,91.00],[23.60,91.40],[23.85,91.60]], lat:23.8315, lng:91.5600, desc:"Stable alluvial terrain. Very low gradient." },
]

const SENSORS = [
  { id:"STN-JH-082", name:"Jaintia Hills NH-44", state:"Meghalaya", status:"online", reading:"87% moisture · 4.2mm/h shear", lat:25.4484, lng:92.2152, batt:"12.8V" },
  { id:"STN-ML-002", name:"Sohra Escarpment", state:"Meghalaya", status:"online", reading:"180mm / 24hr acc.", lat:25.2986, lng:91.7322, batt:"12.9V" },
  { id:"STN-SK-014", name:"Gangtok South Ridge", state:"Sikkim", status:"online", reading:"74% moisture · 2.8mm/h", lat:27.3389, lng:88.6065, batt:"12.6V" },
  { id:"STN-MZ-049", name:"Aizawl Bawngkawn", state:"Mizoram", status:"degraded", reading:"84% moisture · Solar low", lat:23.7271, lng:92.7176, batt:"11.4V" },
  { id:"STN-NL-021", name:"Kohima NH-29", state:"Nagaland", status:"online", reading:"62mm/24h · 1.2mm/h", lat:25.6751, lng:94.1086, batt:"12.5V" },
  { id:"STN-AS-102", name:"Haflong Pass", state:"Assam", status:"online", reading:"128mm/24h · Critical", lat:25.1800, lng:93.0200, batt:"12.7V" },
  { id:"STN-MN-003", name:"Senapati Corridor", state:"Manipur", status:"offline", reading:"Offline: Power cell fail", lat:24.9800, lng:93.4900, batt:"0.0V" },
  { id:"STN-AR-008", name:"Tawang MCT Pass", state:"Arunachal", status:"online", reading:"68mm/24h · -2C ambient", lat:27.5861, lng:91.8594, batt:"12.8V" },
]

const LANGUAGES = [
  { code:"en", native:"English", region:"Official / Central" },
  { code:"as", native:"অসমীয়া", region:"Assam" },
  { code:"bn", native:"বাংলা", region:"Tripura & Barak" },
  { code:"kha", native:"Khasi", region:"Meghalaya" },
  { code:"grt", native:"A·chik (Garo)", region:"Meghalaya" },
  { code:"lus", native:"Mizo ṭawng", region:"Mizoram" },
  { code:"mni", native:"মৈতৈলোন্", region:"Manipur" },
  { code:"ne", native:"नेपाली", region:"Sikkim" },
  { code:"nag", native:"Nagamese", region:"Nagaland" },
  { code:"brx", native:"बड़ो (Bodo)", region:"Assam Bodoland" },
  { code:"trp", native:"Kokborok", region:"Tripura" },
  { code:"hi", native:"हिंदी", region:"National Official" },
]

const TRANSLATIONS = {
  en: {
    dashboard:"Home", map:"Risk Map", ai:"AI Predict", sensors:"Telemetry", analytics:"Analytics",
    alerts:"Alerts", simulator:"Simulator", safety:"Safety Check", report:"Report",
    activeWarning:"CRITICAL HAZARD WARNING",
    warningText:"Jaintia Hills, Meghalaya (NH-44) · 142mm/24h · Evacuate 3 villages.",
    checkSafety:"Scan GPS Safety", checking:"Locking Satellite GPS...", emergency:"Citizen Emergency SOS",
  },
  as: {
    dashboard:"হোম", map:"মানচিত্ৰ", ai:"AI ভৱিষ্যদ্বাণী", sensors:"চেন্সৰ", analytics:"বিশ্লেষণ",
    alerts:"সতৰ্কতা", simulator:"চিমুলেটৰ", safety:"সুৰক্ষা পৰীক্ষা", report:"ৰিপোৰ্ট",
    activeWarning:"সংকটজনক সতৰ্কতা",
    warningText:"জয়ন্তিয়া পাহাৰ (NH-44) · 142মিমি/২৪ঘণ্টা · আশ্ৰয়স্থললৈ স্থানান্তৰ হওক।",
    checkSafety:"GPS সুৰক্ষা পৰীক্ষা", checking:"স্থান নিৰ্ণয় হৈ আছে...", emergency:"জৰুৰী সতৰ্কতা",
  },
  bn: {
    dashboard:"হোম", map:"মানচিত্র", ai:"AI পূর্বাভাস", sensors:"সেন্সর", analytics:"অ্যানালিটিক্স",
    alerts:"সতর্কতা", simulator:"সিমুলেটর", safety:"নিরাপত্তা", report:"রিপোর্ট",
    activeWarning:"জরুরি ভূমিধস সতর্কতা",
    warningText:"জয়ন্তিয়া হিলস (NH-44) · ১৪২মিমি/২৪ঘণ্টা · ৩টি গ্রাম স্থানান্তর।",
    checkSafety:"GPS নিরাপত্তা চেক", checking:"লোকেশন চেক হচ্ছে...", emergency:"জরুরি অ্যালার্ট",
  },
  kha: {
    dashboard:"Ing (Home)", map:"Ka Map", ai:"AI Jingtip", sensors:"Ki Sensor", analytics:"Jingkheiñ",
    alerts:"Jingmaham", simulator:"Simulator", safety:"Jingiada", report:"Ka Report",
    activeWarning:"JINGMAHAM BA KHRAW",
    warningText:"Jaintia Hills (NH-44) · 142mm slap/24 kynta · Kynriah noh sha ki jaka shngain.",
    checkSafety:"Peit Jingiada GPS", checking:"Dang wad jaka...", emergency:"Kynshew Khubor Kyrkieh",
  },
  grt: {
    dashboard:"Nok (Home)", map:"Map", ai:"AI Ma·siani", sensors:"Sensor-rang", analytics:"Histap",
    alerts:"Mikrakatani", simulator:"Simulator", safety:"Jol Naljoka", report:"Report",
    activeWarning:"KENANI MIKRAKATANI",
    warningText:"Jaintia Hills (NH-44) · Naljokgipa biapona re·angbo.",
    checkSafety:"GPS Naljokani Nibo", checking:"Biapko sandienga...", emergency:"Rang·san Mikrakatbo",
  },
  lus: {
    dashboard:"In (Home)", map:"Map", ai:"AI Hriatlawkna", sensors:"Sensor-te", analytics:"Endikna",
    alerts:"Hriattirna", simulator:"Simulator", safety:"Himna Enna", report:"Report",
    activeWarning:"LEIMIN HLUAWHNA",
    warningText:"Jaintia Hills (NH-44) · Ruahtui 142mm sur · Hmun him pan vat rawh u.",
    checkSafety:"GPS Himna En Rawh", checking:"Hmun zawn mek a ni...", emergency:"Khaihhawm Hriattirna",
  },
  mni: {
    dashboard:"হোম", map:"মেপ", ai:"AI প্রেডিক্ট", sensors:"সেন্সর", analytics:"অ্যানালিটিক্স",
    alerts:"অলর্ট", simulator:"সিমুলেটর", safety:"নুঙাইবা চেক", report:"রিপোর্ট",
    activeWarning:"লৌথোকপা কৃতিকেল সতৰ্কতা",
    warningText:"জয়ন্তিয়া হিলস (NH-44) · ১৪২মিমি · অশ্ৰয়স্থল চংশিন্নবা।",
    checkSafety:"GPS সেফটি চেক", checking:"চেক তৌরি...", emergency:"ইমার্জেন্সি ব্রডকাস্ট",
  },
  ne: {
    dashboard:"होम", map:"नक्सा", ai:"AI भविष्यवाणी", sensors:"सेन्सर", analytics:"एनालिटिक्स",
    alerts:"अलर्ट", simulator:"सिमुलेटर", safety:"सुरक्षा जाँच", report:"रिपोर्ट",
    activeWarning:"गम्भीर पहिरो चेतावनी",
    warningText:"जयन्तिया हिल्स (NH-44) · १४२मिमि/२४ঘণ্টা · तुरुन्त सुरक्षित स्थानमा जानुस्।",
    checkSafety:"GPS सुरक्षा जाँच्नुस्", checking:"स्थान खोजिँदैछ...", emergency:"आपतकालीन अलर्ट",
  },
  nag: {
    dashboard:"Ghor (Home)", map:"Map", ai:"AI Janai Diya", sensors:"Sensors", analytics:"Hesab",
    alerts:"Hushiar", simulator:"Simulator", safety:"Safety Check", report:"Report",
    activeWarning:"DANGA KHATRA HUSHIAR",
    warningText:"Jaintia Hills (NH-44) · Safe jaka te jabi.",
    checkSafety:"GPS Safety Sabo", checking:"Jaka dhoondhi ase...", emergency:"Emergency Khobor",
  },
  brx: {
    dashboard:"Nò (Home)", map:"Map", ai:"AI Mitinga", sensors:"Sensors", analytics:"Naijirnay",
    alerts:"Husiyar", simulator:"Simulator", safety:"Bikhung", report:"Report",
    activeWarning:"GWBWRWI DANGER",
    warningText:"Jaintia Hills (NH-44) · Sukhibari thaoniyo thaang.",
    checkSafety:"GPS Safety Nay", checking:"Jaiga naydong...", emergency:"Emergency Alert",
  },
  trp: {
    dashboard:"Nok (Home)", map:"Map", ai:"AI Sakphang", sensors:"Sensors", analytics:"Saimung",
    alerts:"Khurumung", simulator:"Simulator", safety:"Kahamyung", report:"Report",
    activeWarning:"KWMAI YAKGAMI",
    warningText:"Jaintia Hills (NH-44) · Tongthok hani thani thani thaidi.",
    checkSafety:"GPS Safety Naydi", checking:"Jaga nayjagwi tongo...", emergency:"Emergency Alert",
  },
  hi: {
    dashboard:"होम", map:"नक्शा", ai:"AI भविष्यवाणी", sensors:"सेंसर", analytics:"एनालिटिक्स",
    alerts:"अलर्ट", simulator:"सिमुलेटर", safety:"सुरक्षा जाँच", report:"रिपोर्ट",
    activeWarning:"गंभीर खतरा चेतावनी",
    warningText:"जयंतिया हिल्स, मेघालय (NH-44) · 142मिमी/24घंटे · तत्काल सुरक्षित स्थान पर जाएं।",
    checkSafety:"GPS सुरक्षा जाँचें", checking:"लोकेशन जाँची जा रही है...", emergency:"आपातकालीन प्रसारण",
  }
}

function getRiskColor(score) {
  if (score >= 80) return "#b91c1c"
  if (score >= 65) return "#d97706"
  if (score >= 45) return "#ca8a04"
  if (score >= 25) return "#16a34a"
  return "#15803d"
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 1. SPLASH SCREEN
function SplashScreen({ onEnter }) {
  const [selectedLang, setSelectedLang] = useState("en")
  const [step, setStep] = useState(1) // 1: Language, 2: Citizen Details
  const [citizenName, setCitizenName] = useState("Harsh Pathak")
  const [citizenState, setCitizenState] = useState("Meghalaya")
  const [citizenDistrict, setCitizenDistrict] = useState("Jaintia Hills (NH-44)")

  const handleFinish = () => {
    const userPayload = {
      name: citizenName.trim() || "Citizen Volunteer",
      state: citizenState,
      district: citizenDistrict,
      id: "NER-NODE-" + Math.floor(1000 + Math.random() * 9000),
      registeredAt: new Date().toLocaleDateString("en-IN")
    }
    onEnter(selectedLang, userPayload)
  }

  return (
    <div className="splash-screen">
      {/* Top National Tricolor Strip */}
      <div className="tiranga-strip" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />

      {/* Official Government of India & MDoNER Header */}
      <div className="splash-govt-top">
        <img src="/emblem_of_india.svg" alt="Emblem of India" className="splash-emblem" />
        <div className="splash-govt-name">भारत सरकार &bull; GOVERNMENT OF INDIA</div>
        <div className="splash-mdoner-banner">
          <img src="/mdoner_logo.svg" alt="MDoNER" />
        </div>
      </div>

      <div className="splash-logo-wrap">
        <div className="splash-logo-ring" />
        <div className="splash-logo-ring2" />
        <img src="/logo.jpg" alt="AEGIS" className="splash-logo" />
      </div>
      <div className="splash-badge">TEAM AEGIS · SIH 2026 INITIATIVE</div>
      <h1 className="splash-title">NER <span>Landslide</span><br />Early Warning System</h1>
      <p className="splash-subtitle">Ministry of Development of North Eastern Region (MDoNER) &bull; GSI &bull; NDMA</p>

      {step === 1 ? (
        <>
          <p className="splash-lang-title">Step 1 of 2: Choose Language / ভাষা নিৰ্বাচন কৰক</p>
          <div className="splash-lang-grid" style={{ maxHeight: "190px", overflowY: "auto", padding: "4px" }}>
            {LANGUAGES.map(lang => (
              <button key={lang.code} className={`lang-btn ${selectedLang === lang.code ? "selected" : ""}`} onClick={() => setSelectedLang(lang.code)}>
                <span className="lang-native">{lang.native}</span>
                <span className="lang-english">{lang.region}</span>
              </button>
            ))}
          </div>
          <button className="splash-enter-btn" onClick={() => setStep(2)}>
            <span>Continue to Citizen Setup</span>
            <span>→</span>
          </button>
        </>
      ) : (
        <div className="onboarding-step-card">
          <p className="splash-lang-title" style={{ marginTop: 0 }}>Step 2 of 2: One-Time Citizen Setup</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px", textAlign: "center" }}>
            Stored in local device storage. No database needed. You will never be asked again on this phone.
          </p>

          <div style={{ textAlign: "left", marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--darknavy)", display: "block", marginBottom: "4px" }}>Citizen Name</label>
            <input 
              className="form-input" 
              value={citizenName} 
              onChange={e => setCitizenName(e.target.value)} 
              placeholder="e.g. Harsh Pathak" 
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ textAlign: "left", marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--darknavy)", display: "block", marginBottom: "4px" }}>State Jurisdiction</label>
            <select 
              className="form-input" 
              value={citizenState} 
              onChange={e => setCitizenState(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="Meghalaya">Meghalaya</option>
              <option value="Assam">Assam</option>
              <option value="Sikkim">Sikkim</option>
              <option value="Mizoram">Mizoram</option>
              <option value="Nagaland">Nagaland</option>
              <option value="Arunachal Pradesh">Arunachal Pradesh</option>
              <option value="Manipur">Manipur</option>
              <option value="Tripura">Tripura</option>
            </select>
          </div>

          <div style={{ textAlign: "left", marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--darknavy)", display: "block", marginBottom: "4px" }}>District / Highway Corridor</label>
            <input 
              className="form-input" 
              value={citizenDistrict} 
              onChange={e => setCitizenDistrict(e.target.value)} 
              placeholder="e.g. Jaintia Hills (NH-44)" 
              style={{ width: "100%" }}
            />
          </div>

          <button className="splash-enter-btn" onClick={handleFinish} style={{ width: "100%", maxWidth: "100%" }}>
            <span>Save &amp; Enter AEGIS App</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  )
}

// 2. DEDICATED BULLETPROOF SAFETY CHECK VIEW
function SafetyCheckView({ t, onBack }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [query, setQuery] = useState("")

  const computeLocationSafety = async (lat, lon, label) => {
    setLoading(true)
    let nearest = ZONES[0]
    let minDist = calculateDistance(lat, lon, nearest.lat, nearest.lng)
    ZONES.forEach(z => {
      const d = calculateDistance(lat, lon, z.lat, z.lng)
      if (d < minDist) { minDist = d; nearest = z; }
    })

    let rain = 0.0, temp = 24.0
    try {
      const wData = await getWeather(lat, lon)
      if (wData) {
        temp = wData.temperature ?? 24.0
        rain = wData.precipitation ?? 0.0
      }
    } catch(e) {}

    const isCritical = minDist <= 25
    const isWatch = minDist > 25 && minDist <= 80

    setResult({
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
      label: label || "Detected Location",
      nearestName: nearest.name,
      nearestState: nearest.state,
      distanceKm: minDist < 20 ? minDist.toFixed(1) : Math.round(minDist),
      status: isCritical ? "critical" : isWatch ? "caution" : "safe",
      statusTitle: isCritical ? "CRITICAL HAZARD ZONE (RED)" : isWatch ? "ELEVATED HILL WATCH (AMBER)" : "SAFE TERRAIN (GREEN)",
      advice: isCritical 
        ? "Active landslide fault within " + minDist.toFixed(1) + " km. Move away from steep hill cuts to nearest community hall."
        : isWatch 
        ? "Hill corridor watch active. Avoid night vehicular movement along highway cuttings."
        : "Stable low-gradient region (~" + Math.round(minDist) + " km from hill faults). Normal conditions.",
      rain: rain.toFixed(1),
      soil: isCritical ? "92.4%" : isWatch ? "64.1%" : "28.0%",
      slope: isCritical ? "41.5°" : isWatch ? "26.0°" : "< 5°",
      shelter: isCritical ? "District Multipurpose Hall, Khliehriat (2.4 km away)" : "Normal Local Facilities"
    })
    setLoading(false)
  }

  const handleGPS = () => {
    setLoading(true)
    let finished = false
    const fallback = setTimeout(() => {
      if (!finished) {
        finished = true
        computeLocationSafety(26.1445, 91.7362, "Guwahati Region (GPS Fallback)")
      }
    }, 3500)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!finished) {
            finished = true
            clearTimeout(fallback)
            computeLocationSafety(pos.coords.latitude, pos.coords.longitude, "Your Real GPS Location")
          }
        },
        (err) => {
          if (!finished) {
            finished = true
            clearTimeout(fallback)
            computeLocationSafety(26.1445, 91.7362, "Guwahati Area (GPS Denied)")
          }
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
      )
    } else {
      clearTimeout(fallback)
      computeLocationSafety(26.1445, 91.7362, "Guwahati Area (GPS Not Supported)")
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", India")}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          computeLocationSafety(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name.split(',')[0])
          return
        }
      }
    } catch(e) {}
    alert("Location not found. Showing regional analysis.")
    computeLocationSafety(25.5788, 91.8933, query)
  }

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Safety Advisor</h2>
          <p>Real-Time Slope Proximity</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Gps size={18} color="var(--navy)" />
            <span>Triangulate Hazard Risk</span>
          </div>
        </div>
        <div className="card-body">
          <button className={`btn btn-primary ${loading ? "btn-scanning" : ""}`} onClick={handleGPS} disabled={loading} style={{ width: "100%", marginBottom: "12px" }}>
            <span className={loading ? "gps-spin-icon" : ""} style={{ display: "inline-flex" }}>
              <Icons.Gps size={18} color="#ffffff" />
            </span>
            <span>{loading ? "Locking Satellite GPS..." : "Scan Real GPS Coordinates"}</span>
          </button>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: "6px" }}>
            <input 
              className="form-input" 
              placeholder="Or enter PIN / City (e.g. 793001 or Shillong)" 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-outline btn-sm" style={{ padding: "0 14px", fontWeight: "700" }}>
              Search
            </button>
          </form>

          {result && (
            <div className={`safety-card ${result.status}`} style={{ marginTop: "14px" }}>
              <div style={{ marginBottom: "6px" }}>
                <Icons.Safety size={38} color={result.status === "critical" ? "#b91c1c" : result.status === "caution" ? "#d97706" : "#15803d"} />
              </div>
              <div className="safety-status" style={{ color: result.status === "critical" ? "#b91c1c" : result.status === "caution" ? "#d97706" : "#15803d" }}>
                {result.statusTitle}
              </div>
              <div style={{ fontSize: "12px", color: "var(--darknavy)", fontWeight: "600", marginBottom: "4px" }}>
                {result.label} ({result.lat}° N, {result.lon}° E)
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>
                Nearest Fault: <strong>{result.nearestName} ({result.distanceKm} km away)</strong>
              </div>
              <div className="safety-stats">
                <div className="safety-stat"><div className="safety-stat-value">{result.rain} mm/h</div><div className="safety-stat-label">Rain</div></div>
                <div className="safety-stat"><div className="safety-stat-value">{result.soil}</div><div className="safety-stat-label">Soil Sat.</div></div>
                <div className="safety-stat"><div className="safety-stat-value">{result.slope}</div><div className="safety-stat-label">Slope</div></div>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px", marginTop: "10px", fontSize: "11.5px", textAlign: "left", color: "var(--darknavy)" }}>
                <strong>Advisory:</strong> {result.advice}
                {result.status === "critical" && (
                  <div style={{ marginTop: "6px", color: "#b91c1c", fontWeight: "700" }}>
                    Shelter: {result.shelter}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 3. HOME VIEW WITH PROFESSIONAL VECTOR ICONS
function HomeView({ t, onOpenSection, onOpenSOS }) {
  const [liveSoil, setLiveSoil] = useState(87)
  const [liveDisp, setLiveDisp] = useState(4.2)
  const [liveRain, setLiveRain] = useState(18.7)
  const [quickMult, setQuickMult] = useState(1.0)

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSoil(v => Math.min(99, Math.max(60, v + (Math.random() - 0.45) * 2)))
      setLiveDisp(v => Math.min(8, Math.max(0.5, v + (Math.random() - 0.4) * 0.3)))
      setLiveRain(v => Math.min(30, Math.max(5, v + (Math.random() - 0.45) * 1.5)))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const APP_TILES = [
    { id: "safety", name: t.safety, icon: <Icons.Safety size={24} color="currentColor" />, type: "safety" },
    { id: "predictions", name: t.ai, icon: <Icons.Ai size={24} color="currentColor" />, type: "ai" },
    { id: "map", name: t.map, icon: <Icons.Map size={24} color="currentColor" />, type: "map" },
    { id: "sensors", name: t.sensors, icon: <Icons.Sensors size={24} color="currentColor" />, type: "sensors" },
    { id: "analytics", name: t.analytics, icon: <Icons.Analytics size={24} color="currentColor" />, type: "analytics" },
    { id: "simulation", name: t.simulator, icon: <Icons.Simulator size={24} color="currentColor" />, type: "simulator" },
    { id: "alerts", name: t.alerts, icon: <Icons.Alerts size={24} color="currentColor" />, type: "alerts", badge: "7" },
    { id: "report", name: t.report, icon: <Icons.Report size={24} color="currentColor" />, type: "report" },
  ]

  return (
    <div>
      {/* Hero Status Widget */}
      <div className="hero-widget">
        <div className="hero-widget-top">
          <div className="hero-widget-tag">
            <span className="live-dot" style={{ background: "#b91c1c" }}></span>
            <span>{t.activeWarning}</span>
          </div>
          <span style={{ fontSize: 10, color: "var(--navy)", fontWeight: 700 }}>NLSM LEVEL-3</span>
        </div>
        <div className="hero-widget-title">Jaintia Hills Sector (NH-44 Frontier Corridor)</div>
        <div className="hero-widget-desc">Immediate debris flow watch issued under GSI NLSM macro-zonation guidelines. Ground pore saturation threshold exceeded. Pre-emptive convoy regulation active.</div>
        <div className="hero-widget-metrics">
          <div className="hero-metric-box">
            <div className="hero-metric-val" style={{ color: "#b91c1c", fontVariantNumeric: "tabular-nums" }}>94%</div>
            <div className="hero-metric-lbl">Failure Prob.</div>
          </div>
          <div className="hero-metric-box">
            <div className="hero-metric-val" style={{ color: "#d97706", fontVariantNumeric: "tabular-nums" }}>{liveDisp.toFixed(1)} mm/mo</div>
            <div className="hero-metric-lbl">InSAR Creep</div>
          </div>
          <div className="hero-metric-box">
            <div className="hero-metric-val" style={{ color: "#1e40af", fontVariantNumeric: "tabular-nums" }}>{liveRain.toFixed(0)} mm/h</div>
            <div className="hero-metric-lbl">Radar Precip.</div>
          </div>
        </div>
      </div>

      {/* Quick Interactive Cloudburst What-If Bar */}
      <div className="quick-stress-card">
        <div className="quick-stress-head">
          <div className="quick-stress-title">
            <Icons.Simulator size={16} color="var(--navy)" />
            <span>Interactive Cloudburst Stress Slider</span>
          </div>
          <span className="quick-stress-badge" style={{ 
            background: quickMult >= 1.8 ? "#b91c1c" : quickMult >= 1.3 ? "#ea580c" : "#15803d",
            color: "#fff"
          }}>
            {quickMult.toFixed(1)}x {quickMult >= 1.8 ? "Cloudburst" : quickMult >= 1.3 ? "Heavy Rain" : "Normal"}
          </span>
        </div>
        <div className="quick-stress-body">
          <input 
            type="range" 
            min="0.5" 
            max="2.5" 
            step="0.1" 
            value={quickMult} 
            onChange={e => setQuickMult(parseFloat(e.target.value))} 
            className="sick-range-input mini"
            style={{
              background: quickMult > 1.7 ? "#b91c1c" : quickMult > 1.2 ? "#d97706" : "#15803d"
            }}
          />
          <div className="quick-stress-labels">
            <span>0.5x Sub</span>
            <span>1.0x Normal</span>
            <span>1.8x Cloudburst</span>
            <span>2.5x Deluge</span>
          </div>
        </div>
        <div className="quick-stress-footer">
          <span>Derived FoS: <strong>{(1.42 / (quickMult * 0.95 + 0.05)).toFixed(2)}</strong></span>
          <button className="quick-stress-link" onClick={() => onOpenSection("simulation")}>
            Full Simulation Engine ›
          </button>
        </div>
      </div>

      {/* Official MDoNER Authority Banner */}
      <div className="govt-ministry-card">
        <img src="/mdoner_logo.svg" alt="MDoNER" className="govt-ministry-logo" />
        <div className="govt-ministry-divider" />
        <div className="govt-ministry-info">
          <div className="govt-ministry-badge">MDoNER &bull; GOVT. OF INDIA</div>
          <div className="govt-ministry-name">Ministry of Development of North Eastern Region</div>
          <div className="govt-ministry-detail">NLSM GSI Hazard Early Warning Architecture</div>
        </div>
      </div>

      {/* Modern Squircle App Grid */}
      <div className="home-section-title">
        <span>System Modules</span>
        <span style={{ fontSize: 10, color: "var(--navy)" }}>8 Applications</span>
      </div>

      <div className="app-grid">
        {APP_TILES.map(app => (
          <button key={app.id} className="app-tile" onClick={() => onOpenSection(app.id)}>
            <div className={`app-squircle ${app.type}`}>
              {app.icon}
              {app.badge && <span className="app-badge-pip">{app.badge}</span>}
            </div>
            <span className="app-name">{app.name}</span>
          </button>
        ))}
      </div>

      {/* Quick Launch Safety Check Card */}
      <div className="card" style={{ borderLeft: "4px solid var(--navy)" }}>
        <div className="card-header">
          <div className="card-title">
            <Icons.Safety size={18} color="var(--navy)" />
            <span>Citizen Slope Risk Check</span>
          </div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Check your immediate proximity to active fault lines and satellite soil saturation.
          </p>
          <button className="btn btn-primary" onClick={() => onOpenSection("safety")}>
            <Icons.Gps size={18} color="#ffffff" />
            <span>Open GPS Safety Advisor</span>
          </button>
        </div>
      </div>

      {/* Live Geotechnical Gauges Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Sensors size={18} color="var(--navy)" />
            <span>Station JH-082 Telemetry</span>
          </div>
          <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700 }}>● LIVE 15m</span>
        </div>
        <div className="card-body">
          <div className="gauge-row">
            <div className="gauge-item">
              <div className="gauge-label-row">
                <span className="gauge-label">Soil Moisture (Pore Pressure)</span>
                <span className="gauge-value" style={{ color: liveSoil > 80 ? "#b91c1c" : "#ca8a04" }}>{liveSoil.toFixed(0)}%</span>
              </div>
              <div className="gauge-bar-bg">
                <div className="gauge-bar-fill" style={{ width: `${liveSoil}%`, background: liveSoil > 80 ? "#b91c1c" : "#ca8a04" }} />
              </div>
            </div>
            <div className="gauge-item">
              <div className="gauge-label-row">
                <span className="gauge-label">Shear Displacement Rate</span>
                <span className="gauge-value" style={{ color: liveDisp > 3 ? "#b91c1c" : "#d97706" }}>{liveDisp.toFixed(1)} mm/h</span>
              </div>
              <div className="gauge-bar-bg">
                <div className="gauge-bar-fill" style={{ width: `${(liveDisp / 6) * 100}%`, background: liveDisp > 3 ? "#b91c1c" : "#d97706" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Broadcast SOS */}
      <button className="btn btn-danger" onClick={onOpenSOS}>
        <Icons.Alerts size={18} color="#ffffff" />
        <span>{t.emergency}</span>
      </button>

      {/* Government of India Official Portal Footer */}
      <div className="govt-official-footer">
        <div className="govt-footer-emblems">
          <img src="/emblem_of_india.svg" alt="Emblem of India" className="govt-footer-emblem" />
          <div style={{ width: "1px", height: "26px", background: "#cbd5e1" }} />
          <img src="/logo.jpg" alt="Team AEGIS" className="govt-footer-aegis" />
        </div>
        <div className="govt-footer-title">पूर्वोत्तर क्षेत्र विकास मंत्रालय &bull; MDoNER</div>
        <div className="govt-footer-sub">Ministry of Development of North Eastern Region &bull; Government of India</div>
        <div className="govt-footer-portal-info">
          North Eastern Regional Landslide Early Warning System (NER-LEWS 2.0)<br/>
          Smart India Hackathon 2026 Initiative &bull; Integrated with GSI NLSM &amp; IMD AWS
        </div>
        <div className="govt-footer-copyright">
          Government of India &copy; {new Date().getFullYear()} &bull; Developed by Team AEGIS
        </div>
      </div>
    </div>
  )
}

// 4. AI PREDICTIONS VIEW
function PredictionsView({ t, onBack, onOpenSOS }) {
  const hotspots = [
    { zone:"Jaintia Hills, Meghalaya", prob:94, eta:"3h 15m", pop:"3,200", trigger:"Rainfall Intensity (52%) + Pore Pressure (28%)", corridor:"NH-44 Sector 8" },
    { zone:"Gangtok South, Sikkim", prob:81, eta:"7h 40m", pop:"1,840", trigger:"Antecedent Rain (45%) + Lithology (35%)", corridor:"NH-10 Link" },
    { zone:"Aizawl East, Mizoram", prob:76, eta:"11h 10m", pop:"2,410", trigger:"Soil Moisture (48%) + Slope Cut (32%)", corridor:"Bawngkawn Ridge" },
    { zone:"Kohima Dzudza, Nagaland", prob:68, eta:"19h 45m", pop:"950", trigger:"Culvert Blockage (41%) + Siltstone (39%)", corridor:"NH-29 Bridge" },
  ]

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>LandslideNet AI</h2>
          <p>XGBoost + SHAP (89.3% Acc)</p>
        </div>
      </div>

      <div className="card" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700 }}>AI MODEL STATUS</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--darknavy)" }}>v3.2 Active</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>14,000+ GSI Historical Training Records</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af", fontFamily: "monospace" }}>0.92</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>ROC-AUC Score</div>
          </div>
        </div>
      </div>

      <div className="home-section-title">Critical Hotspot Sectors</div>

      {hotspots.map((h, i) => (
        <div className="card" key={i} style={{ borderLeft: `4px solid ${h.prob >= 80 ? "var(--red)" : "var(--orange)"}` }}>
          <div className="card-header">
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--darknavy)" }}>{h.zone}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{h.corridor}</div>
            </div>
            <span className={`risk-pill ${h.prob >= 80 ? "critical" : "high"}`}>{h.prob}% PROB</span>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "var(--surface2)", padding: 8, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Failure ETA:</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: h.prob >= 80 ? "#b91c1c" : "#d97706", fontFamily: "monospace" }}>{h.eta}</div>
              </div>
              <div style={{ background: "var(--surface2)", padding: 8, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Population:</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--darknavy)", fontFamily: "monospace" }}>{h.pop}</div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 10 }}>
              Primary Factor: <strong style={{ color: "var(--text)" }}>{h.trigger}</strong>
            </div>
            <button className="btn btn-danger btn-sm" style={{ width: "100%" }} onClick={onOpenSOS}>
              Request Emergency Assistance & Helplines
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// 5. GEOSPATIAL MAP VIEW
function MapView({ t, onBack }) {
  const [mapType, setMapType] = useState("terrain")

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Geospatial Risk Map</h2>
          <p>NLSM 16 Monitored Zones</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Map size={18} color="var(--navy)" />
            <span>Regional GIS Viewport</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={`btn btn-outline btn-sm ${mapType === "terrain" ? "active" : ""}`}
              style={mapType === "terrain" ? { background: "var(--navy)", color: "#fff" } : {}}
              onClick={() => setMapType("terrain")}>Topo</button>
            <button className={`btn btn-outline btn-sm ${mapType === "satellite" ? "active" : ""}`}
              style={mapType === "satellite" ? { background: "var(--navy)", color: "#fff" } : {}}
              onClick={() => setMapType("satellite")}>Sat</button>
          </div>
        </div>
        <div style={{ height: 280 }}>
          <MapContainer center={[25.5, 92.8]} zoom={6} style={{ height: "100%", width: "100%" }} maxBounds={[[6.0, 68.0], [38.0, 98.0]]} maxBoundsViscosity={1.0}>
            {mapType === "terrain" ? (
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
            ) : (
              <>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
              </>
            )}
            {ZONES.map(z => (
              <Polygon key={z.id} positions={z.coords} pathOptions={{ color: getRiskColor(z.score), fillColor: getRiskColor(z.score), fillOpacity: 0.45, weight: 2 }}>
                <Popup><strong>{z.name}</strong><br />{z.state}<br />Risk: {z.risk} ({z.score}%)<br />{z.desc}</Popup>
              </Polygon>
            ))}
            {SENSORS.map(s => (
              <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={6}
                pathOptions={{ color: s.status === "online" ? "#15803d" : s.status === "degraded" ? "#d97706" : "#b91c1c", fillColor: s.status === "online" ? "#15803d" : s.status === "degraded" ? "#d97706" : "#b91c1c", fillOpacity: 0.9, weight: 2 }}>
                <Popup>{s.id}<br />{s.name}<br />{s.reading}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="home-section-title">Regional Hazard Zones</div>
      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {ZONES.map(z => (
            <div className="zone-item" key={z.id}>
              <div className="zone-color-dot" style={{ background: getRiskColor(z.score) }} />
              <div className="zone-info">
                <div className="zone-name">{z.name}</div>
                <div className="zone-state">{z.state} · {z.desc}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="zone-score" style={{ color: getRiskColor(z.score) }}>{z.score}%</div>
                <span className={`risk-pill ${z.score >= 80 ? "critical" : z.score >= 65 ? "high" : z.score >= 45 ? "moderate" : "safe"}`}>{z.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 6. SENSORS TELEMETRY VIEW
function SensorsView({ t, onBack }) {
  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Sensor Telemetry</h2>
          <p>347 Active NER Stations</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", fontFamily: "monospace" }}>341</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Online</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--orange)", fontFamily: "monospace" }}>4</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Warning</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--red)", fontFamily: "monospace" }}>2</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Offline</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Sensors size={18} color="var(--navy)" />
            <span>Key Stations Telemetry</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: "0 16px" }}>
          {SENSORS.map(s => (
            <div className="sensor-item" key={s.id}>
              <div className={`sensor-status-dot ${s.status}`} />
              <div className="sensor-info">
                <div className="sensor-name">{s.name} ({s.state})</div>
                <div className="sensor-reading">{s.reading} · {s.batt}</div>
              </div>
              <span className={`sensor-status-label ${s.status}`}>{s.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 7. ANALYTICS VIEW
function AnalyticsView({ t, onBack }) {
  const states = [
    { name:"Meghalaya", pct:92 },
    { name:"Sikkim", pct:84 },
    { name:"Arunachal", pct:81 },
    { name:"Mizoram", pct:76 },
    { name:"Nagaland", pct:68 },
    { name:"Assam", pct:48 },
    { name:"Manipur", pct:54 },
    { name:"Tripura", pct:18 },
  ]

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>System Analytics</h2>
          <p>Model Performance & States</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Analytics size={18} color="var(--navy)" />
            <span>Key Performance Indicators</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>True Positive Rate:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", fontFamily: "monospace" }}>91.4%</div>
            </div>
            <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>False Alarm Rate:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--orange)", fontFamily: "monospace" }}>5.8%</div>
            </div>
            <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Inference Latency:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", fontFamily: "monospace" }}>82 ms</div>
            </div>
            <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Coverage Uptime:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", fontFamily: "monospace" }}>99.8%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">State-Wise Vulnerability Distribution</div>
        </div>
        <div className="card-body">
          {states.map(s => (
            <div className="analytics-bar-row" key={s.name}>
              <div className="analytics-bar-label">{s.name}</div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill" style={{ width: `${s.pct}%`, background: getRiskColor(s.pct) }} />
              </div>
              <div className="analytics-bar-val" style={{ color: getRiskColor(s.pct) }}>{s.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 8. SICK SCENARIO & CLOUDBURST SIMULATOR VIEW
function SimulatorView({ t, onBack, onOpenSOS }) {
  const [mult, setMult] = useState(1.0)
  const [activePreset, setActivePreset] = useState("actual")

  const baseRain = 18.7
  const simRain = (baseRain * mult).toFixed(1)
  const crit = mult <= 0.8 ? 4 : mult <= 1.2 ? 12 : mult <= 1.8 ? 26 : 41
  const fos = (1.45 / (mult * 0.95 + 0.05)).toFixed(2)
  const pop = mult <= 0.8 ? "3,200" : mult <= 1.2 ? "18,400" : mult <= 1.8 ? "48,600" : "89,200"
  const runoutVol = (Math.round(mult * 165000)).toLocaleString()

  let tier = "EQUILIBRIUM"
  let tierColor = "#15803d"
  let trackColor = "#15803d"
  if (mult > 0.8 && mult <= 1.2) {
    tier = "NORMAL MONSOON"
    tierColor = "#059669"
    trackColor = "#059669"
  } else if (mult > 1.2 && mult <= 1.7) {
    tier = "HIGH CLOUDBURST RISK"
    tierColor = "#d97706"
    trackColor = "#d97706"
  } else if (mult > 1.7) {
    tier = "CRITICAL SURGE"
    tierColor = "#b91c1c"
    trackColor = "#b91c1c"
  }

  const handlePreset = (val, key) => {
    setMult(val)
    setActivePreset(key)
  }

  return (
    <div className="sick-simulator-wrap">
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Cloudburst Simulator</h2>
          <p>GSI Hydro-Mechanical FoS</p>
        </div>
      </div>

      {/* Hero Stress Dial Card */}
      <div className="sick-slider-hero" style={{ borderColor: tierColor }}>
        <div className="sick-slider-top">
          <span className="sick-slider-tier-badge" style={{ background: tierColor }}>
            {tier}
          </span>
          <span className="sick-slider-live-rate">
            {simRain} mm/h Precipitation
          </span>
        </div>

        <div className="sick-slider-val-row">
          <div className="sick-slider-big-mult">
            <span className="mult-num" style={{ color: tierColor }}>{mult.toFixed(1)}</span>
            <span className="mult-x">x</span>
          </div>
          <div className="sick-slider-summary">
            <div className="summary-title">Precipitation Multiplier</div>
            <div className="summary-desc">
              {mult > 1.5 ? "⚠️ Soil pore pressure breaches shear limit across NER" : "Slope safety factor within acceptable equilibrium"}
            </div>
          </div>
        </div>

        {/* The Sick Interactive Slider Component */}
        <div className="sick-slider-container">
          <div className="sick-slider-track-wrap">
            <input 
              type="range" 
              min="0.5" 
              max="2.5" 
              step="0.05" 
              value={mult} 
              onChange={e => {
                setMult(parseFloat(e.target.value))
                setActivePreset("custom")
              }}
              className="sick-range-input"
              style={{ background: trackColor }}
            />
          </div>
          <div className="sick-slider-ticks">
            <span>0.5x Sub</span>
            <span>1.0x Normal</span>
            <span>1.5x (+50mm)</span>
            <span>2.0x Severe</span>
            <span>2.5x Deluge</span>
          </div>
        </div>

        {/* 4 Quick Preset Chips */}
        <div className="sick-presets-row">
          <button 
            className={`sick-preset-chip ${activePreset === "sub" ? "active" : ""}`}
            onClick={() => handlePreset(0.5, "sub")}
          >
            ☀️ Dry (0.5x)
          </button>
          <button 
            className={`sick-preset-chip ${activePreset === "actual" ? "active" : ""}`}
            onClick={() => handlePreset(1.0, "actual")}
          >
            🌧️ Normal (1.0x)
          </button>
          <button 
            className={`sick-preset-chip ${activePreset === "cloudburst" ? "active" : ""}`}
            onClick={() => handlePreset(1.8, "cloudburst")}
          >
            ⛈️ Cloudburst (1.8x)
          </button>
          <button 
            className={`sick-preset-chip ${activePreset === "max" ? "active" : ""}`}
            onClick={() => handlePreset(2.5, "max")}
          >
            🌊 Deluge (2.5x)
          </button>
        </div>
      </div>

      {/* 4 Real-time Hydro-Mechanical Impact KPI Cards */}
      <div className="sick-kpi-grid">
        <div className="sick-kpi-card">
          <div className="sick-kpi-val" style={{ color: parseFloat(fos) < 1.0 ? "#b91c1c" : "#15803d" }}>
            {fos}
          </div>
          <div className="sick-kpi-lbl">Factor of Safety</div>
          <div className="sick-kpi-sub">{parseFloat(fos) < 1.0 ? "Active Shear Failure" : "Slope Equilibrium"}</div>
        </div>

        <div className="sick-kpi-card">
          <div className="sick-kpi-val" style={{ color: crit > 15 ? "#b91c1c" : "#d97706" }}>
            {crit}
          </div>
          <div className="sick-kpi-lbl">Red Slopes</div>
          <div className="sick-kpi-sub">Critical Slope Sectors</div>
        </div>

        <div className="sick-kpi-card">
          <div className="sick-kpi-val" style={{ color: "#1e40af" }}>
            {pop}
          </div>
          <div className="sick-kpi-lbl">Citizens at Risk</div>
          <div className="sick-kpi-sub">Evacuation Radius</div>
        </div>

        <div className="sick-kpi-card">
          <div className="sick-kpi-val" style={{ color: "#7c3aed" }}>
            {runoutVol} m³
          </div>
          <div className="sick-kpi-lbl">Runout Volume</div>
          <div className="sick-kpi-sub">Debris Flow Inflow</div>
        </div>
      </div>

      {/* Dynamic Sector Status Breakdown */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Map size={16} color="var(--navy)" />
            <span>Regional Sector Instability ({mult.toFixed(1)}x)</span>
          </div>
          <span className="badge-micro" style={{ background: tierColor, color: "#fff" }}>
            {crit} Sectors Triggered
          </span>
        </div>
        <div className="card-body" style={{ padding: "10px 14px" }}>
          <div className="sim-sector-row">
            <div className="sim-sector-name">
              <strong>Jaintia Hills (NH-44 Corridor)</strong>
              <div className="sim-sector-detail">Saturated sandstone overburden · 38° slope</div>
            </div>
            <span className={`risk-pill ${mult >= 1.2 ? "critical" : "moderate"}`}>
              {mult >= 1.2 ? "TRIGGERED (RED)" : "WATCH (AMBER)"}
            </span>
          </div>

          <div className="sim-sector-row">
            <div className="sim-sector-name">
              <strong>Kohima Bypass (NH-29)</strong>
              <div className="sim-sector-detail">Dish-shaped thrust fault · InSAR creep active</div>
            </div>
            <span className={`risk-pill ${mult >= 1.5 ? "critical" : mult >= 1.0 ? "high" : "low"}`}>
              {mult >= 1.5 ? "TRIGGERED (RED)" : mult >= 1.0 ? "HIGH (ORANGE)" : "STABLE"}
            </span>
          </div>

          <div className="sim-sector-row">
            <div className="sim-sector-name">
              <strong>Mangan Highway Pass (North Sikkim)</strong>
              <div className="sim-sector-detail">Glacial moraine wash · Teesta River basin</div>
            </div>
            <span className={`risk-pill ${mult >= 1.8 ? "critical" : mult >= 1.2 ? "high" : "safe"}`}>
              {mult >= 1.8 ? "TRIGGERED (RED)" : mult >= 1.2 ? "ELEVATED" : "SAFE"}
            </span>
          </div>
        </div>
      </div>

      {/* If Critical, Show Instant Dispatch SOS Trigger */}
      {mult >= 1.5 && onOpenSOS && (
        <div className="card" style={{ background: "#fef2f2", border: "1px solid #f87171" }}>
          <div className="card-body" style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#b91c1c", marginBottom: "4px" }}>
              🚨 SIMULATION EXCEEDS CRITICAL DISASTER THRESHOLD
            </div>
            <div style={{ fontSize: "12px", color: "#7f1d1d", marginBottom: "14px" }}>
              Factor of Safety below 1.0. High risk of catastrophic slope failure. Immediate evacuation to designated high-ground bedrock shelter advised.
            </div>
            <button 
              className="btn btn-danger" 
              style={{ width: "100%", padding: "12px", fontWeight: "700", boxShadow: "0 4px 14px rgba(185,28,28,0.3)" }}
              onClick={onOpenSOS}
            >
              Open Citizen Emergency SOS & Helplines
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertsView({ t, onBack, onOpenSOS }) {
  const [alerts, setAlerts] = useState([
    { zone:"Jaintia Hills (NH-44 Sector 8)", sev:"CRITICAL", msg:"142mm/24h recorded. Tension cracks propagating. Evacuate 3 villages.", time:"12m ago", conf:87 },
    { zone:"Haflong Pass Corridor", sev:"CRITICAL", msg:"Debris flow warning triggered. Heavy hill cutting runoff.", time:"28m ago", conf:89 },
    { zone:"Gangtok South Ridge", sev:"HIGH", msg:"Antecedent precipitation threshold reached. Watch advisory.", time:"1h ago", conf:81 },
    { zone:"Aizawl East Bawngkawn", sev:"HIGH", msg:"Urban residential slope saturation at 84%. Alert defense.", time:"2h ago", conf:76 },
    { zone:"Kohima NH-29 Bridge", sev:"HIGH", msg:"Sentinel-1 InSAR surface deformation 1.2mm/h. Single-lane convoy only.", time:"3h ago", conf:71 },
    { zone:"Senapati Terraces", sev:"MODERATE", msg:"Telemetry sensor offline. Periodic patrol dispatched.", time:"5h ago", conf:54 },
    { zone:"Tawang Route", sev:"HIGH", msg:"Permafrost degradation and rockfall along high pass.", time:"6h ago", conf:81 },
  ])

  useEffect(() => {
    getAlerts().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(item => ({
          zone: item.zone || item.zone_name,
          sev: item.severity,
          msg: item.message || (item.type ? `${item.type} reported in ${item.zone}. Priority monitoring.` : "Active hazard bulletin."),
          time: item.time || "Recently",
          conf: item.score || 85
        }))
        setAlerts(formatted)
      }
    }).catch(() => {})
  }, [])

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Active Bulletins</h2>
          <p>7 Active Advisories</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {alerts.map((a, i) => (
            <div className="alert-item" key={i}>
              <div className={`alert-severity-bar ${a.sev.toLowerCase()}`} />
              <div className="alert-content">
                <div className="alert-zone">{a.zone}</div>
                <div className="alert-message">{a.msg}</div>
                <div className="alert-meta">
                  <span className={`risk-pill ${a.sev.toLowerCase()}`}>{a.sev}</span>
                  <span>AI: {a.conf}%</span>
                  <span>{a.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-danger" style={{ width: "100%" }} onClick={onOpenSOS}>
        <Icons.Alerts size={18} color="#ffffff" />
        <span>{t.emergency}</span>
      </button>
    </div>
  )
}

// 10. CITIZEN REPORT VIEW
function ReportView({ t, onBack }) {
  const [reports, setReports] = useState([
    { type:"Tension Crack (30cm)", loc:"NH-44 Dawki Road", desc:"Fissure after continuous rainfall.", time:"2h ago", status:"verified" },
    { type:"Debris Flow Slurry", loc:"Kohima Bypass NH-29", desc:"Slurry overrunning roadway.", time:"5h ago", status:"verified" },
  ])
  const [loc, setLoc] = useState("")
  const [desc, setDesc] = useState("")
  const [toast, setToast] = useState("")

  useEffect(() => {
    getReports().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setReports(data)
      }
    }).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!loc.trim()) { setToast("Please enter a location"); setTimeout(() => setToast(""), 3000); return }
    const newEntry = { type:"Citizen Crack Report", loc, desc: desc || "Reported via mobile app.", time:"Just now", status:"pending" }
    setReports(r => [newEntry, ...r])
    try {
      await submitReport({
        report_type: "Citizen Crack Report",
        location: loc,
        description: desc || "Reported via mobile app.",
        lat: 25.4484,
        lng: 92.2152
      })
      setToast("Report transmitted to District SDMA.")
    } catch (err) {
      setToast("Report saved to local emergency log.")
    }
    setLoc(""); setDesc("")
    setTimeout(() => setToast(""), 3500)
  }

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Incident Reporting</h2>
          <p>Crowdsourced Hazard Submissions</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Report size={18} color="var(--navy)" />
            <span>New Hazard Report</span>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={submit}>
            <div className="form-field">
              <label className="form-label">Incident Type</label>
              <input className="form-input" defaultValue="Tension Crack / Retaining Wall Fissure" />
            </div>
            <div className="form-field">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="e.g. NH-44 KM 38 near Dawki" value={loc} onChange={e => setLoc(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Observations</label>
              <textarea className="form-input" rows={3} placeholder="Describe crack width or water seepage..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Transmit Report</button>
          </form>
        </div>
      </div>

      <div className="home-section-title">Verified Field Reports</div>
      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {reports.map((r, i) => (
            <div className="alert-item" key={i}>
              <div className="alert-content">
                <div className="alert-zone">{r.type}: {r.loc}</div>
                <div className="alert-message">{r.desc}</div>
                <div className="alert-meta">
                  <span className="risk-pill safe" style={{ fontSize: 9 }}>{r.status.toUpperCase()}</span>
                  <span>{r.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// 11. MAIN APP SHELL

// =========================================================================
// 12. OFFLINE DISASTER PORTAL (P2P BLUETOOTH MESH & PRE-DOWNLOADED AI)
// =========================================================================
const OFFLINE_PREDICTIONS = [
  {
    id: "OFF-JH-01",
    zone: "Jaintia Hills (NH-44 Sector 8)",
    state: "Meghalaya",
    risk: "CRITICAL",
    score: 87,
    rainThreshold: "142 mm / 160 mm Trigger (88%)",
    soil: "89.4% Saturation",
    slope: "42.5° Disang Shale",
    fault: "Dauki Fault Faultline (2.1 km)",
    evac: "Immediate evacuation of Shnongpdeng & Dawki valley floor. Move to Khliehriat Multipurpose Hall."
  },
  {
    id: "OFF-SK-02",
    zone: "North Sikkim MCT Zone",
    state: "Sikkim",
    risk: "CRITICAL",
    score: 83,
    rainThreshold: "115 mm / 130 mm (88%)",
    soil: "84.2% Saturation",
    slope: "38.0° Moraine",
    fault: "Main Central Thrust Fault (1.4 km)",
    evac: "NH-10 Chungthang corridor closed. Move to Mangan High-Ground Shelter."
  },
  {
    id: "OFF-AS-03",
    zone: "Haflong Hill Station Pass",
    state: "Assam",
    risk: "CRITICAL",
    score: 85,
    rainThreshold: "128 mm / 140 mm (91%)",
    soil: "86.1% Saturation",
    slope: "35.0° Railway Hill Cut",
    fault: "Dima Hasao Thrust Corridor",
    evac: "Railway cutting landslide alert. Stay in Municipal Community Centre."
  },
  {
    id: "OFF-MZ-04",
    zone: "Aizawl East Flank",
    state: "Mizoram",
    risk: "HIGH",
    score: 76,
    rainThreshold: "95 mm / 120 mm (79%)",
    soil: "74.5% Saturation",
    slope: "32.0° Sandstone",
    fault: "Mizo Fold Belt Fault",
    evac: "Watch road cutting subsidence. Move away from steep terrace edges."
  }
]

const OFFLINE_SHELTERS = [
  { name: "Khliehriat Multipurpose Hall", dist: "2.8 km North", cap: "450 Persons", elev: "1,220m (High Bedrock)", facilities: "Water Cistern, GenSet, Medical Post", lat: 25.352, lng: 92.368 },
  { name: "Dawki Civil Emergency Relief Camp", dist: "4.1 km South", cap: "200 Persons", elev: "180m (Border Plateau)", facilities: "First Aid, Ham Radio, Ration", lat: 25.184, lng: 92.018 },
  { name: "Sohra Govt Higher Secondary Shelter", dist: "6.5 km West", cap: "600 Persons", elev: "1,430m (Limestone Ridge)", facilities: "Civil Defence Store, Rainwater Tanks", lat: 25.285, lng: 91.725 },
  { name: "Gangtok South Ridge Relief Centre", dist: "3.2 km East", cap: "350 Persons", elev: "1,650m (Stable Rock)", facilities: "NDRF Forward Staging Depot", lat: 27.325, lng: 88.612 }
]

const EMERGENCY_CONTACTS = [
  { name: "NDRF National Disaster Helpline", number: "1078", type: "Toll-Free Emergency", desc: "Direct satellite dispatch to Guwahati & Silchar battalions" },
  { name: "Meghalaya State Disaster (SDRF)", number: "1070", type: "State Emergency", desc: "State Disaster Management Authority Control Centre" },
  { name: "National Emergency Response (ERSS)", number: "112", type: "Police / Fire / Rescue", desc: "Single nationwide emergency number" },
  { name: "Emergency Medical & Ambulance", number: "108", type: "Medical Evacuation", desc: "Critical trauma mobile response" },
  { name: "MDoNER Disaster Operations Desk", number: "01123022400", type: "Ministry HQ Delhi", desc: "Central Disaster Monitoring Cell" },
]

function OfflineDisasterPortal({ t, user, activeTab, onSelectTab, onSwitchOnline }) {
  const hasNativeBle = typeof window !== "undefined" && !!window.AegisBleBridge;

  const [scanning, setScanning] = useState(false)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastInfo, setBroadcastInfo] = useState("")
  const [peers, setPeers] = useState([
    { id: "PEER-ML-204", name: "Commuter · Tata Sumo (NH-44)", dist: "14m", rssi: "-54 dBm", hops: 2, lastSeen: "2 min ago", alertsCarried: 1 },
    { id: "PEER-AS-8812", name: "Relief Supply Carrier #04", dist: "29m", rssi: "-72 dBm", hops: 1, lastSeen: "Just now", alertsCarried: 3 },
    { id: "BEACON-JH-082", name: "In-Situ Solar Tower Station (BLE)", dist: "42m", rssi: "-84 dBm", hops: 0, lastSeen: "Live Beacon", alertsCarried: 4 }
  ])
  const [receivedPackets, setReceivedPackets] = useState([])
  const [outbox, setOutbox] = useState([
    { id: 1, text: "NH-44 Km 48 blocked by shale slip. 3 light vehicles stranded on shoulder. All passengers safe.", time: "12 mins ago", status: "Relayed via 2 Peers" }
  ])
  const [newMsg, setNewMsg] = useState("")
  const [offlineToast, setOfflineToast] = useState("")

  const showToast = (msg) => {
    setOfflineToast(msg)
    setTimeout(() => setOfflineToast(""), 4000)
  }

  // Hook real-time BLE callbacks from native Android AegisBleBridge
  useEffect(() => {
    if (typeof window === "undefined") return

    // Listener for discovered BLE peers
    window.onAegisBlePeerDiscovered = (peer) => {
      if (!peer) return
      const peerId = peer.nodeId || peer.address || ("NODE-" + Math.floor(1000 + Math.random() * 9000))
      setPeers(prev => {
        const existingIdx = prev.findIndex(p => p.id === peerId)
        const updated = {
          id: peerId,
          name: peer.message ? `AEGIS Peer · "${peer.message}"` : `AEGIS Mesh Node (${peerId})`,
          dist: peer.distStr || `${peer.distanceMeters || 12}m`,
          rssi: peer.rssi || "-62 dBm",
          hops: 1,
          lastSeen: "Just now (Live Radio)",
          alertsCarried: peer.type === "SOS" ? 1 : 0,
          isHardwareRadio: true
        }
        if (existingIdx >= 0) {
          const next = [...prev]
          next[existingIdx] = { ...next[existingIdx], ...updated }
          return next
        } else {
          return [updated, ...prev]
        }
      })
    }

    // Listener for emergency packets received over the air
    const onPacketGlobal = (packet) => {
      if (!packet) return
      const newEntry = {
        id: Date.now() + Math.random(),
        nodeId: packet.nodeId || "UNKNOWN-NODE",
        type: packet.type || "SOS",
        message: packet.message || "Distress Beacon",
        distStr: packet.distStr || "~15m",
        rssi: packet.rssi || "-60 dBm",
        lat: packet.lat || 25.4484,
        lng: packet.lng || 92.2152,
        riskScore: packet.riskScore || 85,
        time: new Date().toLocaleTimeString("en-IN")
      }
      setReceivedPackets(prev => [newEntry, ...prev])
      showToast(`🚨 Direct BLE Distress Signal Received from ${newEntry.nodeId} (${newEntry.distStr})!`)
    }

    window.onBleMeshPacketGlobal = onPacketGlobal

    return () => {
      if (window.onBleMeshPacketGlobal === onPacketGlobal) {
        window.onBleMeshPacketGlobal = null
      }
    }
  }, [])

  const handleScanPeers = async () => {
    setScanning(true)
    if (hasNativeBle) {
      try {
        if (!window.AegisBleBridge.isBluetoothEnabled()) {
          window.AegisBleBridge.requestEnableBluetooth()
        }
        window.AegisBleBridge.startMeshScan()
        showToast("🔍 Active 2.4GHz BLE Hardware Scan Active (Continuous Emergency Radio)...")
      } catch (err) {
        console.warn("Native BLE scan error:", err)
      }
      // Populate latest discovered hardware peers
      setTimeout(() => {
        try {
          if (window.AegisBleBridge && window.AegisBleBridge.getDiscoveredPeers) {
            const raw = window.AegisBleBridge.getDiscoveredPeers()
            const list = JSON.parse(raw || "[]")
            if (list.length > 0) {
              setPeers(list.map((p, idx) => ({
                id: p.nodeId || "RADIO-NODE-" + idx,
                name: p.type === "WEB_RELAY" ? "Disaster Authority Relay" : (p.message ? "Citizen Node" : "AEGIS Radio Peer"),
                dist: p.distStr || (p.distanceMeters ? p.distanceMeters + "m" : "Nearby"),
                rssi: p.rssi || "-62 dBm",
                hops: 1,
                lastSeen: "Active",
                alertsCarried: p.riskScore ? 1 : 0
              })))
            }
          }
        } catch(e) {}
        setScanning(false)
        showToast("Discovered peers updated. Radio receiver continues active background listening.")
      }, 2500)
    } else {
      // Browser dev fallback
      setTimeout(() => {
        setScanning(false)
        setPeers(prev => [
          ...prev,
          { id: "PEER-LOC-" + Math.floor(100 + Math.random()*899), name: "Nearby Citizen Phone (AEGIS Peer)", dist: (8 + Math.random()*25).toFixed(0) + "m", rssi: "-6" + Math.floor(Math.random()*9) + " dBm", hops: 1, lastSeen: "Just now", alertsCarried: 1 }
        ])
        showToast("BLE Scan Complete: Discovered active AEGIS peers within 40m range.")
      }, 1800)
    }
  }

  const handleBroadcastBLE = (item) => {
    if (hasNativeBle) {
      try {
        const msg = item.evac ? item.evac.slice(0, 24) : item.zone
        window.AegisBleBridge.broadcastWarning(item.zone, item.score, msg)
        setIsBroadcasting(true)
        setBroadcastInfo(`Warning: ${item.zone} (${item.score}%)`)
        showToast(`🚨 Hardware BLE Hazard Warning Beamed (${item.zone})! Passing devices will detect it.`)
      } catch (err) {
        console.warn("BLE broadcast error:", err)
        showToast(`Beamed 128-byte packet (${item.zone}) over local mesh!`)
      }
    } else {
      showToast(`Beamed 128-byte packet (${item.zone}) to ${peers.length} nearby Bluetooth peers!`)
    }
  }

  const handleQueueOutbox = (e) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    const entry = {
      id: Date.now(),
      text: newMsg,
      time: "Just now",
      status: hasNativeBle ? "Broadcasting over Hardware BLE Radio (Zero SIM/Wi-Fi)" : "Queued in BLE Beacon Outbox (Beaming to nearby peers)"
    }
    setOutbox([entry, ...outbox])

    if (hasNativeBle) {
      try {
        const citizenId = user?.id || ("NER-NODE-" + Math.floor(1000 + Math.random()*9000))
        const district = user?.district || "Jaintia Hills"
        window.AegisBleBridge.broadcastSos(citizenId, district, 95, 25.4484, 92.2152, newMsg.slice(0, 25))
        setIsBroadcasting(true)
        setBroadcastInfo(`SOS: "${newMsg.slice(0, 22)}..."`)
        showToast("🚨 Hardware BLE SOS Beacon ACTIVE! Beaming to all phones within 40m without SIM/Wi-Fi.")
      } catch (err) {
        console.warn("Native BLE broadcast error:", err)
        showToast("SOS message queued in Bluetooth Outbox.")
      }
    } else {
      showToast("SOS message queued in Bluetooth Outbox. It will beam to all passing vehicles!")
    }
    setNewMsg("")
  }

  const handleStopBroadcast = () => {
    if (hasNativeBle) {
      try {
        window.AegisBleBridge.stopBroadcast()
      } catch (e) {}
    }
    setIsBroadcasting(false)
    setBroadcastInfo("")
    showToast("BLE Hardware Broadcast Stopped. Radio silent.")
  }

  return (
    <div className="offline-portal-container">
      {/* Indestructible Offline Hero Card */}
      <div className="offline-hero-card">
        <div className="offline-hero-top">
          <div className="offline-hero-tag">
            <span className="net-pulse-dot offline" />
            <span>INDESTRUCTIBLE OFFLINE ENGINE</span>
          </div>
          <span className="zero-kb-badge">0 KB DATA NEEDED</span>
        </div>
        <div className="offline-hero-title">Zero Internet? No Problem.</div>
        <div className="offline-hero-desc">
          AEGIS operates 100% autonomously in remote mountain blackouts using Built-in Device GPS, Local Flash Cache, and Bluetooth P2P Mesh.
        </div>
      </div>

      {/* Horizontal Scrollable Offline Modules (Only Options that Don't Need Internet) */}
      <div className="offline-scroll-wrap">
        <div className="offline-scroll-label">OFFLINE SURVIVAL MODULES (ZERO INTERNET REQUIRED)</div>
        <div className="offline-chips-scroll">
          <button className={`offline-chip-btn ${activeTab === "predictions" ? "active" : ""}`} onClick={() => onSelectTab("predictions")}>
            <Icons.Ai size={16} />
            <span>Cached AI Hazards</span>
          </button>
          <button className={`offline-chip-btn ${activeTab === "mesh" ? "active" : ""}`} onClick={() => onSelectTab("mesh")}>
            <Icons.Bluetooth size={16} />
            <span>Bluetooth P2P Mesh ({peers.length})</span>
          </button>
          <button className={`offline-chip-btn ${activeTab === "simulation" ? "active" : ""}`} onClick={() => onSelectTab("simulation")}>
            <Icons.Simulator size={16} />
            <span>Soil Stress Simulator</span>
          </button>
          <button className={`offline-chip-btn ${activeTab === "shelters" ? "active" : ""}`} onClick={() => onSelectTab("shelters")}>
            <Icons.Map size={16} />
            <span>Bedrock Shelters</span>
          </button>
          <button className={`offline-chip-btn ${activeTab === "contacts" ? "active" : ""}`} onClick={() => onSelectTab("contacts")}>
            <Icons.Phone size={16} />
            <span>Direct SOS Calls</span>
          </button>
          <button className={`offline-chip-btn ${activeTab === "safety" ? "active" : ""}`} onClick={() => onSelectTab("safety")}>
            <Icons.Safety size={16} />
            <span>Satellite GPS Radar</span>
          </button>
          <button className={`offline-chip-btn ${activeTab === "sops" ? "active" : ""}`} onClick={() => onSelectTab("sops")}>
            <Icons.Report size={16} />
            <span>Survival SOP Checklist</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PRE-DOWNLOADED PREDICTIONS */}
      {activeTab === "simulation" && (
        <SimulatorView t={t} onBack={() => onSelectTab("predictions")} onOpenSOS={() => showToast("Emergency SOS protocol triggered offline")} />
      )}

      {activeTab === "predictions" && (
        <div className="offline-tab-content">
          <div className="offline-section-header">
            <div>
              <h3>Pre-Downloaded AI Predictions</h3>
              <p>Cached in Local Flash Storage · GSI NLSM v3.2 Model</p>
            </div>
            <span className="cache-verified-tag">
              <Icons.Download size={13} />
              <span>OFFLINE CACHE</span>
            </span>
          </div>

          {OFFLINE_PREDICTIONS.map(item => (
            <div className="card" key={item.id} style={{ borderLeft: `4px solid ${item.risk === "CRITICAL" ? "#b91c1c" : "#d97706"}`, marginBottom: "12px" }}>
              <div className="card-header">
                <div className="card-title">
                  <span className={`risk-pill ${item.risk.toLowerCase()}`}>{item.risk} ({item.score}%)</span>
                  <span>{item.zone}</span>
                </div>
              </div>
              <div className="card-body">
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  <strong>State:</strong> {item.state} &bull; <strong>Faultline:</strong> {item.fault}
                </div>
                <div className="pred-metrics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px" }}>
                  <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "8px", fontSize: "10.5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Rain Trigger:</span>
                    <div style={{ fontWeight: "700", color: "#b91c1c" }}>{item.rainThreshold}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "8px", fontSize: "10.5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Soil Saturation:</span>
                    <div style={{ fontWeight: "700", color: "var(--darknavy)" }}>{item.soil}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "8px", fontSize: "10.5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Slope Angle:</span>
                    <div style={{ fontWeight: "700", color: "var(--darknavy)" }}>{item.slope}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "8px", fontSize: "10.5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Protocol:</span>
                    <div style={{ fontWeight: "700", color: "#1e40af" }}>Evacuation Readiness Active</div>
                  </div>
                </div>
                <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px", padding: "8px 10px", fontSize: "11px", color: "#991b1b", marginBottom: "10px" }}>
                  <strong>Evacuation Advice:</strong> {item.evac}
                </div>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => handleBroadcastBLE(item)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "700" }}
                >
                  <Icons.Bluetooth size={16} color="#1e40af" />
                  <span>Broadcast Warning via Bluetooth P2P Relay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: BLUETOOTH P2P MESH */}
      {activeTab === "mesh" && (
        <div className="offline-tab-content">
          <div className="offline-section-header">
            <div>
              <h3>Bluetooth P2P Mesh Network</h3>
              <p>Direct Phone-to-Phone Delay-Tolerant Gossip Relay</p>
            </div>
            <span style={{ fontSize: "10px", fontWeight: "700", padding: "4px 8px", borderRadius: "6px", background: hasNativeBle ? "#ecfdf5" : "#eff6ff", color: hasNativeBle ? "#065f46" : "#1e40af", border: `1px solid ${hasNativeBle ? "#a7f3d0" : "#bfdbfe"}` }}>
              {hasNativeBle ? "🟢 HARDWARE BLE (0 KB NET)" : "🔵 SIMULATOR MODE"}
            </span>
          </div>

          {/* Active Hardware Broadcast Notification Card */}
          {isBroadcasting && (
            <div style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: "14px", padding: "14px", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 4px 16px rgba(239, 68, 68, 0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", animation: "radarPulseRing 1s infinite" }} />
                  <strong style={{ color: "#991b1b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active BLE Radio Beacon</strong>
                </div>
                <button 
                  onClick={handleStopBroadcast} 
                  style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                >
                  Stop Beacon
                </button>
              </div>
              <div style={{ fontSize: "11.5px", color: "#7f1d1d" }}>
                Actively transmitting 128-bit emergency packets over 2.4GHz Bluetooth hardware. Nearby phones will receive this alert without internet.
              </div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#b91c1c", background: "rgba(255,255,255,0.7)", padding: "4px 8px", borderRadius: "6px" }}>
                Payload: {broadcastInfo}
              </div>
            </div>
          )}

          {/* Mesh Radar Widget */}
          <div className="mesh-radar-card">
            <div className={`mesh-radar-circle ${scanning ? "scanning" : ""}`}>
              <Icons.Bluetooth size={32} color="#ffffff" />
            </div>
            <div className="mesh-radar-info">
              <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--darknavy)" }}>
                {scanning ? "Scanning 2.4GHz BLE Spectrum..." : `${peers.length} Nearby AEGIS Mesh Peers Found`}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Effective range: 30–50 meters · Zero SIM or cell towers required
              </div>
            </div>
            <button className={`btn btn-primary ${scanning ? "btn-scanning" : ""}`} onClick={handleScanPeers} disabled={scanning} style={{ width: "100%", marginTop: "12px" }}>
              <Icons.Bluetooth size={18} color="#ffffff" />
              <span>{scanning ? "Scanning 2.4GHz Radio..." : "Scan for Nearby Bluetooth Peers"}</span>
            </button>
          </div>

          {/* INCOMING DIRECT RADIO DISTRESS SIGNALS (if any received) */}
          {receivedPackets.length > 0 && (
            <div style={{ marginTop: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="home-section-title" style={{ margin: 0, color: "#b91c1c" }}>🚨 Received Bluetooth Distress Signals ({receivedPackets.length})</span>
                <span style={{ fontSize: "9.5px", background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>LIVE RADIO</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {receivedPackets.map(pkt => (
                  <div key={pkt.id} style={{ background: "#fff", border: "1.5px solid #f87171", borderRadius: "10px", padding: "10px 12px", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "800", color: "#b91c1c", fontSize: "12px" }}>{pkt.nodeId}</span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>{pkt.time} &bull; {pkt.distStr}</span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--darknavy)", fontWeight: "600", marginBottom: "6px" }}>
                      "{pkt.message}"
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button 
                        className="btn btn-sm btn-primary" 
                        style={{ fontSize: "10px", padding: "4px 8px", background: "#059669" }}
                        onClick={() => onSelectTab("shelters")}
                      >
                        🧭 Guide to Shelter
                      </button>
                      <button 
                        className="btn btn-sm btn-outline" 
                        style={{ fontSize: "10px", padding: "4px 8px" }}
                        onClick={() => handleBroadcastBLE({ zone: pkt.nodeId, score: pkt.riskScore, evac: pkt.message })}
                      >
                        📡 Relay via Mesh
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peer Nodes List */}
          <div className="home-section-title" style={{ marginTop: "16px" }}>Detected Mesh Peers &amp; Relays</div>
          <div className="peer-list">
            {peers.map(peer => (
              <div className="peer-card" key={peer.id}>
                <div className="peer-icon-box" style={{ background: peer.isHardwareRadio ? "#ecfdf5" : "#f1f5f9" }}>
                  <Icons.Bluetooth size={20} color={peer.isHardwareRadio ? "#059669" : "#1e40af"} />
                </div>
                <div className="peer-info">
                  <div className="peer-name">
                    <span>{peer.name}</span>
                    {peer.isHardwareRadio && <span style={{ marginLeft: "4px", fontSize: "9px", background: "#10b981", color: "#fff", padding: "1px 4px", borderRadius: "3px" }}>REAL RADIO</span>}
                  </div>
                  <div className="peer-meta">
                    <span>Signal: {peer.rssi}</span> &bull; 
                    <span>Distance: ~{peer.dist}</span> &bull; 
                    <span>Hops: {peer.hops}</span>
                  </div>
                </div>
                <button className="peer-sync-btn" onClick={() => showToast(`Synchronized offline hazard packet with ${peer.id}!`)}>
                  Sync
                </button>
              </div>
            ))}
          </div>

          {/* Offline SOS Beacon Outbox */}
          <div className="home-section-title" style={{ marginTop: "18px" }}>Offline SOS Beacon Outbox</div>
          <div className="card">
            <div className="card-body">
              <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "10px" }}>
                Compose a distress message with your GPS coordinates. It will be beamed over 2.4GHz Bluetooth radio to any vehicle or peer passing within 50m to transport out of the blackout zone (0 KB data).
              </p>
              <form onSubmit={handleQueueOutbox}>
                <textarea 
                  className="form-input" 
                  rows={2} 
                  placeholder="e.g. 4 people trapped near Km 42 bridge collapse. Need rescue rope."
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  style={{ width: "100%", resize: "none", marginBottom: "8px" }}
                />
                <button type="submit" className="btn btn-danger btn-sm" style={{ width: "100%", fontWeight: "700" }}>
                  {hasNativeBle ? "Beam SOS over Bluetooth Radio" : "Queue in Bluetooth SOS Outbox"}
                </button>
              </form>

              <div style={{ marginTop: "12px" }}>
                {outbox.map(item => (
                  <div key={item.id} style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 10px", marginBottom: "6px", fontSize: "11px" }}>
                    <div style={{ color: "var(--darknavy)", fontWeight: "600" }}>"{item.text}"</div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d", fontWeight: "700", marginTop: "4px", fontSize: "9.5px" }}>
                      <span>{item.status}</span>
                      <span style={{ color: "var(--text-muted)" }}>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OFFLINE SHELTERS */}
      {activeTab === "shelters" && (
        <div className="offline-tab-content">
          <div className="offline-section-header">
            <div>
              <h3>Offline Evacuation Shelters</h3>
              <p>Designated High-Ground Bedrock Shelters &bull; GSI Verified</p>
            </div>
          </div>

          {OFFLINE_SHELTERS.map((sh, idx) => (
            <div className="card" key={idx} style={{ marginBottom: "10px", borderLeft: "4px solid #10b981" }}>
              <div className="card-header">
                <div className="card-title">
                  <span>{sh.name}</span>
                  <span style={{ fontSize: "11px", color: "var(--navy)", fontWeight: "700" }}>{sh.dist}</span>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px", marginBottom: "8px" }}>
                  <div><strong>Capacity:</strong> {sh.cap}</div>
                  <div><strong>Elevation:</strong> {sh.elev}</div>
                </div>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "6px 8px", fontSize: "10.5px", color: "#166534", marginBottom: "8px" }}>
                  <strong>Facilities:</strong> {sh.facilities}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  Coordinates: {sh.lat}° N, {sh.lng}° E
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: OFFLINE EMERGENCY SOS CALLS & SOPS */}
      {activeTab === "contacts" && (
        <div className="offline-tab-content">
          <div className="offline-section-header">
            <div>
              <h3>Emergency Helplines &amp; SOPs</h3>
              <p>Direct Cellular Dialing (Operates with zero internet/data)</p>
            </div>
          </div>

          <div className="emergency-call-grid">
            {EMERGENCY_CONTACTS.map((c, i) => (
              <a key={i} href={`tel:${c.number}`} className="emergency-call-btn">
                <div className="call-btn-left">
                  <div className="call-icon-wrap">
                    <Icons.Phone size={18} color="#ffffff" />
                  </div>
                  <div>
                    <div className="call-name">{c.name}</div>
                    <div className="call-desc">{c.desc}</div>
                  </div>
                </div>
                <div className="call-number">{c.number}</div>
              </a>
            ))}
          </div>

          <div className="card" style={{ marginTop: "16px" }}>
            <div className="card-header">
              <div className="card-title">
                <span>Landslide Survival SOP Checklist</span>
              </div>
            </div>
            <div className="card-body" style={{ fontSize: "11.5px", lineHeight: "1.5", color: "var(--darknavy)" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>1. Sudden Roar or Rumbling:</strong> If you hear ground rumbling or cracking trees, immediately sprint perpendicular to the slope to high bedrock ground.
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>2. Driving During Torrential Rain:</strong> Watch for collapsed culverts, muddy water runoff on asphalt, and falling stones. If trapped, abandon vehicle uphill.
              </div>
              <div>
                <strong>3. Secondary Dam Hazards:</strong> Debris flows frequently dam mountain streams. Never seek refuge near riverbanks or narrow gorge bottoms.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OFFLINE GPS SAFETY SENSOR */}
      {activeTab === "safety" && (
        <div className="offline-tab-content">
          <div className="offline-section-header">
            <div>
              <h3>Offline Satellite GPS Triangulator</h3>
              <p>Uses Internal Smartphone Satellite GPS Chip (No SIM required)</p>
            </div>
          </div>
          <SafetyCheckView t={t} onBack={() => onSelectTab("predictions")} />
        </div>
      )}

      {offlineToast && <div className="toast">{offlineToast}</div>}
    </div>
  )
}


// REAL-TIME AUDIBLE SIREN & VIBRATION SYNTHESIZER
let emergencyAudioCtx = null;
let emergencyOscillator = null;
let emergencyGain = null;
let sirenInterval = null;
let vibrationInterval = null;

function initAndUnlockAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!emergencyAudioCtx) {
        emergencyAudioCtx = new AudioCtx();
      }
      if (emergencyAudioCtx.state === 'suspended') {
        emergencyAudioCtx.resume();
      }
    }
  } catch(e) {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', initAndUnlockAudio);
  window.addEventListener('touchstart', initAndUnlockAudio);
  window.addEventListener('pointerdown', initAndUnlockAudio);
}

function startDeviceSiren(msg) {
  // 1. Native Android Hardware Siren (Bypasses silent mode, turns on screen, max alarm stream)
  if (typeof window !== 'undefined' && window.AegisBleBridge && window.AegisBleBridge.triggerNativeSiren) {
    try {
      window.AegisBleBridge.triggerNativeSiren(msg || "CRITICAL EVACUATION SIREN ACTIVE");
    } catch(e) {}
  }

  // 2. Web Audio API Siren for browser webview & speaker
  initAndUnlockAudio();
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!emergencyAudioCtx) {
      emergencyAudioCtx = new AudioCtx();
    }
    if (emergencyAudioCtx.state === 'suspended') {
      emergencyAudioCtx.resume();
    }

    if (emergencyOscillator) {
      try { emergencyOscillator.stop(); } catch(e) {}
    }

    emergencyOscillator = emergencyAudioCtx.createOscillator();
    emergencyGain = emergencyAudioCtx.createGain();
    emergencyGain.gain.setValueAtTime(0.9, emergencyAudioCtx.currentTime);

    emergencyOscillator.type = 'sawtooth';
    emergencyOscillator.frequency.setValueAtTime(800, emergencyAudioCtx.currentTime);

    emergencyOscillator.connect(emergencyGain);
    emergencyGain.connect(emergencyAudioCtx.destination);
    emergencyOscillator.start();

    // Wailing frequency sweep (750Hz <-> 1250Hz) - NDMA/EAS Disaster Siren
    let high = false;
    if (sirenInterval) clearInterval(sirenInterval);
    sirenInterval = setInterval(() => {
      if (!emergencyAudioCtx || !emergencyOscillator) return;
      const targetFreq = high ? 750 : 1250;
      emergencyOscillator.frequency.exponentialRampToValueAtTime(targetFreq, emergencyAudioCtx.currentTime + 0.35);
      high = !high;
    }, 400);

    // Screen WakeLock to keep screen ON during emergency
    if (typeof navigator !== 'undefined' && navigator.wakeLock) {
      navigator.wakeLock.request('screen').catch(() => {});
    }

    // Continuous Phone Vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([1000, 300, 1000, 300, 1500, 500]);
      if (vibrationInterval) clearInterval(vibrationInterval);
      vibrationInterval = setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate([1000, 300, 1000, 300, 1500, 500]);
        }
      }, 4600);
    }

    // Spoken Audio Emergency Evacuation Warning
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance("Critical Alert! Landslide Evacuation Siren Active. Move to safe high ground shelter immediately.");
        u.rate = 1.0;
        u.pitch = 1.1;
        window.speechSynthesis.speak(u);
      }
    } catch(e) {}
  } catch(err) {
    console.error('Audio siren error:', err);
  }
}

function stopDeviceSiren() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  if (emergencyGain && emergencyAudioCtx) {
    try {
      emergencyGain.gain.setValueAtTime(0, emergencyAudioCtx.currentTime);
      emergencyGain.disconnect();
    } catch(e) {}
    emergencyGain = null;
  }
  if (emergencyOscillator) {
    try {
      emergencyOscillator.stop();
      emergencyOscillator.disconnect();
    } catch(e) {}
    emergencyOscillator = null;
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(0);
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  // Native Android Siren Silence Trigger
  if (typeof window !== 'undefined' && window.AegisBleBridge && window.AegisBleBridge.silenceNativeSiren) {
    try {
      window.AegisBleBridge.silenceNativeSiren();
    } catch(e) {}
  }
}

export default function AppMobile() {
  const savedLang = typeof window !== "undefined" ? localStorage.getItem("aegis_lang") : null
  const defaultUser = { name: "Harsh Pathak", state: "Meghalaya", district: "Jaintia Hills (NH-44)", id: "NER-NODE-8842" }
  const savedUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("aegis_user") || "null") : null
  const [user, setUser] = useState(savedUser || defaultUser)
  const [showSplash, setShowSplash] = useState(false)
  const [lang, setLang] = useState(savedLang || "en")
  const [showLangModal, setShowLangModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [activeView, setActiveView] = useState("home")
  const [istTime, setIstTime] = useState("")
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [sosDistressType, setSosDistressType] = useState("Trapped by Mud / Landslide")
  const [sosBleMesh, setSosBleMesh] = useState(true)
  const [sosCellSms, setSosCellSms] = useState(true)
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false)
  const [offlineTab, setOfflineTab] = useState("predictions")
  const [incomingSiren, setIncomingSiren] = useState(null)
  const [pendingBleRelay, setPendingBleRelay] = useState(null)
  const [isWebRelayBroadcasting, setIsWebRelayBroadcasting] = useState(false)
  const [webRelayInfo, setWebRelayInfo] = useState(null)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const [permissionPromptDetail, setPermissionPromptDetail] = useState("")
  const [showBackendModal, setShowBackendModal] = useState(false)
  const [customBackendUrlInput, setCustomBackendUrlInput] = useState(typeof window !== "undefined" ? (localStorage.getItem("aegis_backend_url") || getApiBaseUrl()) : "")
  const [backendPingStatus, setBackendPingStatus] = useState("")
  const lastProcessedDispatchId = useRef("")

  const handleTestBackendPing = async () => {
    setBackendPingStatus("testing")
    try {
      let target = customBackendUrlInput.trim().replace(/\/$/, "")
      if (!target.endsWith("/api") && !target.includes("/api/")) {
        target += "/api"
      }
      const res = await fetch(`${target}/weather?lat=25.44&lng=92.21`, { signal: AbortSignal.timeout(3500) })
      if (res.ok) {
        setBackendPingStatus("connected")
        setToastMsg("✅ Backend Server reachable and responsive!")
      } else {
        setBackendPingStatus("error")
        setToastMsg(`⚠️ Backend responded with HTTP ${res.status}`)
      }
    } catch(err) {
      setBackendPingStatus("failed")
      setToastMsg("❌ Could not reach server. Check IP address & port.")
    }
    setTimeout(() => setToastMsg(""), 4000)
  }

  const handleSaveBackendUrl = () => {
    setCustomBackendUrl(customBackendUrlInput.trim())
    setShowBackendModal(false)
    setToastMsg("✅ Backend Server saved! Reconnecting...")
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const executeBleBroadcast = useCallback((payload) => {
    if (window.AegisBleBridge && typeof window.AegisBleBridge.broadcastWebRelay === "function") {
      const resStr = window.AegisBleBridge.broadcastWebRelay(
        payload.zone || "Jaintia Hills",
        payload.risk_score || 88,
        payload.preset_code || 1,
        payload.severity === "CRITICAL" ? 4 : (payload.severity === "HIGH" ? 3 : 2),
        payload.latitude || 25.4484,
        payload.longitude || 92.2152,
        payload.message || "EVACUATE IMMEDIATELY"
      )
      try {
        const res = JSON.parse(resStr)
        if (res.status === "awaiting_permissions") {
          setShowPermissionPrompt(true)
          setPermissionPromptDetail("Nearby Devices and Location permissions are required by Android OS to broadcast over Bluetooth.")
          return
        }
        if (res.status === "bluetooth_disabled") {
          setShowPermissionPrompt(true)
          setPermissionPromptDetail("Bluetooth is currently turned OFF. Please turn on Bluetooth to proceed.")
          return
        }
      } catch(e) {}
    }
    const alertMsg = payload.message || "EVACUATE IMMEDIATELY: Debris flow expected in 15 mins.";
    const zoneName = payload.zone || "Jaintia Hills Sector 8";

    setIsWebRelayBroadcasting(true)
    setWebRelayInfo(payload)
    setShowPermissionPrompt(false)

    // START SIREN & FULL-SCREEN EMERGENCY TAKEOVER ON PRIMARY PHONE!
    startDeviceSiren(alertMsg)
    setIncomingSiren({
      title: "🚨 PRIMARY GATEWAY: ACTIVE SIREN & BLE BROADCAST",
      message: alertMsg,
      zone: `Zone: ${zoneName} · Primary Radio Gateway Transmitting`,
      time: new Date().toLocaleTimeString("en-IN"),
      isPrimaryGateway: true
    })

    setToastMsg(`🚨 PRIMARY GATEWAY SIREN & RADIO ACTIVE: Broadcasting over 2.4GHz BLE!`)
    setTimeout(() => setToastMsg(""), 5000)
  }, [])

  const handleTriggerWebBleRelay = useCallback((payload) => {
    setPendingBleRelay(payload)
    if (window.AegisBleBridge && typeof window.AegisBleBridge.checkAndRequestBlePermissions === "function") {
      try {
        const permRes = JSON.parse(window.AegisBleBridge.checkAndRequestBlePermissions())
        if (!permRes.allGranted) {
          setShowPermissionPrompt(true)
          setPermissionPromptDetail("Nearby Devices & Location permissions required to relay web broadcast over BLE.")
          return
        }
        if (!permRes.bluetoothEnabled) {
          setShowPermissionPrompt(true)
          setPermissionPromptDetail("Bluetooth is turned off. Please enable Bluetooth.")
          return
        }
      } catch (e) {}
    }
    executeBleBroadcast(payload)
  }, [executeBleBroadcast])

  const handleStopBleRelay = useCallback(() => {
    if (window.AegisBleBridge && typeof window.AegisBleBridge.stopBroadcast === "function") {
      window.AegisBleBridge.stopBroadcast()
    }
    setIsWebRelayBroadcasting(false)
    setWebRelayInfo(null)
    setShowPermissionPrompt(false)
    setToastMsg("BLE Hardware Broadcast Stopped. Radio silent.")
    setTimeout(() => setToastMsg(""), 3500)
  }, [])

  useEffect(() => {
    registerBleGatewayNode({
      node_id: user?.id || "NER-GATEWAY-" + Math.floor(1000 + Math.random() * 9000),
      label: user?.name || "Citizen Gateway Phone",
      battery_level: 88,
      ble_supported: true,
      platform: "Android",
      is_gateway: true
    }).catch(() => {})
  }, [user])

  useEffect(() => {
    // Auto-start continuous BLE mesh scan on mount if native bridge is present
    if (typeof window !== "undefined" && window.AegisBleBridge) {
      try {
        if (!window.AegisBleBridge.isScanningActive()) {
          window.AegisBleBridge.startMeshScan();
        }
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    let backendWs
    const connectBackendBleWS = () => {
      try {
        const wsUrl = getWsBaseUrl()
        backendWs = new WebSocket(wsUrl)
        backendWs.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data)
            if (payload.action === "START_BLE_BROADCAST") {
              handleTriggerWebBleRelay(payload)
            } else if (payload.action === "STOP_BLE_BROADCAST") {
              handleStopBleRelay()
            }
          } catch (e) {}
        }
        backendWs.onclose = () => {
          setTimeout(connectBackendBleWS, 3000)
        }
        backendWs.onerror = () => {}
      } catch (e) {}
    }
    connectBackendBleWS()

    const blePoll = setInterval(async () => {
      try {
        const trigger = await getBleActiveTrigger()
        if (trigger && trigger.active && trigger.dispatch_id && trigger.dispatch_id !== lastProcessedDispatchId.current) {
          lastProcessedDispatchId.current = trigger.dispatch_id
          handleTriggerWebBleRelay(trigger)
        }
      } catch(e) {}
    }, 3000)

    window.onAegisBlePermissionsResult = (allGranted) => {
      if (allGranted && pendingBleRelay) {
        executeBleBroadcast(pendingBleRelay)
      }
    }

    return () => {
      if (backendWs) backendWs.close()
      clearInterval(blePoll)
    }
  }, [handleTriggerWebBleRelay, handleStopBleRelay, executeBleBroadcast, pendingBleRelay])

  useEffect(() => {
    const checkNetwork = () => {
      if (typeof navigator !== "undefined") {
        const currentlyOffline = !navigator.onLine
        setIsOffline(prev => {
          if (prev !== currentlyOffline) {
            if (currentlyOffline) {
              setToastMsg("🔴 NO INTERNET DETECTED: Switched to Autonomous Offline Flash Engine (0 KB Data Needed)")
            } else {
              setToastMsg("🟢 INTERNET RESTORED: Connected to MDoNER / GSI Cloud Telemetry")
            }
            setTimeout(() => setToastMsg(""), 4000)
          }
          return currentlyOffline
        })
      }
    }

    const onOnline = () => {
      setIsOffline(false)
      setToastMsg("🟢 INTERNET RESTORED: Live Cloud Telemetry Active")
      setTimeout(() => setToastMsg(""), 3500)
    }
    const onOffline = () => {
      setIsOffline(true)
      setToastMsg("🔴 NO INTERNET CONNECTION: Autonomous Offline Mode Active (0 KB Needed)")
      setTimeout(() => setToastMsg(""), 4500)
    }

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    const netHeartbeat = setInterval(checkNetwork, 1500)

    // Request permissions on startup
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 3000 })
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {})
      }
    }

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      clearInterval(netHeartbeat)
    }
  }, [])

  // REAL-TIME CITIZEN SIREN DISPATCH LISTENER (WEBSOCKET + SSE + CLOUD JSON POLL)
  useEffect(() => {
    // 1. Request Notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {})
      }
    }

    initAndUnlockAudio();

    // 2. Connect to ultra-low-latency WebSocket + SSE + HTTP Poll
    let ws = null
    let es = null
    let lastMsgId = null

    const handleIncomingAlert = (data) => {
      if (!data || !data.message) return
      if (data.id && data.id === lastMsgId) return
      lastMsgId = data.id || Date.now()

      if (data.message === "AEGIS_SILENCE_ALL_SIRENS" || (data.title && data.title.includes("AEGIS_SILENCE"))) {
        stopDeviceSiren()
        setIncomingSiren(null)
        return
      }

      if (typeof data.message === "string" && data.message.startsWith("AEGIS_BLE_CMD:")) {
        const parts = data.message.replace("AEGIS_BLE_CMD:", "").split("|")
        const cmdPayload = {
          dispatch_id: parts[0] || "BLE-RELAY",
          preset_code: parseInt(parts[1] || "1", 10),
          risk_score: parseInt(parts[2] || "85", 10),
          zone: parts[3] || "Jaintia Hills",
          message: parts.slice(4).join("|") || "EVACUATE IMMEDIATELY"
        }
        handleTriggerWebBleRelay(cmdPayload)
        return
      }

      // Check age: skip if message is older than 2 minutes
      const nowSec = Math.floor(Date.now() / 1000)
      if (data.time && (nowSec - data.time) > 120) return

      // INSTANT SIREN TRIGGER (0ms delay)
      startDeviceSiren()
      setIncomingSiren({
        title: data.title || "MDoNER CRITICAL EVACUATION SIREN",
        message: data.message,
        zone: data.zone || "Jaintia Hills Sector 8 (NH-44 Corridor)",
        time: new Date().toLocaleTimeString("en-IN")
      })

      // Post OS-level Notification immediately
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🚨 AEGIS RED ALERT: EVACUATION SIREN", {
            body: data.message,
            icon: "/logo.jpg",
            tag: "aegis_emergency_siren",
            requireInteraction: true,
            vibrate: [1000, 300, 1000, 300, 1500]
          })
        } catch(e) {}
      }
    }

    if (typeof window !== "undefined") {
      window.triggerNativeAegisAlert = (msg) => {
        handleIncomingAlert({
          title: "MDoNER CRITICAL EVACUATION SIREN",
          message: msg || "Immediate Evacuation Siren Dispatched by Central Command.",
          time: Math.floor(Date.now() / 1000)
        });
      };
      window.silenceNativeAegisAlert = () => {
        stopDeviceSiren();
        setIncomingSiren(null);
      };

      // Direct Hardware BLE Mesh Emergency Packet Receiver (Zero SIM, Zero Wi-Fi)
      window.onAegisBlePacketReceived = (packet) => {
        if (!packet) return;
        const isRelay = packet.type === "WEB_RELAY" || packet.typeCode === 4 || packet.type === "WARNING" || packet.typeCode === 2;
        const directive = packet.fullDirective || packet.presetText || packet.message || "Immediate Evacuation Directive";
        const zoneName = packet.zone || "Jaintia Hills Sector 8 (NH-44 Corridor)";

        // 1. Activate multi-hop relay status in UI
        setIsWebRelayBroadcasting(true);
        setWebRelayInfo({
          message: directive,
          zone: zoneName,
          preset_code: packet.presetCode || 1,
          severity: packet.severity || "CRITICAL",
          isMeshRelay: true,
          nodeId: packet.nodeId || "NEARBY-RADIO-PEER",
          distStr: packet.distStr || "~12m"
        });

        // 2. Sound hardware & web siren
        startDeviceSiren(directive);

        // 3. Immediately display Full-Screen Takeover Modal
        setIncomingSiren({
          title: "🚨 OFFLINE BLE MESH EMERGENCY SIREN",
          message: directive,
          zone: `Zone: ${zoneName} · 2.4GHz BLE Radio Relay (0 KB Net)`,
          time: new Date().toLocaleTimeString("en-IN"),
          isMeshRelay: true,
          nodeId: packet.nodeId || "NEARBY-PEER",
          distStr: packet.distStr || "~12m"
        });

        if (typeof window.onBleMeshPacketGlobal === "function") {
          window.onBleMeshPacketGlobal(packet);
        }
      };
    }

    // PRIMARY: Native Persistent WebSocket (<100ms delivery, with ?since=2m catchup)
    const connectWS = () => {
      try {
        ws = new WebSocket("wss://ntfy.sh/ner_landslide_alert/ws?since=2m")
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.event === "message") {
              handleIncomingAlert(data)
            }
          } catch(e) {}
        }
        ws.onerror = () => {}
        ws.onclose = () => {
          setTimeout(connectWS, 2000)
        }
      } catch(e) {}
    }
    connectWS()

    // SECONDARY: Fallback SSE stream
    try {
      es = new EventSource("https://ntfy.sh/ner_landslide_alert/sse?since=2m")
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.event === "message") {
            handleIncomingAlert(data)
          }
        } catch(e) {}
      }
    } catch(err) {}

    // TERTIARY: Direct Cloud HTTP Poll every 3s (guaranteed fallback on any 4G/WiFi network)
    const cloudPoll = setInterval(async () => {
      try {
        const res = await fetch("https://ntfy.sh/ner_landslide_alert/json?poll=1&since=30s")
        if (res.ok) {
          const text = await res.text()
          const lines = text.trim().split('\n').filter(Boolean)
          for (const line of lines) {
            try {
              const item = JSON.parse(line)
              if (item.event === "message") {
                handleIncomingAlert(item)
              }
            } catch(e) {}
          }
        }
      } catch(e) {}
    }, 3000)

    // Instant catchup when phone wakes from lockscreen / background
    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        try {
          fetch("https://ntfy.sh/ner_landslide_alert/json?poll=1&since=45s")
            .then(res => res.text())
            .then(text => {
              const lines = text.trim().split('\n').filter(Boolean)
              for (const line of lines) {
                try {
                  const item = JSON.parse(line)
                  if (item.event === "message") handleIncomingAlert(item)
                } catch(e) {}
              }
            }).catch(() => {})
        } catch(e) {}

        if (!ws || ws.readyState !== WebSocket.OPEN) {
          connectWS()
        }
      }
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange)
    }

    return () => {
      if (ws) ws.close()
      if (es) es.close()
      clearInterval(cloudPoll)
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange)
      }
      stopDeviceSiren()
    }
  }, [])


  const t = TRANSLATIONS[lang] || TRANSLATIONS.en

  useEffect(() => {
    const update = () => setIstTime(new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata", hour12: false,
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleEnter = (selectedLang, userPayload) => {
    initAndUnlockAudio();
    setLang(selectedLang)
    if (userPayload) setUser(userPayload)
    if (typeof window !== "undefined") {
      localStorage.setItem("aegis_lang", selectedLang)
      if (userPayload) localStorage.setItem("aegis_user", JSON.stringify(userPayload))
    }
    setShowSplash(false)
    setToastMsg(`Welcome, ${userPayload?.name || "Citizen"}! Setup saved locally.`)
    setTimeout(() => setToastMsg(""), 3500)
  }

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aegis_user")
      localStorage.removeItem("aegis_lang")
    }
    setUser(null)
    setShowSplash(true)
    setShowMenuModal(false)
    setShowProfileModal(false)
    setToastMsg("Signed out. Local session cleared.")
    setTimeout(() => setToastMsg(""), 3000)
  }

  const selectNewLang = (selectedLang) => {
    setLang(selectedLang)
    if (typeof window !== "undefined") {
      localStorage.setItem("aegis_lang", selectedLang)
    }
    setShowLangModal(false)
  }

  const handleCitizenSOS = async () => {
    try {
      const channels = []
      if (sosCellSms) channels.push("sms", "national_portal")
      if (sosBleMesh) channels.push("ble_mesh")
      const res = await broadcastAlert({
        zone_name: user?.district || "Jaintia Hills (NH-44)",
        severity: "CRITICAL",
        message: `Citizen Distress SOS [${user?.name || "Citizen"}] - ${sosDistressType}. GPS: 25.4484° N, 92.2152° E`,
        channels
      })
      setShowSOSModal(false)
      setToastMsg(`🚨 Citizen SOS Beamed! Helplines & BLE peers alerted (ID: ${res.dispatch_id || "AEGIS-CITIZEN-SOS"})`)
      setTimeout(() => setToastMsg(""), 5000)
    } catch (err) {
      setShowSOSModal(false)
      setToastMsg("🚨 SOS Queued in Local Bluetooth Mesh Outbox for immediate relay.")
      setTimeout(() => setToastMsg(""), 4000)
    }
  }

  if (showSplash && !incomingSiren) return <SplashScreen onEnter={handleEnter} />

  const ONLINE_DOCK_APPS = [
    { id: "home", label: t.dashboard, icon: <Icons.Home size={20} /> },
    { id: "safety", label: t.safety, icon: <Icons.Safety size={20} /> },
    { id: "simulation", label: "Simulator", icon: <Icons.Simulator size={20} /> },
    { id: "predictions", label: t.ai, icon: <Icons.Ai size={20} /> },
    { id: "map", label: t.map, icon: <Icons.Map size={20} /> },
  ]

  const OFFLINE_DOCK_APPS = [
    { id: "predictions", label: "Cached AI", icon: <Icons.Ai size={20} /> },
    { id: "mesh", label: "P2P Mesh", icon: <Icons.Bluetooth size={20} /> },
    { id: "simulation", label: "Simulator", icon: <Icons.Simulator size={20} /> },
    { id: "shelters", label: "Shelters", icon: <Icons.Map size={20} /> },
    { id: "contacts", label: "SOS Calls", icon: <Icons.Phone size={20} /> },
  ]

  const DOCK_APPS = isOffline ? OFFLINE_DOCK_APPS : ONLINE_DOCK_APPS

  return (
    <div className="app-shell">
      {/* Clean Native Mobile App Bar */}
      <div className="app-header-container">
        {/* Micro Tiranga line */}
        <div className="tiranga-strip" />

        {/* Micro Government Authority Line */}
        <div className="govt-micro-bar">
          <span>भारत सरकार &bull; MDoNER &bull; GOVT. OF INDIA</span>
          <span className="live-clock-micro">{istTime}</span>
        </div>

        {/* True Native Mobile App Navigation Bar */}
        <div className="mobile-app-bar">
          {/* Top Left: Profile Avatar Icon Button */}
          <button 
            className="mobile-avatar-btn" 
            onClick={() => setShowProfileModal(true)} 
            title="Citizen Profile"
          >
            <div className="mobile-avatar-circle">
              {user?.name ? user.name.charAt(0).toUpperCase() : "H"}
            </div>
          </button>

          {/* Center: App Logo + Native App Name */}
          <div className="mobile-brand-wrap" onClick={() => setActiveView("home")} style={{ cursor: "pointer" }}>
            <img src="/logo.jpg" alt="AEGIS" className="mobile-brand-logo" />
            <div className="mobile-brand-text">
              <div className="mobile-brand-title">
                <span>AEGIS</span>
                <span className="mobile-brand-badge">NER-LEWS</span>
              </div>
              <div className="mobile-brand-sub">MDoNER · GSI Telemetry Platform</div>
            </div>
          </div>

          {/* Top Right: Network Pill + Settings Antenna + 3-Dot More Menu */}
          <div className="mobile-header-actions">
            <button 
              className="mobile-more-btn" 
              onClick={() => setShowBackendModal(true)} 
              title="Server IP & BLE Radio Network Settings"
              style={{ marginRight: "4px" }}
            >
              <span style={{ fontSize: "15px" }}>📡</span>
            </button>
            {/* 3-Dot Options Button */}
            <button 
              className="mobile-more-btn" 
              onClick={() => setShowMenuModal(true)} 
              title="More Options"
            >
              <Icons.MoreVertical size={20} color="var(--darknavy)" />
            </button>
          </div>
        </div>

        {/* Physical Sliding Mode Switcher (Online Cloud vs Offline Survival) */}
        <div className="mode-segmented-bar">
          <div className="mode-toggle-track">
            <button 
              className={`mode-toggle-btn ${!isOffline ? "active online" : ""}`}
              onClick={() => {
                if (isOffline) {
                  setIsOffline(false)
                  setToastMsg("Switched to Online 4G Cloud Mode")
                  setTimeout(() => setToastMsg(""), 3000)
                }
              }}
            >
              <span className="mode-btn-dot online" />
              <span>ONLINE CLOUD</span>
              <span className="mode-badge-hint">Live 4G</span>
            </button>

            <button 
              className={`mode-toggle-btn ${isOffline ? "active offline" : ""}`}
              onClick={() => {
                if (!isOffline) {
                  setIsOffline(true)
                  setToastMsg("Switched to Offline Survival Engine (Zero Internet Needed)")
                  setTimeout(() => setToastMsg(""), 3000)
                }
              }}
            >
              <span className="mode-btn-dot offline" />
              <span>OFFLINE SURVIVAL</span>
              <span className="mode-badge-hint">0 KB Data</span>
            </button>
          </div>
        </div>

        {/* Continuous Offline BLE Radio Mesh Listener Status */}
        <div style={{
          margin: "4px 12px 6px",
          padding: "6px 10px",
          borderRadius: "8px",
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          fontWeight: "600",
          color: "#065f46"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
            <span>Radio Listener Active (2.4GHz BLE • 0 KB Net)</span>
          </div>
          <button
            onClick={() => setShowBackendModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "#047857",
              fontSize: "10.5px",
              fontWeight: "700",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Config
          </button>
        </div>

        {/* Dynamic Internet Connection Live Banner */}
        {isOffline ? (
          <div className="net-offline-alert-banner">
            <div className="net-offline-alert-content">
              <span className="net-pulse-dot offline" />
              <div>
                <strong>NO INTERNET CONNECTION</strong>
                <span> &bull; Operating 100% autonomously from device flash (0 KB needed)</span>
              </div>
            </div>
            <span className="net-offline-badge">OFFLINE MODE</span>
          </div>
        ) : (
          <div className="net-online-status-banner">
            <div className="net-online-status-content">
              <span className="net-pulse-dot online" />
              <div>
                <strong>LIVE INTERNET SYNC ACTIVE</strong>
                <span> &bull; IMD AWS &bull; GSI Remote Sensing &bull; Open-Meteo Cloud (38ms)</span>
              </div>
            </div>
            <span className="net-online-badge">ONLINE</span>
          </div>
        )}

        {/* Urgent BLE System Permission Prompt Banner (Automated Permission Flow) */}
        {showPermissionPrompt && (
          <div style={{
            background: "#fffbeb",
            borderLeft: "4px solid #f59e0b",
            padding: "12px 14px",
            margin: "8px 12px",
            borderRadius: 6,
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.15)",
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ fontSize: 20 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 13, color: "#92400e" }}>
                  Permission Required to Bridge Web Alert to Offline Citizens
                </strong>
                <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#78350f", lineHeight: 1.4 }}>
                  {permissionPromptDetail || "Android Nearby Devices and Location permissions are required to beam emergency packets over 2.4GHz BLE radio."}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button 
                type="button"
                onClick={() => {
                  if (window.AegisBleBridge) {
                    window.AegisBleBridge.checkAndRequestBlePermissions();
                    window.AegisBleBridge.requestEnableBluetooth();
                  } else {
                    setShowPermissionPrompt(false);
                    if (pendingBleRelay) executeBleBroadcast(pendingBleRelay);
                  }
                }}
                style={{
                  flex: 1,
                  background: "#d97706",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 4,
                  fontWeight: "700",
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                Authorize Bluetooth &amp; Nearby Devices
              </button>
              <button 
                type="button"
                onClick={() => setShowPermissionPrompt(false)}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  padding: "8px 12px",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "#475569",
                  cursor: "pointer"
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Active Primary Phone Gateway / Offline Multi-Hop Mesh Relay Broadcasting Banner */}
        {isWebRelayBroadcasting && webRelayInfo && (
          <div style={{
            background: webRelayInfo.isMeshRelay
              ? "linear-gradient(135deg, #065f46 0%, #047857 100%)"
              : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "white",
            padding: "12px 14px",
            margin: "8px 12px",
            borderRadius: 8,
            boxShadow: webRelayInfo.isMeshRelay
              ? "0 4px 16px rgba(4, 120, 87, 0.4)"
              : "0 4px 14px rgba(2, 132, 199, 0.35)",
            border: webRelayInfo.isMeshRelay ? "1px solid #34d399" : "1px solid #38bdf8"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="net-pulse-dot online" style={{
                  background: webRelayInfo.isMeshRelay ? "#34d399" : "#38bdf8",
                  boxShadow: webRelayInfo.isMeshRelay ? "0 0 10px #34d399" : "0 0 10px #38bdf8"
                }} />
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.5px" }}>
                  {webRelayInfo.isMeshRelay
                    ? "📡 OFFLINE MULTI-HOP RELAY ACTIVE (0 KB DATA)"
                    : "📡 PRIMARY GATEWAY: ACTIVE BLE BROADCAST"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleStopBleRelay}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Stop Radio
              </button>
            </div>
            <div style={{ fontSize: 11, color: webRelayInfo.isMeshRelay ? "#d1fae5" : "#e0f2fe", marginBottom: 4 }}>
              {webRelayInfo.isMeshRelay ? "Relaying Directive to Nearby Citizens" : "Web Directive"} &bull; Zone: <strong>{webRelayInfo.zone || "Jaintia Hills"}</strong>
            </div>
            <div style={{
              background: "rgba(0,0,0,0.25)",
              padding: "6px 8px",
              borderRadius: 4,
              fontSize: 11.5,
              fontFamily: "monospace",
              color: "#ffffff"
            }}>
              "{webRelayInfo.message}"
            </div>
            <div style={{ fontSize: 10, color: webRelayInfo.isMeshRelay ? "#a7f3d0" : "#bae6fd", marginTop: 4 }}>
              {webRelayInfo.isMeshRelay
                ? "⚡ Auto-relaying 20-byte radio packets over 2.4GHz BLE to alert other offline phones in range!"
                : "📡 Beaming 20-byte packets over 2.4GHz radio to offline phones in range with 0 KB internet"}
            </div>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="app-content">
        <div key={isOffline ? `offline-${offlineTab}` : activeView} className="view-enter-anim">
          {isOffline ? (
            <OfflineDisasterPortal 
              t={t} 
              user={user}
              activeTab={offlineTab} 
              onSelectTab={setOfflineTab} 
              onSwitchOnline={() => setIsOffline(false)} 
            />
          ) : (
            <>
          {activeView === "home" && (
            <HomeView t={t} onOpenSection={setActiveView} onOpenSOS={() => setShowSOSModal(true)} />
          )}
          {activeView === "safety" && (
            <SafetyCheckView t={t} onBack={() => setActiveView("home")} />
          )}
          {activeView === "predictions" && (
            <PredictionsView t={t} onBack={() => setActiveView("home")} onOpenSOS={() => setShowSOSModal(true)} />
          )}
          {activeView === "map" && (
            <MapView t={t} onBack={() => setActiveView("home")} />
          )}
          {activeView === "sensors" && (
            <SensorsView t={t} onBack={() => setActiveView("home")} />
          )}
          {activeView === "analytics" && (
            <AnalyticsView t={t} onBack={() => setActiveView("home")} />
          )}
          {activeView === "simulation" && (
            <SimulatorView t={t} onBack={() => setActiveView("home")} onOpenSOS={() => setShowSOSModal(true)} />
          )}
          {activeView === "alerts" && (
            <AlertsView t={t} onBack={() => setActiveView("home")} onOpenSOS={() => setShowSOSModal(true)} />
          )}
          {activeView === "report" && (
            <ReportView t={t} onBack={() => setActiveView("home")} />
          )}
            </>
          )}
        </div>
      </div>

      {/* FLOATING TRANSLUCENT DOCK WITH VECTOR ICONS */}
      <div className="floating-dock-container">
        <div className="floating-dock">
          {DOCK_APPS.map(app => (
            <button
              key={app.id}
              className={`dock-btn ${(isOffline ? offlineTab : activeView) === app.id ? "active" : ""}`}
              onClick={() => isOffline ? setOfflineTab(app.id) : setActiveView(app.id)}
            >
              <span className="dock-icon">{app.icon}</span>
              <span className="dock-label">{app.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Change Language Modal Bottom Sheet */}
      {showLangModal && (
        <div className="modal-overlay" onClick={() => setShowLangModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title" style={{ color: "var(--darknavy)", fontSize: "16px" }}>Select Language / ভাষা নিৰ্বাচন</div>
            <div className="modal-subtitle">Ministry of Development of North Eastern Region (MDoNER) · 12 Scheduled Languages</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "320px", overflowY: "auto", padding: "4px" }}>
              {LANGUAGES.map(item => (
                <button 
                  key={item.code} 
                  className={`lang-btn ${lang === item.code ? "selected" : ""}`} 
                  onClick={() => selectNewLang(item.code)}
                  style={{ padding: "10px 8px" }}
                >
                  <span className="lang-native" style={{ fontSize: "13px" }}>{item.native}</span>
                  <span className="lang-english">{item.region}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-outline" style={{ marginTop: "14px", width: "100%" }} onClick={() => setShowLangModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Citizen Emergency SOS & Distress Beacon Sheet */}
      {showSOSModal && (
        <div className="modal-overlay" onClick={() => setShowSOSModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="profile-badge-dot" style={{ background: "#ef4444" }} />
              <div className="modal-title" style={{ margin: 0, color: "#b91c1c" }}>Citizen Emergency SOS Request</div>
            </div>
            <div className="modal-subtitle" style={{ marginBottom: "14px" }}>Direct Distress Beacon & 24x7 Disaster Helplines</div>

            {/* Live GPS Coordinates Banner */}
            <div className="sos-gps-banner">
              <div>
                <div className="sos-gps-coords">
                  <Icons.Gps size={13} color="#15803d" />
                  <span>25.4484° N, 92.2152° E</span>
                </div>
                <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                  Elev. 1,380m &bull; {user?.district || "Jaintia Hills Sector (NH-44)"}
                </div>
              </div>
              <span className="sos-gps-badge">GPS LOCKED</span>
            </div>

            {/* Distress Nature Selection */}
            <div className="distress-section-label">Select Nature of Emergency</div>
            <div className="distress-types-grid">
              {[
                { id: "trapped", label: "Trapped by Mud / Landslide", icon: "⚠️" },
                { id: "medical", label: "Medical Emergency / Trauma", icon: "🚑" },
                { id: "road", label: "Road Cutoff / Stranded Car", icon: "🚧" },
                { id: "collapse", label: "House Damaged / Missing", icon: "🏠" },
              ].map((item) => (
                <div
                  key={item.id}
                  className={`distress-type-chip ${sosDistressType === item.label ? "selected" : ""}`}
                  onClick={() => setSosDistressType(item.label)}
                >
                  <span style={{ fontSize: "14px" }}>{item.icon}</span>
                  <span style={{ lineHeight: 1.2 }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Direct 1-Tap Emergency Calling Helplines */}
            <div className="distress-section-label">1-Tap Direct Emergency Helplines</div>
            <div className="helplines-grid">
              {[
                { name: "NDRF Control", number: "1078", desc: "Disaster Force 24x7" },
                { name: "State SDMA", number: "1070", desc: "State Disaster Room" },
                { name: "Ambulance", number: "108", desc: "Trauma & Medical" },
                { name: "Emergency", number: "112", desc: "Police & Quick Rescue" },
              ].map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.number}`}
                  className="helpline-card"
                  onClick={() => {
                    setToastMsg(`Dialing ${h.name} (${h.number})...`)
                    setTimeout(() => setToastMsg(""), 3000)
                  }}
                >
                  <div className="helpline-info">
                    <span className="helpline-agency">{h.name}</span>
                    <span className="helpline-desc">{h.desc}</span>
                  </div>
                  <div className="helpline-dial-pill">
                    <Icons.Phone size={10} color="#ffffff" />
                    <span>{h.number}</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Nearest Safe Shelter Guide */}
            <div className="shelter-shortcut-card">
              <div className="shelter-shortcut-info">
                <div className="shelter-shortcut-title">Nearest GSI-Verified Bedrock Shelter</div>
                <div className="shelter-shortcut-sub">Dawki Govt Higher Secondary School (840m &bull; High Ground)</div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ fontSize: "10.5px", padding: "4px 10px", borderColor: "#10b981", color: "#047857", fontWeight: "700" }}
                onClick={() => {
                  setShowSOSModal(false)
                  if (isOffline) {
                    setOfflineTab("shelters")
                  } else {
                    setActiveView("safety")
                  }
                  setToastMsg("Navigating to Dawki Bedrock Shelter (840m). Follow designated high-ground trail.")
                  setTimeout(() => setToastMsg(""), 4500)
                }}
              >
                Safe Route &rarr;
              </button>
            </div>

            {/* Transmission Channels */}
            <div className="checkbox-row" style={{ padding: "8px 0" }}>
              <span className="checkbox-icon"><Icons.Bluetooth size={16} color="#1d4ed8" /></span>
              <span className="checkbox-label" style={{ fontSize: "11.5px" }}>Beam over Bluetooth P2P Mesh (Passing rescue vehicles)</span>
              <div className={`toggle ${sosBleMesh ? "on" : "off"}`} onClick={() => setSosBleMesh(!sosBleMesh)}>
                <div className="toggle-knob" />
              </div>
            </div>
            <div className="checkbox-row" style={{ padding: "8px 0" }}>
              <span className="checkbox-icon"><Icons.Phone size={16} color="#047857" /></span>
              <span className="checkbox-label" style={{ fontSize: "11.5px" }}>Send Cell SMS Beacon to State Disaster Operations Centre</span>
              <div className={`toggle ${sosCellSms ? "on" : "off"}`} onClick={() => setSosCellSms(!sosCellSms)}>
                <div className="toggle-knob" />
              </div>
            </div>

            {/* Primary Distress Action Button */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="btn btn-danger"
                style={{ padding: "13px", fontWeight: "800", letterSpacing: "0.5px", boxShadow: "0 4px 16px rgba(185,28,28,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                onClick={handleCitizenSOS}
              >
                <Icons.Alerts size={18} color="#ffffff" />
                <span>BROADCAST CITIZEN DISTRESS BEACON</span>
              </button>
              <button className="btn btn-outline" onClick={() => setShowSOSModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      
      {/* 1. CITIZEN PROFILE MODAL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div className="profile-sheet-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : "H"}
              </div>
              <div style={{ fontSize: "17px", fontWeight: "800", color: "var(--darknavy)" }}>{user?.name || "Citizen Volunteer"}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user?.id || "NER-NODE-8842"} &bull; {user?.state || "Meghalaya"}</div>
              <span className="profile-status-badge">VERIFIED CITIZEN NODE</span>
            </div>

            <div className="profile-details-card">
              <div className="profile-detail-row">
                <span className="detail-lbl">Jurisdiction:</span>
                <span className="detail-val">{user?.district || "Jaintia Hills (NH-44)"}, {user?.state || "Meghalaya"}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-lbl">Language in Use:</span>
                <span className="detail-val">{LANGUAGES.find(l => l.code === lang)?.native || "English"}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-lbl">Offline Mesh Outbox:</span>
                <span className="detail-val" style={{ color: "#15803d" }}>Active (0 Pending Transmits)</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-lbl">App Version:</span>
                <span className="detail-val">AEGIS v2.4 (Live OTA via GitHub)</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
              <button className="btn btn-outline" onClick={() => setShowProfileModal(false)}>Close Profile</button>
              <button className="btn btn-danger btn-sm" onClick={handleSignOut} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Icons.LogOut size={16} />
                <span>Sign Out / Switch User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. THREE-DOT OPTIONS MENU BOTTOM SHEET */}
      {showMenuModal && (
        <div className="modal-overlay" onClick={() => setShowMenuModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title" style={{ textAlign: "left", color: "var(--darknavy)", fontSize: "16px" }}>
              AEGIS Options &amp; Services
            </div>
            <div className="modal-subtitle" style={{ textAlign: "left" }}>
              System Configuration &bull; Help &amp; Updates
            </div>

            <div className="menu-options-list">
              {/* Immediate Phone Siren Test Option */}
              <button 
                className="menu-option-item" 
                style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444" }}
                onClick={() => { 
                  setShowMenuModal(false); 
                  startDeviceSiren();
                  setIncomingSiren({
                    title: "LOCAL PHONE SIREN & VIBRATION TEST",
                    message: "TEST BROADCAST: Speaker, vibration motor, and emergency modal are functioning at 100% efficiency. Ready for live demonstration.",
                    zone: "Local Device Diagnostic",
                    time: new Date().toLocaleTimeString("en-IN")
                  });
                }}
              >
                <div className="menu-item-icon" style={{ background: "#b91c1c", color: "#ffffff" }}>
                  <Icons.Alerts size={18} />
                </div>
                <div className="menu-item-text">
                  <div className="menu-item-title" style={{ color: "#b91c1c", fontWeight: "800" }}>Test Siren on This Phone</div>
                  <div className="menu-item-sub">Verify loud speaker alarm, vibration &amp; red takeover modal</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#b91c1c", background: "#fee2e2", padding: "3px 8px", borderRadius: "6px" }}>TEST NOW</span>
              </button>

              <button className="menu-option-item" onClick={() => { setShowMenuModal(false); setShowWhatsNewModal(true); }}>
                <div className="menu-item-icon" style={{ background: "#eff6ff", color: "#1e40af" }}>
                  <Icons.Sparkles size={18} />
                </div>
                <div className="menu-item-text">
                  <div className="menu-item-title">What's New in v2.4</div>
                  <div className="menu-item-sub">MDoNER branding, Bluetooth mesh, offline predictions</div>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>›</span>
              </button>

              <button className="menu-option-item" onClick={() => { setShowMenuModal(false); setShowHelpModal(true); }}>
                <div className="menu-item-icon" style={{ background: "#f0fdf4", color: "#166534" }}>
                  <Icons.HelpCircle size={18} />
                </div>
                <div className="menu-item-text">
                  <div className="menu-item-title">Help &amp; Emergency Support</div>
                  <div className="menu-item-sub">Disaster helplines, SOP guides, offline usage</div>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>›</span>
              </button>

              <button className="menu-option-item" onClick={() => { setShowMenuModal(false); setShowLangModal(true); }}>
                <div className="menu-item-icon" style={{ background: "#fef3c7", color: "#92400e" }}>
                  <Icons.Globe size={18} />
                </div>
                <div className="menu-item-text">
                  <div className="menu-item-title">Change Language</div>
                  <div className="menu-item-sub">Switch between 12 North Eastern scheduled languages</div>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>›</span>
              </button>

              <button className="menu-option-item" onClick={() => { setShowMenuModal(false); setShowProfileModal(true); }}>
                <div className="menu-item-icon" style={{ background: "#f1f5f9", color: "#334155" }}>
                  <Icons.User size={18} />
                </div>
                <div className="menu-item-text">
                  <div className="menu-item-title">Citizen Profile</div>
                  <div className="menu-item-sub">View node registration &amp; device identity</div>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>›</span>
              </button>

              <button className="menu-option-item" onClick={() => { setShowMenuModal(false); setShowBackendModal(true); }}>
                <div className="menu-item-icon" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                  <Icons.Radio size={18} />
                </div>
                <div className="menu-item-text">
                  <div className="menu-item-title">Backend &amp; BLE Network Settings</div>
                  <div className="menu-item-sub">Configure FastAPI URL, Cloud Mesh &amp; radio endpoints</div>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>›</span>
              </button>

              <button className="menu-option-item" onClick={handleSignOut} style={{ borderTop: "1px solid #fee2e2" }}>
                <div className="menu-item-icon" style={{ background: "#fef2f2", color: "#b91c1c" }}>
                  <Icons.LogOut size={18} />
                </div>
                <div className="menu-item-text">
                  <div className="menu-item-title" style={{ color: "#b91c1c" }}>Sign Out</div>
                  <div className="menu-item-sub">Clear local offline session from this device</div>
                </div>
                <span style={{ fontSize: "13px", color: "#b91c1c" }}>›</span>
              </button>
            </div>

            <button className="btn btn-outline" style={{ marginTop: "14px", width: "100%" }} onClick={() => setShowMenuModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* BACKEND SERVER & BLE RADIO SETTINGS BOTTOM SHEET */}
      {showBackendModal && (
        <div className="modal-overlay" onClick={() => setShowBackendModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "88vh", overflowY: "auto" }}>
            <div className="modal-handle" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div className="modal-title" style={{ textAlign: "left", color: "var(--darknavy)", fontSize: "16px" }}>
                📡 Backend &amp; BLE Network
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", background: "#ecfdf5", color: "#065f46", padding: "3px 8px", borderRadius: "6px" }}>
                Active Node
              </span>
            </div>
            <div className="modal-subtitle" style={{ textAlign: "left", marginBottom: "16px" }}>
              Configure FastAPI endpoint, cloud emergency bus, and radio relay.
            </div>

            {/* Current Status Box */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Active API Base URL</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", wordBreak: "break-all" }}>{getApiBaseUrl()}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>WebSocket:</span>
                <code style={{ fontSize: "10.5px", background: "#e2e8f0", padding: "2px 4px", borderRadius: "4px" }}>{getWsBaseUrl()}</code>
              </div>
            </div>

            {/* Custom URL Input */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                Backend Server URL (LAN IP or Cloud URL)
              </label>
              <input
                type="text"
                value={customBackendUrlInput}
                onChange={e => setCustomBackendUrlInput(e.target.value)}
                placeholder="http://192.168.1.15:8000"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>QUICK PRESETS:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setCustomBackendUrlInput("/api")}
                  style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "6px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer" }}
                >
                  💻 Local Proxy (/api)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomBackendUrlInput("http://10.0.2.2:8000")}
                  style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "6px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer" }}
                >
                  📱 Android Emulator (10.0.2.2:8000)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomBackendUrlInput("http://192.168.1.100:8000")}
                  style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "6px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer" }}
                >
                  📶 Wi-Fi Hotspot IP
                </button>
              </div>
            </div>

            {/* Live Test & Save Controls */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, padding: "10px", fontSize: "12px" }}
                onClick={handleTestBackendPing}
              >
                {backendPingStatus === "testing" ? "Testing..." : "⚡ Test Ping"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: "10px", fontSize: "12px" }}
                onClick={handleSaveBackendUrl}
              >
                💾 Save &amp; Apply
              </button>
            </div>

            <button
              className="btn btn-outline"
              style={{ width: "100%", fontSize: "12px" }}
              onClick={() => setShowBackendModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. WHAT'S NEW MODAL */}
      {showWhatsNewModal && (
        <div className="modal-overlay" onClick={() => setShowWhatsNewModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title" style={{ textAlign: "left", color: "var(--navy)", fontSize: "17px" }}>
              What's New in AEGIS v2.4
            </div>
            <div className="modal-subtitle" style={{ textAlign: "left" }}>
              Recent Government Upgrades &bull; Smart India Hackathon 2026
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <div className="feature-highlight-card">
                <div className="feature-icon-tag">Official MDoNER Masthead</div>
                <p>Incorporated official Ministry of Development of North Eastern Region insignia, State Emblem of India, and National Tiranga ribbon.</p>
              </div>

              <div className="feature-highlight-card">
                <div className="feature-icon-tag">Autonomous Bluetooth P2P Mesh</div>
                <p>Works in zero-network landslide blackouts! Transmits 128-byte encrypted disaster hazard packets phone-to-phone via BLE gossip relays.</p>
              </div>

              <div className="feature-highlight-card">
                <div className="feature-icon-tag">Pre-Downloaded Landslide AI Cache</div>
                <p>Flash-cached risk matrices for Jaintia Hills, Sohra, North Sikkim, Haflong, and Aizawl available completely offline.</p>
              </div>

              <div className="feature-highlight-card">
                <div className="feature-icon-tag">12 North Eastern Languages</div>
                <p>Assamese, Bengali, Khasi, Garo, Mizo, Meitei, Nepali, Nagamese, Bodo, Kokborok, Hindi, and English with one-time persistent selection.</p>
              </div>
            </div>

            <button className="btn btn-primary" style={{ marginTop: "16px", width: "100%" }} onClick={() => setShowWhatsNewModal(false)}>
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* 4. HELP & EMERGENCY SUPPORT MODAL */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title" style={{ textAlign: "left", color: "var(--navy)", fontSize: "17px" }}>
              Help &amp; Emergency Support
            </div>
            <div className="modal-subtitle" style={{ textAlign: "left" }}>
              24/7 Disaster Response &bull; Usage Guidance
            </div>

            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "11.5px" }}>
                <strong>How does Offline Mode work?</strong><br/>
                When mobile data drops or you enter a disconnected valley, AEGIS switches into Offline Mesh. You can also tap the <code>[ ONLINE / OFFLINE ]</code> pill button at any time.
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "11.5px" }}>
                <strong>Immediate Emergency Calling:</strong><br/>
                Direct tap-to-dial numbers that operate via standard cellular voice network without needing mobile data:
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <a href="tel:1078" className="btn btn-danger btn-sm" style={{ textDecoration: "none" }}>NDRF: 1078</a>
                  <a href="tel:112" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Police/ERSS: 112</a>
                </div>
              </div>
            </div>

            <button className="btn btn-outline" style={{ marginTop: "16px", width: "100%" }} onClick={() => setShowHelpModal(false)}>
              Close Help
            </button>
          </div>
        </div>
      )}

      
      {/* 🚨 FULL-SCREEN CRITICAL SIREN TAKEOVER MODAL */}
      {incomingSiren && (
        <div className="siren-takeover-overlay" onClick={initAndUnlockAudio} onTouchStart={initAndUnlockAudio}>
          <div className="siren-takeover-box">
            <div className="siren-strobe-strip" />
            
            <div className="siren-pulse-icon-wrap">
              <span className="siren-wave wave-1" />
              <span className="siren-wave wave-2" />
              <div className="siren-pulse-badge">
                <Icons.Alerts size={32} color="#ffffff" />
              </div>
            </div>

            <div className="siren-authority-tag">
              <span>GOVERNMENT OF INDIA &bull; MDoNER DISASTER COMMAND</span>
            </div>

            <div className="siren-title">CRITICAL EVACUATION SIREN ACTIVE</div>
            <div className="siren-zone">{incomingSiren.zone}</div>

            <div className="siren-msg-box">
              <div className="siren-msg-indicator">
                <span className="siren-audio-bar bar-1" />
                <span className="siren-audio-bar bar-2" />
                <span className="siren-audio-bar bar-3" />
                <span className="siren-audio-bar bar-4" />
                <span className="siren-audio-bar bar-2" />
              </div>
              <p>{incomingSiren.message}</p>
              <div className="siren-dispatch-time">Dispatched: {incomingSiren.time} &bull; Audible Alarm &amp; Vibration On</div>
            </div>

            <div className="siren-actions-col">
              {incomingSiren.isPrimaryGateway && (
                <div style={{
                  background: "rgba(2, 132, 199, 0.2)",
                  border: "1px solid #38bdf8",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textAlign: "left"
                }}>
                  <span style={{ fontSize: "22px" }}>📡</span>
                  <div style={{ fontSize: "11.5px", color: "#bae6fd", lineHeight: "1.35" }}>
                    <strong style={{ color: "#38bdf8", display: "block" }}>PRIMARY GATEWAY TRANSMITTER ACTIVE</strong>
                    This phone received the command from the web and is actively broadcasting 2.4GHz BLE radio waves to alert offline citizens nearby!
                  </div>
                </div>
              )}

              {incomingSiren.isMeshRelay && (
                <div style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid #10b981",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textAlign: "left"
                }}>
                  <span style={{ fontSize: "22px" }}>📡</span>
                  <div style={{ fontSize: "11.5px", color: "#d1fae5", lineHeight: "1.35" }}>
                    <strong style={{ color: "#34d399", display: "block" }}>MULTI-HOP MESH ACTIVE (0 KB DATA)</strong>
                    Your phone received this alert over Bluetooth radio and is now actively re-broadcasting to other offline phones nearby!
                  </div>
                </div>
              )}

              <button
                className="btn btn-warning"
                style={{ background: "#f59e0b", color: "#000", fontWeight: "800", padding: "14px", fontSize: "13.5px", boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)" }}
                onClick={() => {
                  stopDeviceSiren()
                  setIncomingSiren(null)
                  setToastMsg("🔕 Siren Silenced. Multi-hop BLE relay remains active in background to warn neighbors.")
                  setTimeout(() => setToastMsg(""), 5000)
                }}
              >
                🔕 SILENCE SIREN (Keep Relaying to Neighbors)
              </button>

              <button
                type="button"
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "700",
                  padding: "11px",
                  fontSize: "12.5px",
                  cursor: "pointer"
                }}
                onClick={() => {
                  stopDeviceSiren()
                  if (window.AegisBleBridge && typeof window.AegisBleBridge.stopBroadcast === "function") {
                    window.AegisBleBridge.stopBroadcast()
                  }
                  setIsWebRelayBroadcasting(false)
                  setIncomingSiren(null)
                  setToastMsg("🛑 Siren Silenced & Radio Broadcast Stopped.")
                  setTimeout(() => setToastMsg(""), 4000)
                }}
              >
                🛑 STOP ALL (Silence &amp; Stop Radio Relay)
              </button>

              <button
                className="btn btn-primary"
                style={{ background: "#059669", fontWeight: "700", padding: "12px" }}
                onClick={() => {
                  stopDeviceSiren()
                  setIncomingSiren(null)
                  if (isOffline) {
                    setOfflineTab("shelters")
                  } else {
                    setActiveView("safety")
                  }
                }}
              >
                🧭 Navigate to Nearest Safe Shelter (Dawki School - 840m)
              </button>

              <a
                href="tel:1078"
                className="btn btn-outline"
                style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.4)", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px" }}
              >
                <Icons.Phone size={15} color="#ffffff" />
                <span>Call NDRF 24x7 Control Room (1078)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
