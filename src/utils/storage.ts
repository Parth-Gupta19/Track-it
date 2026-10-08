import { Activity, LogEntry, MeasurementTool } from '../types/trackit';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

export const INITIAL_INCEPTION_DATE = '2026-09-29';

// Clean empty arrays for production deploy - no pre-declared mock data
export const DEFAULT_ACTIVITIES: Activity[] = [];
export const DEFAULT_TOOLS: MeasurementTool[] = [];
export const DEFAULT_ENTRIES: LogEntry[] = [];

const STORAGE_KEY_ACTIVITIES = 'trackit_activities_v2';
const STORAGE_KEY_TOOLS = 'trackit_tools_v2';
const STORAGE_KEY_ENTRIES = 'trackit_entries_v2';
const STORAGE_KEY_INCEPTION = 'trackit_inception_date_v2';

// Purge any old pre-declared dummy test data from previous dev sessions
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('trackit_clean_deploy_v2') !== 'true') {
      localStorage.removeItem('trackit_activities_v1');
      localStorage.removeItem('trackit_tools_v1');
      localStorage.removeItem('trackit_entries_v1');
      localStorage.removeItem('trackit_inception_date_v1');
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_INCEPTION, INITIAL_INCEPTION_DATE);
      localStorage.setItem('trackit_clean_deploy_v2', 'true');
    }
  } catch (e) {
    // Ignore in non-browser context
  }
}

export class TrackitStorage {
  private static instance: TrackitStorage;
  private currentUserId: string | null = null;

  static getInstance(): TrackitStorage {
    if (!TrackitStorage.instance) {
      TrackitStorage.instance = new TrackitStorage();
    }
    return TrackitStorage.instance;
  }

  setCurrentUser(userId: string | null) {
    const prevUserId = this.currentUserId;
    this.currentUserId = userId;
    // When switching or logging out, clear cached local state so data is strictly separated
    if (prevUserId !== userId) {
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify([]));
      } catch (e) {
        // ignore
      }
      this.notifyChange();
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  getInceptionDate(): string {
    const stored = localStorage.getItem(STORAGE_KEY_INCEPTION);
    if (stored) return stored;
    localStorage.setItem(STORAGE_KEY_INCEPTION, INITIAL_INCEPTION_DATE);
    return INITIAL_INCEPTION_DATE;
  }

  getActivities(): Activity[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse activities from storage', e);
    }
    return DEFAULT_ACTIVITIES;
  }

  saveActivities(activities: Activity[]) {
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    this.notifyChange();
    this.syncToCloud({ activities });
  }

  getTools(): MeasurementTool[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TOOLS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse tools from storage', e);
    }
    return DEFAULT_TOOLS;
  }

  saveTools(tools: MeasurementTool[]) {
    localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(tools));
    this.notifyChange();
    this.syncToCloud({ tools });
  }

  getEntries(): LogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse entries from storage', e);
    }
    return DEFAULT_ENTRIES;
  }

  saveEntries(entries: LogEntry[]) {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    this.notifyChange();
    this.syncToCloud({ entries });
  }

  addEntry(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    const entries = this.getEntries();
    const newEntry: LogEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(`${entry.date}T${entry.time || '12:00'}:00`).getTime() || Date.now(),
    };
    entries.unshift(newEntry);
    this.saveEntries(entries);
    this.syncEntryToFirestore(newEntry);
    return newEntry;
  }

  deleteEntry(id: string): boolean {
    const entries = this.getEntries();
    const filtered = entries.filter((e) => e.id !== id);
    if (filtered.length !== entries.length) {
      this.saveEntries(filtered);
      this.deleteEntryFromFirestore(id);
      return true;
    }
    return false;
  }

  addActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Activity {
    const activities = this.getActivities();
    const newActivity: Activity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    activities.push(newActivity);
    this.saveActivities(activities);
    this.syncActivityToFirestore(newActivity);
    return newActivity;
  }

  deleteActivity(id: string): boolean {
    const activities = this.getActivities();
    const filtered = activities.filter((a) => a.id !== id);
    if (filtered.length !== activities.length) {
      this.saveActivities(filtered);

      const tools = this.getTools().filter((t) => t.activityId !== id);
      this.saveTools(tools);

      const entries = this.getEntries().filter((e) => e.activityId !== id);
      this.saveEntries(entries);

      this.deleteActivityFromFirestore(id);
      return true;
    }
    return false;
  }

  addTool(tool: Omit<MeasurementTool, 'id' | 'createdAt'>): MeasurementTool {
    const tools = this.getTools();
    const newTool: MeasurementTool = {
      ...tool,
      id: `tool_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    tools.push(newTool);
    this.saveTools(tools);
    this.syncToolToFirestore(newTool);
    return newTool;
  }

  deleteTool(id: string): boolean {
    const tools = this.getTools();
    const filtered = tools.filter((t) => t.id !== id);
    if (filtered.length !== tools.length) {
      this.saveTools(filtered);

      const entries = this.getEntries().filter((e) => e.toolId !== id);
      this.saveEntries(entries);

      this.deleteToolFromFirestore(id);
      return true;
    }
    return false;
  }

  resetToDefault() {
    this.saveActivities([]);
    this.saveTools([]);
    this.saveEntries([]);
  }

  private notifyChange() {
    window.dispatchEvent(new CustomEvent('trackit-data-updated'));
  }

  private async syncToCloud(payload: { activities?: Activity[]; tools?: MeasurementTool[]; entries?: LogEntry[] }) {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Offline fallback
    }
  }

  async fetchFromCloud() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
          localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(data.activities));
        }
        if (data.tools && Array.isArray(data.tools) && data.tools.length > 0) {
          localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(data.tools));
        }
        if (data.entries && Array.isArray(data.entries) && data.entries.length > 0) {
          localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(data.entries));
        }
        this.notifyChange();
      }
    } catch {
      // Local storage continues
    }
  }

  // --- Firestore User Sync Operations (Account Separation & Cloud Protection) ---
  async syncFromFirestore() {
    if (!this.currentUserId) return;
    try {
      const userDocRef = doc(db, 'users', this.currentUserId);

      // Fetch user activities
      const actsSnap = await getDocs(collection(userDocRef, 'activities'));
      const firestoreActs: Activity[] = [];
      actsSnap.forEach((d) => firestoreActs.push(d.data() as Activity));

      // Fetch user tools
      const toolsSnap = await getDocs(collection(userDocRef, 'tools'));
      const firestoreTools: MeasurementTool[] = [];
      toolsSnap.forEach((d) => firestoreTools.push(d.data() as MeasurementTool));

      // Fetch user entries
      const entriesSnap = await getDocs(collection(userDocRef, 'entries'));
      const firestoreEntries: LogEntry[] = [];
      entriesSnap.forEach((d) => firestoreEntries.push(d.data() as LogEntry));

      if (firestoreActs.length > 0) {
        this.saveActivities(firestoreActs);
      } else {
        // Sync any current local activities to this user's newly created cloud workspace
        const localActs = this.getActivities();
        for (const act of localActs) {
          await this.syncActivityToFirestore(act);
        }
      }

      if (firestoreTools.length > 0) {
        this.saveTools(firestoreTools);
      } else {
        const localTools = this.getTools();
        for (const tool of localTools) {
          await this.syncToolToFirestore(tool);
        }
      }

      if (firestoreEntries.length > 0) {
        this.saveEntries(firestoreEntries);
      } else {
        const localEntries = this.getEntries();
        for (const entry of localEntries) {
          await this.syncEntryToFirestore(entry);
        }
      }

      this.notifyChange();
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.GET, `users/${this.currentUserId}`);
      } else {
        console.warn('Could not sync user data from Firestore:', e);
      }
    }
  }

  private async syncActivityToFirestore(activity: Activity) {
    if (!this.currentUserId) return;
    const path = `users/${this.currentUserId}/activities/${activity.id}`;
    try {
      const actRef = doc(db, 'users', this.currentUserId, 'activities', activity.id);
      await setDoc(actRef, { ...activity, userId: this.currentUserId }, { merge: true });
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.WRITE, path);
      } else {
        console.warn('Failed to sync activity to Firestore:', e);
      }
    }
  }

  private async deleteActivityFromFirestore(activityId: string) {
    if (!this.currentUserId) return;
    const path = `users/${this.currentUserId}/activities/${activityId}`;
    try {
      const actRef = doc(db, 'users', this.currentUserId, 'activities', activityId);
      await deleteDoc(actRef);
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.DELETE, path);
      } else {
        console.warn('Failed to delete activity from Firestore:', e);
      }
    }
  }

  private async syncToolToFirestore(tool: MeasurementTool) {
    if (!this.currentUserId) return;
    const path = `users/${this.currentUserId}/tools/${tool.id}`;
    try {
      const toolRef = doc(db, 'users', this.currentUserId, 'tools', tool.id);
      await setDoc(toolRef, { ...tool, userId: this.currentUserId }, { merge: true });
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.WRITE, path);
      } else {
        console.warn('Failed to sync tool to Firestore:', e);
      }
    }
  }

  private async deleteToolFromFirestore(toolId: string) {
    if (!this.currentUserId) return;
    const path = `users/${this.currentUserId}/tools/${toolId}`;
    try {
      const toolRef = doc(db, 'users', this.currentUserId, 'tools', toolId);
      await deleteDoc(toolRef);
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.DELETE, path);
      } else {
        console.warn('Failed to delete tool from Firestore:', e);
      }
    }
  }

  private async syncEntryToFirestore(entry: LogEntry) {
    if (!this.currentUserId) return;
    const path = `users/${this.currentUserId}/entries/${entry.id}`;
    try {
      const entryRef = doc(db, 'users', this.currentUserId, 'entries', entry.id);
      await setDoc(entryRef, { ...entry, userId: this.currentUserId }, { merge: true });
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.WRITE, path);
      } else {
        console.warn('Failed to sync entry to Firestore:', e);
      }
    }
  }

  private async deleteEntryFromFirestore(entryId: string) {
    if (!this.currentUserId) return;
    const path = `users/${this.currentUserId}/entries/${entryId}`;
    try {
      const entryRef = doc(db, 'users', this.currentUserId, 'entries', entryId);
      await deleteDoc(entryRef);
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.DELETE, path);
      } else {
        console.warn('Failed to delete entry from Firestore:', e);
      }
    }
  }
}

export const storage = TrackitStorage.getInstance();
