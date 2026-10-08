import React from 'react';
import { Activity } from '../../types/trackit';
import { ArrowRight, Trash2 } from 'lucide-react';

interface ActivityFolderBoxProps {
  activity: Activity;
  toolsCount: number;
  entriesCount: number;
  onSelect: (activityId: string) => void;
  onDelete: (activityId: string) => void;
}

export const ActivityFolderBox: React.FC<ActivityFolderBoxProps> = ({
  activity,
  toolsCount,
  entriesCount,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      onClick={() => onSelect(activity.id)}
      className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/70 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Header without icon/logo */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3 className="font-bold text-base text-slate-100 group-hover:text-indigo-300 transition-colors">
            {activity.name}
          </h3>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete activity "${activity.name}" and all its charts?`)) {
                  onDelete(activity.id);
                }
              }}
              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="Delete activity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* About Description */}
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
          {activity.description || 'No about description provided for this activity.'}
        </p>
      </div>

      {/* Bottom Footer Metadata */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span>{toolsCount} {toolsCount === 1 ? 'chart' : 'charts'}</span>
          <span>·</span>
          <span>{entriesCount} {entriesCount === 1 ? 'entry' : 'entries'}</span>
        </div>

        <span className="flex items-center gap-1 text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform text-xs">
          Open Activity
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
