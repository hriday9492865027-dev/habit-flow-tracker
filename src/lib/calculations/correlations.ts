import type { HourlyEntry, Question } from '@/types';

export interface HabitCorrelation {
  id: string;
  primaryHabit: string;
  secondaryHabit: string;
  primaryCategory: string;
  secondaryCategory: string;
  sampleSizeSlots: number;
  correlationDirection: 'positive' | 'negative' | 'neutral';
  likelihoodPercent: number; // e.g. 78% of the time
  insightSentence: string;
  caveat: string;
}

/**
 * Calculates behavioral co-occurrence across tracked hourly entries.
 * Strict rules:
 * - Requires at least 5 co-occurring hourly slots to avoid spurious findings.
 * - Caveat always warns that correlation does not imply causation.
 */
export function calculateBehavioralCorrelations(
  entries: HourlyEntry[],
  questions: Question[]
): HabitCorrelation[] {
  const correlations: HabitCorrelation[] = [];
  const activeQuestions = questions.filter((q) => q.active);

  if (activeQuestions.length < 2 || entries.length < 10) {
    return correlations;
  }

  // Create slot map: key = `${date}_${timeSlot}`, value = Map<questionId, HourlyEntry>
  const slotMap = new Map<string, Map<string, HourlyEntry>>();
  for (const entry of entries) {
    const key = `${entry.date}_${entry.timeSlot}`;
    if (!slotMap.has(key)) {
      slotMap.set(key, new Map());
    }
    slotMap.get(key)!.set(entry.questionId, entry);
  }

  const qMap = new Map<string, Question>();
  activeQuestions.forEach((q) => qMap.set(q.id, q));

  // Compare each pair of questions
  for (let i = 0; i < activeQuestions.length; i++) {
    for (let j = i + 1; j < activeQuestions.length; j++) {
      const qA = activeQuestions[i];
      const qB = activeQuestions[j];

      let coOccurringSlots = 0;
      let aPosAndBPos = 0;
      let aPosAndBNeg = 0;
      let aTotalPos = 0;

      for (const qEntryMap of slotMap.values()) {
        const entryA = qEntryMap.get(qA.id);
        const entryB = qEntryMap.get(qB.id);

        if (entryA && entryB) {
          coOccurringSlots++;
          if (entryA.outcomeSnapshot === 'positive') {
            aTotalPos++;
            if (entryB.outcomeSnapshot === 'positive') {
              aPosAndBPos++;
            } else if (entryB.outcomeSnapshot === 'negative') {
              aPosAndBNeg++;
            }
          }
        }
      }

      // Require at least 5 co-occurring slots where A is positive
      if (aTotalPos >= 5) {
        const positiveCoOccurrenceRate = Math.round((aPosAndBPos / aTotalPos) * 100);

        if (positiveCoOccurrenceRate >= 65) {
          correlations.push({
            id: `corr_${qA.id}_${qB.id}`,
            primaryHabit: qA.text,
            secondaryHabit: qB.text,
            primaryCategory: qA.category,
            secondaryCategory: qB.category,
            sampleSizeSlots: coOccurringSlots,
            correlationDirection: 'positive',
            likelihoodPercent: positiveCoOccurrenceRate,
            insightSentence: `When "${qA.text}" was recorded with a positive outcome, "${qB.text}" had a positive outcome ${positiveCoOccurrenceRate}% of the time.`,
            caveat:
              'Correlation does not prove causation. Environmental routines, scheduling, and energy levels may mutually influence both behaviors.',
          });
        } else if (positiveCoOccurrenceRate <= 25 && aPosAndBNeg >= 3) {
          const negRate = Math.round((aPosAndBNeg / aTotalPos) * 100);
          correlations.push({
            id: `corr_inv_${qA.id}_${qB.id}`,
            primaryHabit: qA.text,
            secondaryHabit: qB.text,
            primaryCategory: qA.category,
            secondaryCategory: qB.category,
            sampleSizeSlots: coOccurringSlots,
            correlationDirection: 'negative',
            likelihoodPercent: negRate,
            insightSentence: `When "${qA.text}" was positive, "${qB.text}" resulted in negative outcomes in ${negRate}% of matching slots.`,
            caveat:
              'Correlation does not prove causation. Potential fatigue, timing conflicts, or trade-offs might explain the observed divergence.',
          });
        }
      }
    }
  }

  return correlations;
}
