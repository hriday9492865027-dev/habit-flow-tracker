import { eq, and, gte, lte } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db, schema } from '@/lib/db';
import type { HourlyEntry, SaveEntryInput } from '@/types';

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export async function getEntriesForDate(
  userId: string,
  date: string
): Promise<HourlyEntry[]> {
  const rows = await (db as any)
    .select()
    .from(schema.hourlyEntries)
    .where(and(eq(schema.hourlyEntries.userId, userId), eq(schema.hourlyEntries.date, date)));

  return rows.map((r: any) => ({
    id: r.id,
    userId: r.userId,
    questionId: r.questionId,
    optionId: r.optionId,
    value: r.value,
    date: r.date,
    timeSlot: r.timeSlot,
    outcomeSnapshot: r.outcomeSnapshot as any,
    notes: r.notes,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
  }));
}

export async function getEntriesDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<HourlyEntry[]> {
  const rows = await (db as any)
    .select()
    .from(schema.hourlyEntries)
    .where(
      and(
        eq(schema.hourlyEntries.userId, userId),
        gte(schema.hourlyEntries.date, startDate),
        lte(schema.hourlyEntries.date, endDate)
      )
    );

  return rows.map((r: any) => ({
    id: r.id,
    userId: r.userId,
    questionId: r.questionId,
    optionId: r.optionId,
    value: r.value,
    date: r.date,
    timeSlot: r.timeSlot,
    outcomeSnapshot: r.outcomeSnapshot as any,
    notes: r.notes,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
  }));
}

export async function saveHourlyEntry(
  userId: string,
  input: SaveEntryInput
): Promise<HourlyEntry> {
  // 1. Authorize question ownership server-side
  const questionRows = await (db as any)
    .select()
    .from(schema.questions)
    .where(and(eq(schema.questions.id, input.questionId), eq(schema.questions.userId, userId)))
    .limit(1);

  if (!questionRows || questionRows.length === 0) {
    throw new Error('Question not found or unauthorized');
  }

  // 2. Validate option ownership if optionId provided
  let outcome = input.outcomeSnapshot;
  if (input.optionId) {
    const optionRows = await (db as any)
      .select()
      .from(schema.questionOptions)
      .where(
        and(
          eq(schema.questionOptions.id, input.optionId),
          eq(schema.questionOptions.questionId, input.questionId)
        )
      )
      .limit(1);

    if (optionRows && optionRows.length > 0) {
      // Use configured option outcome snapshot
      outcome = optionRows[0].outcome as any;
    }
  }

  const now = new Date();

  // 3. Check for existing entry for this slot
  const existingRows = await (db as any)
    .select()
    .from(schema.hourlyEntries)
    .where(
      and(
        eq(schema.hourlyEntries.userId, userId),
        eq(schema.hourlyEntries.questionId, input.questionId),
        eq(schema.hourlyEntries.date, input.date),
        eq(schema.hourlyEntries.timeSlot, input.timeSlot)
      )
    )
    .limit(1);

  let entryId: string;

  if (existingRows && existingRows.length > 0) {
    entryId = existingRows[0].id;
    await (db as any)
      .update(schema.hourlyEntries)
      .set({
        optionId: input.optionId || null,
        value: input.value,
        outcomeSnapshot: outcome,
        notes: input.notes?.trim() || null,
        updatedAt: now,
      })
      .where(eq(schema.hourlyEntries.id, entryId));
  } else {
    entryId = generateId('entry');
    await (db as any).insert(schema.hourlyEntries).values({
      id: entryId,
      userId,
      questionId: input.questionId,
      optionId: input.optionId || null,
      value: input.value,
      date: input.date,
      timeSlot: input.timeSlot,
      outcomeSnapshot: outcome,
      notes: input.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const updatedRows = await (db as any)
    .select()
    .from(schema.hourlyEntries)
    .where(eq(schema.hourlyEntries.id, entryId))
    .limit(1);

  const saved = updatedRows[0];
  return {
    id: saved.id,
    userId: saved.userId,
    questionId: saved.questionId,
    optionId: saved.optionId,
    value: saved.value,
    date: saved.date,
    timeSlot: saved.timeSlot,
    outcomeSnapshot: saved.outcomeSnapshot as any,
    notes: saved.notes,
    createdAt: saved.createdAt instanceof Date ? saved.createdAt.toISOString() : String(saved.createdAt),
    updatedAt: saved.updatedAt instanceof Date ? saved.updatedAt.toISOString() : String(saved.updatedAt),
  };
}

export async function deleteHourlyEntry(
  userId: string,
  entryId: string
): Promise<boolean> {
  const existing = await (db as any)
    .select()
    .from(schema.hourlyEntries)
    .where(and(eq(schema.hourlyEntries.id, entryId), eq(schema.hourlyEntries.userId, userId)))
    .limit(1);

  if (!existing || existing.length === 0) {
    return false;
  }

  await (db as any)
    .delete(schema.hourlyEntries)
    .where(and(eq(schema.hourlyEntries.id, entryId), eq(schema.hourlyEntries.userId, userId)));

  return true;
}

export async function deleteHourlyEntryBySlot(
  userId: string,
  questionId: string,
  date: string,
  timeSlot: string
): Promise<boolean> {
  const result = await (db as any)
    .delete(schema.hourlyEntries)
    .where(
      and(
        eq(schema.hourlyEntries.userId, userId),
        eq(schema.hourlyEntries.questionId, questionId),
        eq(schema.hourlyEntries.date, date),
        eq(schema.hourlyEntries.timeSlot, timeSlot)
      )
    );

  return true;
}
