import type {
  Outcome,
  OutcomeCounts,
  CompletionStats,
  TimeOfDaySummary,
  DailySummary,
  HourlyEntry,
} from '@/types';

/**
 * Generates an array of time slot strings between startHour and endHour (inclusive).
 * Default: 6 to 21 (6 AM to 9 PM) = 16 slots.
 */
export function generateTimeSlots(
  startHour: number = 6,
  endHour: number = 21,
  intervalMinutes: number = 60
): string[] {
  const slots: string[] = [];
  const startTotalMinutes = startHour * 60;
  const endTotalMinutes = endHour * 60;

  for (let mins = startTotalMinutes; mins <= endTotalMinutes; mins += intervalMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const hourStr = String(h).padStart(2, '0');
    const minStr = String(m).padStart(2, '0');
    slots.push(`${hourStr}:${minStr}`);
  }

  return slots;
}

/**
 * Formats a 24-hour slot like "06:00" or "13:00" into a friendly label like "6 AM" or "1 PM".
 */
export function formatSlotLabel(slot: string): string {
  const [hourStr, minStr] = slot.split(':');
  const hour = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);

  if (isNaN(hour)) return slot;

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  if (minutes === 0) {
    return `${displayHour} ${period}`;
  }
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Calculates raw counts of positive, negative, and neutral entries.
 * Missing / unanswered slots are NOT treated as negative.
 */
export function calculateOutcomeCounts(
  entries: Array<{ outcomeSnapshot: Outcome }>
): OutcomeCounts {
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const entry of entries) {
    if (entry.outcomeSnapshot === 'positive') {
      positive++;
    } else if (entry.outcomeSnapshot === 'negative') {
      negative++;
    } else if (entry.outcomeSnapshot === 'neutral') {
      neutral++;
    }
  }

  return {
    positive,
    negative,
    neutral,
    totalAnswered: entries.length,
  };
}

/**
 * Calculates completion stats with an explicit denominator.
 * Never misleads with arbitrary negative assumptions for unanswered data.
 */
export function calculateCompletionStats(
  totalSlots: number,
  answeredSlots: number
): CompletionStats {
  const safeTotal = Math.max(0, totalSlots);
  const safeAnswered = Math.min(safeTotal, Math.max(0, answeredSlots));
  const unansweredSlots = safeTotal - safeAnswered;

  const completionRatePercent =
    safeTotal > 0 ? Math.round((safeAnswered / safeTotal) * 1000) / 10 : 0;

  return {
    totalSlots: safeTotal,
    answeredSlots: safeAnswered,
    unansweredSlots,
    completionRatePercent,
  };
}

/**
 * Maps a time slot ("HH:MM") to a day partition.
 * Morning: 06:00 - 11:59
 * Afternoon: 12:00 - 16:59
 * Evening: 17:00 - 23:59
 */
export function getTimeOfDayCategory(slot: string): 'morning' | 'afternoon' | 'evening' {
  const hour = parseInt(slot.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Summarizes outcomes partitioned by time of day (morning, afternoon, evening).
 */
export function calculateTimeOfDaySummary(
  entries: Array<{ timeSlot: string; outcomeSnapshot: Outcome }>
): TimeOfDaySummary {
  const morningEntries: Array<{ outcomeSnapshot: Outcome }> = [];
  const afternoonEntries: Array<{ outcomeSnapshot: Outcome }> = [];
  const eveningEntries: Array<{ outcomeSnapshot: Outcome }> = [];

  for (const entry of entries) {
    const category = getTimeOfDayCategory(entry.timeSlot);
    if (category === 'morning') morningEntries.push(entry);
    else if (category === 'afternoon') afternoonEntries.push(entry);
    else eveningEntries.push(entry);
  }

  return {
    morning: calculateOutcomeCounts(morningEntries),
    afternoon: calculateOutcomeCounts(afternoonEntries),
    evening: calculateOutcomeCounts(eveningEntries),
  };
}

/**
 * Computes complete daily summary statistics for dashboard and analytics consumption.
 */
export function calculateDailySummary(
  date: string,
  totalActiveQuestions: number,
  slotsPerQuestion: number,
  entries: HourlyEntry[]
): DailySummary {
  const totalSlots = totalActiveQuestions * slotsPerQuestion;
  const answeredSlots = entries.length;

  return {
    date,
    totalActiveQuestions,
    completion: calculateCompletionStats(totalSlots, answeredSlots),
    outcomes: calculateOutcomeCounts(entries),
    timeOfDay: calculateTimeOfDaySummary(entries),
  };
}

/**
 * Returns today's date formatted as YYYY-MM-DD in the local or specified timezone.
 */
export function getTodayString(targetDate: Date = new Date()): string {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns an adjacent date (offset by offsetDays) formatted as YYYY-MM-DD.
 */
export function getAdjacentDate(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offsetDays);
  return getTodayString(dt);
}

/**
 * Validates whether a string matches YYYY-MM-DD format and is a real date.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/**
 * Human-friendly date formatting (e.g. "Sunday, October 18, 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
