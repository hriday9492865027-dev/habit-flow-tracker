import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db, schema } from '@/lib/db';
import type { UserSettings } from '@/types';

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const rows = await (db as any)
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, userId))
    .limit(1);

  if (rows && rows.length > 0) {
    const s = rows[0];
    return {
      id: s.id,
      userId: s.userId,
      trackingStartHour: s.trackingStartHour,
      trackingEndHour: s.trackingEndHour,
      trackingIntervalMinutes: s.trackingIntervalMinutes,
      timezone: s.timezone,
      theme: s.theme,
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
      updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
    };
  }

  // Create default settings if not exists
  const now = new Date();
  const id = generateId('settings');
  await (db as any).insert(schema.userSettings).values({
    id,
    userId,
    trackingStartHour: 6,
    trackingEndHour: 21,
    trackingIntervalMinutes: 60,
    timezone: 'UTC',
    theme: 'dark',
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    userId,
    trackingStartHour: 6,
    trackingEndHour: 21,
    trackingIntervalMinutes: 60,
    timezone: 'UTC',
    theme: 'dark',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updateUserSettings(
  userId: string,
  input: Partial<{
    trackingStartHour: number;
    trackingEndHour: number;
    trackingIntervalMinutes: number;
    timezone: string;
    theme: string;
  }>
): Promise<UserSettings> {
  // Ensure record exists
  await getUserSettings(userId);

  const now = new Date();
  const updateFields: any = { updatedAt: now };

  if (input.trackingStartHour !== undefined) updateFields.trackingStartHour = input.trackingStartHour;
  if (input.trackingEndHour !== undefined) updateFields.trackingEndHour = input.trackingEndHour;
  if (input.trackingIntervalMinutes !== undefined) updateFields.trackingIntervalMinutes = input.trackingIntervalMinutes;
  if (input.timezone !== undefined) updateFields.timezone = input.timezone;
  if (input.theme !== undefined) updateFields.theme = input.theme;

  await (db as any)
    .update(schema.userSettings)
    .set(updateFields)
    .where(eq(schema.userSettings.userId, userId));

  return getUserSettings(userId);
}
