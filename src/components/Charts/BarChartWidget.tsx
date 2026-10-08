import React, { useState } from 'react';
import { LogEntry, MeasurementTool } from '../../types/trackit';

interface BarChartWidgetProps {
  tool: MeasurementTool;
  entries: LogEntry[];
}

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({ tool, entries }) => {
  const [hoveredBar, setHoveredBar] = useState<{ label: string; value: number; date?: string } | null>(null);
  const categories = tool.config.categories && tool.config.categories.length > 0
    ? tool.config.categories
    : ['Value'];
  const unit = tool.config.unit || '';
  const yLabel = tool.config.yAxisLabel || unit || 'Value';

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
        <p>No records found in this timeframe.</p>
        <span className="text-xs text-slate-600 mt-1">Add an entry in Report Entry to see bar analytics.</span>
      </div>
    );
  }

  // Calculate totals per category
  const categoryTotals: Record<string, number> = {};
  categories.forEach((cat) => (categoryTotals[cat] = 0));

  entries.forEach((entry) => {
    Object.entries(entry.values).forEach(([cat, val]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(val || 0);
    });
  });

  const maxVal = Math.max(...Object.values(categoryTotals), 1);
  const roundedMax = Math.ceil(maxVal * 1.15);

  const colors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#8b5cf6', // Purple
  ];

  return (
    <div className="w-full">
      {/* Y-Axis Label and Tooltip preview */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-medium text-slate-300">Metric: {yLabel}</span>
        {hoveredBar ? (
          <span className="text-indigo-300 font-mono">
            {hoveredBar.label}: <strong className="text-white">{hoveredBar.value.toLocaleString()} {unit}</strong>
          </span>
        ) : (
          <span className="text-slate-500">Hover bars to view exact volume</span>
        )}
      </div>

      {/* SVG Bar Chart */}
      <div className="relative h-52 w-full bg-slate-900/60 rounded-lg p-3 border border-slate-800/80">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = 150 - pct * 130;
            const gridVal = Math.round(pct * roundedMax);
            return (
              <g key={idx}>
                <line x1="35" y1={y} x2="495" y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <text x="30" y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" className="font-mono">
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {categories.map((cat, idx) => {
            const val = categoryTotals[cat] || 0;
            const barHeight = (val / roundedMax) * 130;
            const totalBars = categories.length;
            const availableWidth = 440;
            const barSlot = availableWidth / totalBars;
            const barWidth = Math.min(barSlot * 0.58, 48);
            const x = 45 + idx * barSlot + (barSlot - barWidth) / 2;
            const y = 150 - barHeight;
            const color = colors[idx % colors.length];

            return (
              <g
                key={cat}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredBar({ label: cat, value: val })}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Background highlight on hover */}
                <rect
                  x={x - 4}
                  y="15"
                  width={barWidth + 8}
                  height="138"
                  fill="#1e293b"
                  opacity={hoveredBar?.label === cat ? 0.4 : 0}
                  rx="4"
                />
                
                {/* Main Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  fill={color}
                  rx="3"
                  className="transition-all duration-300"
                />

                {/* Top highlight cap */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height="3"
                  fill="#ffffff"
                  opacity="0.4"
                  rx="1"
                />

                {/* Value on top of bar */}
                {barHeight > 18 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="9.5"
                    className="font-mono font-medium"
                  >
                    {val}
                  </text>
                )}

                {/* Category X-Axis label */}
                <text
                  x={x + barWidth / 2}
                  y="166"
                  textAnchor="middle"
                  fill={hoveredBar?.label === cat ? '#f8fafc' : '#94a3b8'}
                  fontSize="9.5"
                  fontWeight={hoveredBar?.label === cat ? '600' : '400'}
                  className="select-none"
                >
                  {cat.length > 13 ? `${cat.substring(0, 11)}..` : cat}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Category Legend & Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
        {categories.map((cat, idx) => {
          const val = categoryTotals[cat] || 0;
          const color = colors[idx % colors.length];
          return (
            <div
              key={cat}
              className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800/60"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-slate-300 truncate" title={cat}>{cat}</span>
              </div>
              <span className="text-slate-200 font-mono font-medium ml-1 shrink-0">
                {val} <span className="text-slate-500 text-[10px]">{unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
