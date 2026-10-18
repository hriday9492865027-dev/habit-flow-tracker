import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: err.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
