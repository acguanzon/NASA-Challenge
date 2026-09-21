import React, { useState } from 'react';
import type { CLPSMission } from '../types/mission';
import { Search, Filter, Rocket, MapPin, Compass } from 'lucide-react';

interface MissionFilterBarProps {
  missions: CLPSMission[];
  selectedMission: CLPSMission | null;
  onSelectMission: (mission: CLPSMission) => void;
}

export const MissionFilterBar: React.FC<MissionFilterBarProps> = ({
  missions,
  selectedMission,
  onSelectMission,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'SOUTH_POLE' | 'CONFIRMED'>('ALL');

  // Filter logic
  const filteredMissions = missions.filter((m) => {
    // Search
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchSearch =
        m.lander_name.toLowerCase().includes(s) ||
        m.target_region.toLowerCase().includes(s) ||
        m.vendor.toLowerCase().includes(s) ||
        m.task_order.toLowerCase().includes(s) ||
        m.payload_array.some((p) => p.name.toLowerCase().includes(s) || (p.acronym && p.acronym.toLowerCase().includes(s)));
      if (!matchSearch) return false;
    }

    // Vendor
    if (vendorFilter !== 'ALL' && !m.vendor.toLowerCase().includes(vendorFilter.toLowerCase())) {
      return false;
    }

    // Status
    if (statusFilter !== 'ALL' && m.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    // Special Region
    if (regionFilter === 'SOUTH_POLE' && m.coordinates.latitude > -70) {
      return false;
    }
    if (regionFilter === 'CONFIRMED' && !m.coordinates.is_confirmed) {
      return false;
    }

    return true;
  });

  return (
    <div className="w-full md:w-[360px] h-full bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col shadow-2xl z-20 overflow-hidden text-slate-200">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">CLPS Task Orders</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
            {filteredMissions.length} Missions
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search payload, vendor, region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setRegionFilter(regionFilter === 'SOUTH_POLE' ? 'ALL' : 'SOUTH_POLE')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
              regionFilter === 'SOUTH_POLE'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/60 font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Polar South (&lt;-70°)
          </button>

          <button
            onClick={() => setRegionFilter(regionFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
              regionFilter === 'CONFIRMED'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60 font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Confirmed Landings
          </button>
        </div>

        {/* Vendor Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-slate-400 shrink-0" />
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Commercial Vendors</option>
            <option value="Intuitive Machines">Intuitive Machines</option>
            <option value="Firefly">Firefly Aerospace</option>
            <option value="Astrobotic">Astrobotic</option>
            <option value="Draper">Draper</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="Landed">Landed</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Transit Anomaly">Anomaly</option>
          </select>
        </div>
      </div>

      {/* Mission Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredMissions.map((m) => {
          const isSelected = selectedMission?.mission_id === m.mission_id;
          const latStr = `${Math.abs(m.coordinates.latitude).toFixed(1)}°${m.coordinates.latitude >= 0 ? 'N' : 'S'}`;
          const lonStr = `${Math.abs(m.coordinates.longitude).toFixed(1)}°${m.coordinates.longitude >= 0 ? 'E' : 'W'}`;

          return (
            <div
              key={m.mission_id}
              onClick={() => onSelectMission(m)}
              className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/95 border-cyan-500 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              {/* Active Indicator Strip */}
              {isSelected && <div className="absolute top-0 left-0 bottom-0 w-1 bg-cyan-400" />}

              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                    {m.task_order}
                  </div>
                  <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                    <span>{m.lander_name}</span>
                  </div>
                  <div className="text-xs text-slate-400">{m.vendor}</div>
                </div>

                <span
                  className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    m.status === 'Landed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : m.status === 'Upcoming'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-orange-950 text-orange-300 border border-orange-800'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              {/* Coordinates and Region */}
              <div className="mt-2 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-slate-300 truncate mr-2">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{m.target_region}</span>
                </div>

                <div className="flex items-center gap-1 font-mono text-slate-400 shrink-0">
                  <Compass className="w-3 h-3 text-cyan-500" />
                  <span>{latStr}, {lonStr}</span>
                </div>
              </div>

              {/* Payloads badge */}
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">
                  {m.payload_array.length} SMD Scientific Payloads
                </span>
                <span
                  className={`font-medium ${
                    m.coordinates.is_confirmed ? 'text-emerald-400' : 'text-amber-400/90'
                  }`}
                >
                  {m.coordinates.designation}
                </span>
              </div>
            </div>
          );
        })}

        {filteredMissions.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No CLPS missions match the current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
