import React, { useMemo, useState } from 'react';
import { Activity, LogEntry, MeasurementTool, MeasurementToolType } from '../../types/trackit';
import { storage } from '../../utils/storage';
import { ToolCatalogPanel } from './ToolCatalogPanel';
import { ChartBox } from './ChartBox';
import { TimelineSlider } from '../Charts/TimelineSlider';
import { CreateToolModal } from './CreateToolModal';
import {
  ArrowLeft,
  Plus,
  PlusCircle,
  Folder,
  Trash2,
  SlidersHorizontal,
  Calendar,
  Layers,
} from 'lucide-react';

interface ActivityDetailPageProps {
  activity: Activity;
  allTools: MeasurementTool[];
  allEntries: LogEntry[];
  inceptionDate: string;
  onBack: () => void;
  onOpenToolDetail: (toolId: string) => void;
  onNavigateToReport: (activityId: string, toolId?: string) => void;
}

export const ActivityDetailPage: React.FC<ActivityDetailPageProps> = ({
  activity,
  allTools,
  allEntries,
  inceptionDate,
  onBack,
  onOpenToolDetail,
  onNavigateToReport,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Default to 60 days back or inceptionDate
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    const inc = new Date(inceptionDate);
    const chosen = d < inc ? inc : d;
    return chosen.toISOString().split('T')[0];
  }, [inceptionDate]);

  const [selectedStartDate, setSelectedStartDate] = useState<string>(defaultStart);
  const [createToolModalState, setCreateToolModalState] = useState<{
    isOpen: boolean;
    initialType?: MeasurementToolType;
  }>({ isOpen: false });

  // Tools belonging specifically to this activity
  const activityTools = useMemo(() => {
    return allTools.filter((t) => t.activityId === activity.id);
  }, [allTools, activity.id]);

  const handleCreateTool = (toolData: Omit<MeasurementTool, 'id' | 'createdAt'>) => {
    storage.addTool(toolData);
  };

  const handleDeleteTool = (toolId: string) => {
    storage.deleteTool(toolId);
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
            title="Return to Activity List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                Activity Workspace
              </span>
              <span className="text-slate-600">/</span>
              <h1 className="text-xl font-bold text-slate-100">{activity.name}</h1>
            </div>
            {activity.description && (
              <p className="text-xs text-slate-400 mt-0.5">{activity.description}</p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateToReport(activity.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Data to this Activity</span>
          </button>
        </div>
      </div>

      {/* Chronological Timeline Component: Oldest on far left, Current time on far right */}
      <TimelineSlider
        inceptionDate={inceptionDate}
        currentDate={todayStr}
        selectedStartDate={selectedStartDate}
        onStartDateChange={setSelectedStartDate}
      />

      {/* Dedicated Activity Window with Common Side Panel Tool Catalog */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Activity Window Title Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500" />
            <h2 className="text-sm font-bold text-slate-100">{activity.name}</h2>
            <span className="text-[11px] text-slate-500 font-mono">
              ({activityTools.length} {activityTools.length === 1 ? 'chart box' : 'chart boxes'})
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Click any chart box below to open its dedicated page
          </div>
        </div>

        {/* Two-Column Layout: Common Side Panel on Left + Rectangular Chart Boxes on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          {/* Common Side Panel containing the Full Tool Catalog */}
          <div className="lg:col-span-3">
            <ToolCatalogPanel
              activityName={activity.name}
              onSelectToolType={(type) =>
                setCreateToolModalState({ isOpen: true, initialType: type })
              }
              className="h-full"
            />
          </div>

          {/* Main Area: Rectangular Chart Boxes Grid */}
          <div className="lg:col-span-9 p-5 bg-slate-950">
            {activityTools.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-800 rounded-xl">
                <Layers className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-base font-semibold text-slate-200">No Chart Boxes Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
                  Select a tool from the left Tool Catalog panel to create your first rectangular chart box.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setCreateToolModalState({ isOpen: true, initialType: 'bar_chart' })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Chart Box</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {activityTools.map((tool) => (
                  <ChartBox
                    key={tool.id}
                    tool={tool}
                    allEntries={allEntries}
                    startDate={selectedStartDate}
                    endDate={todayStr}
                    onOpenToolDetail={onOpenToolDetail}
                    onDeleteTool={handleDeleteTool}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Tool Modal */}
      <CreateToolModal
        activityId={activity.id}
        activityName={activity.name}
        initialType={createToolModalState.initialType}
        isOpen={createToolModalState.isOpen}
        onClose={() => setCreateToolModalState({ isOpen: false })}
        onSave={handleCreateTool}
      />
    </div>
  );
};
