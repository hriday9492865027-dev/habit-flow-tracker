import { eq, and, asc } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db, schema } from '@/lib/db';
import type { Question, QuestionOption, CreateQuestionInput, UpdateQuestionInput } from '@/types';

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export async function getQuestionsForUser(
  userId: string,
  includeArchived: boolean = false
): Promise<Question[]> {
  const conditions = [eq(schema.questions.userId, userId)];
  if (!includeArchived) {
    conditions.push(eq(schema.questions.active, true));
  }

  const questionRows = await (db as any)
    .select()
    .from(schema.questions)
    .where(and(...conditions))
    .orderBy(asc(schema.questions.order), asc(schema.questions.createdAt));

  if (!questionRows || questionRows.length === 0) {
    return [];
  }

  const questionIds = questionRows.map((q: any) => q.id);

  // Fetch all options for these questions
  const optionRows = await (db as any)
    .select()
    .from(schema.questionOptions)
    .orderBy(asc(schema.questionOptions.order), asc(schema.questionOptions.createdAt));

  const optionsByQuestionId = new Map<string, QuestionOption[]>();
  for (const opt of optionRows) {
    if (!questionIds.includes(opt.questionId)) continue;
    const list = optionsByQuestionId.get(opt.questionId) || [];
    list.push({
      id: opt.id,
      questionId: opt.questionId,
      text: opt.text,
      outcome: opt.outcome as any,
      explanation: opt.explanation,
      order: opt.order,
      createdAt: opt.createdAt instanceof Date ? opt.createdAt.toISOString() : String(opt.createdAt),
      updatedAt: opt.updatedAt instanceof Date ? opt.updatedAt.toISOString() : String(opt.updatedAt),
    });
    optionsByQuestionId.set(opt.questionId, list);
  }

  return questionRows.map((q: any) => ({
    id: q.id,
    userId: q.userId,
    text: q.text,
    category: q.category,
    answerType: q.answerType,
    active: q.active,
    order: q.order,
    description: q.description,
    options: optionsByQuestionId.get(q.id) || [],
    createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : String(q.createdAt),
    updatedAt: q.updatedAt instanceof Date ? q.updatedAt.toISOString() : String(q.updatedAt),
  }));
}

export async function getQuestionById(
  userId: string,
  questionId: string
): Promise<Question | null> {
  const questionRows = await (db as any)
    .select()
    .from(schema.questions)
    .where(and(eq(schema.questions.id, questionId), eq(schema.questions.userId, userId)))
    .limit(1);

  if (!questionRows || questionRows.length === 0) {
    return null;
  }

  const q = questionRows[0];
  const optionRows = await (db as any)
    .select()
    .from(schema.questionOptions)
    .where(eq(schema.questionOptions.questionId, questionId))
    .orderBy(asc(schema.questionOptions.order));

  return {
    id: q.id,
    userId: q.userId,
    text: q.text,
    category: q.category,
    answerType: q.answerType,
    active: q.active,
    order: q.order,
    description: q.description,
    options: optionRows.map((opt: any) => ({
      id: opt.id,
      questionId: opt.questionId,
      text: opt.text,
      outcome: opt.outcome as any,
      explanation: opt.explanation,
      order: opt.order,
      createdAt: opt.createdAt instanceof Date ? opt.createdAt.toISOString() : String(opt.createdAt),
      updatedAt: opt.updatedAt instanceof Date ? opt.updatedAt.toISOString() : String(opt.updatedAt),
    })),
    createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : String(q.createdAt),
    updatedAt: q.updatedAt instanceof Date ? q.updatedAt.toISOString() : String(q.updatedAt),
  };
}

export async function createQuestion(
  userId: string,
  input: CreateQuestionInput
): Promise<Question> {
  const questionId = generateId('q');

  // Determine next order
  const existingQuestions = await (db as any)
    .select({ order: schema.questions.order })
    .from(schema.questions)
    .where(eq(schema.questions.userId, userId));

  const maxOrder = existingQuestions.reduce(
    (max: number, q: any) => Math.max(max, q.order ?? 0),
    -1
  );
  const nextOrder = maxOrder + 1;

  const now = new Date();

  await (db as any).insert(schema.questions).values({
    id: questionId,
    userId,
    text: input.text.trim(),
    category: input.category?.trim() || 'General',
    answerType: input.answerType || 'yes_no',
    active: true,
    order: nextOrder,
    description: input.description?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });

  // Default Yes/No options if none provided
  const rawOptions =
    input.options && input.options.length > 0
      ? input.options
      : [
          { text: 'Yes', outcome: 'positive' as const, explanation: '', order: 0 },
          { text: 'No', outcome: 'negative' as const, explanation: '', order: 1 },
        ];

  for (let i = 0; i < rawOptions.length; i++) {
    const opt = rawOptions[i];
    await (db as any).insert(schema.questionOptions).values({
      id: generateId('opt'),
      questionId,
      text: opt.text.trim(),
      outcome: opt.outcome,
      explanation: opt.explanation?.trim() || null,
      order: opt.order ?? i,
      createdAt: now,
      updatedAt: now,
    });
  }

  const created = await getQuestionById(userId, questionId);
  if (!created) throw new Error('Failed to retrieve created question');
  return created;
}

export async function updateQuestion(
  userId: string,
  questionId: string,
  input: UpdateQuestionInput
): Promise<Question> {
  const existing = await getQuestionById(userId, questionId);
  if (!existing) {
    throw new Error('Question not found or unauthorized');
  }

  const now = new Date();
  const updateFields: any = { updatedAt: now };

  if (input.text !== undefined) updateFields.text = input.text.trim();
  if (input.category !== undefined) updateFields.category = input.category.trim();
  if (input.answerType !== undefined) updateFields.answerType = input.answerType;
  if (input.active !== undefined) updateFields.active = input.active;
  if (input.order !== undefined) updateFields.order = input.order;
  if (input.description !== undefined) updateFields.description = input.description?.trim() || null;

  await (db as any)
    .update(schema.questions)
    .set(updateFields)
    .where(and(eq(schema.questions.id, questionId), eq(schema.questions.userId, userId)));

  // If options array is provided, replace or update options
  if (input.options) {
    // Delete existing options
    await (db as any)
      .delete(schema.questionOptions)
      .where(eq(schema.questionOptions.questionId, questionId));

    // Insert updated options
    for (let i = 0; i < input.options.length; i++) {
      const opt = input.options[i];
      await (db as any).insert(schema.questionOptions).values({
        id: opt.id || generateId('opt'),
        questionId,
        text: opt.text.trim(),
        outcome: opt.outcome,
        explanation: opt.explanation?.trim() || null,
        order: opt.order ?? i,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const updated = await getQuestionById(userId, questionId);
  if (!updated) throw new Error('Failed to retrieve updated question');
  return updated;
}

export async function deleteQuestion(
  userId: string,
  questionId: string
): Promise<boolean> {
  const existing = await getQuestionById(userId, questionId);
  if (!existing) return false;

  await (db as any)
    .delete(schema.questions)
    .where(and(eq(schema.questions.id, questionId), eq(schema.questions.userId, userId)));

  return true;
}

export async function reorderQuestions(
  userId: string,
  questionIds: string[]
): Promise<void> {
  const now = new Date();
  for (let index = 0; index < questionIds.length; index++) {
    const qId = questionIds[index];
    await (db as any)
      .update(schema.questions)
      .set({ order: index, updatedAt: now })
      .where(and(eq(schema.questions.id, qId), eq(schema.questions.userId, userId)));
  }
}

export async function toggleQuestionActive(
  userId: string,
  questionId: string,
  active: boolean
): Promise<Question> {
  return updateQuestion(userId, questionId, { active });
}

/**
 * Seed default question templates for a new user
 * Highlights diverse YES/NO outcome semantics:
 * - "Drank Water": YES -> Positive, NO -> Negative
 * - "Smoked / Craving": YES -> Negative, NO -> Positive
 * - "Deep Work Sprint": YES -> Positive, NO -> Neutral
 */
export async function seedDefaultQuestions(userId: string): Promise<void> {
  const templates: CreateQuestionInput[] = [
    {
      text: 'Drank 250ml+ Water',
      category: 'Health',
      description: 'Hydration check every hour for sustained energy',
      options: [
        { text: 'Yes', outcome: 'positive', explanation: 'Good hydration', order: 0 },
        { text: 'No', outcome: 'negative', explanation: 'Missed hourly water intake', order: 1 },
      ],
    },
    {
      text: 'Focused Deep Work',
      category: 'Focus',
      description: 'Single-tasking without distracting tabs or phone checks',
      options: [
        { text: 'Yes', outcome: 'positive', explanation: 'Deep focus maintained', order: 0 },
        { text: 'No', outcome: 'negative', explanation: 'Distracted or interrupted', order: 1 },
      ],
    },
    {
      text: 'Sugar / Junk Snack',
      category: 'Health',
      description: 'Avoided mindless snacking and sugar crashes',
      options: [
        // CRITICAL PRODUCT RULE: YES is Negative here!
        { text: 'Yes', outcome: 'negative', explanation: 'Consumed sugary snack', order: 0 },
        { text: 'No', outcome: 'positive', explanation: 'Stayed clean', order: 1 },
      ],
    },
    {
      text: 'Moved / Stretched (5 min)',
      category: 'Routine',
      description: 'Stood up, walked, or stretched away from the desk',
      options: [
        { text: 'Yes', outcome: 'positive', explanation: 'Body active', order: 0 },
        { text: 'No', outcome: 'neutral', explanation: 'Sedentary hour', order: 1 },
      ],
    },
  ];

  for (const tpl of templates) {
    await createQuestion(userId, tpl);
  }
}
