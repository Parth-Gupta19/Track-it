import React, { useMemo, useState } from 'react';
import { Activity, LogEntry, MeasurementTool } from '../../types/trackit';
import { calculateToolFindings, filterEntriesByDateRange, getDaysBetween } from '../../utils/analytics';
import { TimelineSlider } from '../Charts/TimelineSlider';
import { BarChartWidget } from '../Charts/BarChartWidget';
import { PieChartWidget } from '../Charts/PieChartWidget';
import { LineChartWidget } from '../Charts/LineChartWidget';
import { CounterWidget } from '../Charts/CounterWidget';
import {
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  PlusCircle,
  BarChart3,
  PieChart,
  LineChart,
  Hash,
  Download,
  Info,
  Trash2,
} from 'lucide-react';
import { storage } from '../../utils/storage';

interface ChartDetailPageProps {
  activity: Activity;
  tool: MeasurementTool;
  allEntries: LogEntry[];
  inceptionDate: string;
  onBack: () => void;
  onNavigateToReport: (activityId: string, toolId: string) => void;
}

export const ChartDetailPage: React.FC<ChartDetailPageProps> = ({
  activity,
  tool,
  allEntries,
  inceptionDate,
  onBack,
  onNavigateToReport,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Default to 30 days back or inceptionDate
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const inc = new Date(inceptionDate);
    const chosen = d < inc ? inc : d;
    return chosen.toISOString().split('T')[0];
  }, [inceptionDate]);

  const [selectedStartDate, setSelectedStartDate] = useState(defaultStart);

  // Filter entries for this specific tool and time window
  const toolEntries = useMemo(() => {
    return allEntries.filter((e) => e.toolId === tool.id);
  }, [allEntries, tool.id]);

  const filteredEntries = useMemo(() => {
    return filterEntriesByDateRange(toolEntries, selectedStartDate, todayStr);
  }, [toolEntries, selectedStartDate, todayStr]);

  const findings = useMemo(() => {
    return calculateToolFindings(filteredEntries);
  }, [filteredEntries]);

  const daysActive = getDaysBetween(selectedStartDate, todayStr);

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'bar_chart':
        return <BarChart3 className="w-5 h-5 text-indigo-400" />;
      case 'pie_chart':
        return <PieChart className="w-5 h-5 text-purple-400" />;
      case 'line_chart':
        return <LineChart className="w-5 h-5 text-blue-400" />;
      case 'counter':
        return <Hash className="w-5 h-5 text-cyan-400" />;
      default:
        return <BarChart3 className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Return to Activity Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-400 font-semibold">{activity.name}</span>
              <span className="text-slate-600">/</span>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {tool.name}
              </h1>
            </div>
            {tool.purpose && (
              <p className="text-xs text-slate-400 mt-0.5">{tool.purpose}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateToReport(activity.id, tool.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Entry into this Chart</span>
          </button>
        </div>
      </div>

      {/* Chronological Timeline Component (Oldest left, Current time right) */}
      <TimelineSlider
        inceptionDate={inceptionDate}
        currentDate={todayStr}
        selectedStartDate={selectedStartDate}
        onStartDateChange={setSelectedStartDate}
      />

      {/* Dedicated Chart Display Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              {getToolIcon(tool.type)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Visual Analytics: {tool.name}
              </h2>
              <span className="text-xs text-slate-400">
                Displaying {filteredEntries.length} entries filtered across {daysActive} days
              </span>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
            Unit: <strong className="text-white">{tool.config.unit || 'units'}</strong>
          </div>
        </div>

        {/* Full Interactive Chart */}
        <div className="w-full py-2">
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
      </div>

      {/* Mathematical & Statistical Insights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            Growth Percentage
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                findings.trend === 'up'
                  ? 'text-emerald-400'
                  : findings.trend === 'down'
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              {findings.growthPercent !== null
                ? `${findings.growthPercent > 0 ? '+' : ''}${findings.growthPercent}%`
                : 'N/A'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Start vs end of filtered window
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium">Mode (Most Frequent)</span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-mono text-slate-100 truncate block">
              {findings.mode !== null ? `${findings.mode} ${tool.config.unit}` : 'None'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Most frequent recorded value
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium">Average / Mean</span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-mono text-indigo-300">
              {findings.count > 0 ? `${findings.mean} ${tool.config.unit}` : '—'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Across {filteredEntries.length} records
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium">Total Volume / Metric</span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {findings.total} {tool.config.unit}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Sum of entries in window
          </span>
        </div>
      </div>

      {/* Filtered Records Table for this Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Historical Records for this Chart</span>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
              {filteredEntries.length} records
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {selectedStartDate} to {todayStr}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Breakdown / Values</th>
                <th className="py-2.5 px-4">Total</th>
                <th className="py-2.5 px-4">Notes</th>
                <th className="py-2.5 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No records found in this time range. Use the timeline slider above to expand.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                      <div className="font-semibold text-white">{record.date}</div>
                      {record.time && <div className="text-[10px] text-slate-500">{record.time}</div>}
                    </td>

                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(record.values).map(([k, v]) => (
                          <span
                            key={k}
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                          >
                            {k}: <strong className="text-indigo-300">{v}</strong>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                      <span className="font-semibold text-slate-100">{record.totalValue}</span>{' '}
                      <span className="text-slate-500 text-[10px]">{tool.config.unit}</span>
                    </td>

                    <td className="py-2.5 px-4 text-slate-400 text-xs max-w-xs truncate" title={record.notes}>
                      {record.notes || <span className="text-slate-600 italic">—</span>}
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete record from ${record.date}?`)) {
                            storage.deleteEntry(record.id);
                          }
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
