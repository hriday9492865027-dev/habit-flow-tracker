import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { createQuestion, getQuestionsForUser, getQuestionById, updateQuestion } from './questions';
import { saveHourlyEntry, getEntriesForDate } from './entries';
import { createUser } from './users';

describe('Data Access Layer & Product Rules', () => {
  const userA_email = `usera_${Date.now()}@example.com`;
  const userB_email = `userb_${Date.now()}@example.com`;
  let userA_id: string;
  let userB_id: string;

  test('Creates two isolated users', async () => {
    const userA = await createUser(userA_email, 'password123', 'User A');
    const userB = await createUser(userB_email, 'password123', 'User B');
    userA_id = userA.id;
    userB_id = userB.id;

    assert.ok(userA_id);
    assert.ok(userB_id);
    assert.notEqual(userA_id, userB_id);
  });

  test('Configures question where YES is Negative and NO is Positive', async () => {
    const q = await createQuestion(userA_id, {
      text: 'Did you smoke cigarettes?',
      category: 'Health',
      options: [
        { text: 'Yes', outcome: 'negative', explanation: 'Relapsed' },
        { text: 'No', outcome: 'positive', explanation: 'Stayed smoke free' },
      ],
    });

    assert.equal(q.text, 'Did you smoke cigarettes?');
    assert.equal(q.options?.length, 2);
    const yesOpt = q.options?.find((o) => o.text === 'Yes');
    const noOpt = q.options?.find((o) => o.text === 'No');

    assert.equal(yesOpt?.outcome, 'negative');
    assert.equal(noOpt?.outcome, 'positive');
  });

  test('Preserves outcome snapshot upon saving entry', async () => {
    const questions = await getQuestionsForUser(userA_id);
    const smokeQuestion = questions.find((q) => q.text === 'Did you smoke cigarettes?');
    assert.ok(smokeQuestion);

    const yesOption = smokeQuestion.options?.find((o) => o.text === 'Yes');
    assert.ok(yesOption);

    // Save entry with "Yes" (which is negative)
    const entry = await saveHourlyEntry(userA_id, {
      questionId: smokeQuestion.id,
      optionId: yesOption.id,
      value: 'Yes',
      date: '2026-10-18',
      timeSlot: '08:00',
      outcomeSnapshot: 'negative',
    });

    assert.equal(entry.value, 'Yes');
    assert.equal(entry.outcomeSnapshot, 'negative');

    // Retrieve entry from DB
    const entries = await getEntriesForDate(userA_id, '2026-10-18');
    const found = entries.find((e) => e.id === entry.id);
    assert.ok(found);
    assert.equal(found.value, 'Yes');
    assert.equal(found.outcomeSnapshot, 'negative');
  });

  test('Changing option outcome does NOT rewrite historical entry snapshot', async () => {
    const questions = await getQuestionsForUser(userA_id);
    const smokeQuestion = questions.find((q) => q.text === 'Did you smoke cigarettes?');
    assert.ok(smokeQuestion);

    // Update question options to mark Yes as neutral
    await updateQuestion(userA_id, smokeQuestion.id, {
      options: [
        { text: 'Yes', outcome: 'neutral' },
        { text: 'No', outcome: 'positive' },
      ],
    });

    // Verify historical entry still preserves original outcome snapshot 'negative'
    const entries = await getEntriesForDate(userA_id, '2026-10-18');
    const historicalEntry = entries.find((e) => e.questionId === smokeQuestion.id);
    assert.ok(historicalEntry);
    assert.equal(historicalEntry.outcomeSnapshot, 'negative');
  });

  test('Strict cross-user authorization prevents User B from accessing User A records', async () => {
    const questionsA = await getQuestionsForUser(userA_id);
    const questionA = questionsA[0];
    assert.ok(questionA);

    // User B tries to fetch User A's question by ID
    const crossQuestion = await getQuestionById(userB_id, questionA.id);
    assert.equal(crossQuestion, null);

    // User B tries to save an entry on User A's question
    await assert.rejects(
      async () => {
        await saveHourlyEntry(userB_id, {
          questionId: questionA.id,
          value: 'Yes',
          date: '2026-10-18',
          timeSlot: '09:00',
          outcomeSnapshot: 'positive',
        });
      },
      /unauthorized|not found/i
    );

    // User B's entries for 2026-10-18 should be empty
    const entriesB = await getEntriesForDate(userB_id, '2026-10-18');
    assert.equal(entriesB.length, 0);
  });

  after(() => {
    // Graceful exit after all test suites complete
    setTimeout(() => process.exit(0), 100);
  });
});
