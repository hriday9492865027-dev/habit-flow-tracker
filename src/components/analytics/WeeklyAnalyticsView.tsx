'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
  MinusCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  HelpCircle,
  Award,
} from 'lucide-react';
import type { Question, HourlyEntry } from '@/types';
import {
  formatDisplayDate,
  getAdjacentDate,
  getTodayString,
} from '@/lib/calculations';
import {
  calculateWeeklyAnalytics,
  type WeeklyAnalyticsResult,
} from '@/lib/calculations/analytics';

interface WeeklyAnalyticsViewProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  questions: Question[];
  entries: HourlyEntry[];
  timeSlots: string[];
}

export function WeeklyAnalyticsView({
  startDate,
  endDate,
  onRangeChange,
  questions,
  entries,
  timeSlots,
}: WeeklyAnalyticsViewProps) {
  const weekly: WeeklyAnalyticsResult = calculateWeeklyAnalytics(
    startDate,
    endDate,
    entries,
    questions,
    timeSlots
  );

  const activeQuestions = questions.filter((q) => q.active);
  const slotsPerDay = activeQuestions.length * timeSlots.length;

  function handlePrevWeek() {
    const newStart = getAdjacentDate(startDate, -7);
    const newEnd = getAdjacentDate(endDate, -7);
    onRangeChange(newStart, newEnd);
  }

  function handleNextWeek() {
    const newStart = getAdjacentDate(startDate, 7);
    const newEnd = getAdjacentDate(endDate, 7);
    onRangeChange(newStart, newEnd);
  }

  function handleCurrentWeek() {
    const today = getTodayString();
    const start = getAdjacentDate(today, -6);
    onRangeChange(start, today);
  }

  return (
    <div className="space-y-6">
      {/* 7-Day Range Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {formatDisplayDate(startDate)} &ndash; {formatDisplayDate(endDate)}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                7-Day Window
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Weekly progress, change over time, and question consistency trends
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Previous 7 Days"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleCurrentWeek}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-xs font-semibold text-sky-400 hover:text-sky-300 border border-slate-700/60 transition-colors"
          >
            Current 7 Days
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Next 7 Days"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekly KPI Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Weekly Completion */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>7-Day Completion</span>
            <span className="font-mono text-[11px] text-slate-500">
              {weekly.totals.answeredSlots}/{weekly.totals.totalSlots}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {weekly.totals.completionRatePercent}%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, weekly.totals.completionRatePercent)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 block mt-2">
            {weekly.totals.unansweredSlots} total unanswered slots (missing data)
          </span>
        </div>

        {/* Positive Outcomes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-emerald-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Positive Outcomes</span>
            </span>
            <span className="font-mono text-[11px]">{weekly.totals.positiveRatePercent}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {weekly.totals.outcomes.positive}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 block mt-3">
            Positive habit accomplishments
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
              {weekly.totals.answeredSlots > 0
                ? Math.round((weekly.totals.outcomes.negative / weekly.totals.answeredSlots) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {weekly.totals.outcomes.negative}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[10px] text-rose-400/80 block mt-3">
            Friction or missed targets
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
              {weekly.totals.answeredSlots > 0
                ? Math.round((weekly.totals.outcomes.neutral / weekly.totals.answeredSlots) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {weekly.totals.outcomes.neutral}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[10px] text-amber-400/80 block mt-3">
            Passive or non-applicable entries
          </span>
        </div>
      </div>

      {/* 7-Day Day-by-Day Stacked Outcome Chart */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>7-Day Daily Outcome Breakdown &amp; Adherence</span>
            </h3>
            <p className="text-xs text-slate-400">
              Daily distribution of positive, negative, neutral, and missing hours
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Positive
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Negative
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Neutral
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700 inline-block" /> Missing
            </span>
          </div>
        </div>

        {/* 7-Day Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-2">
          {weekly.dailyMetrics.map((day) => {
            const hasData = day.answeredSlots > 0;
            const posRatio = slotsPerDay > 0 ? (day.outcomes.positive / slotsPerDay) * 100 : 0;
            const negRatio = slotsPerDay > 0 ? (day.outcomes.negative / slotsPerDay) * 100 : 0;
            const neuRatio = slotsPerDay > 0 ? (day.outcomes.neutral / slotsPerDay) * 100 : 0;

            return (
              <div
                key={day.date}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors group"
              >
                <span className="text-xs font-bold text-slate-300">{day.dayOfWeek}</span>
                <span className="text-[10px] text-slate-500 mb-3">{day.dayOfMonth}</span>

                {/* Vertical stacked bar */}
                <div className="w-full h-36 bg-slate-900 rounded-xl border border-slate-800/80 flex flex-col-reverse p-1.5 gap-1 relative overflow-hidden">
                  {posRatio > 0 && (
                    <div
                      className="bg-emerald-500 rounded-sm w-full transition-all"
                      style={{ height: `${posRatio}%` }}
                      title={`${day.outcomes.positive} Positive`}
                    />
                  )}
                  {negRatio > 0 && (
                    <div
                      className="bg-rose-500 rounded-sm w-full transition-all"
                      style={{ height: `${negRatio}%` }}
                      title={`${day.outcomes.negative} Negative`}
                    />
                  )}
                  {neuRatio > 0 && (
                    <div
                      className="bg-amber-500 rounded-sm w-full transition-all"
                      style={{ height: `${neuRatio}%` }}
                      title={`${day.outcomes.neutral} Neutral`}
                    />
                  )}
                  {!hasData && (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">
                      No data
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <span className="text-xs font-bold text-white block">
                    {day.completionRatePercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {day.answeredSlots}/{day.totalSlots}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Consistency Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Habit Consistency Audit (7 Days)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {weekly.questionMetrics.length} Habits Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Habit Question</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Answered Slots</th>
                <th className="py-3 px-3 text-center">Positive</th>
                <th className="py-3 px-3 text-center">Negative</th>
                <th className="py-3 px-3 text-right">Completion Rate</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {weekly.questionMetrics.map((q) => (
                <tr key={q.questionId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">{q.questionText}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] uppercase font-bold text-slate-400 border border-slate-700/60">
                      {q.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">
                    {q.totalAnswered} / {q.totalSlots}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">
                    {q.positiveCount}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-rose-400 font-bold">
                    {q.negativeCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    {q.completionRatePercent}%
                  </td>
                  <td className="py-3 px-3 text-right">
                    {q.trend === 'improving' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Strong
                      </span>
                    )}
                    {q.trend === 'steady' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Steady
                      </span>
                    )}
                    {q.trend === 'needs_attention' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Attention
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Time of Day Summary */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span>7-Day Time of Day Performance Summary</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">Morning (6 AM &ndash; 11 AM)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white">
                {weekly.timeOfDayTotals.morning.totalAnswered}
              </span>
              <span className="text-xs text-slate-400">entries</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono pt-1">
              <span className="text-emerald-400">{weekly.timeOfDayTotals.morning.positive} Pos</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-rose-400">{weekly.timeOfDayTotals.morning.negative} Neg</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-amber-400">{weekly.timeOfDayTotals.morning.neutral} Neu</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">Afternoon (12 PM &ndash; 4 PM)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white">
                {weekly.timeOfDayTotals.afternoon.totalAnswered}
              </span>
              <span className="text-xs text-slate-400">entries</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono pt-1">
              <span className="text-emerald-400">{weekly.timeOfDayTotals.afternoon.positive} Pos</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-rose-400">{weekly.timeOfDayTotals.afternoon.negative} Neg</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-amber-400">{weekly.timeOfDayTotals.afternoon.neutral} Neu</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">Evening (5 PM &ndash; 9 PM)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white">
                {weekly.timeOfDayTotals.evening.totalAnswered}
              </span>
              <span className="text-xs text-slate-400">entries</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono pt-1">
              <span className="text-emerald-400">{weekly.timeOfDayTotals.evening.positive} Pos</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-rose-400">{weekly.timeOfDayTotals.evening.negative} Neg</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-amber-400">{weekly.timeOfDayTotals.evening.neutral} Neu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State CTA if no entries in weekly window */}
      {weekly.totals.answeredSlots === 0 && (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Entries Recorded in this 7-Day Window</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Log entries in the Track Sheet for this week to unlock continuous weekly trend tracking
            and comparison analytics.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/20 transition-all"
          >
            <span>Open Hourly Track Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
