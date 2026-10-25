import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db, schema, ensureDbInitialized } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { seedDefaultQuestions } from './questions';
import { getUserSettings } from './settings';
import type { User } from '@/types';

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  await ensureDbInitialized();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await (db as any)
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, normalizedEmail))
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error('Email is already registered');
  }

  const userId = generateId('usr');
  const passwordHash = hashPassword(password);
  const now = new Date();

  await (db as any).insert(schema.users).values({
    id: userId,
    email: normalizedEmail,
    name: name?.trim() || null,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  // Seed default settings and questions
  await getUserSettings(userId);
  await seedDefaultQuestions(userId);

  return {
    id: userId,
    email: normalizedEmail,
    name: name?.trim() || null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function getUserByEmail(
  email: string
): Promise<{ user: User; passwordHash: string } | null> {
  await ensureDbInitialized();
  const normalizedEmail = email.trim().toLowerCase();

  const rows = await (db as any)
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalizedEmail))
    .limit(1);

  if (!rows || rows.length === 0) {
    return null;
  }

  const u = rows[0];
  return {
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : String(u.updatedAt),
    },
    passwordHash: u.passwordHash,
  };
}
