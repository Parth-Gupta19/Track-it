import React from 'react';
import { Activity as ActivityIcon, Layers, Calendar, Bot, LogIn, LogOut, Cloud, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase';
import { signOut, User } from 'firebase/auth';
import { storage } from '../utils/storage';

interface NavbarProps {
  activeTab: 'home' | 'activities' | 'report' | 'agent';
  onTabChange: (tab: 'home' | 'activities' | 'report' | 'agent') => void;
  entriesCount: number;
  user: User | null;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  user,
  onOpenAuthModal,
}) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      storage.setCurrentUser(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
            <ActivityIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              Trackit
              <span className="text-[10px] text-indigo-400 font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800">
                PRO
              </span>
            </span>
            <span className="text-[10px] text-slate-400">Strict Metric Tracking</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onTabChange('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'home'
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>Home</span>
          </button>

          <button
            onClick={() => onTabChange('activities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Activities List</span>
          </button>

          <button
            onClick={() => onTabChange('report')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'report'
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report Entry</span>
          </button>

          <button
            onClick={() => onTabChange('agent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'agent'
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Agent</span>
          </button>
        </nav>

        {/* Sync & Auth Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-400 border border-emerald-950/80 rounded-lg px-2.5 py-1 bg-emerald-950/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Cloud className="w-3 h-3" />
                <span>Protected Workspace</span>
              </div>

              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-200 max-w-[110px] truncate leading-tight">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">Separate Cloud Store</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out & protect session"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal('signin')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Sign Up</span>
              </button>
            </div>
          )}

          <button
            onClick={() => onTabChange('report')}
            className="hidden sm:block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Quick Log
          </button>
        </div>
      </div>
    </header>
  );
};
