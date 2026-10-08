import React from 'react';
import { TimePeriod } from '../../types/trackit';
import { getDateRangeFromPeriod, getDaysBetween, getPeriodLabel } from '../../utils/analytics';
import { Calendar, SlidersHorizontal } from 'lucide-react';

interface TimeframeControllerProps {
  selectedPeriod: TimePeriod;
  startDate: string;
  endDate: string;
  inceptionDate: string;
  onRangeChange: (period: TimePeriod, start: string, end: string) => void;
}

export const TimeframeController: React.FC<TimeframeControllerProps> = ({
  selectedPeriod,
  startDate,
  endDate,
  inceptionDate,
  onRangeChange,
}) => {
  // Compute total timeline span in days from inception to today
  const totalSpanDays = Math.max(14, getDaysBetween(inceptionDate, endDate));
  const activeDays = getDaysBetween(startDate, endDate);

  // Calculate percentage of timeline covered by current start date
  // 100% means full range back to inception, smaller % means zoomed in closer to today
  const currentRatio = Math.min(100, Math.max(1, Math.round((activeDays / totalSpanDays) * 100)));

  const handleDropdownSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value as TimePeriod;
    const { startDate: newStart, endDate: newEnd } = getDateRangeFromPeriod(newPeriod);
    onRangeChange(newPeriod, newStart, newEnd);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value); // percentage from 1 to 100
    const targetDays = Math.max(1, Math.round((val / 100) * totalSpanDays));

    const end = new Date(endDate);
    const start = new Date(endDate);
    start.setDate(end.getDate() - targetDays);

    const formattedStart = start.toISOString().split('T')[0];

    // Check if close to standard period presets
    let matchedPeriod: TimePeriod = 'all';
    if (targetDays <= 1) matchedPeriod = '1_day';
    else if (targetDays >= 25 && targetDays <= 35) matchedPeriod = '1_month';
    else if (targetDays >= 55 && targetDays <= 65) matchedPeriod = '2_month';
    else if (targetDays >= 85 && targetDays <= 95) matchedPeriod = '3_month';
    else if (targetDays >= 170 && targetDays <= 190) matchedPeriod = '6_month';
    else if (targetDays >= 350 && targetDays <= 375) matchedPeriod = '1_year';

    onRangeChange(matchedPeriod, formattedStart, endDate);
  };

  return (
    <div className="w-full mt-4 pt-3 border-t border-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Quick Dropdown Menu Column */}
        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-slate-400 flex items-center gap-1.5 shrink-0 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Time Period:
          </label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={handleDropdownSelect}
            className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="1_day">1 Day</option>
            <option value="1_month">1 Month</option>
            <option value="2_month">2 Months</option>
            <option value="3_month">3 Months</option>
            <option value="6_month">6 Months</option>
            <option value="1_year">1 Year</option>
            <option value="all">All Time (Since Launch)</option>
          </select>
        </div>

        {/* Interconnected Active Window Label */}
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] self-start sm:self-auto">
          <span>Viewing:</span>
          <span className="text-indigo-300 font-medium bg-indigo-950/60 border border-indigo-800/40 rounded px-2 py-0.5">
            {startDate} <span className="text-slate-500">to</span> {endDate} ({activeDays}d)
          </span>
        </div>
      </div>

      {/* Adjustable Timeline Slider Line */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
          <span className="flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            Adjust Timeline Window
          </span>
          <span>
            {currentRatio}% of total recorded history ({totalSpanDays} days available)
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min="1"
            max="100"
            value={currentRatio}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-600 mt-1 font-mono">
          <span>1 Day</span>
          <span>1 Mo</span>
          <span>3 Mo</span>
          <span>6 Mo</span>
          <span>All History</span>
        </div>
      </div>
    </div>
  );
};
