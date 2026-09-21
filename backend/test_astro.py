"""
Automated Unit Tests for CLPS Lunar Ephemeris & Mission Catalog
"""

import math
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from backend.astro_engine import (
    datetime_to_jd,
    get_j2000_days,
    calculate_subsolar_point,
    calculate_subearth_point,
    compute_horizon_look_angles,
    get_surface_environmental_telemetry,
    LUNAR_MEAN_RADIUS_KM
)
from backend.missions_db import get_all_missions, get_mission_by_id
from backend.main import app

client = TestClient(app)

def test_j2000_epoch_julian_date():
    # J2000.0 epoch is 2000-01-01 12:00:00 UTC -> JD 2451545.0
    dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    jd = datetime_to_jd(dt)
    assert math.isclose(jd, 2451545.0, abs_tol=1e-4)
    d = get_j2000_days(jd)
    assert math.isclose(d, 0.0, abs_tol=1e-4)

def test_subsolar_latitude_bounds():
    # Moon's tilt to ecliptic is ~1.54°, so subsolar latitude should never exceed ~1.6°
    for day in range(0, 365, 30):
        lat, lon, dist = calculate_subsolar_point(float(day))
        assert -1.6 <= lat <= 1.6
        assert -180.0 <= lon <= 180.0
        assert 1.4e8 <= dist <= 1.6e8  # AU in km

def test_subearth_libration_bounds():
    # Optical librations bound subearth point to approximately [-8°, +8°] in lon and [-7°, +7°] in lat
    for day in range(0, 365, 15):
        lib_lat, lib_lon, dist = calculate_subearth_point(float(day))
        assert -8.5 <= lib_lat <= 8.5
        assert -10.0 <= lib_lon <= 10.0
        assert 350000.0 <= dist <= 410000.0

def test_polar_horizon_look_angles():
    # At South pole (-90°), any subsolar point with lat ~ 0° should have Sun near 0° elevation
    az, el = compute_horizon_look_angles(target_lat=-89.9, target_lon=0.0, body_lat=0.0, body_lon=0.0)
    assert math.isclose(el, 0.1, abs_tol=1.0)

def test_clps_catalog_missions():
    missions = get_all_missions()
    assert len(missions) >= 7
    im1 = get_mission_by_id("TO-2-IM-1")
    assert im1 is not None
    assert im1.vendor == "Intuitive Machines"
    assert im1.lander_name.startswith("Nova-C")
    assert im1.coordinates.latitude < -80.0  # Malapert A is ~ -80.13
    assert im1.coordinates.is_confirmed is True
    assert len(im1.payload_array) >= 5

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"

def test_api_missions_list():
    res = client.get("/api/missions")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 7

def test_api_missions_filter_vendor():
    res = client.get("/api/missions?vendor=Firefly")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["vendor"] == "Firefly Aerospace"

def test_api_telemetry_post():
    payload = {
        "latitude": -80.13,
        "longitude": 1.44,
        "elevation_km": -3.2,
        "timestamp_utc": "2024-02-23T00:00:00Z"
    }
    res = client.post("/api/astro/telemetry", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "solar_horizon" in data
    assert "earth_horizon" in data
    assert "azimuth_deg" in data["solar_horizon"]
    assert "elevation_deg" in data["solar_horizon"]

def test_api_forecast():
    res = client.get("/api/astro/forecast/TO-2-IM-1?days=5")
    assert res.status_code == 200
    data = res.json()
    assert data["mission_id"] == "TO-2-IM-1"
    assert len(data["forecast_points"]) > 0

if __name__ == "__main__":
    pytest.main(["-v", "backend/test_astro.py"])
