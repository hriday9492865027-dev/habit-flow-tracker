import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { Navbar } from '@/components/layout/Navbar';
import { PwaOfflineManager } from '@/components/layout/PwaOfflineManager';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <PwaOfflineManager />
      <Navbar user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HabitFlow &copy; 2026 &bull; Private Hourly Habit &amp; Behavior Tracking</span>
          <span className="text-slate-400 font-mono">Owner A Core Foundation &bull; Ready for Owner B Modules</span>
        </div>
      </footer>
    </div>
  );
}
