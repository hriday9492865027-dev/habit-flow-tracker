import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Session check error:', err);
    return NextResponse.json({ user: null });
  }
}
