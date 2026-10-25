import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getQuestionsForUser } from '@/lib/data-access/questions';
import { getEntriesForDate } from '@/lib/data-access/entries';
import { getUserSettings } from '@/lib/data-access/settings';
import { getTodayString } from '@/lib/calculations';
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics & Insights | HabitFlow',
  description: 'Daily audits, weekly trajectory, calendar heatmaps, and evidence-based insights',
};

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const today = getTodayString();
  const [questions, entries, settings] = await Promise.all([
    getQuestionsForUser(user.id, false),
    getEntriesForDate(user.id, today),
    getUserSettings(user.id),
  ]);

  return (
    <AnalyticsClient
      initialDate={today}
      initialQuestions={questions}
      initialEntries={entries}
      settings={settings}
    />
  );
}
