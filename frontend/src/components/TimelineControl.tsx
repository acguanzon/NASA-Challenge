import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Moon } from 'lucide-react';

interface TimelineControlProps {
  currentDate: Date;
  onChangeDate: (date: Date) => void;
  isLive: boolean;
  onToggleLive: () => void;
}

export const TimelineControl: React.FC<TimelineControlProps> = ({
  currentDate,
  onChangeDate,
  isLive,
  onToggleLive,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier] = useState(12); // hours per tick

  // Playback timer loop: increments time by 6 hours every 800ms
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onChangeDate(new Date(currentDate.getTime() + speedMultiplier * 3600 * 1000));
    }, 600);
    return () => clearInterval(interval);
  }, [isPlaying, currentDate, onChangeDate, speedMultiplier]);

  // Handle manual range scrub (range: -15 to +15 days relative to now)
  const now = new Date();
  const diffDays = (currentDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const daysOffset = parseFloat(e.target.value);
    const newDate = new Date(now.getTime() + daysOffset * 24 * 3600 * 1000);
    onChangeDate(newDate);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 px-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 text-xs text-slate-200">
      {/* Time Mode and Play/Pause */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (isLive) onToggleLive();
            setIsPlaying(!isPlaying);
          }}
          className={`p-2 rounded-xl border transition-all ${
            isPlaying
              ? 'bg-amber-600/30 text-amber-300 border-amber-500/60'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title={isPlaying ? 'Pause orbital timeline' : 'Play time-lapse (advance terminator)'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onToggleLive();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all font-mono font-semibold ${
            isLive
              ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/60 shadow-md shadow-cyan-950'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
          }`}
          title="Sync with real-time current UTC"
        >
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
          <span>LIVE NOW</span>
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onChangeDate(new Date());
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Reset to current moment"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Date & UTC Readout */}
      <div className="flex items-center gap-3 font-mono bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>UTC: {currentDate.toISOString().replace('T', ' ').slice(0, 19)}Z</span>
        </div>
        <div className="text-slate-500 hidden sm:block">|</div>
        <div className="text-slate-400 hidden sm:flex items-center gap-1">
          <Moon className="w-3.5 h-3.5 text-amber-400" />
          <span>Offset: {diffDays > 0 ? `+${diffDays.toFixed(1)}` : diffDays.toFixed(1)} d</span>
        </div>
      </div>

      {/* Synodic Month Timeline Slider */}
      <div className="flex-1 min-w-[200px] flex items-center gap-3">
        <span className="text-[10px] font-mono text-slate-400 shrink-0">-15d</span>
        <input
          type="range"
          min="-15"
          max="15"
          step="0.25"
          value={diffDays}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <span className="text-[10px] font-mono text-slate-400 shrink-0">+15d</span>
      </div>
    </div>
  );
};
