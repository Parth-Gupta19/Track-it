/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { Activity, LogEntry, MeasurementTool } from './types/trackit';
import { storage } from './utils/storage';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/Home/HomePage';
import { ActivitiesPage } from './components/Activities/ActivitiesPage';
import { ReportEntryPage } from './components/ReportEntry/ReportEntryPage';
import { AIAgentPage } from './components/AIAgent/AIAgentPage';
import { AuthModal } from './components/Auth/AuthModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const [activeTab, setActiveTab] = useState<'home' | 'activities' | 'report' | 'agent'>('home');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tools, setTools] = useState<MeasurementTool[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [inceptionDate, setInceptionDate] = useState<string>('2026-09-29');

  // Track selected activity and tool within the Activities section
  const [selectedActivityId, setSelectedActivityId] = useState<string | undefined>(undefined);
  const [selectedToolId, setSelectedToolId] = useState<string | undefined>(undefined);

  // Pre-fill state when jumping from a tool folder directly to Report Entry
  const [reportPrefill, setReportPrefill] = useState<{
    activityId?: string;
    toolId?: string;
  }>({});

  const reloadData = useCallback(() => {
    setActivities(storage.getActivities());
    setTools(storage.getTools());
    setEntries(storage.getEntries());
    setInceptionDate(storage.getInceptionDate());
  }, []);

  useEffect(() => {
    reloadData();
    storage.fetchFromCloud();

    const handleDataUpdate = () => {
      reloadData();
    };

    window.addEventListener('trackit-data-updated', handleDataUpdate);
    return () => {
      window.removeEventListener('trackit-data-updated', handleDataUpdate);
    };
  }, [reloadData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        storage.setCurrentUser(user.uid);
        await storage.syncFromFirestore();
      } else {
        storage.setCurrentUser(null);
      }
      reloadData();
    });
    return () => unsubscribe();
  }, [reloadData]);

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleNavigateToReport = (activityId?: string, toolId?: string) => {
    if (activityId || toolId) {
      setReportPrefill({ activityId, toolId });
    }
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'report') setReportPrefill({});
        }}
        entriesCount={entries.length}
        user={currentUser}
        onOpenAuthModal={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <HomePage
            activities={activities}
            tools={tools}
            entries={entries}
            inceptionDate={inceptionDate}
            onNavigate={(page) => {
              setActiveTab(page);
              if (page !== 'report') setReportPrefill({});
            }}
            user={currentUser}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'activities' && (
          <ActivitiesPage
            activities={activities}
            tools={tools}
            entries={entries}
            inceptionDate={inceptionDate}
            selectedActivityId={selectedActivityId}
            selectedToolId={selectedToolId}
            onSelectActivity={(id) => {
              setSelectedActivityId(id);
              if (!id) setSelectedToolId(undefined);
            }}
            onSelectTool={(id) => setSelectedToolId(id)}
            onNavigateToReport={handleNavigateToReport}
          />
        )}

        {activeTab === 'report' && (
          <ReportEntryPage
            activities={activities}
            tools={tools}
            entries={entries}
            preSelectedActivityId={reportPrefill.activityId}
            preSelectedToolId={reportPrefill.toolId}
          />
        )}

        {activeTab === 'agent' && (
          <AIAgentPage
            activities={activities}
            tools={tools}
            entries={entries}
            onNavigateToActivities={() => setActiveTab('activities')}
            onNavigateToReport={() => setActiveTab('report')}
          />
        )}
      </main>

      {/* Sign In & Sign Up Modal Window */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => reloadData()}
      />

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Trackit</span>
            <span>·</span>
            <span>Strict-Time Activity & Metric Tracking System</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>{currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Guest Session'}</span>
            <span>·</span>
            <span>Google Cloud Firestore Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
