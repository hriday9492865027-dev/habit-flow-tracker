import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getNotificationPreferences } from '@/lib/data-access/notifications';
import { NotificationManager } from '@/components/notifications/NotificationManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notifications & Insights | HabitFlow',
  description: 'Hourly habit check-in reminders, quiet hours, and Web Push notifications',
};

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const preferences = await getNotificationPreferences(user.id);

  return (
    <div className="space-y-6">
      <NotificationManager initialPreferences={preferences} />
    </div>
  );
}
