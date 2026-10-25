'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Award,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import type { Question, HourlyEntry } from '@/types';
import {
  calculateMonthlyAnalytics,
  type MonthlyAnalyticsResult,
  type HeatmapCell,
} from '@/lib/calculations/analytics';
import { formatDisplayDate } from '@/lib/calculations';

interface MonthlyAnalyticsViewProps {
  year: number;
  month: number; // 1-12
  onMonthChange: (year: number, month: number) => void;
  questions: Question[];
  entries: HourlyEntry[];
  timeSlots: string[];
}

export function MonthlyAnalyticsView({
  year,
  month,
  onMonthChange,
  questions,
  entries,
  timeSlots,
}: MonthlyAnalyticsViewProps) {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  const monthly: MonthlyAnalyticsResult = calculateMonthlyAnalytics(
    year,
    month,
    entries,
    questions,
    timeSlots
  );

  function handlePrevMonth() {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  }

  function handleNextMonth() {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  }

  function handleCurrentMonth() {
    const now = new Date();
    onMonthChange(now.getFullYear(), now.getMonth() + 1);
  }

  // Calculate day-of-week header padding (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // Standard Monday-first calendar display
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  // In Monday-first index: Mon = 0, Tue = 1, ..., Sun = 6
  const leadingBlankDays = (firstDayOfMonth + 6) % 7;

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {monthly.monthName} {monthly.year}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Monthly Heatmap
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Calendar habit consistency density, monthly champion habits, and weekday analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleCurrentMonth}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-xs font-semibold text-purple-400 hover:text-purple-300 border border-slate-700/60 transition-colors"
          >
            Current Month
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Monthly Completion */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Monthly Completion</span>
            <span className="font-mono text-[11px] text-slate-500">
              {monthly.summary.answeredSlots}/{monthly.summary.totalSlots}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {monthly.summary.completionRatePercent}%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, monthly.summary.completionRatePercent)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 block mt-2">
            {monthly.summary.activeDaysCount} active tracking days this month
          </span>
        </div>

        {/* Positive Outcomes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-emerald-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Positive Outcomes</span>
            </span>
            <span className="font-mono text-[11px]">{monthly.summary.positiveRatePercent}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {monthly.summary.outcomes.positive}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 block mt-3">
            Positive outcomes across all habits
          </span>
        </div>

        {/* Negative Outcomes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-rose-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Negative Outcomes</span>
            </span>
            <span className="font-mono text-[11px]">
              {monthly.summary.answeredSlots > 0
                ? Math.round(
                    (monthly.summary.outcomes.negative / monthly.summary.answeredSlots) * 100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {monthly.summary.outcomes.negative}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[10px] text-rose-400/80 block mt-3">
            Recorded friction or lapses
          </span>
        </div>

        {/* Neutral Outcomes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Neutral Outcomes</span>
            </span>
            <span className="font-mono text-[11px]">
              {monthly.summary.answeredSlots > 0
                ? Math.round(
                    (monthly.summary.outcomes.neutral / monthly.summary.answeredSlots) * 100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {monthly.summary.outcomes.neutral}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[10px] text-amber-400/80 block mt-3">
            Neutral / baseline entries
          </span>
        </div>
      </div>

      {/* Monthly Habit Heatmap Calendar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Habit Consistency Heatmap</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any calendar day to inspect detailed completion and outcome counts
            </p>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Less</span>
            <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-750" title="0% No data" />
            <span className="w-3.5 h-3.5 rounded bg-emerald-950 border border-emerald-800" title="1-25% Low" />
            <span className="w-3.5 h-3.5 rounded bg-emerald-800 border border-emerald-600" title="26-50% Moderate" />
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-500" title="51-75% High" />
            <span className="w-3.5 h-3.5 rounded bg-emerald-400 border border-emerald-300" title="76-100% Peak" />
            <span>More</span>
          </div>
        </div>

        {/* Monday-to-Sunday Calendar Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[500px]">
            {/* Weekday Labels Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-2">
              {/* Blank leading days */}
              {Array.from({ length: leadingBlankDays }).map((_, idx) => (
                <div
                  key={`blank_${idx}`}
                  className="h-16 rounded-xl bg-slate-950/20 border border-transparent"
                />
              ))}

              {/* Real month days */}
              {monthly.cells.map((cell) => {
                const isSelected = selectedCell?.date === cell.date;

                // Color classes based on intensity
                let bgClass = 'bg-slate-950/50 border-slate-800/80 text-slate-400';
                if (cell.intensity === 1) {
                  bgClass = 'bg-emerald-950/50 border-emerald-900/60 text-emerald-300';
                } else if (cell.intensity === 2) {
                  bgClass = 'bg-emerald-900/50 border-emerald-800 text-emerald-200';
                } else if (cell.intensity === 3) {
                  bgClass = 'bg-emerald-700/60 border-emerald-600 text-white font-bold';
                } else if (cell.intensity === 4) {
                  bgClass = 'bg-emerald-500 border-emerald-400 text-slate-950 font-extrabold shadow-sm shadow-emerald-500/20';
                }

                return (
                  <button
                    key={cell.date}
                    onClick={() => setSelectedCell(cell)}
                    className={`h-16 p-2 rounded-xl border flex flex-col justify-between text-left transition-all hover:scale-[1.02] ${bgClass} ${
                      isSelected ? 'ring-2 ring-purple-400 border-purple-400' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{cell.dayOfMonth}</span>
                      {cell.answeredSlots > 0 && (
                        <span className="text-[10px] opacity-80 font-mono">
                          {cell.positiveCount}P
                        </span>
                      )}
                    </div>
                    {cell.answeredSlots > 0 ? (
                      <span className="text-[10px] font-mono opacity-90 truncate">
                        {cell.completionRatePercent}%
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-600 font-mono">&ndash;</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Cell Audit Drawer */}
        {selectedCell && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {formatDisplayDate(selectedCell.date)}
                </span>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {selectedCell.completionRatePercent}% Completion
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                {selectedCell.answeredSlots} of {selectedCell.totalSlots} slots logged &bull;{' '}
                <span className="text-emerald-400 font-bold">{selectedCell.positiveCount} Positive</span>,{' '}
                <span className="text-rose-400 font-bold">{selectedCell.negativeCount} Negative</span>,{' '}
                <span className="text-amber-400 font-bold">{selectedCell.neutralCount} Neutral</span>
              </p>
            </div>
            <Link
              href={`/track?date=${selectedCell.date}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors self-start sm:self-auto"
            >
              <span>View in Track Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Day of Week Analysis & Habit Champions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Performance */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Day-of-Week Behavioral Momentum</span>
            </h3>
            <span className="text-xs text-slate-400">Average Adherence</span>
          </div>

          <div className="space-y-2.5">
            {monthly.dayOfWeekPatterns.map((dow) => (
              <div
                key={dow.dayName}
                className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="w-28">
                  <span className="font-semibold text-slate-200 block">{dow.dayName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {dow.totalDaysRecorded} days in month
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex-1 mx-4 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, dow.avgCompletionRatePercent)}%` }}
                  />
                </div>

                <div className="text-right w-16">
                  <span className="font-mono font-bold text-white">
                    {dow.avgCompletionRatePercent}%
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-mono">
                    {dow.totalPositive} Pos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Habit Highlights & Challenges */}
        <div className="space-y-4">
          {/* Top Habit Champion */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Award className="w-5 h-5" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Monthly Habit Champion
              </h4>
            </div>

            {monthly.topHabits.highestAdherence ? (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
                <span className="text-sm font-bold text-white block">
                  &ldquo;{monthly.topHabits.highestAdherence.questionText}&rdquo;
                </span>
                <p className="text-xs text-slate-400">
                  Achieved {monthly.topHabits.highestAdherence.rate}% positive outcome consistency
                  throughout {monthly.monthName}.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Log more entries across this month to reveal your top performing habit.
              </p>
            )}
          </div>

          {/* Most Challenging Habit */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/20 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Focus Area for Next Month
              </h4>
            </div>

            {monthly.topHabits.mostChallenging &&
            monthly.topHabits.mostChallenging.negativeCount > 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
                <span className="text-sm font-bold text-white block">
                  &ldquo;{monthly.topHabits.mostChallenging.questionText}&rdquo;
                </span>
                <p className="text-xs text-slate-400">
                  Encountered {monthly.topHabits.mostChallenging.negativeCount} negative outcomes
                  during {monthly.monthName}. Setting smaller micro-goals can help turn this around.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No major friction patterns recorded this month. Excellent consistency!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Empty State CTA if no entries in the month */}
      {monthly.summary.answeredSlots === 0 && (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Entries Logged in {monthly.monthName}</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Entries logged in the Track Sheet will populate your monthly habit calendar heatmap and
            weekday analytics.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all"
          >
            <span>Open Hourly Track Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
