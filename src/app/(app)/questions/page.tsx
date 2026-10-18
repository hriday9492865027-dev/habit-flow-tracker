import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getQuestionsForUser } from '@/lib/data-access/questions';
import { QuestionsClient } from './QuestionsClient';

export const metadata = {
  title: 'Questions | HabitFlow',
  description: 'Manage questions, answer options, and outcome mappings',
};

export default async function QuestionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const questions = await getQuestionsForUser(user.id, true);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-900">
        <h1 className="text-2xl font-bold text-white tracking-tight">Question Management</h1>
        <p className="text-xs text-slate-400">
          Create, categorize, reorder, and configure positive/negative outcome rules for each habit.
        </p>
      </div>

      <QuestionsClient initialQuestions={questions} />
    </div>
  );
}
