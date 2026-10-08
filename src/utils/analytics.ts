import { LogEntry, MeasurementTool, StatisticalFindings, TimePeriod } from '../types/trackit';

/**
 * Calculate statistical findings (Mean, Mode, Growth %, Min, Max, Total) for a tool's entries.
 */
export function calculateToolFindings(entries: LogEntry[]): StatisticalFindings {
  if (!entries || entries.length === 0) {
    return {
      count: 0,
      total: 0,
      mean: 0,
      mode: null,
      min: 0,
      max: 0,
      growthPercent: null,
      latestValue: 0,
      trend: 'insufficient_data',
    };
  }

  // Sort chronologically
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const values = sorted.map((e) => e.totalValue);

  const count = values.length;
  const total = values.reduce((sum, v) => sum + v, 0);
  const mean = Math.round((total / count) * 100) / 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const latestValue = values[values.length - 1];

  // Calculate Mode (most frequent value)
  const frequencyMap: Record<number, number> = {};
  let maxFreq = 0;
  let mode: number | null = null;

  for (const v of values) {
    frequencyMap[v] = (frequencyMap[v] || 0) + 1;
    if (frequencyMap[v] > maxFreq) {
      maxFreq = frequencyMap[v];
      mode = v;
    }
  }

  // If all values appear only once and count > 1, mode isn't distinct
  if (count > 1 && maxFreq === 1) {
    mode = null; // No repeated mode
  }

  // Calculate Growth Percentage: compare earliest to latest
  let growthPercent: number | null = null;
  let trend: 'up' | 'down' | 'neutral' | 'insufficient_data' = 'insufficient_data';

  if (count >= 2) {
    const earliest = values[0];
    if (earliest === 0) {
      growthPercent = latestValue > 0 ? 100 : 0;
    } else {
      growthPercent = Math.round(((latestValue - earliest) / Math.abs(earliest)) * 1000) / 10;
    }

    if (growthPercent > 0) trend = 'up';
    else if (growthPercent < 0) trend = 'down';
    else trend = 'neutral';
  } else if (count === 1) {
    trend = 'neutral';
  }

  return {
    count,
    total,
    mean,
    mode,
    min,
    max,
    growthPercent,
    latestValue,
    trend,
  };
}

/**
 * Filter entries according to date range
 */
export function filterEntriesByDateRange(
  entries: LogEntry[],
  startDate: string,
  endDate: string
): LogEntry[] {
  return entries.filter((e) => {
    return e.date >= startDate && e.date <= endDate;
  });
}

/**
 * Given a TimePeriod, compute the corresponding startDate and endDate (today)
 */
export function getDateRangeFromPeriod(period: TimePeriod, referenceDate = new Date()): { startDate: string; endDate: string } {
  const end = new Date(referenceDate);
  const start = new Date(referenceDate);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  switch (period) {
    case '1_day':
      // Just today
      return { startDate: formatDate(end), endDate: formatDate(end) };
    case '1_month':
      start.setMonth(start.getMonth() - 1);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    case '2_month':
      start.setMonth(start.getMonth() - 2);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    case '3_month':
      start.setMonth(start.getMonth() - 3);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    case '6_month':
      start.setMonth(start.getMonth() - 6);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    case '1_year':
      start.setFullYear(start.getFullYear() - 1);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    case 'all':
    default:
      return { startDate: '2020-01-01', endDate: formatDate(end) };
  }
}

/**
 * Human-readable period label
 */
export function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case '1_day':
      return '1 Day';
    case '1_month':
      return '1 Month';
    case '2_month':
      return '2 Months';
    case '3_month':
      return '3 Months';
    case '6_month':
      return '6 Months';
    case '1_year':
      return '1 Year';
    case 'all':
      return 'All Time';
  }
}

/**
 * Calculate the number of days elapsed between two dates
 */
export function getDaysBetween(startDateStr: string, endDateStr = new Date().toISOString().split('T')[0]): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Generate CSV formatted string from stored records
 */
export function generateCSVExport(
  entries: LogEntry[],
  tools: Record<string, MeasurementTool>,
  activityNames: Record<string, string>
): string {
  const headers = ['Entry ID', 'Date', 'Time', 'Activity', 'Measurement Tool', 'Tool Type', 'Recorded Values', 'Total / Metric', 'Unit', 'Notes'];

  const rows = entries.map((e) => {
    const tool = tools[e.toolId];
    const activityName = activityNames[e.activityId] || 'Unknown Activity';
    const toolName = tool ? tool.name : 'Unknown Tool';
    const toolType = tool ? tool.type : 'N/A';
    const unit = tool?.config.unit || '';
    
    // Format values as "Category: Value; ..."
    const valuesFormatted = Object.entries(e.values)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const safeNotes = (e.notes || '').replace(/"/g, '""');

    return [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.time || ''}"`,
      `"${activityName}"`,
      `"${toolName}"`,
      `"${toolType}"`,
      `"${valuesFormatted}"`,
      e.totalValue,
      `"${unit}"`,
      `"${safeNotes}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
