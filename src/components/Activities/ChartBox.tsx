import React, { useMemo } from 'react';
import { LogEntry, MeasurementTool } from '../../types/trackit';
import { calculateToolFindings, filterEntriesByDateRange } from '../../utils/analytics';
import { BarChartWidget } from '../Charts/BarChartWidget';
import { PieChartWidget } from '../Charts/PieChartWidget';
import { LineChartWidget } from '../Charts/LineChartWidget';
import { CounterWidget } from '../Charts/CounterWidget';
import {
  BarChart3,
  PieChart,
  LineChart,
  Hash,
  ExternalLink,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
} from 'lucide-react';

interface ChartBoxProps {
  tool: MeasurementTool;
  allEntries: LogEntry[];
  startDate: string;
  endDate: string;
  onOpenToolDetail: (toolId: string) => void;
  onDeleteTool: (toolId: string) => void;
}

export const ChartBox: React.FC<ChartBoxProps> = ({
  tool,
  allEntries,
  startDate,
  endDate,
  onOpenToolDetail,
  onDeleteTool,
}) => {
  // Filter entries for this tool within selected timeline range
  const toolEntries = useMemo(() => {
    return allEntries.filter((e) => e.toolId === tool.id);
  }, [allEntries, tool.id]);

  const filteredEntries = useMemo(() => {
    return filterEntriesByDateRange(toolEntries, startDate, endDate);
  }, [toolEntries, startDate, endDate]);

  const findings = useMemo(() => {
    return calculateToolFindings(filteredEntries);
  }, [filteredEntries]);

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'bar_chart':
        return <BarChart3 className="w-4 h-4 text-indigo-400" />;
      case 'pie_chart':
        return <PieChart className="w-4 h-4 text-purple-400" />;
      case 'line_chart':
        return <LineChart className="w-4 h-4 text-blue-400" />;
      case 'counter':
        return <Hash className="w-4 h-4 text-cyan-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getToolTypeBadge = (type: string) => {
    switch (type) {
      case 'bar_chart':
        return 'Bar Chart';
      case 'pie_chart':
        return 'Pie Chart';
      case 'line_chart':
        return 'Line Trend';
      case 'counter':
        return 'Counter';
      default:
        return 'Chart';
    }
  };

  return (
    <div
      onClick={() => onOpenToolDetail(tool.id)}
      className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/70 rounded-xl overflow-hidden shadow-sm hover:shadow-indigo-500/5 transition-all flex flex-col cursor-pointer"
    >
      {/* Rectangular Box Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
            {getToolIcon(tool.type)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                {tool.name}
              </h3>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0 font-mono">
                {getToolTypeBadge(tool.type)}
              </span>
            </div>
            {tool.purpose && (
              <p className="text-[11px] text-slate-500 truncate" title={tool.purpose}>
                {tool.purpose}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onOpenToolDetail(tool.id)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/80 rounded-lg transition-colors cursor-pointer"
            title="Open dedicated page for this chart"
          >
            <span>Open Page</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete measurement tool "${tool.name}" and its entries?`)) {
                onDeleteTool(tool.id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Delete this chart"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Visual Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="w-full pointer-events-none">
          {tool.type === 'bar_chart' && (
            <BarChartWidget tool={tool} entries={filteredEntries} />
          )}
          {tool.type === 'pie_chart' && (
            <PieChartWidget tool={tool} entries={filteredEntries} />
          )}
          {tool.type === 'line_chart' && (
            <LineChartWidget tool={tool} entries={filteredEntries} />
          )}
          {tool.type === 'counter' && (
            <CounterWidget tool={tool} entries={filteredEntries} />
          )}
        </div>

        {/* Quick KPI Strip at Bottom of Rectangular Box */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono">
              <span className="text-[10px] text-slate-500 uppercase">Growth:</span>
              <span
                className={`font-semibold flex items-center gap-0.5 ${
                  findings.trend === 'up'
                    ? 'text-emerald-400'
                    : findings.trend === 'down'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {findings.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {findings.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {findings.trend === 'neutral' && <Minus className="w-3 h-3" />}
                {findings.growthPercent !== null ? `${findings.growthPercent}%` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono">
              <span className="text-[10px] text-slate-500 uppercase">Mode:</span>
              <span className="font-semibold text-slate-200">
                {findings.mode !== null ? `${findings.mode} ${tool.config.unit}` : 'None'}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            {filteredEntries.length} records in window
          </div>
        </div>
      </div>
    </div>
  );
};
