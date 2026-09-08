from fastapi import APIRouter

router = APIRouter()

@router.get("/analytics/performance")
def get_performance():
    return {
        "accuracy": 89.3,
        "roc_auc": 0.92,
        "false_positive_rate": 7.2,
        "false_negative_rate": 3.5,
        "sensor_uptime": 98.2,
        "avg_alert_latency_sec": 2.3,
        "sms_delivery_rate": 96.8,
        "citizen_reports_per_day": 12,
        "model": "XGBoost + Random Forest Ensemble",
        "last_retrained": "2026-09-03T00:00:00Z"
    }

@router.get("/analytics/features")
def get_features():
    return [
        {"feature": "24h Rainfall (mm)", "importance": 0.31},
        {"feature": "72h Cumulative Rainfall", "importance": 0.22},
        {"feature": "Slope Angle (degrees)", "importance": 0.18},
        {"feature": "Soil Saturation (%)", "importance": 0.14},
        {"feature": "Lithology / Rock Type", "importance": 0.08},
        {"feature": "Vegetation Cover (NDVI)", "importance": 0.04},
        {"feature": "Active Fault Distance (km)", "importance": 0.03},
    ]