import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserSettings } from '@/lib/data-access/settings';
import { SettingsClient } from './SettingsClient';

export const metadata = {
  title: 'Settings | HabitFlow',
  description: 'Manage tracking schedule, timezones, and preferences',
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const settings = await getUserSettings(user.id);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-900">
        <h1 className="text-2xl font-bold text-white tracking-tight">App Settings</h1>
        <p className="text-xs text-slate-400">
          Configure tracking hours, timezones, and review shared developer contracts.
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
