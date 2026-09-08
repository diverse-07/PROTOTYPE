from fastapi import APIRouter

router = APIRouter()

ZONES = [
    {"id":1,"name":"Jaintia Hills","state":"Meghalaya","risk":"CRITICAL","score":87,"lat":25.05,"lng":92.12,"description":"Active thrust zone. Disang shale saturation. NH-44 corridor."},
    {"id":2,"name":"Sohra / Cherrapunji","state":"Meghalaya","risk":"HIGH","score":74,"lat":25.28,"lng":91.72,"description":"World-record rainfall zone. Limestone escarpment failure."},
    {"id":3,"name":"Ri-Bhoi District","state":"Meghalaya","risk":"MODERATE","score":52,"lat":25.75,"lng":91.95,"description":"Sub-Himalayan foothills. Seasonal translational soil slips."},
    {"id":4,"name":"Brahmaputra Valley","state":"Assam","risk":"SAFE","score":18,"lat":26.14,"lng":91.74,"description":"Flat alluvial floodplain. Very low slope gradient."},
    {"id":5,"name":"Barak Valley","state":"Assam","risk":"LOW","score":32,"lat":24.80,"lng":92.75,"description":"Rolling hills. Flash flood risk in monsoon."},
    {"id":6,"name":"North Sikkim","state":"Sikkim","risk":"CRITICAL","score":83,"lat":27.60,"lng":88.45,"description":"Teesta MCT active fault. Glacial moraine instability."},
    {"id":7,"name":"South Sikkim","state":"Sikkim","risk":"MODERATE","score":55,"lat":27.15,"lng":88.45,"description":"Namchi terraced ridges. Sandstone weathering."},
    {"id":8,"name":"Aizawl East","state":"Mizoram","risk":"HIGH","score":71,"lat":23.73,"lng":92.72,"description":"Urban hill cutting. Saturated residential slopes."},
    {"id":9,"name":"Kohima District","state":"Nagaland","risk":"HIGH","score":68,"lat":25.67,"lng":94.11,"description":"NH-29 corridor. Active slope cutting and subsidence."},
    {"id":10,"name":"Tawang District","state":"Arunachal Pradesh","risk":"CRITICAL","score":81,"lat":27.59,"lng":91.86,"description":"High-altitude MCT zone. Permafrost degradation."},
    {"id":11,"name":"Senapati District","state":"Manipur","risk":"MODERATE","score":50,"lat":25.27,"lng":94.02,"description":"Hill district terraced agriculture. Seasonal erosion."},
    {"id":12,"name":"Imphal East","state":"Manipur","risk":"SAFE","score":15,"lat":24.82,"lng":93.95,"description":"Loktak basin floor. Flat stable alluvium."},
    {"id":13,"name":"Agartala Plains","state":"Tripura","risk":"SAFE","score":12,"lat":23.83,"lng":91.28,"description":"Flat river basin. Very stable terrain."},
    {"id":14,"name":"Mon District","state":"Nagaland","risk":"LOW","score":29,"lat":26.73,"lng":94.94,"description":"Forested gentle slopes. Low historical slide frequency."},
    {"id":15,"name":"Lunglei District","state":"Mizoram","risk":"MODERATE","score":48,"lat":22.88,"lng":92.74,"description":"Longitudinal valley ridges. Moderate saturation risk."},
    {"id":16,"name":"Itanagar Capital","state":"Arunachal Pradesh","risk":"MODERATE","score":45,"lat":27.08,"lng":93.60,"description":"Tertiary sandstone hills. Urban slope cutting."},
]

@router.get("/zones")
def get_zones():
    return ZONES

@router.get("/risk")
def get_risk(lat: float = 26.14, lng: float = 91.74):
    import math
    nearest = min(ZONES, key=lambda z: math.sqrt((z["lat"]-lat)**2+(z["lng"]-lng)**2))
    return {"lat":lat,"lng":lng,"nearest_zone":nearest["name"],"risk":nearest["risk"],"score":nearest["score"],"description":nearest["description"]}