export type MeasurementToolType = 'bar_chart' | 'pie_chart' | 'line_chart' | 'counter';

export interface MeasurementToolConfig {
  categories?: string[];
  yAxisLabel?: string;
  unit: string;
  target?: number;
  color?: string;
}

export interface MeasurementTool {
  id: string;
  activityId: string;
  name: string;
  purpose: string;
  type: MeasurementToolType;
  config: MeasurementToolConfig;
  createdAt: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  activityId: string;
  toolId: string;
  date: string; // ISO format YYYY-MM-DD
  time?: string; // HH:mm
  timestamp: number;
  values: Record<string, number>;
  totalValue: number;
  notes?: string;
}

export type TimePeriod = '1_day' | '1_month' | '2_month' | '3_month' | '6_month' | '1_year' | 'all';

export interface DateFilterRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  period: TimePeriod;
}

export interface AppMetadata {
  siteLaunchDate: string;
  totalDaysRunning: number;
  activeTrackingDays: number;
}

export interface StatisticalFindings {
  count: number;
  total: number;
  mean: number;
  mode: number | null;
  min: number;
  max: number;
  growthPercent: number | null; // change from earliest in window to latest in window
  latestValue: number;
  trend: 'up' | 'down' | 'neutral' | 'insufficient_data';
}

export interface AIAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionTaken?: {
    type: 'add_entry' | 'create_activity' | 'create_tool' | 'analytics_report';
    details: string;
    targetId?: string;
  };
}
