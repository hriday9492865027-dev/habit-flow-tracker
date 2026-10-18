'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { OutcomeBadge } from '@/components/track/OutcomeBadge';
import type { Question, Outcome, CreateQuestionInput, UpdateQuestionInput } from '@/types';

interface QuestionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionToEdit?: Question | null;
  onSave: (data: CreateQuestionInput | UpdateQuestionInput) => Promise<void>;
}

interface OptionFormState {
  id?: string;
  text: string;
  outcome: Outcome;
  explanation: string;
}

export function QuestionFormDialog({
  isOpen,
  onClose,
  questionToEdit,
  onSave,
}: QuestionFormDialogProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Health');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<OptionFormState[]>([
    { text: 'Yes', outcome: 'positive', explanation: '' },
    { text: 'No', outcome: 'negative', explanation: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES = ['Health', 'Focus', 'Productivity', 'Routine', 'Mindset', 'Custom'];

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    if (questionToEdit) {
      setText(questionToEdit.text);
      setCategory(questionToEdit.category);
      setDescription(questionToEdit.description || '');
      if (questionToEdit.options && questionToEdit.options.length > 0) {
        setOptions(
          questionToEdit.options.map((o) => ({
            id: o.id,
            text: o.text,
            outcome: o.outcome,
            explanation: o.explanation || '',
          }))
        );
      } else {
        setOptions([
          { text: 'Yes', outcome: 'positive', explanation: '' },
          { text: 'No', outcome: 'negative', explanation: '' },
        ]);
      }
    } else {
      setText('');
      setCategory('Health');
      setDescription('');
      setOptions([
        { text: 'Yes', outcome: 'positive', explanation: 'Habit completed successfully' },
        { text: 'No', outcome: 'negative', explanation: 'Missed habit' },
      ]);
    }
  }, [isOpen, questionToEdit]);

  if (!isOpen) return null;

  function applyPreset(presetType: 'positive-habit' | 'avoid-habit' | 'neutral-habit') {
    if (presetType === 'positive-habit') {
      setOptions([
        { text: 'Yes', outcome: 'positive', explanation: 'Positive habit completed' },
        { text: 'No', outcome: 'negative', explanation: 'Missed routine' },
      ]);
    } else if (presetType === 'avoid-habit') {
      // CRITICAL PRODUCT RULE: YES means Negative, NO means Positive!
      setOptions([
        { text: 'Yes', outcome: 'negative', explanation: 'Slips/cravings happened' },
        { text: 'No', outcome: 'positive', explanation: 'Successfully avoided' },
      ]);
    } else {
      setOptions([
        { text: 'Yes', outcome: 'positive', explanation: 'Completed' },
        { text: 'No', outcome: 'neutral', explanation: 'Optional / Not required this hour' },
      ]);
    }
  }

  function handleOptionChange(index: number, field: keyof OptionFormState, val: string) {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: val };
    setOptions(updated);
  }

  function addOption() {
    setOptions([...options, { text: '', outcome: 'neutral', explanation: '' }]);
  }

  function removeOption(index: number) {
    if (options.length <= 1) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError('Question text is required');
      return;
    }

    if (options.length === 0 || options.some((o) => !o.text.trim())) {
      setError('All answer options must have text');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        text: text.trim(),
        category: category.trim(),
        description: description.trim() || undefined,
        options: options.map((o, idx) => ({
          id: o.id,
          text: o.text.trim(),
          outcome: o.outcome,
          explanation: o.explanation.trim() || undefined,
          order: idx,
        })),
      });

      onClose();
    } catch (err: any) {
      console.error('Error saving question:', err);
      setError(err.message || 'Failed to save question');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-dialog-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="question-dialog-title" className="text-base font-bold text-white tracking-tight">
                {questionToEdit ? 'Edit Habit Question' : 'Create Habit Question'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure question text, category, and outcome mappings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Question Title / Habit Prompt *
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Did you drink 250ml+ water? or Avoided sugary snacks?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Description / Guidance */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Guidance Note (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief advice or criteria for scoring"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Presets Bar */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
              Quick Option Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('positive-habit')}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Standard Habit: Yes (+), No (-)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('avoid-habit')}
                className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                title="Critical: YES is Negative when avoiding unwanted habits!"
              >
                Avoidance Habit: Yes (-), No (+)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('neutral-habit')}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Optional Habit: Yes (+), No (~)
              </button>
            </div>
          </div>

          {/* Options List with Outcome Mappings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Answer Options &amp; Evaluated Outcomes *
              </label>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                      placeholder="e.g. Yes or No"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />

                    {/* Outcome dropdown */}
                    <div className="w-36">
                      <select
                        value={opt.outcome}
                        onChange={(e) =>
                          handleOptionChange(idx, 'outcome', e.target.value as Outcome)
                        }
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none ${
                          opt.outcome === 'positive'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                            : opt.outcome === 'negative'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                            : 'bg-slate-800 text-slate-300 border-slate-600'
                        }`}
                      >
                        <option value="positive">+ Positive</option>
                        <option value="negative">- Negative</option>
                        <option value="neutral">~ Neutral</option>
                      </select>
                    </div>

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Remove option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={opt.explanation}
                    onChange={(e) => handleOptionChange(idx, 'explanation', e.target.value)}
                    placeholder="Optional explanation / meaning for this outcome..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-850 border border-slate-750 text-slate-300 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Question'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
