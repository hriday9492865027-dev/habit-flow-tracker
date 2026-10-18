'use client';

import React, { useState } from 'react';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { OutcomeBadge } from '@/components/track/OutcomeBadge';
import { QuestionFormDialog } from './QuestionFormDialog';
import type { Question, CreateQuestionInput, UpdateQuestionInput } from '@/types';

interface QuestionListProps {
  initialQuestions: Question[];
  onRefresh: () => Promise<void>;
}

export function QuestionList({ initialQuestions, onRefresh }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Sync when initialQuestions change
  React.useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const categories = Array.from(new Set(questions.map((q) => q.category)));

  const filteredQuestions = questions.filter((q) => {
    if (activeTab === 'active' && !q.active) return false;
    if (activeTab === 'archived' && q.active) return false;
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    return true;
  });

  async function handleCreateOrUpdate(data: CreateQuestionInput | UpdateQuestionInput) {
    if (editingQuestion) {
      const res = await fetch(`/api/questions/${editingQuestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update question');
    } else {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create question');
    }

    await onRefresh();
  }

  async function handleToggleArchive(question: Question) {
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !question.active }),
      });
      if (!res.ok) throw new Error('Failed to toggle archive');
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(questionId: string) {
    if (!confirm('Are you sure you want to delete this question and its historical tracking data?')) {
      return;
    }

    setDeletingId(questionId);
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete question');
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === filteredQuestions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...filteredQuestions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Optimistically update UI
    const updatedIds = reordered.map((q) => q.id);
    setIsUpdatingOrder(true);

    try {
      const res = await fetch('/api/questions/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: updatedIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder questions');
      await onRefresh();
    } catch (err) {
      console.error('Reorder error:', err);
    } finally {
      setIsUpdatingOrder(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Active vs Archived Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active (
            {questions.filter((q) => q.active).length}
            )
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'archived'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Archived (
            {questions.filter((q) => !q.active).length}
            )
          </button>
        </div>

        {/* Right: Category filter & Create Button */}
        <div className="flex items-center gap-3">
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Question</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {activeTab === 'active' ? 'No active questions found' : 'No archived questions'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {activeTab === 'active'
              ? 'Click the button below to configure your habit tracking prompts.'
              : 'Questions you archive will appear here for reference or restoration.'}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => {
                setEditingQuestion(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
            >
              <Plus className="w-4 h-4" />
              <span>Create Question</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3 flex-1">
                {/* Reorder Buttons (Only for active tab) */}
                {activeTab === 'active' && (
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isUpdatingOrder}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === filteredQuestions.length - 1 || isUpdatingOrder}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {question.category}
                    </span>
                    {!question.active && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Archived
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                    {question.text}
                  </h4>
                  {question.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{question.description}</p>
                  )}

                  {/* Configured Answer Options Preview */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-[11px] text-slate-500 font-medium">Outcomes:</span>
                    {question.options?.map((opt) => (
                      <div
                        key={opt.id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-750 text-xs text-slate-300"
                      >
                        <span className="font-semibold text-white">{opt.text}</span>
                        <OutcomeBadge outcome={opt.outcome} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => {
                    setEditingQuestion(question);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleToggleArchive(question)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
                  title={question.active ? 'Archive question' : 'Restore question'}
                >
                  {question.active ? (
                    <>
                      <Archive className="w-3.5 h-3.5 text-amber-400" />
                      <span>Archive</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Restore</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(question.id)}
                  disabled={deletingId === question.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-colors"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <QuestionFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingQuestion(null);
        }}
        questionToEdit={editingQuestion}
        onSave={handleCreateOrUpdate}
      />
    </div>
  );
}
