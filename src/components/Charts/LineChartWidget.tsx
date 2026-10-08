import React, { useState } from 'react';
import { LogEntry, MeasurementTool } from '../../types/trackit';

interface LineChartWidgetProps {
  tool: MeasurementTool;
  entries: LogEntry[];
}

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({ tool, entries }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    value: number;
    notes?: string;
    x: number;
    y: number;
  } | null>(null);

  const unit = tool.config.unit || '';
  const target = tool.config.target;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
        <p>No timeline data in this timeframe.</p>
        <span className="text-xs text-slate-600 mt-1">Log an entry in Report Entry to start tracking trends.</span>
      </div>
    );
  }

  // Sort chronologically
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  const values = sorted.map((e) => e.totalValue);
  const dataMin = Math.min(...values, target !== undefined ? target : Infinity);
  const dataMax = Math.max(...values, target !== undefined ? target : -Infinity);

  // Buffer range
  const padding = (dataMax - dataMin) * 0.18 || 2;
  const yMin = Math.max(0, Math.floor(dataMin - padding));
  const yMax = Math.ceil(dataMax + padding);
  const yRange = yMax - yMin || 1;

  const width = 500;
  const height = 180;
  const chartLeft = 40;
  const chartRight = 485;
  const chartTop = 20;
  const chartBottom = 150;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Map entries to SVG coordinates
  const points = sorted.map((entry, idx) => {
    const x = sorted.length === 1
      ? chartLeft + chartWidth / 2
      : chartLeft + (idx / (sorted.length - 1)) * chartWidth;
    const y = chartBottom - ((entry.totalValue - yMin) / yRange) * chartHeight;
    return {
      x,
      y,
      entry,
      value: entry.totalValue,
      date: entry.date,
      notes: entry.notes,
    };
  });

  // Construct path string
  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Closed area path for gradient
  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`
    : '';

  // Calculate target Y
  const targetY = target !== undefined
    ? chartBottom - ((target - yMin) / yRange) * chartHeight
    : null;

  return (
    <div className="w-full">
      {/* Top summary row */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <div className="flex items-center gap-3">
          <span>Range: <strong className="text-slate-200 font-mono">{yMin} – {yMax} {unit}</strong></span>
          {target !== undefined && (
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-0.5 border-t border-dashed border-indigo-400" />
              Target Goal: {target} {unit}
            </span>
          )}
        </div>
        {hoveredPoint ? (
          <span className="text-emerald-300 font-mono">
            {hoveredPoint.date}: <strong className="text-white">{hoveredPoint.value} {unit}</strong>
          </span>
        ) : (
          <span className="text-slate-500">Hover points for notes & timestamps</span>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative h-52 w-full bg-slate-900/60 rounded-lg p-3 border border-slate-800/80">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`line-grad-${tool.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = chartBottom - pct * chartHeight;
            const gridVal = Math.round(yMin + pct * yRange);
            return (
              <g key={idx}>
                <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <text x={chartLeft - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" className="font-mono">
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Target line */}
          {targetY !== null && targetY >= chartTop && targetY <= chartBottom && (
            <g>
              <line x1={chartLeft} y1={targetY} x2={chartRight} y2={targetY} stroke="#818cf8" strokeWidth="1.2" strokeDasharray="4 4" />
              <text x={chartRight + 2} y={targetY + 3} fill="#a5b4fc" fontSize="8.5" className="font-mono">
                Goal
              </text>
            </g>
          )}

          {/* Area fill */}
          {areaD && <path d={areaD} fill={`url(#line-grad-${tool.id})`} />}

          {/* Main line */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.date === pt.date && hoveredPoint?.value === pt.value;
            return (
              <g key={idx} className="cursor-pointer">
                {/* Invisible larger hover area */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="12"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint({ date: pt.date, value: pt.value, notes: pt.notes, x: pt.x, y: pt.y })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Visible dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '6' : '4'}
                  fill={isHovered ? '#38bdf8' : '#818cf8'}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Date ticks on bottom axis */}
          {points.length > 0 && (
            <g>
              <text x={points[0].x} y="166" fill="#94a3b8" fontSize="8.5" textAnchor="start">
                {points[0].date}
              </text>
              {points.length > 1 && (
                <text x={points[points.length - 1].x} y="166" fill="#94a3b8" fontSize="8.5" textAnchor="end">
                  {points[points.length - 1].date}
                </text>
              )}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 bg-slate-900 border border-slate-700 shadow-xl rounded px-2.5 py-1.5 text-xs"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div className="font-semibold text-white font-mono">
              {hoveredPoint.value} {unit}
            </div>
            <div className="text-[10px] text-slate-400">{hoveredPoint.date}</div>
            {hoveredPoint.notes && (
              <div className="text-[10px] text-slate-300 italic mt-0.5 border-t border-slate-800 pt-0.5 max-w-[150px] truncate">
                {hoveredPoint.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
