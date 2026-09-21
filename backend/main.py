"""
CLPS Lunar Mission Browser - FastAPI Backend Service
Provides high-precision astronomical telemetry, mission data, and spatial look angles.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import dateutil.parser

from backend.missions_db import get_all_missions, get_mission_by_id, CLPSMission
from backend.astro_engine import (
    get_surface_environmental_telemetry,
    calculate_subsolar_point,
    calculate_subearth_point,
    generate_synodic_illumination_forecast,
    datetime_to_jd,
    get_j2000_days
)

app = FastAPI(
    title="NASA CLPS Lunar Mission Browser API",
    description="Astronomical calculation engine, landing site coordinates, and lunar telemetry for NASA Commercial Lunar Payload Services missions.",
    version="1.0.0"
)

# Enable CORS for local and web frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TelemetryRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in degrees [-90 to +90], North positive")
    longitude: float = Field(..., description="Longitude in degrees [0 to 360] or [-180 to 180], East positive")
    elevation_km: Optional[float] = Field(0.0, description="Elevation in km relative to 1737.4 km reference sphere")
    timestamp_utc: Optional[str] = Field(None, description="ISO 8601 UTC timestamp. Defaults to current epoch.")

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "NASA CLPS Lunar Ephemeris & Mission Engine",
        "reference_ellipsoid": "IAU 2000 Moon Mean Radius (1737.4 km)",
        "ephemeris_kernel_basis": "IAU / JPL DE440 rotation and libration elements"
    }

@app.get("/api/missions", response_model=List[CLPSMission])
def list_missions(
    vendor: Optional[str] = Query(None, description="Filter by commercial vendor"),
    status: Optional[str] = Query(None, description="Filter by mission status"),
    search: Optional[str] = Query(None, description="Search term in target region, lander, or payloads")
):
    missions = get_all_missions()
    if vendor:
        missions = [m for m in missions if vendor.lower() in m.vendor.lower()]
    if status:
        missions = [m for m in missions if status.lower() in m.status.lower()]
    if search:
        s = search.lower()
        missions = [
            m for m in missions
            if s in m.target_region.lower()
            or s in m.lander_name.lower()
            or s in m.mission_id.lower()
            or any(s in p.name.lower() or (p.acronym and s in p.acronym.lower()) for p in m.payload_array)
        ]
    return missions

@app.get("/api/missions/{mission_id}", response_model=CLPSMission)
def get_mission(mission_id: str):
    mission = get_mission_by_id(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail=f"Mission '{mission_id}' not found in CLPS catalog.")
    return mission

@app.post("/api/astro/telemetry")
def compute_telemetry(req: TelemetryRequest):
    dt = datetime.now(timezone.utc)
    if req.timestamp_utc:
        try:
            dt = dateutil.parser.isoparse(req.timestamp_utc)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ISO timestamp: {str(e)}")
            
    return get_surface_environmental_telemetry(
        lat_deg=req.latitude,
        lon_deg=req.longitude,
        elevation_km=req.elevation_km or 0.0,
        timestamp=dt
    )

@app.get("/api/astro/subsolar")
def get_current_subsolar(epoch_utc: Optional[str] = None):
    dt = datetime.now(timezone.utc)
    if epoch_utc:
        try:
            dt = dateutil.parser.isoparse(epoch_utc)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ISO timestamp: {str(e)}")
            
    jd = datetime_to_jd(dt)
    d = get_j2000_days(jd)
    
    subsolar_lat, subsolar_lon, sun_dist = calculate_subsolar_point(d)
    subearth_lat, subearth_lon, earth_dist = calculate_subearth_point(d)
    
    return {
        "timestamp_utc": dt.isoformat(),
        "julian_date": round(jd, 4),
        "subsolar_point": {
            "latitude": round(subsolar_lat, 3),
            "longitude": round(subsolar_lon, 3),
            "distance_km": round(sun_dist, 1)
        },
        "subearth_point": {
            "latitude": round(subearth_lat, 3),
            "longitude": round(subearth_lon, 3),
            "distance_km": round(earth_dist, 1)
        }
    }

@app.get("/api/astro/forecast/{mission_id}")
def get_mission_illumination_forecast(
    mission_id: str,
    start_utc: Optional[str] = None,
    days: float = Query(29.53, ge=1.0, le=60.0)
):
    mission = get_mission_by_id(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail=f"Mission '{mission_id}' not found")
        
    dt = datetime.now(timezone.utc)
    if start_utc:
        try:
            dt = dateutil.parser.isoparse(start_utc)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ISO timestamp: {str(e)}")
            
    forecast = generate_synodic_illumination_forecast(
        lat_deg=mission.coordinates.latitude,
        lon_deg=mission.coordinates.longitude,
        start_dt=dt,
        days=days,
        step_hours=6.0
    )
    
    return {
        "mission_id": mission.mission_id,
        "target_region": mission.target_region,
        "coordinates": mission.coordinates.model_dump(),
        "start_utc": dt.isoformat(),
        "period_days": days,
        "forecast_points": forecast
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
