# AEGIS REST Backend (FastAPI)

Production-grade asynchronous Python API for the North East Region Landslide Early Warning System.

## Endpoints:
- `GET /api/weather?lat=&lng=` — Live Open-Meteo rainfall & precipitation telemetry with automatic offline edge fallback
- `GET /api/zones` — 16 regional NER hazard zones with 5-tier GSI classification
- `GET /api/risk?lat=&lng=` — Real-time coordinate-level landslide risk evaluation
- `POST /api/alerts/broadcast` — Sovereign multi-channel emergency dispatch order
- `GET /api/analytics/performance` — Model validation metrics (ROC-AUC, Latency, Accuracy)

## Quick Start:
```bash
pip install -r requirements.txt
python main.py
```
Or with uvicorn:
```bash
uvicorn main:app --reload --port 8000
```
Interactive Swagger Docs at `http://localhost:8000/docs`
