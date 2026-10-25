'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  BarChart3,
  Flame,
  Network,
  Download,
  Table2,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { Question, HourlyEntry, UserSettings } from '@/types';
import { generateTimeSlots, getAdjacentDate, getTodayString } from '@/lib/calculations';
import { DailyAnalyticsView } from './DailyAnalyticsView';
import { WeeklyAnalyticsView } from './WeeklyAnalyticsView';
import { MonthlyAnalyticsView } from './MonthlyAnalyticsView';
import { GoalsStreaksView } from './GoalsStreaksView';
import { CorrelationsView } from './CorrelationsView';
import { ExportDialog } from './ExportDialog';

type AnalyticsTab = 'daily' | 'weekly' | 'monthly' | 'streaks' | 'correlations';

interface AnalyticsClientProps {
  initialDate: string;
  initialQuestions: Question[];
  initialEntries: HourlyEntry[];
  settings: UserSettings;
}

export function AnalyticsClient({
  initialDate,
  initialQuestions,
  initialEntries,
  settings,
}: AnalyticsClientProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('daily');
  const [currentDate, setCurrentDate] = useState<string>(initialDate);
  const [weeklyStart, setWeeklyStart] = useState<string>(getAdjacentDate(initialDate, -6));
  const [weeklyEnd, setWeeklyEnd] = useState<string>(initialDate);

  const now = new Date();
  const [monthlyYear, setMonthlyYear] = useState<number>(now.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState<number>(now.getMonth() + 1);

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [entries, setEntries] = useState<HourlyEntry[]>(initialEntries);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const timeSlots = generateTimeSlots(
    settings.trackingStartHour ?? 6,
    settings.trackingEndHour ?? 21,
    settings.trackingIntervalMinutes ?? 60
  );

  // Fetch entries for active mode
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      let url = '';
      if (activeTab === 'daily') {
        url = `/api/entries?date=${currentDate}`;
      } else if (activeTab === 'weekly') {
        url = `/api/entries?startDate=${weeklyStart}&endDate=${weeklyEnd}`;
      } else if (activeTab === 'monthly') {
        const lastDay = new Date(monthlyYear, monthlyMonth, 0).getDate();
        const start = `${monthlyYear}-${String(monthlyMonth).padStart(2, '0')}-01`;
        const end = `${monthlyYear}-${String(monthlyMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        url = `/api/entries?startDate=${start}&endDate=${end}`;
      } else {
        // Streaks or correlations: fetch 60-day window
        const today = getTodayString();
        const start = getAdjacentDate(today, -60);
        url = `/api/entries?startDate=${start}&endDate=${today}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load analytics entries');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setFetchError(err.message || 'Error loading analytics entries');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentDate, weeklyStart, weeklyEnd, monthlyYear, monthlyMonth]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Analytics &amp; Insights
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-Time Data Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Behavioral Trends &amp; Outcomes
          </h1>
          <p className="text-xs text-slate-400">
            Daily audits, weekly trajectory, calendar heatmaps, and evidence-based insights
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Data</span>
          </button>

          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
          >
            <Table2 className="w-4 h-4" />
            <span>Track Sheet</span>
          </Link>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'daily'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Daily Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'weekly'
              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>7-Day Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'monthly'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Monthly Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab('streaks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'streaks'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Goals &amp; Streaks</span>
        </button>

        <button
          onClick={() => setActiveTab('correlations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'correlations'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Correlations</span>
        </button>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={() => fetchEntries()}
            className="text-rose-400 hover:text-white font-medium underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main View Area with loading overlay */}
      <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        {activeTab === 'daily' && (
          <DailyAnalyticsView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            questions={questions}
            entries={entries}
            timeSlots={timeSlots}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyAnalyticsView
            startDate={weeklyStart}
            endDate={weeklyEnd}
            onRangeChange={(s, e) => {
              setWeeklyStart(s);
              setWeeklyEnd(e);
            }}
            questions={questions}
            entries={entries}
            timeSlots={timeSlots}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyAnalyticsView
            year={monthlyYear}
            month={monthlyMonth}
            onMonthChange={(y, m) => {
              setMonthlyYear(y);
              setMonthlyMonth(m);
            }}
            questions={questions}
            entries={entries}
            timeSlots={timeSlots}
          />
        )}

        {activeTab === 'streaks' && (
          <GoalsStreaksView
            questions={questions}
            entries={entries}
            currentDate={currentDate}
          />
        )}

        {activeTab === 'correlations' && (
          <CorrelationsView questions={questions} entries={entries} />
        )}
      </div>

      {/* Export Dialog Modal */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        questions={questions}
        currentDate={currentDate}
      />
    </div>
  );
}
