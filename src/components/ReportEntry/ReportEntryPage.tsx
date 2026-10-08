import React, { useState, useEffect, useMemo } from 'react';
import { Activity, LogEntry, MeasurementTool } from '../../types/trackit';
import { storage } from '../../utils/storage';
import { generateCSVExport } from '../../utils/analytics';
import {
  Calendar,
  Clock,
  Save,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Layers,
  BarChart3,
  PieChart,
  LineChart,
  Hash,
  AlertCircle,
} from 'lucide-react';

interface ReportEntryPageProps {
  activities: Activity[];
  tools: MeasurementTool[];
  entries: LogEntry[];
  preSelectedActivityId?: string;
  preSelectedToolId?: string;
}

export const ReportEntryPage: React.FC<ReportEntryPageProps> = ({
  activities,
  tools,
  entries,
  preSelectedActivityId,
  preSelectedToolId,
}) => {
  // Strict time defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().substring(0, 5);

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTimeStr);

  // Selection columns
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    preSelectedActivityId || activities[0]?.id || ''
  );

  // Filter tools to ONLY those of the selected activity!
  const availableTools = useMemo(() => {
    return tools.filter((t) => t.activityId === selectedActivityId);
  }, [tools, selectedActivityId]);

  const [selectedToolId, setSelectedToolId] = useState<string>(
    preSelectedToolId || availableTools[0]?.id || ''
  );

  // When activity changes, automatically update tool selection to first available of that activity
  useEffect(() => {
    if (preSelectedActivityId) {
      setSelectedActivityId(preSelectedActivityId);
    }
  }, [preSelectedActivityId]);

  useEffect(() => {
    if (preSelectedToolId && availableTools.some((t) => t.id === preSelectedToolId)) {
      setSelectedToolId(preSelectedToolId);
    } else if (availableTools.length > 0 && !availableTools.some((t) => t.id === selectedToolId)) {
      setSelectedToolId(availableTools[0].id);
    }
  }, [availableTools, preSelectedToolId, selectedToolId]);

  const activeTool = tools.find((t) => t.id === selectedToolId);
  const activeActivity = activities.find((a) => a.id === selectedActivityId);

  // Dynamic values form state
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Table filters
  const [tableSearch, setTableSearch] = useState('');
  const [tableActivityFilter, setTableActivityFilter] = useState('all');
  const [tableToolFilter, setTableToolFilter] = useState('all');

  // Reset/populate form values when activeTool changes
  useEffect(() => {
    if (!activeTool) {
      setDynamicValues({});
      return;
    }

    const initial: Record<string, string> = {};
    if (activeTool.type === 'bar_chart' || activeTool.type === 'pie_chart') {
      const cats = activeTool.config.categories || ['Value'];
      cats.forEach((cat) => {
        initial[cat] = '';
      });
    } else if (activeTool.type === 'line_chart') {
      const key = activeTool.config.categories?.[0] || 'Value';
      initial[key] = '';
    } else if (activeTool.type === 'counter') {
      initial['value'] = '';
    }
    setDynamicValues(initial);
  }, [activeTool?.id, activeTool?.type]);

  const handleValueChange = (category: string, val: string) => {
    setDynamicValues((prev) => ({
      ...prev,
      [category]: val,
    }));
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActivity || !activeTool) return;

    // Convert string inputs to numeric values
    const numericValues: Record<string, number> = {};
    let total = 0;

    Object.entries(dynamicValues).forEach(([k, v]) => {
      const num = parseFloat(v) || 0;
      numericValues[k] = num;
      total += num;
    });

    // If single line or counter, total is the direct value
    if (activeTool.type === 'line_chart' || activeTool.type === 'counter') {
      const primaryKey = Object.keys(numericValues)[0];
      total = numericValues[primaryKey] || 0;
    }

    storage.addEntry({
      activityId: activeActivity.id,
      toolId: activeTool.id,
      date,
      time,
      values: numericValues,
      totalValue: Math.round(total * 100) / 100,
      notes: notes.trim() || undefined,
    });

    setSaveSuccessMsg(`Data record saved into "${activeTool.name}" on ${date}!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);

    // Clear dynamic inputs for next log
    const resetVals: Record<string, string> = {};
    Object.keys(dynamicValues).forEach((k) => (resetVals[k] = ''));
    setDynamicValues(resetVals);
    setNotes('');
  };

  // Quick Date presets
  const setQuickDate = (type: 'today' | 'yesterday') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    setDate(d.toISOString().split('T')[0]);
  };

  // Export handlers
  const handleExportCSV = () => {
    const toolsMap: Record<string, MeasurementTool> = {};
    tools.forEach((t) => (toolsMap[t.id] = t));

    const actMap: Record<string, string> = {};
    activities.forEach((a) => (actMap[a.id] = a.name));

    const csvContent = generateCSVExport(entries, toolsMap, actMap);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trackit-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        activities,
        tools,
        entries,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trackit-database-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Filter records in table
  const filteredRecords = useMemo(() => {
    return entries.filter((e) => {
      if (tableActivityFilter !== 'all' && e.activityId !== tableActivityFilter) return false;
      if (tableToolFilter !== 'all' && e.toolId !== tableToolFilter) return false;
      if (tableSearch) {
        const q = tableSearch.toLowerCase();
        const actName = activities.find((a) => a.id === e.activityId)?.name.toLowerCase() || '';
        const toolName = tools.find((t) => t.id === e.toolId)?.name.toLowerCase() || '';
        const notesText = (e.notes || '').toLowerCase();
        const dateMatch = e.date.includes(q);
        if (!actName.includes(q) && !toolName.includes(q) && !notesText.includes(q) && !dateMatch) {
          return false;
        }
      }
      return true;
    });
  }, [entries, tableActivityFilter, tableToolFilter, tableSearch, activities, tools]);

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'bar_chart':
        return <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'pie_chart':
        return <PieChart className="w-3.5 h-3.5 text-purple-400" />;
      case 'line_chart':
        return <LineChart className="w-3.5 h-3.5 text-blue-400" />;
      case 'counter':
        return <Hash className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Save className="w-5 h-5 text-indigo-400" />
            Report Entry & Real-Time Sync
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Strict time logging system. Select an activity and its dedicated measurement tool to record data directly into its visual folder.
          </p>
        </div>

        {/* Export buttons toolbar */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap no-print">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            title="Export all data records as CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            title="Export full database backup as JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            title="Print or save as PDF report"
          >
            <Printer className="w-3.5 h-3.5 text-purple-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Entry Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg no-print">
        {/* Strict Time Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Strict Time Record</span>
            <span className="text-slate-600 font-mono">|</span>
            <span className="text-slate-400 font-normal">All entries are timestamped and preserved in real time.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Quick Date:</span>
            <button
              type="button"
              onClick={() => setQuickDate('today')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                date === todayStr
                  ? 'bg-indigo-950 border-indigo-700 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('yesterday')}
              className="px-2 py-0.5 rounded text-[11px] font-medium border bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Main Entry Form */}
        <form onSubmit={handleSaveEntry} className="p-6 space-y-6">
          {/* Top row: Strict Date & Time inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Date Picker */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Date (Strict System) <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* 2. Time Picker */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Time of Record
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* 3. Activity Selection Column */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Activity Selection <span className="text-rose-400">*</span>
              </label>
              {activities.length > 0 ? (
                <select
                  required
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer font-medium"
                >
                  {activities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.name} ({act.category})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
                  No activities created yet.
                </div>
              )}
            </div>

            {/* 4. Measurement Tools Selecting Column (Shows ONLY tools of that activity!) */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                Measurement Tool Column <span className="text-rose-400">*</span>
              </label>
              {availableTools.length > 0 ? (
                <select
                  required
                  value={selectedToolId}
                  onChange={(e) => setSelectedToolId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer font-medium"
                >
                  {availableTools.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
                  No tools created for this activity yet.
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Data Input System tailored to selected tool type */}
          {activeTool ? (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {getToolIcon(activeTool.type)}
                  <span className="font-semibold text-slate-200 text-xs">
                    Data Entry System for: <strong className="text-indigo-300">{activeTool.name}</strong>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({activeTool.config.unit || 'units'})
                  </span>
                </div>
                {activeTool.purpose && (
                  <span className="text-[11px] text-slate-400 italic hidden md:inline">
                    "{activeTool.purpose}"
                  </span>
                )}
              </div>

              {/* Dynamic Inputs per Tool Type */}
              {(activeTool.type === 'bar_chart' || activeTool.type === 'pie_chart') && (
                <div>
                  <label className="block text-slate-400 text-xs mb-2">
                    Enter values for configured {activeTool.type === 'bar_chart' ? 'bars' : 'pie slices'}:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(activeTool.config.categories || ['Value']).map((cat) => (
                      <div key={cat} className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                        <label className="block text-slate-300 font-medium text-xs truncate mb-1" title={cat}>
                          {cat}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={dynamicValues[cat] || ''}
                            onChange={(e) => handleValueChange(cat, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                          />
                          <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-mono">
                            {activeTool.config.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTool.type === 'line_chart' && (
                <div className="max-w-md">
                  <label className="block text-slate-300 font-medium text-xs mb-1.5">
                    Metric Value ({activeTool.config.yAxisLabel || activeTool.config.unit})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder={`e.g. ${activeTool.config.target || '50'}`}
                      value={dynamicValues[activeTool.config.categories?.[0] || 'Value'] || ''}
                      onChange={(e) =>
                        handleValueChange(activeTool.config.categories?.[0] || 'Value', e.target.value)
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">
                      {activeTool.config.unit}
                    </span>
                  </div>
                  {activeTool.config.target !== undefined && (
                    <span className="text-[11px] text-indigo-400 mt-1 block">
                      Target goal configured: <strong>{activeTool.config.target} {activeTool.config.unit}</strong>
                    </span>
                  )}
                </div>
              )}

              {activeTool.type === 'counter' && (
                <div className="max-w-md">
                  <label className="block text-slate-300 font-medium text-xs mb-1.5">
                    Current Milestone / Recorded Count ({activeTool.config.unit})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 85"
                      value={dynamicValues['value'] || ''}
                      onChange={(e) => handleValueChange('value', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">
                      {activeTool.config.unit}
                    </span>
                  </div>
                  {activeTool.config.target !== undefined && (
                    <span className="text-[11px] text-cyan-400 mt-1 block">
                      Milestone Target: <strong>{activeTool.config.target} {activeTool.config.unit}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Context notes */}
              <div>
                <label className="block text-slate-400 text-xs mb-1">
                  Session Notes / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Peak intensity, fasted training, completed all sets without rest."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                />
              </div>

              {/* Submit Button & Feedback */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  Tool folder <strong className="text-slate-300">"{activeTool.name}"</strong> will immediately receive this entry and update its analytics.
                </div>

                <div className="flex items-center gap-3">
                  {saveSuccessMsg && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      {saveSuccessMsg}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to Cloud Database</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              Select an activity with at least one measurement tool to begin recording data.
            </div>
          )}
        </form>
      </div>

      {/* Stored Records & Visual Analytics History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Stored Records Database</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                {filteredRecords.length} records
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Historical ledger of strict-time stamped data entries.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search notes, date..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs w-44"
              />
            </div>

            <select
              value={tableActivityFilter}
              onChange={(e) => setTableActivityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
            >
              <option value="all">All Activities</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={tableToolFilter}
              onChange={(e) => setTableToolFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
            >
              <option value="all">All Tools</option>
              {tools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Activity</th>
                <th className="py-2.5 px-4">Measurement Tool</th>
                <th className="py-2.5 px-4">Values Recorded</th>
                <th className="py-2.5 px-4">Total / Value</th>
                <th className="py-2.5 px-4">Notes</th>
                <th className="py-2.5 px-4 text-right no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                    No stored records found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const act = activities.find((a) => a.id === record.activityId);
                  const tool = tools.find((t) => t.id === record.toolId);
                  const unit = tool?.config.unit || '';

                  return (
                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Date & Time */}
                      <td className="py-2.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="font-semibold text-white">{record.date}</div>
                        {record.time && (
                          <div className="text-[10px] text-slate-500">{record.time}</div>
                        )}
                      </td>

                      {/* Activity */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: act?.color || '#6366f1' }}
                          />
                          <span className="font-medium text-slate-200">
                            {act?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      {/* Measurement Tool */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {tool && getToolIcon(tool.type)}
                          <span className="text-slate-300 font-medium">
                            {tool?.name || 'Unknown Tool'}
                          </span>
                        </div>
                      </td>

                      {/* Values Recorded */}
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                          {Object.entries(record.values).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 whitespace-nowrap"
                            >
                              {k}: <strong className="text-indigo-300">{v}</strong>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                        <span className="font-semibold text-slate-100">
                          {record.totalValue}
                        </span>{' '}
                        <span className="text-slate-500 text-[10px]">{unit}</span>
                      </td>

                      {/* Notes */}
                      <td className="py-2.5 px-4 text-slate-400 text-xs max-w-xs truncate" title={record.notes}>
                        {record.notes || <span className="text-slate-600 italic">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right no-print whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (confirm(`Delete record from ${record.date}?`)) {
                              storage.deleteEntry(record.id);
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
