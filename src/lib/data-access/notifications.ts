import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db, schema } from '@/lib/db';

export interface NotificationPreferences {
  id: string;
  userId: string;
  enabled: boolean;
  mode: 'interval' | 'specific_times';
  intervalMinutes: number;
  specificTimes: string[]; // ["09:00", "13:00", "17:00", "21:00"]
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "06:00"
  daysOfWeek: number[]; // [0,1,2,3,4,5,6] (0 = Sunday, 1 = Monday, ...)
  createdAt: string;
  updatedAt: string;
}

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const rows = await (db as any)
    .select()
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))
    .limit(1);

  if (rows && rows.length > 0) {
    const r = rows[0];
    let specificTimes: string[] = ['09:00', '13:00', '17:00', '21:00'];
    let daysOfWeek: number[] = [1, 2, 3, 4, 5, 6, 0];

    try {
      specificTimes = JSON.parse(r.specificTimes);
    } catch {}

    try {
      daysOfWeek = JSON.parse(r.daysOfWeek);
    } catch {}

    return {
      id: r.id,
      userId: r.userId,
      enabled: Boolean(r.enabled),
      mode: (r.mode as any) || 'interval',
      intervalMinutes: r.intervalMinutes ?? 60,
      specificTimes,
      quietHoursStart: r.quietHoursStart || '22:00',
      quietHoursEnd: r.quietHoursEnd || '06:00',
      daysOfWeek,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
    };
  }

  // Create default preferences
  const id = generateId('notif_pref');
  const now = new Date();
  const defaultSpecific = JSON.stringify(['09:00', '13:00', '17:00', '21:00']);
  const defaultDays = JSON.stringify([1, 2, 3, 4, 5, 6, 0]);

  await (db as any).insert(schema.notificationPreferences).values({
    id,
    userId,
    enabled: false,
    mode: 'interval',
    intervalMinutes: 60,
    specificTimes: defaultSpecific,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    daysOfWeek: defaultDays,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    userId,
    enabled: false,
    mode: 'interval',
    intervalMinutes: 60,
    specificTimes: ['09:00', '13:00', '17:00', '21:00'],
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updateNotificationPreferences(
  userId: string,
  input: Partial<{
    enabled: boolean;
    mode: 'interval' | 'specific_times';
    intervalMinutes: number;
    specificTimes: string[];
    quietHoursStart: string;
    quietHoursEnd: string;
    daysOfWeek: number[];
  }>
): Promise<NotificationPreferences> {
  // Ensure record exists
  await getNotificationPreferences(userId);

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.enabled !== undefined) updateData.enabled = input.enabled;
  if (input.mode !== undefined) updateData.mode = input.mode;
  if (input.intervalMinutes !== undefined) updateData.intervalMinutes = input.intervalMinutes;
  if (input.specificTimes !== undefined) {
    updateData.specificTimes = JSON.stringify(input.specificTimes);
  }
  if (input.quietHoursStart !== undefined) updateData.quietHoursStart = input.quietHoursStart;
  if (input.quietHoursEnd !== undefined) updateData.quietHoursEnd = input.quietHoursEnd;
  if (input.daysOfWeek !== undefined) {
    updateData.daysOfWeek = JSON.stringify(input.daysOfWeek);
  }

  await (db as any)
    .update(schema.notificationPreferences)
    .set(updateData)
    .where(eq(schema.notificationPreferences.userId, userId));

  return getNotificationPreferences(userId);
}

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string }
): Promise<void> {
  const existing = await (db as any)
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, sub.endpoint))
    .limit(1);

  if (existing && existing.length > 0) {
    // Already saved for this endpoint
    return;
  }

  const id = generateId('push_sub');
  await (db as any).insert(schema.pushSubscriptions).values({
    id,
    userId,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    createdAt: new Date(),
  });
}

export async function deletePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await (db as any)
    .delete(schema.pushSubscriptions)
    .where(
      and(
        eq(schema.pushSubscriptions.userId, userId),
        eq(schema.pushSubscriptions.endpoint, endpoint)
      )
    );
}

export async function getUserPushSubscriptions(
  userId: string
): Promise<Array<{ id: string; endpoint: string; p256dh: string; auth: string }>> {
  const rows = await (db as any)
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, userId));

  return rows.map((r: any) => ({
    id: r.id,
    endpoint: r.endpoint,
    p256dh: r.p256dh,
    auth: r.auth,
  }));
}
