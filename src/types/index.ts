/**
 * HabitFlow Core Types & Integration Contract
 * Shared across Owner A (Foundation & Core Tracking) and Owner B (Analytics, Reminders, PWA)
 */

export type Outcome = 'positive' | 'negative' | 'neutral';

/**
 * Extensible Answer Types (Phase 1 supports 'yes_no'; Phase 2 extensible)
 */
export type AnswerType =
  | 'yes_no'
  | 'single_choice'
  | 'multiple_choice'
  | 'numeric'
  | 'currency'
  | 'duration'
  | 'rating';

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  outcome: Outcome;
  explanation?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  userId: string;
  text: string;
  category: string;
  answerType: AnswerType;
  active: boolean;
  order: number;
  description?: string | null;
  options?: QuestionOption[];
  createdAt: string;
  updatedAt: string;
}

export interface HourlyEntry {
  id: string;
  userId: string;
  questionId: string;
  optionId: string | null;
  value: string; // The raw answer (e.g. "Yes", "No", numeric value)
  date: string; // YYYY-MM-DD format (timezone-stable)
  timeSlot: string; // e.g. "06:00", "07:00", ... "21:00"
  outcomeSnapshot: Outcome; // Preserves evaluated outcome at time of recording
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  trackingStartHour: number; // default: 6 (6 AM)
  trackingEndHour: number; // default: 21 (9 PM)
  trackingIntervalMinutes: number; // default: 60 (Phase 2 foundation)
  timezone: string; // e.g. "UTC" or "America/New_York"
  theme: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculation and Analytics Types
 */
export interface OutcomeCounts {
  positive: number;
  negative: number;
  neutral: number;
  totalAnswered: number;
}

export interface CompletionStats {
  totalSlots: number;
  answeredSlots: number;
  unansweredSlots: number;
  completionRatePercent: number; // 0 to 100 with explicit denominator
}

export interface TimeOfDaySummary {
  morning: OutcomeCounts; // 06:00 - 11:00
  afternoon: OutcomeCounts; // 12:00 - 16:00
  evening: OutcomeCounts; // 17:00 - 21:00
}

export interface DailySummary {
  date: string;
  totalActiveQuestions: number;
  completion: CompletionStats;
  outcomes: OutcomeCounts;
  timeOfDay: TimeOfDaySummary;
}

/**
 * Input DTOs
 */
export interface CreateQuestionInput {
  text: string;
  category: string;
  answerType?: AnswerType;
  description?: string;
  options: Array<{
    text: string;
    outcome: Outcome;
    explanation?: string;
    order?: number;
  }>;
}

export interface UpdateQuestionInput {
  text?: string;
  category?: string;
  answerType?: AnswerType;
  active?: boolean;
  order?: number;
  description?: string;
  options?: Array<{
    id?: string;
    text: string;
    outcome: Outcome;
    explanation?: string;
    order?: number;
  }>;
}

export interface SaveEntryInput {
  questionId: string;
  optionId?: string | null;
  value: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "HH:MM"
  outcomeSnapshot: Outcome;
  notes?: string;
}
