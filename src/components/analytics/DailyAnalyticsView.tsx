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
  HelpCircle,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { Question, HourlyEntry, Outcome } from '@/types';
import {
  calculateOutcomeCounts,
  calculateCompletionStats,
  calculateTimeOfDaySummary,
  formatSlotLabel,
  formatDisplayDate,
  getAdjacentDate,
  getTodayString,
} from '@/lib/calculations';
import { calculateEvidenceBasedInsights } from '@/lib/calculations/analytics';

interface DailyAnalyticsViewProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  questions: Question[];
  entries: HourlyEntry[];
  timeSlots: string[];
}

export function DailyAnalyticsView({
  currentDate,
  onDateChange,
  questions,
  entries,
  timeSlots,
}: DailyAnalyticsViewProps) {
  const activeQuestions = questions.filter((q) => q.active);
  const totalSlots = activeQuestions.length * timeSlots.length;
  const answeredSlots = entries.length;
  const completion = calculateCompletionStats(totalSlots, answeredSlots);
  const outcomes = calculateOutcomeCounts(entries);
  const timeOfDay = calculateTimeOfDaySummary(entries);
  const insights = calculateEvidenceBasedInsights(
    entries,
    activeQuestions,
    timeSlots,
    formatDisplayDate(currentDate)
  );

  const isToday = currentDate === getTodayString();
  const positiveRatePercent =
    answeredSlots > 0 ? Math.round((outcomes.positive / answeredSlots) * 1000) / 10 : 0;

  // Map entries for quick lookup
  const entryLookup = new Map<string, HourlyEntry>();
  entries.forEach((e) => {
    entryLookup.set(`${e.questionId}_${e.timeSlot}`, e);
  });

  return (
    <div className="space-y-6">
      {/* Date Header & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {formatDisplayDate(currentDate)}
              </h2>
              {isToday && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Daily habit performance and outcome audit</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onDateChange(getAdjacentDate(currentDate, -1))}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isToday && (
            <button
              onClick={() => onDateChange(getTodayString())}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-slate-700/60 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => onDateChange(getAdjacentDate(currentDate, 1))}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Completion */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Daily Completion</span>
            <span className="font-mono text-[11px] text-slate-500">
              {answeredSlots}/{totalSlots} slots
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {completion.completionRatePercent}%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, completion.completionRatePercent)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 block mt-2">
            {completion.unansweredSlots} unanswered slots remaining
          </span>
        </div>

        {/* Positive Outcomes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-emerald-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Positive</span>
            </span>
            <span className="font-mono text-[11px]">{positiveRatePercent}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {outcomes.positive}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 block mt-3">
            Constructive habit hours logged
          </span>
        </div>

        {/* Negative Outcomes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-rose-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Negative</span>
            </span>
            <span className="font-mono text-[11px]">
              {answeredSlots > 0 ? Math.round((outcomes.negative / answeredSlots) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {outcomes.negative}
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
              <span>Neutral</span>
            </span>
            <span className="font-mono text-[11px]">
              {answeredSlots > 0 ? Math.round((outcomes.neutral / answeredSlots) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {outcomes.neutral}
            </span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[10px] text-amber-400/80 block mt-3">
            Rest, baseline, or N/A
          </span>
        </div>
      </div>

      {/* Hourly Timeline Outcome Strip */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Hourly Outcome Timeline ({formatSlotLabel(timeSlots[0] || '06:00')} &ndash;{' '}
              {formatSlotLabel(timeSlots[timeSlots.length - 1] || '21:00')})
            </h3>
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

        {/* Horizontal Hour Matrix */}
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-flow-col auto-cols-[minmax(54px,1fr)] gap-2 min-w-[700px]">
            {timeSlots.map((slot) => {
              const slotEntries = entries.filter((e) => e.timeSlot === slot);
              const pos = slotEntries.filter((e) => e.outcomeSnapshot === 'positive').length;
              const neg = slotEntries.filter((e) => e.outcomeSnapshot === 'negative').length;
              const neu = slotEntries.filter((e) => e.outcomeSnapshot === 'neutral').length;
              const hasEntries = slotEntries.length > 0;

              return (
                <div
                  key={slot}
                  className="flex flex-col items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <span className="text-[11px] font-semibold text-slate-300 mb-2">
                    {formatSlotLabel(slot)}
                  </span>
                  <div className="w-full h-16 flex flex-col-reverse gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800/80">
                    {pos > 0 && (
                      <div
                        className="bg-emerald-500 rounded-sm w-full transition-all"
                        style={{ height: `${(pos / activeQuestions.length) * 100}%` }}
                        title={`${pos} Positive`}
                      />
                    )}
                    {neg > 0 && (
                      <div
                        className="bg-rose-500 rounded-sm w-full transition-all"
                        style={{ height: `${(neg / activeQuestions.length) * 100}%` }}
                        title={`${neg} Negative`}
                      />
                    )}
                    {neu > 0 && (
                      <div
                        className="bg-amber-500 rounded-sm w-full transition-all"
                        style={{ height: `${(neu / activeQuestions.length) * 100}%` }}
                        title={`${neu} Neutral`}
                      />
                    )}
                    {!hasEntries && (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">
                        &ndash;
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 font-mono">
                    {slotEntries.length}/{activeQuestions.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two-Column: Question Performance & Time-of-Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question-Level Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Habit-by-Habit Outcome Distribution</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {activeQuestions.length} Active Habits
            </span>
          </div>

          <div className="space-y-3">
            {activeQuestions.map((q) => {
              const qEntries = entries.filter((e) => e.questionId === q.id);
              const qOutcomes = calculateOutcomeCounts(qEntries);
              const qRate =
                timeSlots.length > 0
                  ? Math.round((qEntries.length / timeSlots.length) * 100)
                  : 0;

              return (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200 block">{q.text}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {q.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-bold">{qRate}%</span>
                      <span className="text-[10px] text-slate-400 block">
                        {qEntries.length}/{timeSlots.length} slots
                      </span>
                    </div>
                  </div>

                  {/* Outcome Segmented Bar */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    {qOutcomes.positive > 0 && (
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${(qOutcomes.positive / timeSlots.length) * 100}%`,
                        }}
                        title={`${qOutcomes.positive} Positive`}
                      />
                    )}
                    {qOutcomes.negative > 0 && (
                      <div
                        className="bg-rose-500 h-full"
                        style={{
                          width: `${(qOutcomes.negative / timeSlots.length) * 100}%`,
                        }}
                        title={`${qOutcomes.negative} Negative`}
                      />
                    )}
                    {qOutcomes.neutral > 0 && (
                      <div
                        className="bg-amber-500 h-full"
                        style={{
                          width: `${(qOutcomes.neutral / timeSlots.length) * 100}%`,
                        }}
                        title={`${qOutcomes.neutral} Neutral`}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="text-emerald-400">{qOutcomes.positive} Pos</span>
                    <span className="text-rose-400">{qOutcomes.negative} Neg</span>
                    <span className="text-amber-400">{qOutcomes.neutral} Neu</span>
                    <span className="text-slate-500">
                      {timeSlots.length - qEntries.length} Unanswered
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time of Day Segmentation & Evidence Insights */}
        <div className="space-y-6">
          {/* Time of Day Distribution */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Time of Day Outcomes</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {/* Morning */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-300 block">Morning</span>
                <span className="text-[10px] text-slate-500 block">6 AM &ndash; 11 AM</span>
                <span className="text-base font-extrabold text-white block mt-1">
                  {timeOfDay.morning.totalAnswered}
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[10px] pt-1">
                  <span className="text-emerald-400 font-bold">{timeOfDay.morning.positive}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-rose-400 font-bold">{timeOfDay.morning.negative}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-amber-400 font-bold">{timeOfDay.morning.neutral}</span>
                </div>
              </div>

              {/* Afternoon */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-300 block">Afternoon</span>
                <span className="text-[10px] text-slate-500 block">12 PM &ndash; 4 PM</span>
                <span className="text-base font-extrabold text-white block mt-1">
                  {timeOfDay.afternoon.totalAnswered}
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[10px] pt-1">
                  <span className="text-emerald-400 font-bold">{timeOfDay.afternoon.positive}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-rose-400 font-bold">{timeOfDay.afternoon.negative}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-amber-400 font-bold">{timeOfDay.afternoon.neutral}</span>
                </div>
              </div>

              {/* Evening */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-300 block">Evening</span>
                <span className="text-[10px] text-slate-500 block">5 PM &ndash; 9 PM</span>
                <span className="text-base font-extrabold text-white block mt-1">
                  {timeOfDay.evening.totalAnswered}
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[10px] pt-1">
                  <span className="text-emerald-400 font-bold">{timeOfDay.evening.positive}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-rose-400 font-bold">{timeOfDay.evening.negative}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-amber-400 font-bold">{timeOfDay.evening.neutral}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence-Based Insights */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Evidence-Based Daily Insights</span>
            </h3>

            <div className="space-y-2.5">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{insight.title}</span>
                    {insight.metric && (
                      <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {insight.description}
                  </p>
                  <span className="text-[10px] text-slate-500 block pt-1 font-mono">
                    {insight.sampleSize}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State CTA if no entries for the day */}
      {answeredSlots === 0 && (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Tracked Entries for this Day</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You haven&apos;t logged any habit entries for {formatDisplayDate(currentDate)} yet.
            Unanswered slots are tracked as missing data.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>Open Hourly Track Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
