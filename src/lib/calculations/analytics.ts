import type {
  Outcome,
  OutcomeCounts,
  CompletionStats,
  TimeOfDaySummary,
  HourlyEntry,
  Question,
} from '@/types';
import {
  calculateOutcomeCounts,
  calculateCompletionStats,
  calculateTimeOfDaySummary,
  getTodayString,
  getAdjacentDate,
  formatSlotLabel,
} from './index';

export interface DayMetric {
  date: string;
  dayOfWeek: string; // "Mon", "Tue", etc.
  dayOfMonth: number;
  totalSlots: number;
  answeredSlots: number;
  unansweredSlots: number;
  completionRatePercent: number;
  outcomes: OutcomeCounts;
  positiveRatePercent: number; // positive / answeredSlots (or 0)
}

export interface QuestionWeeklyMetric {
  questionId: string;
  questionText: string;
  category: string;
  totalAnswered: number;
  totalSlots: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  completionRatePercent: number;
  positiveRatePercent: number;
  trend: 'improving' | 'steady' | 'needs_attention';
}

export interface WeeklyAnalyticsResult {
  startDate: string;
  endDate: string;
  dailyMetrics: DayMetric[];
  totals: {
    totalSlots: number;
    answeredSlots: number;
    unansweredSlots: number;
    completionRatePercent: number;
    outcomes: OutcomeCounts;
    positiveRatePercent: number;
  };
  questionMetrics: QuestionWeeklyMetric[];
  timeOfDayTotals: TimeOfDaySummary;
  changeVsPreviousWeek: {
    completionRateDelta: number; // e.g. +5.2%
    positiveRateDelta: number;
  };
}

export interface HeatmapCell {
  date: string;
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  answeredSlots: number;
  totalSlots: number;
  completionRatePercent: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  intensity: 0 | 1 | 2 | 3 | 4; // 0 = no data, 1 = 1-25%, 2 = 26-50%, 3 = 51-75%, 4 = 76-100%
}

export interface DayOfWeekPattern {
  dayName: string;
  shortName: string;
  dayIndex: number;
  totalDaysRecorded: number;
  avgCompletionRatePercent: number;
  totalPositive: number;
  totalNegative: number;
  totalNeutral: number;
  totalAnswered: number;
}

export interface MonthlyAnalyticsResult {
  year: number;
  month: number; // 1-12
  monthName: string;
  totalDaysInMonth: number;
  cells: HeatmapCell[];
  summary: {
    totalSlots: number;
    answeredSlots: number;
    unansweredSlots: number;
    completionRatePercent: number;
    outcomes: OutcomeCounts;
    positiveRatePercent: number;
    activeDaysCount: number;
  };
  dayOfWeekPatterns: DayOfWeekPattern[];
  topHabits: {
    highestAdherence: { questionText: string; rate: number } | null;
    mostChallenging: { questionText: string; negativeCount: number } | null;
  };
}

export interface EvidenceInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'pattern';
  title: string;
  description: string;
  sampleSize: string; // e.g. "Based on 42 entries across 7 days"
  timeWindow: string;
  metric?: string;
}

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Calculates 7-day weekly analytics from entries and question catalog.
 * Strict rules:
 * - Unanswered is missing data, NEVER treated as negative.
 * - Explicit denominators.
 */
export function calculateWeeklyAnalytics(
  startDate: string,
  endDate: string,
  entries: HourlyEntry[],
  questions: Question[],
  timeSlots: string[],
  previousWeekEntries: HourlyEntry[] = []
): WeeklyAnalyticsResult {
  const activeQuestions = questions.filter((q) => q.active);
  const slotsPerDay = activeQuestions.length * timeSlots.length;

  // Generate 7 day strings between startDate and endDate
  const dateList: string[] = [];
  let curr = startDate;
  while (curr <= endDate && dateList.length < 31) {
    dateList.push(curr);
    curr = getAdjacentDate(curr, 1);
  }

  // Daily metrics
  const dailyMetrics: DayMetric[] = dateList.map((dStr) => {
    const dayEntries = entries.filter((e) => e.date === dStr);
    const outcomes = calculateOutcomeCounts(dayEntries);
    const completion = calculateCompletionStats(slotsPerDay, dayEntries.length);

    const [y, m, d] = dStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = DAY_NAMES_SHORT[dateObj.getDay()];

    const positiveRate =
      dayEntries.length > 0
        ? Math.round((outcomes.positive / dayEntries.length) * 1000) / 10
        : 0;

    return {
      date: dStr,
      dayOfWeek,
      dayOfMonth: d,
      totalSlots: slotsPerDay,
      answeredSlots: dayEntries.length,
      unansweredSlots: completion.unansweredSlots,
      completionRatePercent: completion.completionRatePercent,
      outcomes,
      positiveRatePercent: positiveRate,
    };
  });

  // Week totals
  const totalSlots = slotsPerDay * dateList.length;
  const answeredSlots = entries.length;
  const unansweredSlots = Math.max(0, totalSlots - answeredSlots);
  const weekCompletion = calculateCompletionStats(totalSlots, answeredSlots);
  const weekOutcomes = calculateOutcomeCounts(entries);
  const weekPositiveRate =
    answeredSlots > 0
      ? Math.round((weekOutcomes.positive / answeredSlots) * 1000) / 10
      : 0;

  // Question-by-question performance
  const questionMetrics: QuestionWeeklyMetric[] = activeQuestions.map((q) => {
    const qEntries = entries.filter((e) => e.questionId === q.id);
    const qOutcomes = calculateOutcomeCounts(qEntries);
    const qTotalSlots = timeSlots.length * dateList.length;
    const qCompletion = calculateCompletionStats(qTotalSlots, qEntries.length);
    const qPosRate =
      qEntries.length > 0
        ? Math.round((qOutcomes.positive / qEntries.length) * 1000) / 10
        : 0;

    let trend: 'improving' | 'steady' | 'needs_attention' = 'steady';
    if (qPosRate >= 70 && qCompletion.completionRatePercent >= 60) {
      trend = 'improving';
    } else if (qOutcomes.negative > qOutcomes.positive || qCompletion.completionRatePercent < 35) {
      trend = 'needs_attention';
    }

    return {
      questionId: q.id,
      questionText: q.text,
      category: q.category,
      totalAnswered: qEntries.length,
      totalSlots: qTotalSlots,
      positiveCount: qOutcomes.positive,
      negativeCount: qOutcomes.negative,
      neutralCount: qOutcomes.neutral,
      completionRatePercent: qCompletion.completionRatePercent,
      positiveRatePercent: qPosRate,
      trend,
    };
  });

  // Previous week comparison (if entries provided)
  let completionRateDelta = 0;
  let positiveRateDelta = 0;
  if (previousWeekEntries.length > 0 && totalSlots > 0) {
    const prevOutcomes = calculateOutcomeCounts(previousWeekEntries);
    const prevCompletion = (previousWeekEntries.length / totalSlots) * 100;
    const prevPosRate = (prevOutcomes.positive / previousWeekEntries.length) * 100;
    completionRateDelta = Math.round((weekCompletion.completionRatePercent - prevCompletion) * 10) / 10;
    positiveRateDelta = Math.round((weekPositiveRate - prevPosRate) * 10) / 10;
  }

  return {
    startDate,
    endDate,
    dailyMetrics,
    totals: {
      totalSlots,
      answeredSlots,
      unansweredSlots,
      completionRatePercent: weekCompletion.completionRatePercent,
      outcomes: weekOutcomes,
      positiveRatePercent: weekPositiveRate,
    },
    questionMetrics,
    timeOfDayTotals: calculateTimeOfDaySummary(entries),
    changeVsPreviousWeek: {
      completionRateDelta,
      positiveRateDelta,
    },
  };
}

/**
 * Calculates full month heatmap and pattern distribution.
 */
export function calculateMonthlyAnalytics(
  year: number,
  month: number, // 1 to 12
  entries: HourlyEntry[],
  questions: Question[],
  timeSlots: string[]
): MonthlyAnalyticsResult {
  const activeQuestions = questions.filter((q) => q.active);
  const slotsPerDay = activeQuestions.length * timeSlots.length;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = MONTH_NAMES[month - 1] || `Month ${month}`;

  // Group entries by date
  const entriesByDate = new Map<string, HourlyEntry[]>();
  for (const entry of entries) {
    if (!entriesByDate.has(entry.date)) {
      entriesByDate.set(entry.date, []);
    }
    entriesByDate.get(entry.date)!.push(entry);
  }

  const cells: HeatmapCell[] = [];
  let totalAnswered = 0;
  let totalPositive = 0;
  let totalNegative = 0;
  let totalNeutral = 0;
  let activeDaysCount = 0;

  // Day of week buckets (0 = Sun, ..., 6 = Sat)
  const dowStats = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    dayName: DAY_NAMES_FULL[i],
    shortName: DAY_NAMES_SHORT[i],
    daysCount: 0,
    completionSum: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    answered: 0,
  }));

  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    const dayEntries = entriesByDate.get(dStr) || [];
    const outcomes = calculateOutcomeCounts(dayEntries);
    const answeredCount = dayEntries.length;
    const completionRate =
      slotsPerDay > 0 ? Math.round((answeredCount / slotsPerDay) * 1000) / 10 : 0;

    totalAnswered += answeredCount;
    totalPositive += outcomes.positive;
    totalNegative += outcomes.negative;
    totalNeutral += outcomes.neutral;

    if (answeredCount > 0) {
      activeDaysCount++;
    }

    // Determine heatmap intensity 0 to 4 based on positive completion quality
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (answeredCount > 0) {
      const positiveRatio = outcomes.positive / (slotsPerDay || 1);
      if (positiveRatio >= 0.75 || completionRate >= 80) intensity = 4;
      else if (positiveRatio >= 0.5 || completionRate >= 50) intensity = 3;
      else if (positiveRatio >= 0.25 || completionRate >= 25) intensity = 2;
      else intensity = 1;
    }

    cells.push({
      date: dStr,
      dayOfMonth: day,
      dayOfWeek,
      answeredSlots: answeredCount,
      totalSlots: slotsPerDay,
      completionRatePercent: completionRate,
      positiveCount: outcomes.positive,
      negativeCount: outcomes.negative,
      neutralCount: outcomes.neutral,
      intensity,
    });

    // Update DOW stats
    const dow = dowStats[dayOfWeek];
    dow.daysCount++;
    dow.completionSum += completionRate;
    dow.positive += outcomes.positive;
    dow.negative += outcomes.negative;
    dow.neutral += outcomes.neutral;
    dow.answered += answeredCount;
  }

  const totalSlotsMonth = slotsPerDay * daysInMonth;
  const monthCompletion = calculateCompletionStats(totalSlotsMonth, totalAnswered);
  const positiveRatePercent =
    totalAnswered > 0 ? Math.round((totalPositive / totalAnswered) * 1000) / 10 : 0;

  const dayOfWeekPatterns: DayOfWeekPattern[] = dowStats.map((dow) => ({
    dayName: dow.dayName,
    shortName: dow.shortName,
    dayIndex: dow.dayIndex,
    totalDaysRecorded: dow.daysCount,
    avgCompletionRatePercent:
      dow.daysCount > 0 ? Math.round((dow.completionSum / dow.daysCount) * 10) / 10 : 0,
    totalPositive: dow.positive,
    totalNegative: dow.negative,
    totalNeutral: dow.neutral,
    totalAnswered: dow.answered,
  }));

  // Identify highest adherence & most challenging habits
  let highestAdherence: { questionText: string; rate: number } | null = null;
  let mostChallenging: { questionText: string; negativeCount: number } | null = null;

  if (activeQuestions.length > 0 && totalAnswered > 0) {
    let bestScore = -1;
    let worstNeg = -1;

    for (const q of activeQuestions) {
      const qEntries = entries.filter((e) => e.questionId === q.id);
      if (qEntries.length > 0) {
        const qOutcomes = calculateOutcomeCounts(qEntries);
        const posRatio = Math.round((qOutcomes.positive / qEntries.length) * 100);
        if (posRatio > bestScore) {
          bestScore = posRatio;
          highestAdherence = { questionText: q.text, rate: posRatio };
        }
        if (qOutcomes.negative > worstNeg) {
          worstNeg = qOutcomes.negative;
          mostChallenging = { questionText: q.text, negativeCount: qOutcomes.negative };
        }
      }
    }
  }

  return {
    year,
    month,
    monthName,
    totalDaysInMonth: daysInMonth,
    cells,
    summary: {
      totalSlots: totalSlotsMonth,
      answeredSlots: totalAnswered,
      unansweredSlots: monthCompletion.unansweredSlots,
      completionRatePercent: monthCompletion.completionRatePercent,
      outcomes: {
        positive: totalPositive,
        negative: totalNegative,
        neutral: totalNeutral,
        totalAnswered,
      },
      positiveRatePercent,
      activeDaysCount,
    },
    dayOfWeekPatterns,
    topHabits: {
      highestAdherence,
      mostChallenging,
    },
  };
}

/**
 * Computes evidence-based time of day and habit insights from real data.
 * Zero fabricated numbers; always includes sample size and explicit denominators.
 */
export function calculateEvidenceBasedInsights(
  entries: HourlyEntry[],
  questions: Question[],
  timeSlots: string[],
  timeWindowLabel: string = 'Current Period'
): EvidenceInsight[] {
  const insights: EvidenceInsight[] = [];
  const totalEntries = entries.length;

  if (totalEntries === 0) {
    return [
      {
        id: 'no_data',
        type: 'info',
        title: 'Start Tracking to Unlock Evidence-Based Insights',
        description:
          'Log your hourly habits in the Track Sheet. As entries accumulate, HabitFlow will analyze your time-of-day momentum and habit consistency patterns.',
        sampleSize: '0 entries recorded',
        timeWindow: timeWindowLabel,
      },
    ];
  }

  // 1. Time-of-day momentum insight
  const tod = calculateTimeOfDaySummary(entries);
  const timeWindows = [
    { name: 'Morning (6 AM - 11 AM)', data: tod.morning },
    { name: 'Afternoon (12 PM - 4 PM)', data: tod.afternoon },
    { name: 'Evening (5 PM - 9 PM)', data: tod.evening },
  ];

  const activeWindows = timeWindows.filter((w) => w.data.totalAnswered > 0);
  if (activeWindows.length > 0) {
    // Sort by positive outcome percentage
    activeWindows.sort((a, b) => {
      const rateA = a.data.positive / a.data.totalAnswered;
      const rateB = b.data.positive / b.data.totalAnswered;
      return rateB - rateA;
    });

    const bestWindow = activeWindows[0];
    const bestRate = Math.round((bestWindow.data.positive / bestWindow.data.totalAnswered) * 100);

    insights.push({
      id: 'tod_momentum',
      type: 'success',
      title: `Strongest Consistency: ${bestWindow.name}`,
      description: `You achieved a ${bestRate}% positive outcome rate during this time window (${bestWindow.data.positive} positive out of ${bestWindow.data.totalAnswered} logged entries).`,
      sampleSize: `Based on ${bestWindow.data.totalAnswered} entries in ${bestWindow.name}`,
      timeWindow: timeWindowLabel,
      metric: `${bestRate}% Positive`,
    });

    // Check if another window has significant negative outcomes
    const lowestWindow = activeWindows[activeWindows.length - 1];
    if (lowestWindow !== bestWindow && lowestWindow.data.negative > 0) {
      const negRate = Math.round((lowestWindow.data.negative / lowestWindow.data.totalAnswered) * 100);
      if (negRate >= 30) {
        insights.push({
          id: 'tod_challenge',
          type: 'warning',
          title: `Focus Opportunity: ${lowestWindow.name}`,
          description: `${negRate}% of recorded entries in ${lowestWindow.name} were negative outcomes (${lowestWindow.data.negative} entries). Setting a reminder before this window could help redirect focus.`,
          sampleSize: `Based on ${lowestWindow.data.totalAnswered} entries in ${lowestWindow.name}`,
          timeWindow: timeWindowLabel,
          metric: `${negRate}% Negative`,
        });
      }
    }
  }

  // 2. High-adherence habit
  const questionMap = new Map<string, Question>();
  questions.forEach((q) => questionMap.set(q.id, q));

  const entriesByQuestion = new Map<string, HourlyEntry[]>();
  entries.forEach((e) => {
    if (!entriesByQuestion.has(e.questionId)) entriesByQuestion.set(e.questionId, []);
    entriesByQuestion.get(e.questionId)!.push(e);
  });

  for (const [qId, qEntries] of entriesByQuestion.entries()) {
    const q = questionMap.get(qId);
    if (!q) continue;

    const qOutcomes = calculateOutcomeCounts(qEntries);
    if (qEntries.length >= 5) {
      const positiveRate = Math.round((qOutcomes.positive / qEntries.length) * 100);
      if (positiveRate >= 80) {
        insights.push({
          id: `habit_champion_${qId}`,
          type: 'pattern',
          title: `Consistent Habit: "${q.text}"`,
          description: `Logged with ${positiveRate}% positive outcomes across ${qEntries.length} tracked time slots. This is currently one of your most consistent habits.`,
          sampleSize: `${qOutcomes.positive}/${qEntries.length} positive slots`,
          timeWindow: timeWindowLabel,
          metric: `${positiveRate}%`,
        });
        break; // Show top 1 habit champion
      }
    }
  }

  // 3. Denominator & Missing Data Note
  const overallOutcomes = calculateOutcomeCounts(entries);
  insights.push({
    id: 'missing_data_integrity',
    type: 'info',
    title: 'Data Integrity & Denominator Transparency',
    description: `Analyzed ${totalEntries} total answered slots with ${overallOutcomes.positive} positive, ${overallOutcomes.negative} negative, and ${overallOutcomes.neutral} neutral entries. Unanswered slots are strictly treated as missing data rather than negative results.`,
    sampleSize: `${totalEntries} entries verified`,
    timeWindow: timeWindowLabel,
  });

  return insights;
}
