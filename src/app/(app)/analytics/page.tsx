import React from 'react';
import Link from 'next/link';
import { BarChart3, Code, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Analytics Contract | HabitFlow',
  description: 'Owner B Analytics & Trends Integration Interface',
};

export default function AnalyticsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Scope Boundary Banner */}
      <div className="p-6 rounded-2xl bg-sky-950/40 border border-sky-500/30 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400">
            <BarChart3 className="w-5 h-5" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Assigned Module: Analytics &amp; Visual Trends
            </h2>
          </div>
          <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
            Owner B Scope
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This route and its child views (Daily, Weekly, Monthly) are reserved for Owner B to implement using Recharts, weekly change calculations, and monthly heatmaps.
          All required database entities, server queries, and pure calculation utilities have been built, strictly authorized, and tested by Owner A.
        </p>
      </div>

      {/* Integration Contract Highlights */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Code className="w-4 h-4 text-emerald-400" />
          <span>Ready Data Access Queries for Owner B</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750">
            <span className="font-mono text-emerald-400 font-semibold block mb-1">
              GET /api/entries?date=YYYY-MM-DD
            </span>
            <span className="text-slate-400">
              Fetches all entries for a specific day. Returns raw answer and preserved outcomeSnapshot.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750">
            <span className="font-mono text-emerald-400 font-semibold block mb-1">
              GET /api/entries?startDate=...&amp;endDate=...
            </span>
            <span className="text-slate-400">
              Range query for 7-day weekly comparisons or 30-day monthly heatmap aggregation.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750">
            <span className="font-mono text-emerald-400 font-semibold block mb-1">
              calculateOutcomeCounts(entries)
            </span>
            <span className="text-slate-400">
              Pure calculation returning positive, negative, neutral, and total counts.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750">
            <span className="font-mono text-emerald-400 font-semibold block mb-1">
              calculateCompletionStats(total, answered)
            </span>
            <span className="text-slate-400">
              Calculates explicit percentage without treating unanswered slots as negative.
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete contract documented in docs/INTEGRATION_CONTRACT.md</span>
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
    </div>
  );
}
