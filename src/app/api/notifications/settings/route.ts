import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/data-access/notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const preferences = await getNotificationPreferences(user.id);
    return NextResponse.json({ preferences });
  } catch (err: any) {
    console.error('Failed to get notification preferences:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve notification preferences' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await updateNotificationPreferences(user.id, body);
    return NextResponse.json({ preferences: updated });
  } catch (err: any) {
    console.error('Failed to update notification preferences:', err);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
