'use client';

import React, { useState, useCallback } from 'react';
import { DateNavigator } from './DateNavigator';
import { TrackSheet } from './TrackSheet';
import {
  calculateCompletionStats,
  calculateOutcomeCounts,
  generateTimeSlots,
} from '@/lib/calculations';
import type { Question, HourlyEntry, UserSettings, Outcome } from '@/types';

interface TrackSheetClientProps {
  initialDate: string;
  initialQuestions: Question[];
  initialEntries: HourlyEntry[];
  settings: UserSettings;
}

export function TrackSheetClient({
  initialDate,
  initialQuestions,
  initialEntries,
  settings,
}: TrackSheetClientProps) {
  const [currentDate, setCurrentDate] = useState<string>(initialDate);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [entries, setEntries] = useState<HourlyEntry[]>(initialEntries);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const timeSlots = generateTimeSlots(
    settings.trackingStartHour ?? 6,
    settings.trackingEndHour ?? 21,
    settings.trackingIntervalMinutes ?? 60
  );

  // Completion stats and outcome calculations
  const totalSlots = questions.length * timeSlots.length;
  const answeredSlots = entries.length;
  const completion = calculateCompletionStats(totalSlots, answeredSlots);
  const outcomes = calculateOutcomeCounts(entries);

  // Fetch entries for a different date
  const handleDateChange = useCallback(async (newDate: string) => {
    setCurrentDate(newDate);
    setIsLoadingDate(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/entries?date=${newDate}`);
      if (!res.ok) throw new Error('Failed to fetch entries');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err: any) {
      console.error('Date change error:', err);
      setSaveError('Could not load entries for selected date.');
    } finally {
      setIsLoadingDate(false);
    }
  }, []);

  // Save an hourly entry
  const handleSaveEntry = useCallback(
    async (payload: {
      questionId: string;
      optionId?: string | null;
      value: string;
      date: string;
      timeSlot: string;
      outcomeSnapshot: Outcome;
      notes?: string;
    }) => {
      setSaveError(null);

      // Optimistic update
      const tempId = `temp_${Date.now()}`;
      const optimisticEntry: HourlyEntry = {
        id: tempId,
        userId: '',
        questionId: payload.questionId,
        optionId: payload.optionId || null,
        value: payload.value,
        date: payload.date,
        timeSlot: payload.timeSlot,
        outcomeSnapshot: payload.outcomeSnapshot,
        notes: payload.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setEntries((prev) => {
        const filtered = prev.filter(
          (e) => !(e.questionId === payload.questionId && e.timeSlot === payload.timeSlot && e.date === payload.date)
        );
        return [...filtered, optimisticEntry];
      });

      try {
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Server rejected entry');
        }

        const data = await res.json();
        // Replace optimistic entry with real saved entry from server
        setEntries((prev) =>
          prev.map((e) => (e.id === tempId ? data.entry : e))
        );
      } catch (err: any) {
        console.error('Save entry failed:', err);
        setSaveError(err.message || 'Failed to save entry. Reverting change.');
        // Re-fetch to guarantee data consistency
        handleDateChange(payload.date);
        throw err;
      }
    },
    [handleDateChange]
  );

  // Delete an hourly entry
  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      setSaveError(null);

      // Optimistically remove
      const previousEntries = entries;
      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      try {
        const res = await fetch(`/api/entries/${entryId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error('Failed to delete entry on server');
        }
      } catch (err: any) {
        console.error('Delete entry failed:', err);
        setSaveError('Failed to delete entry. Restoring previous state.');
        setEntries(previousEntries);
        throw err;
      }
    },
    [entries]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Error Banner if any */}
      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            className="text-rose-400 hover:text-white text-xs underline font-medium ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Date Navigator & Quick Progress */}
      <DateNavigator
        currentDate={currentDate}
        onDateChange={handleDateChange}
        completion={completion}
        outcomes={outcomes}
      />

      {/* Main Spreadsheet Grid */}
      <div className={`transition-opacity duration-200 ${isLoadingDate ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        <TrackSheet
          questions={questions}
          entries={entries}
          timeSlots={timeSlots}
          date={currentDate}
          onSaveEntry={handleSaveEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      </div>
    </div>
  );
}
