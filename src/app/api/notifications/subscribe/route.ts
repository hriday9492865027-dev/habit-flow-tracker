import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  savePushSubscription,
  deletePushSubscription,
} from '@/lib/data-access/notifications';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid PushSubscription payload' },
        { status: 400 }
      );
    }

    await savePushSubscription(user.id, {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to save push subscription:', err);
    return NextResponse.json(
      { error: 'Failed to register push subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    await deletePushSubscription(user.id, endpoint);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete push subscription:', err);
    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}
