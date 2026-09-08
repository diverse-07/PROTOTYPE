from fastapi import APIRouter
import httpx

router = APIRouter()

@router.get("/weather")
async def get_weather(lat: float = 26.14, lng: float = 91.74):
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}"
            f"&current=temperature_2m,precipitation,windspeed_10m,weathercode"
            f"&hourly=precipitation&forecast_days=1&timezone=Asia/Kolkata"
        )
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(url)
            data = r.json()
        cur = data.get("current", {})
        rain = cur.get("precipitation", 0)
        temp = cur.get("temperature_2m", 22)
        wind = cur.get("windspeed_10m", 8)
        return {
            "lat": lat, "lng": lng,
            "temperature": temp,
            "precipitation": rain,
            "wind": wind,
            "safe_zone": rain < 50,
            "source": "Open-Meteo Live"
        }
    except Exception:
        return {
            "lat": lat, "lng": lng,
            "temperature": 22.5,
            "precipitation": 12.3,
            "wind": 8.1,
            "safe_zone": True,
            "source": "Mock (Open-Meteo unavailable)"
        }