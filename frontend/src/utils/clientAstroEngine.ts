import type { AstroTelemetry, ForecastPoint } from '../types/mission';

/**
 * Client-Side IAU 2000 Moon Ephemeris & Horizon Engine
 * Provides immediate instant calculations synchronized with the FastAPI backend.
 */

export function computeClientTelemetry(
  lat: number,
  lon: number,
  date: Date
): AstroTelemetry {
  // Julian Date calculation
  const time = date.getTime();
  const jd = time / 86400000 + 2440587.5;
  const d = jd - 2451545.0; // days since J2000.0

  // Subsolar point (IAU model)
  const D = (297.850 + 12.190749 * d) % 360.0;
  const F = (93.272 + 13.229350 * d) % 360.0;
  let subsolarLon = (180.0 - D) % 360.0;
  if (subsolarLon > 180.0) subsolarLon -= 360.0;
  const subsolarLat = 1.5424 * Math.sin((F * Math.PI) / 180.0);

  // Subearth point (librations)
  const l = (134.963 + 13.064993 * d) % 360.0;
  const lRad = (l * Math.PI) / 180.0;
  const dRad = (D * Math.PI) / 180.0;
  const fRad = (F * Math.PI) / 180.0;

  const libLon = -6.289 * Math.sin(lRad) + 1.274 * Math.sin(2 * dRad - lRad) + 0.658 * Math.sin(2 * dRad);
  const libLat = 5.128 * Math.sin(fRad) + 0.280 * Math.sin(lRad + fRad);

  // Horizon Look Angles
  const [sunAz, sunEl] = computeLookAngles(lat, lon, subsolarLat, subsolarLon);
  const [earthAz, earthEl] = computeLookAngles(lat, lon, libLat, libLon);

  let illumState = 'Full Sunlight';
  let illumPct = 100.0;
  if (sunEl > 0.5) {
    illumState = 'Full Sunlight';
    illumPct = 100.0;
  } else if (sunEl >= -0.5) {
    illumState = 'Grazing / Horizon Terminator';
    illumPct = Math.round(50.0 + (sunEl / 0.5) * 50.0);
  } else {
    illumState = 'Lunar Night / Shadow';
    illumPct = 0.0;
  }

  let dteStatus = 'Optimal Direct LOS';
  let directLos = true;
  if (earthEl > 5.0) {
    dteStatus = 'Optimal Direct LOS';
    directLos = true;
  } else if (earthEl > 0.0) {
    dteStatus = 'Low-Elevation Grazing Link (Terrain Multipath Hazard)';
    directLos = true;
  } else {
    dteStatus = 'Lunar Occultation (Requires Relay Satellite)';
    directLos = false;
  }

  return {
    timestamp_utc: date.toISOString(),
    julian_date: Number(jd.toFixed(4)),
    days_since_j2000: Number(d.toFixed(4)),
    subsolar_point: {
      latitude: Number(subsolarLat.toFixed(3)),
      longitude: Number(subsolarLon.toFixed(3)),
      distance_km: 149597870.7,
    },
    subearth_point: {
      latitude: Number(libLat.toFixed(3)),
      longitude: Number(libLon.toFixed(3)),
      distance_km: 384400.0,
    },
    solar_horizon: {
      azimuth_deg: Number(sunAz.toFixed(2)),
      elevation_deg: Number(sunEl.toFixed(2)),
      illumination_state: illumState,
      surface_illumination_percent: illumPct,
    },
    earth_horizon: {
      azimuth_deg: Number(earthAz.toFixed(2)),
      elevation_deg: Number(earthEl.toFixed(2)),
      dte_status: dteStatus,
      direct_los: directLos,
      light_travel_time_sec: 1.282,
    },
  };
}

function computeLookAngles(
  tLat: number,
  tLon: number,
  bLat: number,
  bLon: number
): [number, number] {
  const latR = (tLat * Math.PI) / 180;
  const lonR = (tLon * Math.PI) / 180;

  const up = [
    Math.cos(latR) * Math.cos(lonR),
    Math.cos(latR) * Math.sin(lonR),
    Math.sin(latR),
  ];

  const north = [
    -Math.sin(latR) * Math.cos(lonR),
    -Math.sin(latR) * Math.sin(lonR),
    Math.cos(latR),
  ];

  // East = North x Up
  const east = [
    north[1] * up[2] - north[2] * up[1],
    north[2] * up[0] - north[0] * up[2],
    north[0] * up[1] - north[1] * up[0],
  ];

  const bLatR = (bLat * Math.PI) / 180;
  const bLonR = (bLon * Math.PI) / 180;
  const targetVec = [
    Math.cos(bLatR) * Math.cos(bLonR),
    Math.cos(bLatR) * Math.sin(bLonR),
    Math.sin(bLatR),
  ];

  const upComp = targetVec[0] * up[0] + targetVec[1] * up[1] + targetVec[2] * up[2];
  const northComp = targetVec[0] * north[0] + targetVec[1] * north[1] + targetVec[2] * north[2];
  const eastComp = targetVec[0] * east[0] + targetVec[1] * east[1] + targetVec[2] * east[2];

  const clampedUp = Math.max(-1.0, Math.min(1.0, upComp));
  const elevation = (Math.asin(clampedUp) * 180) / Math.PI;
  let azimuth = (Math.atan2(eastComp, northComp) * 180) / Math.PI;
  if (azimuth < 0) azimuth += 360;

  return [azimuth, elevation];
}

export function computeClientForecast(lat: number, lon: number, startDate: Date): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  const totalDays = 29.53;
  const steps = 60; // every ~12 hours

  for (let i = 0; i <= steps; i++) {
    const elapsedDays = (i / steps) * totalDays;
    const date = new Date(startDate.getTime() + elapsedDays * 24 * 3600 * 1000);
    const telem = computeClientTelemetry(lat, lon, date);
    points.push({
      elapsed_days: Number(elapsedDays.toFixed(2)),
      sun_elevation_deg: telem.solar_horizon.elevation_deg,
      earth_elevation_deg: telem.earth_horizon.elevation_deg,
      is_illuminated: telem.solar_horizon.elevation_deg > 0,
      has_dte: telem.earth_horizon.direct_los,
    });
  }
  return points;
}
