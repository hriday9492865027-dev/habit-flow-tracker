import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  calculateWeeklyAnalytics,
  calculateMonthlyAnalytics,
  calculateEvidenceBasedInsights,
} from './analytics';
import type { Question, HourlyEntry } from '@/types';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    userId: 'u1',
    text: 'Drank Water',
    category: 'Health',
    answerType: 'yes_no',
    active: true,
    order: 0,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'q2',
    userId: 'u1',
    text: 'Avoided Smoking',
    category: 'Health',
    answerType: 'yes_no',
    active: true,
    order: 1,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

const mockTimeSlots = ['08:00', '09:00', '14:00', '20:00']; // 4 slots/day

describe('Analytics Calculations (Owner B)', () => {
  test('calculateWeeklyAnalytics correctly computes 7-day stats and preserves missing data rules', () => {
    const startDate = '2026-10-17';
    const endDate = '2026-10-23';

    // 2 questions * 4 slots = 8 slots/day. For 7 days = 56 total slots.
    const entries: HourlyEntry[] = [
      // Day 1
      {
        id: 'e1',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-17',
        timeSlot: '08:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-17T08:00:00Z',
        updatedAt: '2026-10-17T08:00:00Z',
      },
      {
        id: 'e2',
        userId: 'u1',
        questionId: 'q2',
        optionId: null,
        value: 'No', // For smoking, No is positive
        date: '2026-10-17',
        timeSlot: '08:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-17T08:00:00Z',
        updatedAt: '2026-10-17T08:00:00Z',
      },
      // Day 2
      {
        id: 'e3',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'No',
        date: '2026-10-18',
        timeSlot: '14:00',
        outcomeSnapshot: 'negative',
        createdAt: '2026-10-18T14:00:00Z',
        updatedAt: '2026-10-18T14:00:00Z',
      },
      {
        id: 'e4',
        userId: 'u1',
        questionId: 'q2',
        optionId: null,
        value: 'Yes', // For smoking, Yes is negative
        date: '2026-10-18',
        timeSlot: '20:00',
        outcomeSnapshot: 'negative',
        createdAt: '2026-10-18T20:00:00Z',
        updatedAt: '2026-10-18T20:00:00Z',
      },
    ];

    const result = calculateWeeklyAnalytics(
      startDate,
      endDate,
      entries,
      mockQuestions,
      mockTimeSlots
    );

    assert.strictEqual(result.totals.totalSlots, 56);
    assert.strictEqual(result.totals.answeredSlots, 4);
    assert.strictEqual(result.totals.unansweredSlots, 52);
    assert.strictEqual(result.totals.outcomes.positive, 2);
    assert.strictEqual(result.totals.outcomes.negative, 2);
    assert.strictEqual(result.totals.outcomes.neutral, 0);

    // Unanswered slots are NEVER counted as negative
    assert.strictEqual(result.totals.positiveRatePercent, 50); // 2 out of 4 answered = 50%
    assert.strictEqual(result.dailyMetrics.length, 7);

    // Check Day 1 metric
    const day1 = result.dailyMetrics.find((d) => d.date === '2026-10-17');
    assert.ok(day1);
    assert.strictEqual(day1.answeredSlots, 2);
    assert.strictEqual(day1.outcomes.positive, 2);
    assert.strictEqual(day1.positiveRatePercent, 100);

    // Check Question metrics
    assert.strictEqual(result.questionMetrics.length, 2);
    const q1Metric = result.questionMetrics.find((q) => q.questionId === 'q1');
    assert.ok(q1Metric);
    assert.strictEqual(q1Metric.totalAnswered, 2);
    assert.strictEqual(q1Metric.positiveCount, 1);
    assert.strictEqual(q1Metric.negativeCount, 1);
  });

  test('calculateMonthlyAnalytics generates full month heatmap cells and day of week patterns', () => {
    const year = 2026;
    const month = 10; // October has 31 days

    const entries: HourlyEntry[] = [
      {
        id: 'e1',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-05',
        timeSlot: '08:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-05T08:00:00Z',
        updatedAt: '2026-10-05T08:00:00Z',
      },
      {
        id: 'e2',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-05',
        timeSlot: '09:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-05T09:00:00Z',
        updatedAt: '2026-10-05T09:00:00Z',
      },
    ];

    const result = calculateMonthlyAnalytics(
      year,
      month,
      entries,
      mockQuestions,
      mockTimeSlots
    );

    assert.strictEqual(result.totalDaysInMonth, 31);
    assert.strictEqual(result.cells.length, 31);
    assert.strictEqual(result.summary.answeredSlots, 2);
    assert.strictEqual(result.summary.outcomes.positive, 2);
    assert.strictEqual(result.summary.activeDaysCount, 1);

    // Check specific day cell for 2026-10-05
    const cell5 = result.cells.find((c) => c.date === '2026-10-05');
    assert.ok(cell5);
    assert.strictEqual(cell5.answeredSlots, 2);
    assert.strictEqual(cell5.positiveCount, 2);
    assert.ok(cell5.intensity > 0);

    // Verify empty day has intensity 0
    const cell6 = result.cells.find((c) => c.date === '2026-10-06');
    assert.ok(cell6);
    assert.strictEqual(cell6.answeredSlots, 0);
    assert.strictEqual(cell6.intensity, 0);

    // Day of week patterns should have 7 days
    assert.strictEqual(result.dayOfWeekPatterns.length, 7);
  });

  test('calculateEvidenceBasedInsights produces reliable, non-fabricated insights with sample sizes', () => {
    const entries: HourlyEntry[] = [
      {
        id: 'e1',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-20',
        timeSlot: '08:00', // Morning
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-20T08:00:00Z',
        updatedAt: '2026-10-20T08:00:00Z',
      },
      {
        id: 'e2',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-20',
        timeSlot: '09:00', // Morning
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-20T09:00:00Z',
        updatedAt: '2026-10-20T09:00:00Z',
      },
      {
        id: 'e3',
        userId: 'u1',
        questionId: 'q2',
        optionId: null,
        value: 'Yes',
        date: '2026-10-20',
        timeSlot: '20:00', // Evening negative
        outcomeSnapshot: 'negative',
        createdAt: '2026-10-20T20:00:00Z',
        updatedAt: '2026-10-20T20:00:00Z',
      },
    ];

    const insights = calculateEvidenceBasedInsights(entries, mockQuestions, mockTimeSlots);

    assert.ok(insights.length >= 2);
    const momentumInsight = insights.find((i) => i.id === 'tod_momentum');
    assert.ok(momentumInsight);
    assert.ok(momentumInsight.title.includes('Morning'));
    assert.ok(momentumInsight.sampleSize.includes('entries'));

    // Check transparency disclaimer
    const integrityNote = insights.find((i) => i.id === 'missing_data_integrity');
    assert.ok(integrityNote);
    assert.ok(integrityNote.description.includes('Unanswered slots are strictly treated as missing data'));
  });
});
