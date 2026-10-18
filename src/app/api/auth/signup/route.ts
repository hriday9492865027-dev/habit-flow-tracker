import { NextResponse } from 'next/server';
import { createUser } from '@/lib/data-access/users';
import { createSession } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);
    await createSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}
