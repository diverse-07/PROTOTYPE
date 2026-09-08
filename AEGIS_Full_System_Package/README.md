# Team AEGIS: NER-LEWS Complete System Package
**Smart India Hackathon 2026 | Problem Statement ID: SIH26001**
*Ministry of Development of North Eastern Region (MDoNER) & Government of India*

---

## 📁 Package Architecture:

```
AEGIS_Full_System_Package/
│
├── app_frontend/            # 📱 Mobile Application (React + Capacitor)
│   ├── src/                 # Pure Mobile Source Code
│   │   ├── App.jsx          # Mobile App (Slider, P2P Mesh, 12 Languages, GPS)
│   │   ├── mobile.css       # Native Mobile App Styling (No cartoon emojis)
│   │   ├── main.jsx         # Entrypoint
│   │   └── api/client.js    # Edge AI + Backend Client
│   ├── public/              # Official AEGIS Logos & Assets
│   ├── package.json
│   ├── vite.config.js
│   └── capacitor.config.json
│
├── website_frontend/        # 💻 Government GIS Web Portal (Desktop Dashboard)
│   ├── src/                 # Pure Web Source Code
│   │   ├── App.jsx          # 16-Zone Map, Live Risk Heatmap, Dispatch Console
│   │   ├── index.css        # Government NIC Navy/Gold Design Theme
│   │   ├── main.jsx         # Entrypoint
│   │   └── api/client.js    # Data Client
│   ├── public/              # Official Assets + Standalone desktop.html
│   ├── package.json
│   └── vite.config.js
│
└── backend/                 # ⚙️ Python FastAPI Async Engine
    ├── main.py              # Application Entrypoint & CORS Middleware
    ├── database.py          # SQLite Engine & SQLAlchemy Session
    ├── models.py            # Relational Schemas (Zone, Alert, Sensor)
    ├── seed.py              # In-situ Sensor Telemetry Seed Data
    ├── requirements.txt     # Dependencies
    └── routers/
        ├── weather.py       # Open-Meteo Live Rainfall Ingestion
        ├── risk.py          # 16-Zone GSI Geotechnical Scoring
        ├── alerts.py        # Sovereign Dispatch & Push Webhooks
        └── analytics.py     # SHAP Feature Weights & Model Metrics
```

---

## 🚀 How to Run the Entire System:

### 1. Run Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*API runs at `http://localhost:8000` | Swagger Docs at `http://localhost:8000/docs`*

### 2. Run Mobile App (Terminal 2)
```bash
cd app_frontend
npm install
npm run dev
```
*Runs at `http://localhost:3000` (Mobile responsive layout, 100% offline-ready)*

### 3. Run Web Portal (Terminal 3)
```bash
cd website_frontend
npm install
npm run dev
```
*Runs at `http://localhost:5173` (Full desktop government GIS control center)*
