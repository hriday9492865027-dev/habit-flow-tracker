import type { HourlyEntry, Question } from '@/types';
import { calculateOutcomeCounts, getTodayString, getAdjacentDate } from './index';

export interface HabitStreak {
  questionId: string;
  questionText: string;
  category: string;
  currentStreakDays: number;
  longestStreakDays: number;
  totalDaysLogged: number;
  totalPositiveSlots: number;
  todayLogged: boolean;
  todayPositive: boolean;
}

export interface OverallStreakSummary {
  currentStreakDays: number;
  longestStreakDays: number;
  activeGoalHabitsCount: number;
  habitStreaks: HabitStreak[];
}

/**
 * Calculates current and longest streaks for each habit and overall tracking.
 * Unanswered slots are missing data, never negative.
 */
export function calculateHabitStreaks(
  entries: HourlyEntry[],
  questions: Question[],
  todayStr: string = getTodayString()
): OverallStreakSummary {
  const activeQuestions = questions.filter((q) => q.active);

  // Group entries by questionId, then by date
  const questionDateMap = new Map<string, Map<string, HourlyEntry[]>>();
  const allLoggedDates = new Set<string>();

  for (const entry of entries) {
    allLoggedDates.add(entry.date);
    if (!questionDateMap.has(entry.questionId)) {
      questionDateMap.set(entry.questionId, new Map());
    }
    const dateMap = questionDateMap.get(entry.questionId)!;
    if (!dateMap.has(entry.date)) {
      dateMap.set(entry.date, []);
    }
    dateMap.get(entry.date)!.push(entry);
  }

  // Calculate habit-specific streaks
  const habitStreaks: HabitStreak[] = activeQuestions.map((q) => {
    const dateMap = questionDateMap.get(q.id) || new Map<string, HourlyEntry[]>();
    const dates = Array.from(dateMap.keys()).sort();

    // A day is "positive" for this habit if it has at least 1 positive outcome and positive >= negative
    const positiveDates = new Set<string>();
    let totalPositiveSlots = 0;

    for (const [d, dEntries] of dateMap.entries()) {
      const counts = calculateOutcomeCounts(dEntries);
      totalPositiveSlots += counts.positive;
      if (counts.positive > 0 && counts.positive >= counts.negative) {
        positiveDates.add(d);
      }
    }

    // Calculate current streak working backwards from today or yesterday
    let currentStreak = 0;
    let checkDate = todayStr;

    // Check today first
    if (positiveDates.has(checkDate)) {
      currentStreak++;
      checkDate = getAdjacentDate(checkDate, -1);
    } else {
      // If not logged today, check if yesterday was positive (streak still alive)
      const yesterday = getAdjacentDate(checkDate, -1);
      if (positiveDates.has(yesterday)) {
        checkDate = yesterday;
      }
    }

    while (positiveDates.has(checkDate)) {
      currentStreak++;
      checkDate = getAdjacentDate(checkDate, -1);
    }

    // Calculate all-time longest streak
    let longestStreak = 0;
    let runningStreak = 0;
    let prevDate: string | null = null;

    const sortedPositiveDates = Array.from(positiveDates).sort();
    for (const d of sortedPositiveDates) {
      if (prevDate === null) {
        runningStreak = 1;
      } else {
        const expectedNext = getAdjacentDate(prevDate, 1);
        if (d === expectedNext) {
          runningStreak++;
        } else {
          runningStreak = 1;
        }
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
      prevDate = d;
    }

    return {
      questionId: q.id,
      questionText: q.text,
      category: q.category,
      currentStreakDays: currentStreak,
      longestStreakDays: Math.max(longestStreak, currentStreak),
      totalDaysLogged: dates.length,
      totalPositiveSlots,
      todayLogged: dateMap.has(todayStr),
      todayPositive: positiveDates.has(todayStr),
    };
  });

  // Calculate overall logging streak (any habit logged per day)
  let overallCurrentStreak = 0;
  let checkOverallDate = todayStr;

  if (allLoggedDates.has(checkOverallDate)) {
    overallCurrentStreak++;
    checkOverallDate = getAdjacentDate(checkOverallDate, -1);
  } else {
    const yesterday = getAdjacentDate(checkOverallDate, -1);
    if (allLoggedDates.has(yesterday)) {
      checkOverallDate = yesterday;
    }
  }

  while (allLoggedDates.has(checkOverallDate)) {
    overallCurrentStreak++;
    checkOverallDate = getAdjacentDate(checkOverallDate, -1);
  }

  let overallLongestStreak = 0;
  let runningOverall = 0;
  let prevOverallDate: string | null = null;
  const sortedDates = Array.from(allLoggedDates).sort();

  for (const d of sortedDates) {
    if (prevOverallDate === null) {
      runningOverall = 1;
    } else {
      const expected = getAdjacentDate(prevOverallDate, 1);
      if (d === expected) {
        runningOverall++;
      } else {
        runningOverall = 1;
      }
    }
    if (runningOverall > overallLongestStreak) {
      overallLongestStreak = runningOverall;
    }
    prevOverallDate = d;
  }

  return {
    currentStreakDays: overallCurrentStreak,
    longestStreakDays: Math.max(overallLongestStreak, overallCurrentStreak),
    activeGoalHabitsCount: activeQuestions.length,
    habitStreaks,
  };
}
