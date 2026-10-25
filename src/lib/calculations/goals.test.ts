import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateHabitStreaks } from './goals';
import type { Question, HourlyEntry } from '@/types';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    userId: 'u1',
    text: 'Focused Work',
    category: 'Productivity',
    answerType: 'yes_no',
    active: true,
    order: 0,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

describe('Goals & Streaks Calculations (Phase 2)', () => {
  test('calculates contiguous daily streaks where positive outcomes meet target', () => {
    const today = '2026-10-23';

    // 3 consecutive positive days (Oct 21, Oct 22, Oct 23)
    const entries: HourlyEntry[] = [
      {
        id: 'e1',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-21',
        timeSlot: '09:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-21T09:00:00Z',
        updatedAt: '2026-10-21T09:00:00Z',
      },
      {
        id: 'e2',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-22',
        timeSlot: '09:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-22T09:00:00Z',
        updatedAt: '2026-10-22T09:00:00Z',
      },
      {
        id: 'e3',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-23',
        timeSlot: '10:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-23T10:00:00Z',
        updatedAt: '2026-10-23T10:00:00Z',
      },
    ];

    const result = calculateHabitStreaks(entries, mockQuestions, today);

    assert.strictEqual(result.currentStreakDays, 3);
    assert.strictEqual(result.longestStreakDays, 3);
    assert.strictEqual(result.habitStreaks.length, 1);

    const h1 = result.habitStreaks[0];
    assert.strictEqual(h1.currentStreakDays, 3);
    assert.strictEqual(h1.totalPositiveSlots, 3);
    assert.strictEqual(h1.todayLogged, true);
    assert.strictEqual(h1.todayPositive, true);
  });

  test('resets streak when a day is completely missed without penalizing missing data', () => {
    const today = '2026-10-23';

    // Logged Oct 20 (positive), missed Oct 21 and Oct 22, logged Oct 23
    const entries: HourlyEntry[] = [
      {
        id: 'e1',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-20',
        timeSlot: '09:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-20T09:00:00Z',
        updatedAt: '2026-10-20T09:00:00Z',
      },
      {
        id: 'e2',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-23',
        timeSlot: '09:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-23T09:00:00Z',
        updatedAt: '2026-10-23T09:00:00Z',
      },
    ];

    const result = calculateHabitStreaks(entries, mockQuestions, today);

    // Because Oct 21 and Oct 22 were missed, the current streak restarted on Oct 23 (1 day)
    assert.strictEqual(result.currentStreakDays, 1);
    assert.strictEqual(result.longestStreakDays, 1);
  });
});
