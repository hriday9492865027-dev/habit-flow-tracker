import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getQuestionsForUser } from '@/lib/data-access/questions';
import { getEntriesForDate } from '@/lib/data-access/entries';
import { getUserSettings } from '@/lib/data-access/settings';
import {
  getTodayString,
  generateTimeSlots,
  calculateDailySummary,
  formatDisplayDate,
} from '@/lib/calculations';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { TimeOfDayBreakdown } from '@/components/dashboard/TimeOfDayBreakdown';
import { Table2, BarChart3, Bell, ArrowRight, Sparkles, Layers } from 'lucide-react';

export const metadata = {
  title: 'Dashboard | HabitFlow',
  description: 'Habit tracking daily overview and completion metrics',
};

export default async function DashboardPage() {
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

  const timeSlots = generateTimeSlots(
    settings.trackingStartHour ?? 6,
    settings.trackingEndHour ?? 21,
    settings.trackingIntervalMinutes ?? 60
  );

  const summary = calculateDailySummary(today, questions.length, timeSlots.length, entries);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Today's Overview
            </span>
            <span className="text-xs text-slate-400 font-medium">{formatDisplayDate(today)}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Habit Dashboard</h1>
          <p className="text-xs text-slate-400">
            Real-time outcome scoring and time-of-day completion breakdown
          </p>
        </div>

        <Link
          href="/track"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Table2 className="w-4 h-4" />
          <span>Open Track Sheet</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Time of Day Distribution */}
      <TimeOfDayBreakdown timeOfDay={summary.timeOfDay} />

      {/* Owner B Collaboration & Extension Modules */}
      <div className="mt-8 pt-6 border-t border-slate-900">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Owner B Modules &amp; Integration Slices</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Analytics Module Preview */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Module 1: Advanced Analytics &amp; Heatmaps
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  Owner B Scope
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Weekly 7-day change over time, monthly habit consistency heatmaps, and pattern correlations using Recharts and the shared calculation contracts.
              </p>
            </div>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Analytics Integration Contract</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Notifications & PWA Preview */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Module 2: Notifications &amp; Offline PWA
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Owner B Scope
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Service Worker push notification scheduling, interval reminders, quiet hours, manifest installation, and safe offline state sync without data loss.
              </p>
            </div>
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              <Bell className="w-4 h-4" />
              <span>View Notifications Contract</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
