import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db, schema, ensureDbInitialized } from '@/lib/db';
import type { User } from '@/types';

export const SESSION_COOKIE_NAME = 'habitflow_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string): Promise<string> {
  await ensureDbInitialized();
  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await (db as any).insert(schema.sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return sessionId;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    await (db as any).delete(schema.sessions).where(eq(schema.sessions.id, sessionCookie.value));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    await ensureDbInitialized();

    const sessionRows = await (db as any)
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionCookie.value))
      .limit(1);

    if (!sessionRows || sessionRows.length === 0) {
      return null;
    }

    const session = sessionRows[0];
    if (new Date(session.expiresAt) < new Date()) {
      // Session expired
      await (db as any).delete(schema.sessions).where(eq(schema.sessions.id, session.id));
      return null;
    }

    const userRows = await (db as any)
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (!userRows || userRows.length === 0) {
      return null;
    }

    const u = userRows[0];
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : String(u.updatedAt),
    };
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
