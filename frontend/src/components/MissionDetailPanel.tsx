import React, { useState } from 'react';
import type { CLPSMission, AstroTelemetry, ForecastPoint } from '../types/mission';
import { TelemetryGauges } from './TelemetryGauges';
import {
  X,
  Rocket,
  Compass,
  Layers,
  Cpu,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Activity,
  TrendingUp,
} from 'lucide-react';

interface MissionDetailPanelProps {
  mission: CLPSMission;
  onClose: () => void;
  telemetry: AstroTelemetry | null;
  forecast: ForecastPoint[];
}

export const MissionDetailPanel: React.FC<MissionDetailPanelProps> = ({
  mission,
  onClose,
  telemetry,
  forecast,
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'payloads' | 'specs'>('telemetry');

  // Format coordinates to standard planetary notation
  const latStr = `${Math.abs(mission.coordinates.latitude).toFixed(2)}° ${mission.coordinates.latitude >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(mission.coordinates.longitude).toFixed(2)}° ${mission.coordinates.longitude >= 0 ? 'E' : 'W'}`;

  return (
    <aside
      aria-label="Mission Details"
      className="w-full md:w-[460px] h-full bg-slate-900/90 backdrop-blur-xl border-l border-slate-800 flex flex-col shadow-2xl z-20 overflow-hidden text-slate-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Drawer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
            {mission.task_order}
          </span>
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
              mission.status === 'Landed'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : mission.status === 'Upcoming'
                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                : 'bg-orange-950 text-orange-300 border border-orange-800'
            }`}
          >
            {mission.status}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {mission.lander_name}
        </h2>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
          <span className="font-semibold text-slate-300">{mission.vendor}</span>
          <span>•</span>
          <span>{mission.target_region}</span>
        </div>

        {/* Standard Planetary Coordinates Banner */}
        <div className="mt-3 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Planetary Landing Coordinates:</span>
            </span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                mission.coordinates.is_confirmed
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 flex items-center gap-1'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/50 flex items-center gap-1'
              }`}
            >
              {mission.coordinates.is_confirmed ? (
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400" />
              )}
              <span>{mission.coordinates.designation}</span>
            </span>
          </div>

          <div className="font-mono text-cyan-300 font-semibold tracking-wide flex items-center justify-between">
            <span>{latStr}, {lonStr}</span>
            <span className="text-slate-400 text-[11px]">
              {mission.coordinates.elevation_km >= 0 ? '+' : ''}
              {mission.coordinates.elevation_km.toFixed(2)} km
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 text-xs font-medium bg-slate-950/20">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'telemetry'
              ? 'border-cyan-500 text-cyan-400 font-semibold bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Telemetry & Horizon</span>
        </button>

        <button
          onClick={() => setActiveTab('payloads')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'payloads'
              ? 'border-cyan-500 text-cyan-400 font-semibold bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Payloads ({mission.payload_array.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('specs')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'specs'
              ? 'border-cyan-500 text-cyan-400 font-semibold bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Specs & Avionics</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: TELEMETRY & HORIZON */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            {/* Overview Summary */}
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
              {mission.summary}
            </p>

            {/* Real-Time Horizon Gauges */}
            <TelemetryGauges telemetry={telemetry} coordinates={mission.coordinates} />

            {/* 29.5-Day Synodic Solar Elevation Forecast Chart */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>29.5-Day Synodic Solar Elevation Profile</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Diurnal Cycle</span>
              </div>

              {forecast.length > 0 ? (
                <div className="mt-3">
                  {/* Miniature SVG Curve */}
                  <div className="h-28 w-full bg-slate-950/80 rounded-lg p-2 border border-slate-800/60 relative flex flex-col justify-end">
                    {/* Horizon 0° reference line */}
                    <div className="absolute left-2 right-2 top-1/2 border-b border-dashed border-slate-600/70 pointer-events-none" />
                    <div className="absolute right-3 top-[46%] text-[9px] font-mono text-slate-400">
                      0° Horizon
                    </div>

                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 60">
                      <defs>
                        <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Line Points */}
                      {(() => {
                        const minEl = -20;
                        const maxEl = 90;
                        const points = forecast
                          .map((pt, idx) => {
                            const x = (idx / (forecast.length - 1)) * 100;
                            // Map elevation to y: minEl -> 60, maxEl -> 0
                            const y = 60 - ((pt.sun_elevation_deg - minEl) / (maxEl - minEl)) * 60;
                            return `${x},${y}`;
                          })
                          .join(' ');

                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="1.8"
                              points={points}
                            />
                          </>
                        );
                      })()}
                    </svg>

                    <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                      <span>Day 0</span>
                      <span>Day 15 (Solar Noon)</span>
                      <span>Day 29.5 (Night)</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-2">
                    Shows solar incidence angle above the local tangent plane over one full lunar day/night cycle.
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-500 py-4">
                  Loading lunar synodic cycle ephemeris...
                </div>
              )}
            </div>

            {/* Launch / Landing Dates */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div className="text-slate-400 text-[10px] flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  <span>Launch Date</span>
                </div>
                <div className="font-mono text-slate-200">
                  {mission.launch_date ? new Date(mission.launch_date).toLocaleDateString() : 'TBD'}
                </div>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div className="text-slate-400 text-[10px] flex items-center gap-1 mb-0.5">
                  <Rocket className="w-3 h-3 text-emerald-400" />
                  <span>Landing Date</span>
                </div>
                <div className="font-mono text-slate-200">
                  {mission.landing_date ? new Date(mission.landing_date).toLocaleDateString() : 'TBD'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCIENTIFIC PAYLOADS */}
        {activeTab === 'payloads' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              NASA Science Mission Directorate (SMD) & commercial research instruments manifest:
            </div>

            {mission.payload_array.map((p) => (
              <div
                key={p.payload_id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 backdrop-blur-sm space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {p.acronym && (
                        <span className="bg-cyan-950 text-cyan-300 font-mono text-[10px] px-1.5 py-0.2 rounded border border-cyan-800/60">
                          {p.acronym}
                        </span>
                      )}
                      <span>{p.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.agency_or_institution}</div>
                  </div>
                  {p.mass_kg && (
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 shrink-0">
                      {p.mass_kg} kg
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
                  {p.objective}
                </p>

                <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider">
                  Category: {p.instrument_type}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: LANDER SPECS & AVIONICS */}
        {activeTab === 'specs' && (
          <div className="space-y-3">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Flight Platform Architecture</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/50">
                  <div className="text-slate-400 text-[10px]">Propulsion System</div>
                  <div className="font-medium text-slate-200 mt-0.5">{mission.lander_specs.propellant || 'N/A'}</div>
                </div>

                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/50">
                  <div className="text-slate-400 text-[10px]">Payload Mass Capacity</div>
                  <div className="font-medium text-slate-200 mt-0.5">
                    {mission.lander_specs.payload_capacity_kg ? `${mission.lander_specs.payload_capacity_kg} kg` : 'N/A'}
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/50">
                  <div className="text-slate-400 text-[10px]">Solar Power Generation</div>
                  <div className="font-medium text-slate-200 mt-0.5">
                    {mission.lander_specs.power_generation_w ? `${mission.lander_specs.power_generation_w} W` : 'N/A'}
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/50">
                  <div className="text-slate-400 text-[10px]">Dimensions (H × Ø)</div>
                  <div className="font-medium text-slate-200 mt-0.5">
                    {mission.lander_specs.height_m}m × {mission.lander_specs.diameter_m}m
                  </div>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-950/60 border border-slate-800/50 mt-2 text-[11px]">
                <div className="text-slate-400 text-[10px]">RF Telemetry & Communications</div>
                <div className="font-medium text-cyan-300 mt-0.5">{mission.lander_specs.primary_comms || 'Deep Space Network compatible'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
