import React, { useState } from 'react';
import { MeasurementTool, MeasurementToolType } from '../../types/trackit';
import { X, BarChart3, PieChart, LineChart, Hash, Check } from 'lucide-react';

interface CreateToolModalProps {
  activityId: string;
  activityName: string;
  initialType?: MeasurementToolType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (toolData: Omit<MeasurementTool, 'id' | 'createdAt'>) => void;
}

export const CreateToolModal: React.FC<CreateToolModalProps> = ({
  activityId,
  activityName,
  initialType = 'bar_chart',
  isOpen,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<MeasurementToolType>(initialType);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [yAxisLabel, setYAxisLabel] = useState('');
  const [unit, setUnit] = useState('');
  const [target, setTarget] = useState<string>('');
  const [color, setColor] = useState('#6366f1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let parsedCategories: string[] = [];
    if (type === 'bar_chart' || type === 'pie_chart') {
      parsedCategories = categoriesInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (parsedCategories.length === 0) {
        parsedCategories = type === 'bar_chart' ? ['Category A', 'Category B'] : ['Slice 1', 'Slice 2'];
      }
    }

    onSave({
      activityId,
      name: name.trim(),
      purpose: purpose.trim() || 'Track ongoing performance',
      type,
      config: {
        categories: parsedCategories.length > 0 ? parsedCategories : undefined,
        yAxisLabel: yAxisLabel.trim() || undefined,
        unit: unit.trim() || (type === 'counter' ? 'count' : 'units'),
        target: target ? Number(target) : undefined,
        color,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Create Measurement Tool Folder</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Adding to activity: <span className="text-indigo-400 font-medium">{activityName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Tool Type Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Measurement Tool Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('bar_chart')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-start gap-1.5 transition-all ${
                  type === 'bar_chart'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-xs">Bar Chart</span>
                <span className="text-[10px] text-slate-500">Multi-bars comparison</span>
              </button>

              <button
                type="button"
                onClick={() => setType('pie_chart')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-start gap-1.5 transition-all ${
                  type === 'pie_chart'
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <PieChart className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-xs">Pie Chart</span>
                <span className="text-[10px] text-slate-500">Proportional shares</span>
              </button>

              <button
                type="button"
                onClick={() => setType('line_chart')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-start gap-1.5 transition-all ${
                  type === 'line_chart'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <LineChart className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-xs">Line Trend</span>
                <span className="text-[10px] text-slate-500">Time trajectory</span>
              </button>

              <button
                type="button"
                onClick={() => setType('counter')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-start gap-1.5 transition-all ${
                  type === 'counter'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Hash className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-xs">Counter</span>
                <span className="text-[10px] text-slate-500">Cumulative target</span>
              </button>
            </div>
          </div>

          {/* Name & Reason */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Tool Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Muscle Group Split, Deep Work Languages, Reading Pace"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Purpose / Reason For Making It
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. To maintain balanced upper vs lower body training load without overtraining."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs resize-none"
            />
          </div>

          {/* Tool specific parameters */}
          {(type === 'bar_chart' || type === 'pie_chart') && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {type === 'bar_chart' ? 'What will different bars be? (Categories)' : 'What will slices be? (Categories)'}
              </label>
              <input
                type="text"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
                placeholder="Separate with commas: Upper Body, Lower Body, Core, Cardio"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Comma-separated items will become individual {type === 'bar_chart' ? 'bars' : 'pie slices'}.
              </span>
            </div>
          )}

          {type === 'bar_chart' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Y-Axis Graph Label
              </label>
              <input
                type="text"
                value={yAxisLabel}
                onChange={(e) => setYAxisLabel(e.target.value)}
                placeholder="e.g. Minutes Trained, Kilograms, Repetitions, Hours"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Measurement Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. mins, kg, hrs, pages, count"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {type === 'counter' ? 'Target Milestone' : 'Target Goal (Optional)'}
              </label>
              <input
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={type === 'counter' ? '100' : 'e.g. 75'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Create Tool Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
