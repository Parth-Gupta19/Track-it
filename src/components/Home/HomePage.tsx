import React, { useState, useMemo } from 'react';
import { Activity, LogEntry, MeasurementTool } from '../../types/trackit';
import { getDaysBetween } from '../../utils/analytics';
import {
  Activity as ActivityIcon,
  Calendar,
  Layers,
  BarChart3,
  Bot,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Quote,
  ShieldCheck,
  CheckCircle,
  Plus,
  Lock,
  Cloud,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HomePageProps {
  activities: Activity[];
  tools: MeasurementTool[];
  entries: LogEntry[];
  inceptionDate: string;
  onNavigate: (page: 'home' | 'activities' | 'report' | 'agent') => void;
  user?: User | null;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

const MOTIVATIONAL_QUOTES = [
  {
    quote: 'If you cannot measure it, you cannot improve it. When you can measure what you are speaking about and express it in numbers, you know something about it.',
    author: 'Lord Kelvin',
    context: 'Mathematical & Physical Pioneer',
  },
  {
    quote: 'What gets measured gets managed. Consistent logging removes illusion and reveals true velocity.',
    author: 'Peter Drucker',
    context: 'Management Philosopher',
  },
  {
    quote: 'You do not rise to the level of your goals. You fall to the level of your systems. Precision measurement creates unbreakable systems.',
    author: 'James Clear',
    context: 'Behavioral Scientist & Author',
  },
  {
    quote: 'Discipline is choosing between what you want now and what you want most. Data is the compass that keeps you honest.',
    author: 'Abraham Lincoln',
    context: 'Historical Leader',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  activities,
  tools,
  entries,
  inceptionDate,
  onNavigate,
  user,
  onOpenAuth,
}) => {
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Compute No. of Days for which website is running
  const todayStr = new Date().toISOString().split('T')[0];
  const daysRunning = useMemo(() => {
    return Math.max(0, getDaysBetween(inceptionDate, todayStr));
  }, [inceptionDate, todayStr]);

  // Compute active days with entries
  const uniqueLoggedDays = useMemo(() => {
    const dates = new Set(entries.map((e) => e.date));
    return dates.size;
  }, [entries]);

  const activeQuote = MOTIVATIONAL_QUOTES[quoteIdx];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Cloud Account Protection Notice if not logged in */}
      {!user && onOpenAuth && (
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Private Cloud Workspace</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                  Cloud Firestore
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sign in or create an account so your whole app data is isolated, protected, and saved separately on our cloud database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Sign Up
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Motivational Quote & How App Helps Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Quote className="w-36 h-36 text-indigo-400" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Daily Discipline & Scientific Clarity</span>
          </div>

          <blockquote className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed italic">
            "{activeQuote.quote}"
          </blockquote>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-sm font-bold text-indigo-300">{activeQuote.author}</span>
              <span className="text-xs text-slate-500 ml-2">· {activeQuote.context}</span>
            </div>

            <button
              onClick={() => setQuoteIdx((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
              className="text-xs text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Cycle inspiration →
            </button>
          </div>

          {/* How the App Helps Section */}
          <div className="mt-4 pt-4 border-t border-slate-800/60 bg-slate-950/40 rounded-xl p-4 text-xs text-slate-300 leading-relaxed space-y-2">
            <div className="font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How Trackit Empowers Your Progress:</span>
            </div>
            <p className="text-slate-400">
              Vague intentions easily lead to stalled habits. Trackit brings objective measurement into your daily routine. By categorizing activities, deploying dedicated measurement tools (custom Bar Charts, Pie distributions, Line trajectories, and Counters), and applying strict time-stamping, Trackit turns effort into actionable mathematical patterns—allowing you to inspect growth percentages, mode frequencies, and long-term consistency.
            </p>
          </div>
        </div>
      </div>

      {/* The Measurement Bar (KPI Metrics requested by user) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>App Measurement Bar & System Velocity</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Active since {inceptionDate} · Today {todayStr}
          </span>
        </div>

        {/* Primary Metric Bar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. No. Of Activities */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">No. Of Activities</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white">
                {activities.length}
              </span>
              <span className="text-xs text-slate-500">configured</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 truncate">
              {activities.length > 0 ? (
                <>
                  {activities.map((a) => a.name).slice(0, 2).join(', ')}
                  {activities.length > 2 ? ` +${activities.length - 2} more` : ''}
                </>
              ) : (
                <span className="text-slate-500">Ready for initial setup</span>
              )}
            </div>
          </div>

          {/* 2. No. Of Days Website Is Running */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Days Website Running</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400">
                {daysRunning}
              </span>
              <span className="text-xs text-slate-500">days active</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Continuous uptime & tracking history
            </div>
          </div>

          {/* 3. Measurement Tools Active */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Measurement Tools</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white">
                {tools.length}
              </span>
              <span className="text-xs text-slate-500">active tools</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Bar, Pie, Line, and Counter tools
            </div>
          </div>

          {/* 4. Strict Time Entries Recorded */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Stored Records</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-cyan-400">
                {entries.length}
              </span>
              <span className="text-xs text-slate-500">timestamped logs</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Across {uniqueLoggedDays} unique dates
            </div>
          </div>
        </div>

        {/* Visual Progress Bar Strip */}
        <div className="mt-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Activity Coverage & System Density</span>
            <span className="font-mono text-indigo-300">
              {activities.length > 0 ? `${entries.length} records across ${activities.length} activities` : 'No activities yet'}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex gap-1">
            {activities.length > 0 && entries.length > 0 ? (
              activities.map((act) => {
                const count = entries.filter((e) => e.activityId === act.id).length;
                const pct = entries.length > 0 ? (count / entries.length) * 100 : 0;
                return (
                  <div
                    key={act.id}
                    title={`${act.name}: ${count} entries (${Math.round(pct)}%)`}
                    style={{ width: `${pct}%`, backgroundColor: act.color || '#6366f1' }}
                    className="h-full rounded-sm transition-all duration-500"
                  />
                );
              })
            ) : (
              <div className="w-full h-full bg-slate-800/40 rounded-full" />
            )}
          </div>

          {activities.length > 0 && (
            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 flex-wrap">
              {activities.map((act) => (
                <div key={act.id} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: act.color || '#6366f1' }} />
                  <span>{act.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty State Onboarding if user has 0 activities */}
      {activities.length === 0 && (
        <div className="p-6 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Ready for Clean Deployment</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              All pre-declared mock data has been purged. Create your initial activity folder box or ask the Gemini AI Agent to configure custom measurement tools for you.
            </p>
          </div>

          <button
            onClick={() => onNavigate('activities')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Activity</span>
          </button>
        </div>
      )}

      {/* Mechanism & Quick Navigation Pathway */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          App Architecture & Navigation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Activities */}
          <div
            onClick={() => onNavigate('activities')}
            className="group p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-xl cursor-pointer transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs text-indigo-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                Activities & Chart Windows
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Browse activities as clean folder boxes. Open dedicated windows with common tool catalogs, rectangular chart boxes, and two-dot chronological timelines.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activities.length} activities · {tools.length} chart boxes</span>
            </div>
          </div>

          {/* Card 2: Report Entry */}
          <div
            onClick={() => onNavigate('report')}
            className="group p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-xl cursor-pointer transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Record <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                Report Entry & Cloud Sync
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Strict time system for precise historical and daily recording. Dynamic forms tailored to Bar, Pie, Line, and Counter tools with CSV/JSON exports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time database sync active</span>
            </div>
          </div>

          {/* Card 3: AI Agent */}
          <div
            onClick={() => onNavigate('agent')}
            className="group p-5 bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-xl cursor-pointer transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-xs text-purple-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open AI <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors">
                Google Gemini AI Agent
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Intelligent assistant with voice input. Can log entries into any activity, create tools, and calculate exact growth % and mode findings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Voice input & autonomous management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
