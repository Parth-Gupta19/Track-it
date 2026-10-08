import React, { useState } from 'react';
import { LogEntry, MeasurementTool } from '../../types/trackit';

interface PieChartWidgetProps {
  tool: MeasurementTool;
  entries: LogEntry[];
}

export const PieChartWidget: React.FC<PieChartWidgetProps> = ({ tool, entries }) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const categories = tool.config.categories && tool.config.categories.length > 0
    ? tool.config.categories
    : ['Slice 1', 'Slice 2'];
  const unit = tool.config.unit || 'units';

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
        <p>No records found in this timeframe.</p>
        <span className="text-xs text-slate-600 mt-1">Log an entry in Report Entry to see distribution.</span>
      </div>
    );
  }

  // Aggregate category values
  const totals: Record<string, number> = {};
  categories.forEach((cat) => (totals[cat] = 0));

  entries.forEach((e) => {
    Object.entries(e.values).forEach(([cat, val]) => {
      totals[cat] = (totals[cat] || 0) + Number(val || 0);
    });
  });

  const sumTotal = Object.values(totals).reduce((acc, v) => acc + v, 0);

  const colors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#14b8a6', // Teal
  ];

  if (sumTotal === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
        <p>Values in this timeframe equal 0.</p>
      </div>
    );
  }

  // Generate SVG arcs for donut chart
  const cx = 100;
  const cy = 100;
  const outerRadius = 80;
  const innerRadius = 45;

  let accumulatedAngle = -Math.PI / 2; // start from top (12 o'clock)

  const slices = categories.map((cat, idx) => {
    const val = totals[cat] || 0;
    const fraction = val / sumTotal;
    const angle = fraction * 2 * Math.PI;

    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle = endAngle;

    // Outer arc points
    const x1 = cx + outerRadius * Math.cos(startAngle);
    const y1 = cy + outerRadius * Math.sin(startAngle);
    const x2 = cx + outerRadius * Math.cos(endAngle);
    const y2 = cy + outerRadius * Math.sin(endAngle);

    // Inner arc points
    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    const percentage = Math.round(fraction * 1000) / 10;
    const color = colors[idx % colors.length];

    return {
      category: cat,
      value: val,
      percentage,
      pathData,
      color,
    };
  });

  const activeItem = hoveredSlice
    ? slices.find((s) => s.category === hoveredSlice)
    : slices[0];

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900/60 rounded-lg p-4 border border-slate-800/80">
        {/* SVG Donut */}
        <div className="relative w-48 h-48 shrink-0">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {slices.map((slice) => {
              const isHovered = hoveredSlice === slice.category;
              return (
                <path
                  key={slice.category}
                  d={slice.pathData}
                  fill={slice.color}
                  opacity={hoveredSlice && !isHovered ? 0.4 : 1}
                  className="transition-all duration-200 cursor-pointer hover:brightness-110"
                  onMouseEnter={() => setHoveredSlice(slice.category)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium truncate max-w-[80px]">
              {activeItem ? activeItem.category : 'Total'}
            </span>
            <span className="text-base font-bold font-mono text-white">
              {activeItem ? `${activeItem.percentage}%` : '100%'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {activeItem ? `${activeItem.value} ${unit}` : ''}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2">
          {slices.map((slice) => {
            const isHovered = hoveredSlice === slice.category;
            return (
              <div
                key={slice.category}
                onMouseEnter={() => setHoveredSlice(slice.category)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-900/40 border border-slate-800/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className={`text-xs truncate ${isHovered ? 'text-white font-medium' : 'text-slate-300'}`}>
                    {slice.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                  <span className="text-slate-400">{slice.value} {unit}</span>
                  <span className="text-slate-200 font-semibold w-12 text-right">{slice.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
