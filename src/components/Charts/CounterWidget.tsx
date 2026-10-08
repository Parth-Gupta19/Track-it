import React from 'react';
import { LogEntry, MeasurementTool } from '../../types/trackit';

interface CounterWidgetProps {
  tool: MeasurementTool;
  entries: LogEntry[];
}

export const CounterWidget: React.FC<CounterWidgetProps> = ({ tool, entries }) => {
  const unit = tool.config.unit || 'units';
  const target = tool.config.target || 100;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
        <p>No counter records in this timeframe.</p>
        <span className="text-xs text-slate-600 mt-1">Log count in Report Entry to start measuring.</span>
      </div>
    );
  }

  // Sort chronologically
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const latestEntry = sorted[sorted.length - 1];
  const currentValue = latestEntry.totalValue;

  const percentage = Math.min(100, Math.round((currentValue / target) * 100));

  // Circular progress calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="w-full bg-slate-900/60 rounded-lg p-5 border border-slate-800/80">
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* Progress Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="#1e293b"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="#06b6d4"
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {currentValue}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              {unit}
            </span>
            <span className="text-xs font-semibold text-cyan-400 mt-0.5">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Milestone & Target Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-6 pb-2 border-b border-slate-800">
            <span className="text-slate-400 text-xs">Milestone Goal:</span>
            <span className="font-mono font-medium text-slate-200">{target} {unit}</span>
          </div>
          <div className="flex items-center justify-between gap-6 pb-2 border-b border-slate-800">
            <span className="text-slate-400 text-xs">Remaining to Target:</span>
            <span className="font-mono font-medium text-cyan-300">
              {Math.max(0, target - currentValue)} {unit}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6 pb-2 border-b border-slate-800">
            <span className="text-slate-400 text-xs">Total Logs Logged:</span>
            <span className="font-mono font-medium text-slate-200">{entries.length} entries</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-400 text-xs">Last Updated:</span>
            <span className="font-mono text-xs text-slate-400">{latestEntry.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
