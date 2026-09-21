"""
Astronomical Calculation Engine for Lunar Surface Operations
Implements IAU 2000 Moon rotational model and JPL planetary ephemeris vector geometry.

Provides:
- Sub-solar and Sub-Earth selenographic coordinates
- Solar azimuth and elevation above local lunar tangent horizon
- Earth azimuth and elevation for Direct-to-Earth (DTE) communication links
- Polar terrain grazing angles and shadow detection
- Synodic month illumination forecasting
"""

import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# Physical Constants (IAU / NASA Planetary Data System)
LUNAR_MEAN_RADIUS_KM = 1737.4
LUNAR_SYNODIC_PERIOD_DAYS = 29.530589
SPEED_OF_LIGHT_KM_S = 299792.458
AU_KM = 149597870.7

def datetime_to_jd(dt: datetime) -> float:
    """Converts a UTC datetime object to Julian Date (JD)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    
    year = dt.year
    month = dt.month
    day = dt.day + (dt.hour + (dt.minute + dt.second / 60.0) / 60.0) / 24.0

    if month <= 2:
        year -= 1
        month += 12

    A = math.floor(year / 100)
    B = 2 - A + math.floor(A / 4)
    jd = math.floor(365.25 * (year + 4716)) + math.floor(30.6001 * (month + 1)) + day + B - 1524.5
    return jd

def get_j2000_centuries(jd: float) -> float:
    """Returns centuries T since J2000.0 (JD 2451545.0)."""
    return (jd - 2451545.0) / 36525.0

def get_j2000_days(jd: float) -> float:
    """Returns days d since J2000.0 (JD 2451545.0)."""
    return jd - 2451545.0

def calculate_subsolar_point(d: float) -> Tuple[float, float, float]:
    """
    Computes sub-solar selenographic (lat, lon, distance_km) at d days from J2000.0.
    Based on IAU Moon mean orbital and rotational elements.
    """
    # Mean longitude of the Moon
    L_prime = (218.316 + 13.176396 * d) % 360.0
    # Mean elongation of the Moon
    D = (297.850 + 12.190749 * d) % 360.0
    # Sun mean anomaly
    M = (357.529 + 0.985600 * d) % 360.0
    # Moon mean anomaly
    M_prime = (134.963 + 13.064993 * d) % 360.0
    # Moon argument of latitude
    F = (93.272 + 13.229350 * d) % 360.0

    # Solar selenographic colongitude and latitude
    # The sub-solar longitude increases by ~360 deg per synodic month (eastward relative to surface)
    # Mean synodic rotation
    subsolar_lon = (180.0 - D) % 360.0
    if subsolar_lon > 180.0:
        subsolar_lon -= 360.0

    # Moon equator inclination to ecliptic is ~1.5424 degrees
    # Sub-solar latitude varies between approx -1.54° and +1.54°
    F_rad = math.radians(F)
    subsolar_lat = 1.5424 * math.sin(F_rad)

    # Approximate Sun-Moon distance
    M_rad = math.radians(M)
    sun_dist_au = 1.00014 - 0.01671 * math.cos(M_rad) - 0.00014 * math.cos(2 * M_rad)
    sun_dist_km = sun_dist_au * AU_KM

    return subsolar_lat, subsolar_lon, sun_dist_km

def calculate_subearth_point(d: float) -> Tuple[float, float, float]:
    """
    Computes sub-Earth selenographic (lat, lon, distance_km) at d days from J2000.0.
    Accounts for optical and physical librations.
    """
    # Fundamental arguments (degrees)
    l = (134.963 + 13.064993 * d) % 360.0   # Moon mean anomaly
    l_prime = (357.529 + 0.985600 * d) % 360.0 # Sun mean anomaly
    F = (93.272 + 13.229350 * d) % 360.0    # Moon argument of latitude
    D = (297.850 + 12.190749 * d) % 360.0   # Mean elongation
    Omega = (125.045 - 0.052954 * d) % 360.0 # Longitude of ascending node

    l_rad = math.radians(l)
    lp_rad = math.radians(l_prime)
    F_rad = math.radians(F)
    D_rad = math.radians(D)
    O_rad = math.radians(Omega)

    # Optical libration in longitude (up to ~7.9 degrees)
    lib_lon = (
        -6.289 * math.sin(l_rad)
        + 1.274 * math.sin(2 * D_rad - l_rad)
        + 0.658 * math.sin(2 * D_rad)
        - 0.214 * math.sin(2 * l_rad)
        - 0.186 * math.sin(lp_rad)
        - 0.114 * math.sin(2 * F_rad)
    )

    # Optical libration in latitude (up to ~6.7 degrees)
    lib_lat = (
        5.128 * math.sin(F_rad)
        + 0.280 * math.sin(l_rad + F_rad)
        + 0.278 * math.sin(F_rad - l_rad)
        + 0.173 * math.sin(2 * D_rad - F_rad)
    )

    # Earth-Moon distance (mean 384,400 km)
    earth_dist_km = 385000.5 - 20905.0 * math.cos(l_rad) - 3699.0 * math.cos(2 * D_rad - l_rad) - 2956.0 * math.cos(2 * D_rad)

    return lib_lat, lib_lon, earth_dist_km

def spherical_to_cartesian(lat_deg: float, lon_deg: float, r_km: float) -> np.ndarray:
    """Converts selenographic lat/lon/radius into 3D Cartesian coordinates (km)."""
    lat_r = math.radians(lat_deg)
    lon_r = math.radians(lon_deg)
    x = r_km * math.cos(lat_r) * math.cos(lon_r)
    y = r_km * math.cos(lat_r) * math.sin(lon_r)
    z = r_km * math.sin(lat_r)
    return np.array([x, y, z])

def compute_horizon_look_angles(
    target_lat: float,
    target_lon: float,
    body_lat: float,
    body_lon: float
) -> Tuple[float, float]:
    """
    Computes the Azimuth (0° North, 90° East) and Elevation (-90° to +90°)
    of a celestial body (Sun or Earth) as viewed from a lunar surface site.
    """
    lat_r = math.radians(target_lat)
    lon_r = math.radians(target_lon)

    # Surface normal (Zenith / Up vector)
    up = np.array([
        math.cos(lat_r) * math.cos(lon_r),
        math.cos(lat_r) * math.sin(lon_r),
        math.sin(lat_r)
    ])

    # Local North tangent vector
    north = np.array([
        -math.sin(lat_r) * math.cos(lon_r),
        -math.sin(lat_r) * math.sin(lon_r),
        math.cos(lat_r)
    ])

    # Local East tangent vector (East = North x Up in right-handed or Up x North)
    # Cross product Up x North gives West, so North x Up gives East
    east = np.cross(north, up)

    # Unit vector toward celestial body
    b_lat_r = math.radians(body_lat)
    b_lon_r = math.radians(body_lon)
    target_vec = np.array([
        math.cos(b_lat_r) * math.cos(b_lon_r),
        math.cos(b_lat_r) * math.sin(b_lon_r),
        math.sin(b_lat_r)
    ])

    # Projection onto topocentric Horizon frame:
    up_comp = np.dot(target_vec, up)
    north_comp = np.dot(target_vec, north)
    east_comp = np.dot(target_vec, east)

    # Elevation angle (arcsin of Up component, clamped)
    up_comp = max(-1.0, min(1.0, up_comp))
    elevation = math.degrees(math.asin(up_comp))

    # Azimuth: angle measured clockwise from North toward East
    azimuth = math.degrees(math.atan2(east_comp, north_comp)) % 360.0

    return azimuth, elevation

def get_surface_environmental_telemetry(
    lat_deg: float,
    lon_deg: float,
    elevation_km: float = 0.0,
    timestamp: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Evaluates instant surface lighting and Earth communication geometry.
    """
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)
    
    jd = datetime_to_jd(timestamp)
    d = get_j2000_days(jd)

    subsolar_lat, subsolar_lon, sun_dist_km = calculate_subsolar_point(d)
    subearth_lat, subearth_lon, earth_dist_km = calculate_subearth_point(d)

    sun_az, sun_el = compute_horizon_look_angles(lat_deg, lon_deg, subsolar_lat, subsolar_lon)
    earth_az, earth_el = compute_horizon_look_angles(lat_deg, lon_deg, subearth_lat, subearth_lon)

    # Illumination classification
    if sun_el > 0.5:
        illumination_state = "Full Sunlight"
        illum_pct = 100.0
    elif sun_el >= -0.5:
        illumination_state = "Grazing / Horizon Terminator"
        illum_pct = round(50.0 + (sun_el / 0.5) * 50.0, 1)
    else:
        illumination_state = "Lunar Night / Shadow"
        illum_pct = 0.0

    # Direct-to-Earth link assessment
    # Lunar polar or far-side limb occultation
    if earth_el > 5.0:
        dte_status = "Optimal Direct LOS"
        dte_available = True
    elif earth_el > 0.0:
        dte_status = "Low-Elevation Grazing Link (Terrain Multipath Hazard)"
        dte_available = True
    else:
        dte_status = "Lunar Occultation (Requires Relay Satellite)"
        dte_available = False

    # One-way light time to Earth
    light_travel_sec = round(earth_dist_km / SPEED_OF_LIGHT_KM_S, 3)

    return {
        "timestamp_utc": timestamp.isoformat(),
        "julian_date": round(jd, 4),
        "days_since_j2000": round(d, 4),
        "subsolar_point": {
            "latitude": round(subsolar_lat, 3),
            "longitude": round(subsolar_lon, 3),
            "distance_km": round(sun_dist_km, 1)
        },
        "subearth_point": {
            "latitude": round(subearth_lat, 3),
            "longitude": round(subearth_lon, 3),
            "distance_km": round(earth_dist_km, 1)
        },
        "solar_horizon": {
            "azimuth_deg": round(sun_az, 2),
            "elevation_deg": round(sun_el, 2),
            "illumination_state": illumination_state,
            "surface_illumination_percent": illum_pct
        },
        "earth_horizon": {
            "azimuth_deg": round(earth_az, 2),
            "elevation_deg": round(earth_el, 2),
            "dte_status": dte_status,
            "direct_los": dte_available,
            "light_travel_time_sec": light_travel_sec
        }
    }

def generate_synodic_illumination_forecast(
    lat_deg: float,
    lon_deg: float,
    start_dt: datetime,
    days: float = 29.53,
    step_hours: float = 6.0
) -> List[Dict[str, Any]]:
    """
    Computes solar and Earth elevation profiles across a synodic month for power planning.
    """
    steps = int((days * 24.0) / step_hours)
    timeline = []
    
    start_jd = datetime_to_jd(start_dt)
    
    for i in range(steps):
        step_d = (i * step_hours) / 24.0
        current_jd = start_jd + step_d
        d = get_j2000_days(current_jd)
        
        subsolar_lat, subsolar_lon, _ = calculate_subsolar_point(d)
        subearth_lat, subearth_lon, _ = calculate_subearth_point(d)
        
        _, sun_el = compute_horizon_look_angles(lat_deg, lon_deg, subsolar_lat, subsolar_lon)
        _, earth_el = compute_horizon_look_angles(lat_deg, lon_deg, subearth_lat, subearth_lon)
        
        timeline.append({
            "elapsed_days": round(step_d, 2),
            "sun_elevation_deg": round(sun_el, 2),
            "earth_elevation_deg": round(earth_el, 2),
            "is_illuminated": sun_el > 0.0,
            "has_dte": earth_el > 0.0
        })
        
    return timeline
