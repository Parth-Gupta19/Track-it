import React, { useState, useMemo } from 'react';
import { LogEntry, MeasurementTool, TimePeriod } from '../../types/trackit';
import { calculateToolFindings, filterEntriesByDateRange, getDateRangeFromPeriod } from '../../utils/analytics';
import { BarChartWidget } from '../Charts/BarChartWidget';
import { PieChartWidget } from '../Charts/PieChartWidget';
import { LineChartWidget } from '../Charts/LineChartWidget';
import { CounterWidget } from '../Charts/CounterWidget';
import { TimeframeController } from '../Charts/TimeframeController';
import { Folder, Trash2, PlusCircle, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface FolderCardProps {
  tool: MeasurementTool;
  allEntries: LogEntry[];
  inceptionDate: string;
  onDeleteTool: (toolId: string) => void;
  onQuickLog: (tool: MeasurementTool) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  tool,
  allEntries,
  inceptionDate,
  onDeleteTool,
  onQuickLog,
}) => {
  // Default timeframe to 1 month
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1_month');
  const defaultRange = useMemo(() => getDateRangeFromPeriod('1_month'), []);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: defaultRange.startDate,
    end: defaultRange.endDate,
  });

  // Filter entries belonging to this tool and within selected date range
  const toolEntries = useMemo(() => {
    return allEntries.filter((e) => e.toolId === tool.id);
  }, [allEntries, tool.id]);

  const filteredEntries = useMemo(() => {
    return filterEntriesByDateRange(toolEntries, dateRange.start, dateRange.end);
  }, [toolEntries, dateRange.start, dateRange.end]);

  // Compute findings for the active window
  const findings = useMemo(() => {
    return calculateToolFindings(filteredEntries);
  }, [filteredEntries]);

  const handleRangeChange = (period: TimePeriod, start: string, end: string) => {
    setSelectedPeriod(period);
    setDateRange({ start, end });
  };

  const getToolTypeLabel = (type: string) => {
    switch (type) {
      case 'bar_chart':
        return 'Bar Chart';
      case 'pie_chart':
        return 'Pie Chart';
      case 'line_chart':
        return 'Line Trend';
      case 'counter':
        return 'Metric Counter';
      default:
        return 'Tool';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700/80 transition-all flex flex-col">
      {/* Folder Tab Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-100 text-sm">{tool.name}</h3>
              <span className="text-[10px] text-slate-400 border border-slate-800 rounded px-1.5 py-0.5 bg-slate-950 font-medium">
                {getToolTypeLabel(tool.type)}
              </span>
            </div>
            {tool.purpose && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2" title={tool.purpose}>
                {tool.purpose}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onQuickLog(tool)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded transition-colors"
            title="Log data into this measurement tool"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log</span>
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete measurement tool "${tool.name}" and its stored data?`)) {
                onDeleteTool(tool.id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
            title="Delete this measurement tool folder"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Folder Workspace */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Graph Display Area */}
        <div className="w-full">
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

        {/* Mathematical Findings Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs">
          {/* Growth Percent */}
          <div className="p-2 rounded bg-slate-950/50 border border-slate-800/40">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              Growth %
              <Info className="w-2.5 h-2.5 text-slate-600" />
            </span>
            <div className="flex items-center gap-1 font-mono font-semibold mt-0.5">
              {findings.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
              {findings.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
              {findings.trend === 'neutral' && <Minus className="w-3 h-3 text-slate-400" />}
              <span
                className={
                  findings.trend === 'up'
                    ? 'text-emerald-400'
                    : findings.trend === 'down'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }
              >
                {findings.growthPercent !== null
                  ? `${findings.growthPercent > 0 ? '+' : ''}${findings.growthPercent}%`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Mode (Most Frequent Value) */}
          <div className="p-2 rounded bg-slate-950/50 border border-slate-800/40">
            <span className="text-[10px] text-slate-500">Mode (Frequent)</span>
            <div className="font-mono font-semibold text-slate-200 mt-0.5 truncate">
              {findings.mode !== null ? `${findings.mode} ${tool.config.unit}` : 'None'}
            </div>
          </div>

          {/* Mean (Average) */}
          <div className="p-2 rounded bg-slate-950/50 border border-slate-800/40">
            <span className="text-[10px] text-slate-500">Mean / Avg</span>
            <div className="font-mono font-semibold text-slate-200 mt-0.5">
              {findings.count > 0 ? `${findings.mean} ${tool.config.unit}` : '—'}
            </div>
          </div>

          {/* Stored Records in Frame */}
          <div className="p-2 rounded bg-slate-950/50 border border-slate-800/40">
            <span className="text-[10px] text-slate-500">Records (Total: {toolEntries.length})</span>
            <div className="font-mono font-semibold text-slate-200 mt-0.5">
              {filteredEntries.length} logged
            </div>
          </div>
        </div>

        {/* Interconnected Timeframe Controls (Bottom of graph) */}
        <TimeframeController
          selectedPeriod={selectedPeriod}
          startDate={dateRange.start}
          endDate={dateRange.end}
          inceptionDate={inceptionDate}
          onRangeChange={handleRangeChange}
        />
      </div>
    </div>
  );
};
