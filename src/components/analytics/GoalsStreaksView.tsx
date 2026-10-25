'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Trophy, Calendar, CheckCircle2, ArrowRight, HelpCircle, Target } from 'lucide-react';
import type { Question, HourlyEntry } from '@/types';
import { calculateHabitStreaks, type OverallStreakSummary } from '@/lib/calculations/goals';

interface GoalsStreaksViewProps {
  questions: Question[];
  entries: HourlyEntry[];
  currentDate: string;
}

export function GoalsStreaksView({
  questions,
  entries,
  currentDate,
}: GoalsStreaksViewProps) {
  const streakSummary: OverallStreakSummary = calculateHabitStreaks(
    entries,
    questions,
    currentDate
  );

  return (
    <div className="space-y-6">
      {/* Overall Streak Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Habit Momentum
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Current Streak:{' '}
                <span className="text-amber-400">{streakSummary.currentStreakDays} Days</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block uppercase">Best Streak</span>
              <span className="text-white font-extrabold text-base">
                {streakSummary.longestStreakDays} Days
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block uppercase">Active Habits</span>
              <span className="text-emerald-400 font-extrabold text-base">
                {streakSummary.activeGoalHabitsCount}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          Streaks measure consecutive days where your habit achieved positive hourly outcomes.
          Unanswered slots are missing data and never penalized as negative.
        </p>
      </div>

      {/* Habit-by-Habit Streak Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Habit Streak Breakdown</span>
          </h3>
          <span className="text-xs text-slate-400">
            {streakSummary.habitStreaks.length} Habits
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streakSummary.habitStreaks.map((h) => (
            <div
              key={h.questionId}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-750 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{h.questionText}</h4>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {h.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{h.currentStreakDays}d streak</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Best</span>
                  <span className="font-bold text-slate-200">{h.longestStreakDays} days</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Logged</span>
                  <span className="font-bold text-slate-200">{h.totalDaysLogged} days</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Positive Hours</span>
                  <span className="font-bold text-emerald-400">{h.totalPositiveSlots}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Today&apos;s Status:</span>
                {h.todayLogged ? (
                  h.todayPositive ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Target Met Today
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold">Logged (Target Missed)</span>
                  )
                ) : (
                  <span className="text-slate-500 font-mono">Pending Check-in</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Streak History Yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Log entries consistently in the Track Sheet to build up your positive habit streaks.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20 transition-all"
          >
            <span>Open Hourly Track Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
