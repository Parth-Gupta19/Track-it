import React from 'react';
import { MeasurementToolType } from '../../types/trackit';
import { BarChart3, PieChart, LineChart, Hash, Plus, Sparkles } from 'lucide-react';

interface ToolCatalogPanelProps {
  activityName: string;
  onSelectToolType: (type: MeasurementToolType) => void;
  className?: string;
}

export const ToolCatalogPanel: React.FC<ToolCatalogPanelProps> = ({
  activityName,
  onSelectToolType,
  className = '',
}) => {
  return (
    <div className={`border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Tool Catalog
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Add Tool Box</span>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Create a new measurement chart box in <strong className="text-slate-200">{activityName}</strong>:
        </p>

        {/* Catalog Items */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onSelectToolType('bar_chart')}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-indigo-950/40 hover:border-indigo-500/60 text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                <span>+ Bar Chart</span>
                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Multi-bar volume, splits, and categories with customizable Y-axis scale.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectToolType('pie_chart')}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-purple-950/40 hover:border-purple-500/60 text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300 flex items-center justify-between">
                <span>+ Pie Chart</span>
                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Proportional distribution, macro splits, and percentage shares.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectToolType('line_chart')}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-blue-950/40 hover:border-blue-500/60 text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform shrink-0">
              <LineChart className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-200 group-hover:text-blue-300 flex items-center justify-between">
                <span>+ Line Trend</span>
                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Continuous chronological progression with target goal guide lines.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectToolType('counter')}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-cyan-950/40 hover:border-cyan-500/60 text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
              <Hash className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                <span>+ Metric Counter</span>
                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Cumulative milestone tracking, completion ratios, and progress rings.
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300 mb-1">Interactive Routing</div>
        Clicking any chart box will navigate directly to its dedicated analytical page.
      </div>
    </div>
  );
};
