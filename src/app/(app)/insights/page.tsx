import React from 'react';
import Link from 'next/link';
import { Bell, Smartphone, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Insights & Reminders Contract | HabitFlow',
  description: 'Owner B Notifications, Reminders & PWA Interface',
};

export default function InsightsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Scope Boundary Banner */}
      <div className="p-6 rounded-2xl bg-purple-950/40 border border-purple-500/30 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-400">
            <Bell className="w-5 h-5" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Assigned Module: Hourly Reminders, Web Push &amp; PWA
            </h2>
          </div>
          <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
            Owner B Scope
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This area is designated for Owner B to implement hourly push notifications, Web Push subscriptions, background reminders, and offline Progressive Web App (PWA) features.
        </p>
      </div>

      {/* Contract & Boundary Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Bell className="w-4 h-4 text-purple-400" />
            <span>Reminder Rules &amp; Privacy</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400 leading-relaxed list-disc list-inside">
            <li>Quiet hours and custom tracking hours can be read from <code className="text-slate-300 font-mono">user_settings</code>.</li>
            <li>Avoid sensitive habit answer details in raw push notification payloads.</li>
            <li>Direct clicks on notifications should route directly to <code className="text-slate-300 font-mono">/track</code>.</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>PWA &amp; Offline Sync Contract</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400 leading-relaxed list-disc list-inside">
            <li>Service Worker registration point prepared in layout.</li>
            <li>Do not indiscriminately cache private authenticated user APIs.</li>
            <li>When syncing offline entries, post to <code className="text-slate-300 font-mono">POST /api/entries</code>.</li>
          </ul>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Documented in docs/INTEGRATION_CONTRACT.md</span>
        </span>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-medium"
        >
          <span>Back to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
