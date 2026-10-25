import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserPushSubscriptions } from '@/lib/data-access/notifications';
import { sendPushNotification } from '@/lib/notifications/vapid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscriptions = await getUserPushSubscriptions(user.id);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        deliveredCount: 0,
        message:
          'No active Web Push subscriptions found for your account. Please enable browser notifications on this device first.',
      });
    }

    let deliveredCount = 0;
    for (const sub of subscriptions) {
      const delivered = await sendPushNotification(sub, {
        title: 'HabitFlow Test Notification 🚀',
        body: 'Your notification pipeline is live! Tap to open your hourly Track Sheet.',
        url: '/track',
      });
      if (delivered) deliveredCount++;
    }

    return NextResponse.json({
      success: true,
      deliveredCount,
      totalSubscriptions: subscriptions.length,
      message: `Test notification sent to ${deliveredCount} active device(s).`,
    });
  } catch (err: any) {
    console.error('Test notification failed:', err);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
