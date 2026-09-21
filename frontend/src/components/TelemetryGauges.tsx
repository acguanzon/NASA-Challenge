import React from 'react';
import type { AstroTelemetry, LunarCoordinate } from '../types/mission';
import { Sun, Radio, Mountain, Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface TelemetryGaugesProps {
  telemetry: AstroTelemetry | null;
  coordinates: LunarCoordinate;
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ telemetry, coordinates }) => {
  if (!telemetry) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
        Calculating ephemeris horizon look angles...
      </div>
    );
  }

  const { solar_horizon, earth_horizon } = telemetry;
  const isSunVisible = solar_horizon.elevation_deg > 0;
  const isDTE = earth_horizon.direct_los;
  const isPolar = Math.abs(coordinates.latitude) > 75;

  return (
    <div className="space-y-3">
      {/* 1. Solar Illumination Gauge */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isSunVisible ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Solar Horizon & Power</div>
              <div className="text-[10px] text-slate-400">Solar Tangent Plane Look Angles</div>
            </div>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
              solar_horizon.elevation_deg > 0.5
                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                : solar_horizon.elevation_deg >= -0.5
                ? 'bg-yellow-950/70 text-yellow-300 border border-yellow-800/60'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {solar_horizon.illumination_state}
          </span>
        </div>

        {/* Elevation & Azimuth Readouts */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60">
          <div>
            <div className="text-[10px] text-slate-400">Sun Elevation</div>
            <div className="text-sm font-mono font-bold text-amber-400">
              {solar_horizon.elevation_deg > 0 ? '+' : ''}
              {solar_horizon.elevation_deg.toFixed(2)}°
            </div>
            <div className="text-[9px] text-slate-500">Above local horizon</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">Sun Azimuth</div>
            <div className="text-sm font-mono font-bold text-slate-200">
              {solar_horizon.azimuth_deg.toFixed(1)}°
            </div>
            <div className="text-[9px] text-slate-500">0° North, 90° East</div>
          </div>
        </div>

        {/* Illumination Percentage Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-400">Estimated Photovoltaic Flux</span>
            <span className="font-mono text-amber-300 font-semibold">{solar_horizon.surface_illumination_percent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, solar_horizon.surface_illumination_percent))}%` }}
            />
          </div>
        </div>

        {isPolar && (
          <div className="mt-2 text-[10px] text-amber-300/90 flex items-center gap-1.5 bg-amber-950/30 p-1.5 rounded-lg border border-amber-900/40">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>High Polar Latitude: Long shadow cast from crater rims and peaks of eternal light.</span>
          </div>
        )}
      </div>

      {/* 2. Direct-To-Earth (DTE) Telecom Link Gauge */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDTE ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'}`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Direct-To-Earth (DTE) Comms</div>
              <div className="text-[10px] text-slate-400">Deep Space Network Line of Sight</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isDTE ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                <Wifi className="w-3 h-3" />
                <span>ACTIVE LOS</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-red-950/70 text-red-300 border border-red-800/60">
                <WifiOff className="w-3 h-3" />
                <span>OCCULTED</span>
              </span>
            )}
          </div>
        </div>

        {/* DTE Readout */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60">
          <div>
            <div className="text-[10px] text-slate-400">Earth Elevation</div>
            <div className={`text-sm font-mono font-bold ${isDTE ? 'text-cyan-400' : 'text-red-400'}`}>
              {earth_horizon.elevation_deg > 0 ? '+' : ''}
              {earth_horizon.elevation_deg.toFixed(2)}°
            </div>
            <div className="text-[9px] text-slate-500">{earth_horizon.dte_status}</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">Earth Azimuth</div>
            <div className="text-sm font-mono font-bold text-slate-200">
              {earth_horizon.azimuth_deg.toFixed(1)}°
            </div>
            <div className="text-[9px] text-slate-500">Antenna Pointing Angle</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 text-[10px] bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>One-Way Light Delay:</span>
          </span>
          <span className="font-mono text-cyan-300 font-bold">
            {earth_horizon.light_travel_time_sec.toFixed(3)} s
          </span>
        </div>
      </div>

      {/* 3. Surface Elevation Metric */}
      <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800/60 rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Mountain className="w-3.5 h-3.5 text-slate-400" />
          <span>LOLA Topographic Elevation:</span>
        </div>
        <span className="font-mono font-semibold text-slate-200">
          {coordinates.elevation_km > 0 ? `+${coordinates.elevation_km.toFixed(2)}` : coordinates.elevation_km.toFixed(2)} km
          <span className="text-[10px] text-slate-500 ml-1">(rel. 1737.4 km)</span>
        </span>
      </div>
    </div>
  );
};
