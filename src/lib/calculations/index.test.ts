import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTimeSlots,
  formatSlotLabel,
  calculateOutcomeCounts,
  calculateCompletionStats,
  getTimeOfDayCategory,
  calculateTimeOfDaySummary,
  getAdjacentDate,
  isValidDateString,
  getTodayString,
} from './index';

describe('Calculation Utilities & Product Rules', () => {
  test('generateTimeSlots produces 16 slots from 6 AM (06:00) to 9 PM (21:00) by default', () => {
    const slots = generateTimeSlots(6, 21, 60);
    assert.equal(slots.length, 16);
    assert.equal(slots[0], '06:00');
    assert.equal(slots[15], '21:00');
    assert.deepEqual(slots.slice(0, 4), ['06:00', '07:00', '08:00', '09:00']);
  });

  test('formatSlotLabel properly converts 24h slots into friendly labels', () => {
    assert.equal(formatSlotLabel('06:00'), '6 AM');
    assert.equal(formatSlotLabel('11:00'), '11 AM');
    assert.equal(formatSlotLabel('12:00'), '12 PM');
    assert.equal(formatSlotLabel('13:00'), '1 PM');
    assert.equal(formatSlotLabel('21:00'), '9 PM');
  });

  test('calculateOutcomeCounts accurately counts outcomes and NEVER treats missing as negative', () => {
    const sampleEntries: any[] = [
      { outcomeSnapshot: 'positive' },
      { outcomeSnapshot: 'positive' },
      { outcomeSnapshot: 'negative' },
      { outcomeSnapshot: 'neutral' },
    ];

    const counts = calculateOutcomeCounts(sampleEntries);
    assert.equal(counts.positive, 2);
    assert.equal(counts.negative, 1);
    assert.equal(counts.neutral, 1);
    assert.equal(counts.totalAnswered, 4);
  });

  test('calculateCompletionStats uses explicit denominators and marks unanswered as missing, not negative', () => {
    const stats = calculateCompletionStats(16, 4);
    assert.equal(stats.totalSlots, 16);
    assert.equal(stats.answeredSlots, 4);
    assert.equal(stats.unansweredSlots, 12);
    assert.equal(stats.completionRatePercent, 25.0);

    const zeroStats = calculateCompletionStats(0, 0);
    assert.equal(zeroStats.completionRatePercent, 0);
  });

  test('getTimeOfDayCategory correctly segments morning, afternoon, and evening', () => {
    assert.equal(getTimeOfDayCategory('06:00'), 'morning');
    assert.equal(getTimeOfDayCategory('11:00'), 'morning');
    assert.equal(getTimeOfDayCategory('12:00'), 'afternoon');
    assert.equal(getTimeOfDayCategory('16:00'), 'afternoon');
    assert.equal(getTimeOfDayCategory('17:00'), 'evening');
    assert.equal(getTimeOfDayCategory('21:00'), 'evening');
  });

  test('calculateTimeOfDaySummary partitions entries across timeframes', () => {
    const entries: any[] = [
      { timeSlot: '07:00', outcomeSnapshot: 'positive' },
      { timeSlot: '08:00', outcomeSnapshot: 'negative' },
      { timeSlot: '13:00', outcomeSnapshot: 'positive' },
      { timeSlot: '18:00', outcomeSnapshot: 'neutral' },
    ];

    const summary = calculateTimeOfDaySummary(entries);
    assert.equal(summary.morning.positive, 1);
    assert.equal(summary.morning.negative, 1);
    assert.equal(summary.afternoon.positive, 1);
    assert.equal(summary.evening.neutral, 1);
  });

  test('Date utilities navigate across days and validate YYYY-MM-DD properly', () => {
    assert.equal(isValidDateString('2026-10-18'), true);
    assert.equal(isValidDateString('2026-02-30'), false);
    assert.equal(isValidDateString('invalid-date'), false);

    assert.equal(getAdjacentDate('2026-10-18', 1), '2026-10-19');
    assert.equal(getAdjacentDate('2026-10-18', -1), '2026-10-17');
    assert.equal(getAdjacentDate('2026-10-31', 1), '2026-11-01');
  });
});
