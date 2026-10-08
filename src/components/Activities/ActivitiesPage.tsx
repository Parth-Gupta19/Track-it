import React, { useState } from 'react';
import { Activity, LogEntry, MeasurementTool } from '../../types/trackit';
import { storage } from '../../utils/storage';
import { ActivityFolderBox } from './ActivityFolderBox';
import { ActivityDetailPage } from './ActivityDetailPage';
import { ChartDetailPage } from './ChartDetailPage';
import { CreateActivityModal } from './CreateActivityModal';
import { Plus } from 'lucide-react';

interface ActivitiesPageProps {
  activities: Activity[];
  tools: MeasurementTool[];
  entries: LogEntry[];
  inceptionDate: string;
  onNavigateToReport: (activityId?: string, toolId?: string) => void;
  // Deep linking props if any
  selectedActivityId?: string;
  selectedToolId?: string;
  onSelectActivity?: (id?: string) => void;
  onSelectTool?: (id?: string) => void;
}

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({
  activities,
  tools,
  entries,
  inceptionDate,
  onNavigateToReport,
  selectedActivityId: propSelectedActivityId,
  selectedToolId: propSelectedToolId,
  onSelectActivity,
  onSelectTool,
}) => {
  const [internalSelectedActivityId, setInternalSelectedActivityId] = useState<string | undefined>(
    propSelectedActivityId
  );
  const [internalSelectedToolId, setInternalSelectedToolId] = useState<string | undefined>(
    propSelectedToolId
  );
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);

  const selectedActivityId = propSelectedActivityId !== undefined ? propSelectedActivityId : internalSelectedActivityId;
  const selectedToolId = propSelectedToolId !== undefined ? propSelectedToolId : internalSelectedToolId;

  const handleSelectActivity = (id?: string) => {
    if (onSelectActivity) onSelectActivity(id);
    setInternalSelectedActivityId(id);
    if (!id) {
      if (onSelectTool) onSelectTool(undefined);
      setInternalSelectedToolId(undefined);
    }
  };

  const handleSelectTool = (id?: string) => {
    if (onSelectTool) onSelectTool(id);
    setInternalSelectedToolId(id);
  };

  const handleCreateActivity = (activityData: Omit<Activity, 'id' | 'createdAt'>) => {
    const created = storage.addActivity(activityData);
    handleSelectActivity(created.id);
  };

  const handleDeleteActivity = (activityId: string) => {
    storage.deleteActivity(activityId);
    if (selectedActivityId === activityId) {
      handleSelectActivity(undefined);
    }
  };

  // If a specific tool is selected, render the dedicated Chart Detail Page
  if (selectedActivityId && selectedToolId) {
    const activeActivity = activities.find((a) => a.id === selectedActivityId);
    const activeTool = tools.find((t) => t.id === selectedToolId);

    if (activeActivity && activeTool) {
      return (
        <ChartDetailPage
          activity={activeActivity}
          tool={activeTool}
          allEntries={entries}
          inceptionDate={inceptionDate}
          onBack={() => handleSelectTool(undefined)}
          onNavigateToReport={(actId, toolId) => onNavigateToReport(actId, toolId)}
        />
      );
    }
  }

  // If an activity is selected, render the dedicated Activity Page
  if (selectedActivityId) {
    const activeActivity = activities.find((a) => a.id === selectedActivityId);
    if (activeActivity) {
      return (
        <ActivityDetailPage
          activity={activeActivity}
          allTools={tools}
          allEntries={entries}
          inceptionDate={inceptionDate}
          onBack={() => handleSelectActivity(undefined)}
          onOpenToolDetail={(toolId) => handleSelectTool(toolId)}
          onNavigateToReport={(actId, toolId) => onNavigateToReport(actId, toolId)}
        />
      );
    }
  }

  // Main Activity List Homepage:
  // - Activities formatted as simple folders/rectangular boxes with only activity name & "about" description
  // - No logos
  // - No tool catalog on this main page
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Activities</h1>
          <p className="text-xs text-slate-400 mt-1">
            Select an activity to open its dedicated window, customize measurement chart boxes, and track progress.
          </p>
        </div>

        {/* Primary Plus Button to create new activity */}
        <button
          type="button"
          onClick={() => setIsCreateActivityOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Activity</span>
        </button>
      </div>

      {/* Activities Grid: simple rectangular boxes */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-800 rounded-2xl p-8">
          <h3 className="text-base font-semibold text-slate-200">No Activities Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
            Get started by creating your first activity folder box.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateActivityOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Activity</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((act) => {
            const actTools = tools.filter((t) => t.activityId === act.id);
            const actEntries = entries.filter((e) => e.activityId === act.id);
            return (
              <ActivityFolderBox
                key={act.id}
                activity={act}
                toolsCount={actTools.length}
                entriesCount={actEntries.length}
                onSelect={(id) => handleSelectActivity(id)}
                onDelete={(id) => handleDeleteActivity(id)}
              />
            );
          })}
        </div>
      )}

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateActivityOpen}
        onClose={() => setIsCreateActivityOpen(false)}
        onSave={handleCreateActivity}
      />
    </div>
  );
};
