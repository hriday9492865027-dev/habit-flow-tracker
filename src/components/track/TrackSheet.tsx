'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Check, X, Minus, HelpCircle, Sparkles } from 'lucide-react';
import { formatSlotLabel } from '@/lib/calculations';
import { AnswerDialog } from './AnswerDialog';
import type { Question, HourlyEntry, Outcome } from '@/types';

interface TrackSheetProps {
  questions: Question[];
  entries: HourlyEntry[];
  timeSlots: string[];
  date: string;
  onSaveEntry: (payload: {
    questionId: string;
    optionId?: string | null;
    value: string;
    date: string;
    timeSlot: string;
    outcomeSnapshot: Outcome;
    notes?: string;
  }) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
}

export function TrackSheet({
  questions,
  entries,
  timeSlots,
  date,
  onSaveEntry,
  onDeleteEntry,
}: TrackSheetProps) {
  const [activeCell, setActiveCell] = useState<{
    question: Question;
    timeSlot: string;
  } | null>(null);

  // Map entries by `${questionId}_${timeSlot}` for O(1) lookup
  const entriesMap = useMemo(() => {
    const map = new Map<string, HourlyEntry>();
    for (const entry of entries) {
      map.set(`${entry.questionId}_${entry.timeSlot}`, entry);
    }
    return map;
  }, [entries]);

  // Compute answered counts per question
  const questionAnswerCounts = useMemo(() => {
    const counts = new Map<string, { answered: number; positive: number; negative: number; neutral: number }>();
    for (const q of questions) {
      counts.set(q.id, { answered: 0, positive: 0, negative: 0, neutral: 0 });
    }
    for (const entry of entries) {
      const current = counts.get(entry.questionId);
      if (current) {
        current.answered++;
        if (entry.outcomeSnapshot === 'positive') current.positive++;
        else if (entry.outcomeSnapshot === 'negative') current.negative++;
        else current.neutral++;
      }
    }
    return counts;
  }, [questions, entries]);

  const activeEntry = useMemo(() => {
    if (!activeCell) return null;
    return entriesMap.get(`${activeCell.question.id}_${activeCell.timeSlot}`) || null;
  }, [activeCell, entriesMap]);

  if (questions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Questions Active</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Create habit or behavior questions to begin tracking hourly time slots in this spreadsheet.
        </p>
        <Link
          href="/questions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Manage Questions</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Horizontal scroll container with sticky left question column */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {/* Sticky Left Column: Habit Question Title */}
                <th
                  scope="col"
                  className="sticky left-0 z-20 bg-slate-950 px-4 py-3.5 w-64 sm:w-72 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-center justify-between">
                    <span>Habit / Question</span>
                    <span className="text-[10px] font-normal text-slate-500">Rate</span>
                  </div>
                </th>

                {/* Time Slot Columns: 6 AM to 9 PM */}
                {timeSlots.map((slot) => (
                  <th
                    key={slot}
                    scope="col"
                    className="px-2 py-3.5 text-center min-w-[64px] border-r border-slate-850"
                  >
                    <span className="text-slate-300 font-semibold">{formatSlotLabel(slot)}</span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Rows: One per Question */}
            <tbody className="divide-y divide-slate-800/80">
              {questions.map((question) => {
                const stats = questionAnswerCounts.get(question.id) || {
                  answered: 0,
                  positive: 0,
                  negative: 0,
                  neutral: 0,
                };
                const totalSlots = timeSlots.length;

                return (
                  <tr key={question.id} className="hover:bg-slate-850/40 transition-colors group">
                    {/* Sticky Left Question Header Cell */}
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-850 px-4 py-3 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="pr-1">
                          <div className="text-sm font-semibold text-white tracking-tight leading-snug line-clamp-1">
                            {question.text}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                              {question.category}
                            </span>
                          </div>
                        </div>

                        {/* Daily completion rate for this question */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-slate-300">
                            {stats.answered}/{totalSlots}
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5 justify-end text-[10px]">
                            {stats.positive > 0 && (
                              <span className="text-emerald-400 font-semibold">+{stats.positive}</span>
                            )}
                            {stats.negative > 0 && (
                              <span className="text-rose-400 font-semibold">-{stats.negative}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </th>

                    {/* Hourly Interactive Cells */}
                    {timeSlots.map((slot) => {
                      const entry = entriesMap.get(`${question.id}_${slot}`);
                      const isAnswered = !!entry;

                      const cellClasses =
                        'track-cell min-w-[64px] h-12 p-1 text-center border-r border-slate-800/60 relative cursor-pointer select-none transition-all focus:outline-none';
                      let pillClasses =
                        'w-full h-full flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all';

                      if (isAnswered) {
                        if (entry.outcomeSnapshot === 'positive') {
                          pillClasses +=
                            ' bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 shadow-sm shadow-emerald-950/50 hover:brightness-110';
                        } else if (entry.outcomeSnapshot === 'negative') {
                          pillClasses +=
                            ' bg-rose-950/80 border border-rose-500/70 text-rose-200 shadow-sm shadow-rose-950/50 hover:brightness-110';
                        } else {
                          pillClasses +=
                            ' bg-slate-800 border border-slate-600 text-slate-200 hover:brightness-110';
                        }
                      } else {
                        // Unanswered: subtle and clean, NEVER negative!
                        pillClasses +=
                          ' bg-slate-900/60 border border-slate-800 text-slate-600 hover:bg-slate-800/80 hover:border-slate-700 hover:text-slate-300';
                      }

                      return (
                        <td
                          key={slot}
                          className={cellClasses}
                          onClick={() => setActiveCell({ question, timeSlot: slot })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveCell({ question, timeSlot: slot });
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`${question.text} at ${formatSlotLabel(slot)}: ${
                            isAnswered ? `${entry.value} (${entry.outcomeSnapshot})` : 'Unanswered'
                          }`}
                        >
                          <div className={pillClasses}>
                            {isAnswered ? (
                              <>
                                <span className="truncate max-w-[56px] leading-tight">
                                  {entry.value}
                                </span>
                                {entry.notes && (
                                  <span className="w-1 h-1 rounded-full bg-slate-300 mt-0.5"></span>
                                )}
                              </>
                            ) : (
                              <span className="opacity-0 group-hover/cell:opacity-100 hover:opacity-100 text-slate-500">
                                <Plus className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dense Sheet Legend Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-300">Outcomes:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
              <span className="text-slate-300">Positive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
              <span className="text-slate-300">Negative</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-500"></span>
              <span className="text-slate-300">Neutral</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-slate-700 bg-slate-900"></span>
              <span>Unanswered (Missing data)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Click any cell to log or edit hourly entry
          </div>
        </div>
      </div>

      {/* Answer Modal Dialog */}
      <AnswerDialog
        isOpen={!!activeCell}
        onClose={() => setActiveCell(null)}
        question={activeCell?.question || null}
        timeSlot={activeCell?.timeSlot || ''}
        date={date}
        existingEntry={activeEntry}
        onSave={onSaveEntry}
        onDelete={onDeleteEntry}
      />
    </>
  );
}
