'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { getAdjacentDate, formatDisplayDate, getTodayString } from '@/lib/calculations';
import type { OutcomeCounts, CompletionStats } from '@/types';

interface DateNavigatorProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  completion?: CompletionStats;
  outcomes?: OutcomeCounts;
}

export function DateNavigator({
  currentDate,
  onDateChange,
  completion,
  outcomes,
}: DateNavigatorProps) {
  const isToday = currentDate === getTodayString();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      {/* Date Navigation Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDateChange(getAdjacentDate(currentDate, -1))}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          title="Previous Day"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => onDateChange(getTodayString())}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isToday
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          Today
        </button>

        <button
          onClick={() => onDateChange(getAdjacentDate(currentDate, 1))}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          title="Next Day"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Date Display and Native Picker */}
        <div className="relative flex items-center ml-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white tracking-wide">
              {formatDisplayDate(currentDate)}
            </span>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Pick a date"
            />
          </div>
        </div>
      </div>

      {/* Daily Progress & Outcome Breakdown */}
      {completion && outcomes && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Answered / Total with progress */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              <strong className="text-white font-semibold">{completion.answeredSlots}</strong>
              <span className="text-slate-400">/{completion.totalSlots}</span> slots (
              <strong className="text-emerald-400">{completion.completionRatePercent}%</strong>)
            </span>
          </div>

          {/* Outcome Breakdown Pills */}
          <div className="flex items-center gap-1.5">
            <span
              className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium"
              title="Positive outcomes"
            >
              +{outcomes.positive} Positive
            </span>
            <span
              className="px-2 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 font-medium"
              title="Negative outcomes"
            >
              -{outcomes.negative} Negative
            </span>
            {outcomes.neutral > 0 && (
              <span
                className="px-2 py-1 rounded bg-slate-800 border border-slate-600 text-slate-300 font-medium"
                title="Neutral outcomes"
              >
                ~{outcomes.neutral} Neutral
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
