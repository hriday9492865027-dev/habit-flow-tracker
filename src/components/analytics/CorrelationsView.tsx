'use client';

import React from 'react';
import Link from 'next/link';
import { Network, AlertTriangle, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import type { Question, HourlyEntry } from '@/types';
import {
  calculateBehavioralCorrelations,
  type HabitCorrelation,
} from '@/lib/calculations/correlations';

interface CorrelationsViewProps {
  questions: Question[];
  entries: HourlyEntry[];
}

export function CorrelationsView({ questions, entries }: CorrelationsViewProps) {
  const correlations: HabitCorrelation[] = calculateBehavioralCorrelations(
    entries,
    questions
  );

  return (
    <div className="space-y-6">
      {/* Disclaimer Alert Banner (MANDATORY PER PRD) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Scientific Disclaimer: Correlation Does Not Equal Causation</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          These behavioral insights measure statistical co-occurrence across your logged hourly time
          slots. They do not demonstrate direct cause-and-effect. Shared environments, work rhythms,
          and baseline energy levels may naturally connect these habits.
        </p>
      </div>

      {/* Correlation Findings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-4 h-4 text-teal-400" />
            <span>Behavioral Co-Occurrence Patterns</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {correlations.length} Patterns Detected
          </span>
        </div>

        {correlations.length > 0 ? (
          <div className="space-y-3">
            {correlations.map((corr) => (
              <div
                key={corr.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-750 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {corr.primaryHabit}
                    </span>
                    <span className="text-slate-500 text-xs">&rarr;</span>
                    <span className="font-semibold text-white text-sm">
                      {corr.secondaryHabit}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
                      corr.correlationDirection === 'positive'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {corr.likelihoodPercent}% Co-Occurrence
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {corr.insightSentence}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span className="font-mono">
                    Verified across {corr.sampleSizeSlots} matching hourly slots
                  </span>
                  <span className="text-slate-500 italic">{corr.caveat}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Insufficient Data for Pattern Analysis</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              HabitFlow requires at least 5 matching time slots across habits to prevent misleading
              correlations. Continue tracking your habits across the day to uncover verified patterns.
            </p>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20 transition-all"
            >
              <span>Open Hourly Track Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
