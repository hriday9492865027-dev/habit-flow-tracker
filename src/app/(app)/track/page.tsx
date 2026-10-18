import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getQuestionsForUser } from '@/lib/data-access/questions';
import { getEntriesForDate } from '@/lib/data-access/entries';
import { getUserSettings } from '@/lib/data-access/settings';
import { getTodayString } from '@/lib/calculations';
import { TrackSheetClient } from '@/components/track/TrackSheetClient';

export const metadata = {
  title: 'Track Sheet | HabitFlow',
  description: 'Hourly habit and behavior tracking spreadsheet grid',
};

export default async function TrackPage() {
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-900">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Hourly Track Sheet</h1>
          <p className="text-xs text-slate-400">
            Log your habits hour-by-hour from 6 AM to 9 PM across configured outcome rules.
          </p>
        </div>
      </div>

      <TrackSheetClient
        initialDate={today}
        initialQuestions={questions}
        initialEntries={entries}
        settings={settings}
      />
    </div>
  );
}
