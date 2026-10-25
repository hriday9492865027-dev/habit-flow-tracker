import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateBehavioralCorrelations } from './correlations';
import type { Question, HourlyEntry } from '@/types';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    userId: 'u1',
    text: 'Morning Exercise',
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
    text: 'High Energy',
    category: 'Wellness',
    answerType: 'yes_no',
    active: true,
    order: 1,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

describe('Behavioral Correlations (Phase 2)', () => {
  test('does not fabricate correlations when sample size is below minimum threshold (<5)', () => {
    // Only 2 co-occurring slots
    const entries: HourlyEntry[] = [
      {
        id: 'e1',
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: '2026-10-20',
        timeSlot: '08:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-20T08:00:00Z',
        updatedAt: '2026-10-20T08:00:00Z',
      },
      {
        id: 'e2',
        userId: 'u1',
        questionId: 'q2',
        optionId: null,
        value: 'Yes',
        date: '2026-10-20',
        timeSlot: '08:00',
        outcomeSnapshot: 'positive',
        createdAt: '2026-10-20T08:00:00Z',
        updatedAt: '2026-10-20T08:00:00Z',
      },
    ];

    const correlations = calculateBehavioralCorrelations(entries, mockQuestions);
    assert.strictEqual(correlations.length, 0); // Strict protection against spurious correlations
  });

  test('identifies strong co-occurrence and includes causation caveat', () => {
    const entries: HourlyEntry[] = [];

    // Create 6 slots where both Exercise and Energy are positive
    const days = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'];
    days.forEach((d, idx) => {
      entries.push({
        id: `e_q1_${idx}`,
        userId: 'u1',
        questionId: 'q1',
        optionId: null,
        value: 'Yes',
        date: d,
        timeSlot: '08:00',
        outcomeSnapshot: 'positive',
        createdAt: `${d}T08:00:00Z`,
        updatedAt: `${d}T08:00:00Z`,
      });
      entries.push({
        id: `e_q2_${idx}`,
        userId: 'u1',
        questionId: 'q2',
        optionId: null,
        value: 'Yes',
        date: d,
        timeSlot: '08:00',
        outcomeSnapshot: 'positive',
        createdAt: `${d}T08:00:00Z`,
        updatedAt: `${d}T08:00:00Z`,
      });
    });

    const correlations = calculateBehavioralCorrelations(entries, mockQuestions);
    assert.strictEqual(correlations.length, 1);

    const corr = correlations[0];
    assert.strictEqual(corr.primaryHabit, 'Morning Exercise');
    assert.strictEqual(corr.secondaryHabit, 'High Energy');
    assert.strictEqual(corr.likelihoodPercent, 100);
    assert.ok(corr.caveat.includes('Correlation does not prove causation'));
  });
});
