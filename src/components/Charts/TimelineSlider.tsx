import React, { useMemo } from 'react';
import { getDaysBetween } from '../../utils/analytics';
import { Calendar, History, ArrowRight } from 'lucide-react';

interface TimelineSliderProps {
  inceptionDate: string; // Oldest history (left edge)
  currentDate?: string;  // Current time (fixed right edge, defaults to today)
  selectedStartDate: string; // The start date selected by the left adjustable dot
  onStartDateChange: (startDate: string) => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  inceptionDate,
  currentDate = new Date().toISOString().split('T')[0],
  selectedStartDate,
  onStartDateChange,
}) => {
  // Ensure inceptionDate is earlier than currentDate
  const totalDays = useMemo(() => {
    return Math.max(1, getDaysBetween(inceptionDate, currentDate));
  }, [inceptionDate, currentDate]);

  // Days from inception to selectedStartDate
  const offsetDays = useMemo(() => {
    const incTime = new Date(inceptionDate).getTime();
    const selTime = new Date(selectedStartDate).getTime();
    const diff = Math.max(0, selTime - incTime);
    return Math.min(totalDays, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, [inceptionDate, selectedStartDate, totalDays]);

  // Selected percentage (0% = inceptionDate far left, 100% = currentDate far right)
  const leftPercent = Math.min(100, Math.max(0, (offsetDays / totalDays) * 100));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value);
    const targetDaysOffset = Math.round((pct / 100) * totalDays);

    const d = new Date(inceptionDate);
    d.setDate(d.getDate() + targetDaysOffset);

    // Prevent passing currentDate
    const maxDate = new Date(currentDate);
    if (d > maxDate) {
      d.setTime(maxDate.getTime());
    }

    const formatted = d.toISOString().split('T')[0];
    onStartDateChange(formatted);
  };

  // Quick preset shortcuts
  const handlePreset = (daysBack: number | 'all') => {
    if (daysBack === 'all') {
      onStartDateChange(inceptionDate);
      return;
    }
    const end = new Date(currentDate);
    end.setDate(end.getDate() - daysBack);
    const inc = new Date(inceptionDate);
    const chosen = end < inc ? inc : end;
    onStartDateChange(chosen.toISOString().split('T')[0]);
  };

  const daysFiltered = getDaysBetween(selectedStartDate, currentDate);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Chronological Timeline Window</span>
          <span className="text-[11px] text-slate-500 font-mono">
            ({daysFiltered} days active)
          </span>
        </div>

        {/* Selected Range Display */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-semibold">
            {selectedStartDate}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {currentDate} (Now)
          </span>
        </div>
      </div>

      {/* Two-Dot Visual Slider Container */}
      <div className="relative pt-2 pb-1">
        {/* Track Background */}
        <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
          {/* Active Highlight Range (From adjustable left dot to fixed right dot) */}
          <div
            className="absolute top-0 bottom-0 bg-indigo-600/40 border-y border-indigo-500/60 transition-all duration-75"
            style={{
              left: `${leftPercent}%`,
              right: '0%',
            }}
          />
        </div>

        {/* Range Input for Left Dot */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.5"
          value={leftPercent}
          onChange={handleSliderChange}
          className="absolute top-2 left-0 w-full h-3 opacity-0 cursor-ew-resize z-20"
          title="Drag to adjust start date"
        />

        {/* Visual Left Dot (Adjustable) */}
        <div
          className="absolute top-1 -ml-2.5 w-5 h-5 rounded-full bg-indigo-500 border-2 border-white shadow-lg pointer-events-none z-10 transition-all duration-75 flex items-center justify-center ring-2 ring-indigo-500/30"
          style={{ left: `${leftPercent}%` }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>

        {/* Visual Right Dot (Fixed to Current Time) */}
        <div
          className="absolute top-1 right-0 -mr-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg pointer-events-none z-10 flex items-center justify-center ring-2 ring-emerald-500/30"
          title="Current Time (Fixed)"
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </div>
      </div>

      {/* Timeline Labels: Oldest history far left, Current time far right */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
        <div className="flex flex-col items-start">
          <span className="text-slate-400 font-medium">← Oldest History</span>
          <span className="text-[10px] text-slate-600">{inceptionDate}</span>
        </div>

        {/* Quick Presets */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePreset(1)}
            className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            1D
          </button>
          <button
            type="button"
            onClick={() => handlePreset(7)}
            className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            7D
          </button>
          <button
            type="button"
            onClick={() => handlePreset(30)}
            className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            1M
          </button>
          <button
            type="button"
            onClick={() => handlePreset(90)}
            className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            3M
          </button>
          <button
            type="button"
            onClick={() => handlePreset('all')}
            className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            All History
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-emerald-400 font-medium">Current Time →</span>
          <span className="text-[10px] text-slate-600">{currentDate}</span>
        </div>
      </div>
    </div>
  );
};
