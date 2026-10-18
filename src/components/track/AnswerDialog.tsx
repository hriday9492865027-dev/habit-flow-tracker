'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { formatSlotLabel, formatDisplayDate } from '@/lib/calculations';
import { OutcomeBadge } from './OutcomeBadge';
import type { Question, QuestionOption, HourlyEntry, Outcome } from '@/types';

interface AnswerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  timeSlot: string; // "HH:MM"
  date: string; // "YYYY-MM-DD"
  existingEntry?: HourlyEntry | null;
  onSave: (payload: {
    questionId: string;
    optionId?: string | null;
    value: string;
    date: string;
    timeSlot: string;
    outcomeSnapshot: Outcome;
    notes?: string;
  }) => Promise<void>;
  onDelete?: (entryId: string) => Promise<void>;
}

export function AnswerDialog({
  isOpen,
  onClose,
  question,
  timeSlot,
  date,
  existingEntry,
  onSave,
  onDelete,
}: AnswerDialogProps) {
  const [selectedOption, setSelectedOption] = useState<QuestionOption | null>(null);
  const [customValue, setCustomValue] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>('neutral');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever dialog opens or existingEntry changes
  useEffect(() => {
    if (!isOpen || !question) return;

    setError(null);
    setNotes(existingEntry?.notes || '');

    if (existingEntry) {
      const matchOpt = question.options?.find(
        (o) => o.id === existingEntry.optionId || o.text.toLowerCase() === existingEntry.value.toLowerCase()
      );
      if (matchOpt) {
        setSelectedOption(matchOpt);
        setCustomValue(matchOpt.text);
        setSelectedOutcome(existingEntry.outcomeSnapshot);
      } else {
        setSelectedOption(null);
        setCustomValue(existingEntry.value);
        setSelectedOutcome(existingEntry.outcomeSnapshot);
      }
    } else {
      setSelectedOption(null);
      setCustomValue('');
      setSelectedOutcome('neutral');
    }
  }, [isOpen, question, existingEntry]);

  if (!isOpen || !question) return null;

  async function handleSelectOption(option: QuestionOption) {
    setSelectedOption(option);
    setCustomValue(option.text);
    setSelectedOutcome(option.outcome);
    setError(null);
  }

  async function handleSave() {
    if (!customValue && !selectedOption) {
      setError('Please select an answer option');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const value = selectedOption ? selectedOption.text : customValue.trim();
      const outcomeSnapshot = selectedOption ? selectedOption.outcome : selectedOutcome;

      await onSave({
        questionId: question!.id,
        optionId: selectedOption?.id || null,
        value,
        date,
        timeSlot,
        outcomeSnapshot,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to save answer:', err);
      setError(err.message || 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingEntry || !onDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(existingEntry.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      setError(err.message || 'Failed to delete entry. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="answer-dialog-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                {question.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDisplayDate(date)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-semibold text-slate-200">{formatSlotLabel(timeSlot)}</span>
              </div>
            </div>
            <h3 id="answer-dialog-title" className="text-lg font-bold text-white tracking-tight">
              {question.text}
            </h3>
            {question.description && (
              <p className="text-xs text-slate-400 mt-0.5">{question.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Option Selector Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Answer
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.options && question.options.length > 0 ? (
                question.options.map((option) => {
                  const isSelected = selectedOption?.id === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`min-h-[56px] p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? option.outcome === 'positive'
                            ? 'bg-emerald-950/70 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                            : option.outcome === 'negative'
                            ? 'bg-rose-950/70 border-rose-500 text-white ring-2 ring-rose-500/30'
                            : 'bg-slate-800 border-slate-500 text-white ring-2 ring-slate-500/30'
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-base">{option.text}</span>
                        <OutcomeBadge outcome={option.outcome} />
                      </div>
                      {option.explanation && (
                        <span className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {option.explanation}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-2 space-y-2">
                  <input
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Enter answer value"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-2">
                    {(['positive', 'negative', 'neutral'] as Outcome[]).map((oc) => (
                      <button
                        key={oc}
                        type="button"
                        onClick={() => setSelectedOutcome(oc)}
                        className={`flex-1 py-1.5 rounded text-xs font-semibold border ${
                          selectedOutcome === oc
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {oc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add quick context or details about this hour..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Existing snapshot indicator */}
          {existingEntry && (
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                Recorded outcome snapshot: <strong className="text-white uppercase">{existingEntry.outcomeSnapshot}</strong>
              </span>
              <span>{existingEntry.updatedAt ? new Date(existingEntry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <div>
            {existingEntry && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Clearing...' : 'Clear Entry'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDeleting || (!selectedOption && !customValue)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
