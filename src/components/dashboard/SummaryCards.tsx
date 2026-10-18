'use client';

import React from 'react';
import { CheckCircle2, TrendingUp, AlertTriangle, Minus, HelpCircle } from 'lucide-react';
import type { DailySummary } from '@/types';

interface SummaryCardsProps {
  summary: DailySummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { completion, outcomes, totalActiveQuestions } = summary;
  const answered = outcomes.totalAnswered;

  const posPercent = answered > 0 ? Math.round((outcomes.positive / answered) * 100) : 0;
  const negPercent = answered > 0 ? Math.round((outcomes.negative / answered) * 100) : 0;
  const neutPercent = answered > 0 ? Math.round((outcomes.neutral / answered) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Completion Rate (Explicit Denominator) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Hourly Completion
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {completion.completionRatePercent}%
            </span>
            <span className="text-xs font-medium text-slate-400">
              ({completion.answeredSlots}/{completion.totalSlots} slots)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, completion.completionRatePercent)}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{totalActiveQuestions} active questions</span>
          <span>{completion.unansweredSlots} unanswered</span>
        </div>
      </div>

      {/* 2. Positive Outcomes */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Positive Outcomes
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {outcomes.positive}
            </span>
            <span className="text-xs font-medium text-slate-400">
              ({posPercent}% of answered)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Evaluated as positive per configured question option rules.
          </p>
        </div>

        <div className="mt-3 text-[11px] text-emerald-500/80 font-medium">
          + Active healthy habits
        </div>
      </div>

      {/* 3. Negative Outcomes */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Negative Outcomes
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {outcomes.negative}
            </span>
            <span className="text-xs font-medium text-slate-400">
              ({negPercent}% of answered)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Evaluated as negative per configured option rules (not raw YES/NO).
          </p>
        </div>

        <div className="mt-3 text-[11px] text-rose-400/80 font-medium">
          - Slips or missed routines
        </div>
      </div>

      {/* 4. Neutral Outcomes */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Neutral / Optional
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
            <Minus className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-200 tracking-tight">
              {outcomes.neutral}
            </span>
            <span className="text-xs font-medium text-slate-400">
              ({neutPercent}% of answered)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Optional or non-scored slots; neither positive nor negative.
          </p>
        </div>

        <div className="mt-3 text-[11px] text-slate-400">
          ~ Non-judgmental tracking
        </div>
      </div>
    </div>
  );
}
