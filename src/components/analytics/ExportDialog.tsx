'use client';

import React, { useState } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  X,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Question, HourlyEntry } from '@/types';
import {
  getTodayString,
  getAdjacentDate,
  formatDisplayDate,
  formatSlotLabel,
  calculateOutcomeCounts,
} from '@/lib/calculations';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  currentDate: string;
}

export function ExportDialog({
  isOpen,
  onClose,
  questions,
  currentDate,
}: ExportDialogProps) {
  const [rangeType, setRangeType] = useState<'today' | '7days' | '30days' | 'custom'>('7days');
  const [customStart, setCustomStart] = useState<string>(getAdjacentDate(currentDate, -6));
  const [customEnd, setCustomEnd] = useState<string>(currentDate);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  function getDateRange(): { start: string; end: string } {
    const today = currentDate || getTodayString();
    switch (rangeType) {
      case 'today':
        return { start: today, end: today };
      case '7days':
        return { start: getAdjacentDate(today, -6), end: today };
      case '30days':
        return { start: getAdjacentDate(today, -29), end: today };
      case 'custom':
        return { start: customStart, end: customEnd };
    }
  }

  async function fetchExportEntries(start: string, end: string): Promise<HourlyEntry[]> {
    const res = await fetch(`/api/entries?startDate=${start}&endDate=${end}`);
    if (!res.ok) throw new Error('Failed to retrieve entries from server');
    const data = await res.json();
    let entries: HourlyEntry[] = data.entries || [];
    if (selectedQuestionId !== 'all') {
      entries = entries.filter((e) => e.questionId === selectedQuestionId);
    }
    return entries;
  }

  // Generate and download CSV
  async function handleExportCSV() {
    setIsExporting(true);
    setExportError(null);

    try {
      const { start, end } = getDateRange();
      const entries = await fetchExportEntries(start, end);

      const qMap = new Map<string, Question>();
      questions.forEach((q) => qMap.set(q.id, q));

      // Build RFC 4180 CSV
      const headers = ['Date', 'Time Slot', 'Time Slot Label', 'Question', 'Category', 'Raw Answer', 'Outcome', 'Notes'];
      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

      const rows: string[] = [headers.join(',')];

      // Sort entries by date, then timeSlot
      entries.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.timeSlot.localeCompare(b.timeSlot);
      });

      for (const e of entries) {
        const q = qMap.get(e.questionId);
        const qText = q ? q.text : 'Unknown Question';
        const qCat = q ? q.category : 'General';
        const slotLabel = formatSlotLabel(e.timeSlot);

        rows.push([
          escapeCsv(e.date),
          escapeCsv(e.timeSlot),
          escapeCsv(slotLabel),
          escapeCsv(qText),
          escapeCsv(qCat),
          escapeCsv(e.value),
          escapeCsv(e.outcomeSnapshot),
          escapeCsv(e.notes || ''),
        ].join(','));
      }

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute(
        'download',
        `habitflow_export_${start}_to_${end}.csv`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      setExportError(err.message || 'CSV export failed');
    } finally {
      setIsExporting(false);
    }
  }

  // Print-ready PDF report
  async function handlePrintPDF() {
    setIsExporting(true);
    setExportError(null);

    try {
      const { start, end } = getDateRange();
      const entries = await fetchExportEntries(start, end);
      const outcomes = calculateOutcomeCounts(entries);

      const qMap = new Map<string, Question>();
      questions.forEach((q) => qMap.set(q.id, q));

      // Open clean print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up was blocked. Please allow pop-ups for HabitFlow to generate PDF.');
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>HabitFlow Report - ${start} to ${end}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 40px; }
            h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
            p.meta { font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 24px; }
            .kpi-row { display: flex; gap: 16px; margin-bottom: 28px; }
            .kpi-card { flex: 1; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
            .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
            .kpi-val { font-size: 22px; font-weight: 700; margin-top: 4px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
            .badge-pos { color: #059669; font-weight: 600; }
            .badge-neg { color: #e11d48; font-weight: 600; }
            .badge-neu { color: #d97706; font-weight: 600; }
            .disclaimer { font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            @media print { body { margin: 15mm; } button { display: none; } }
          </style>
        </head>
        <body>
          <h1>HabitFlow Behavioral Audit Report</h1>
          <p class="meta">Date Range: <strong>${formatDisplayDate(start)}</strong> to <strong>${formatDisplayDate(end)}</strong> &bull; Generated on ${new Date().toLocaleDateString()}</p>
          
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-label">Answered Slots</div>
              <div class="kpi-val">${entries.length}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Positive Outcomes</div>
              <div class="kpi-val" style="color: #059669;">${outcomes.positive}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Negative Outcomes</div>
              <div class="kpi-val" style="color: #e11d48;">${outcomes.negative}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Neutral Outcomes</div>
              <div class="kpi-val" style="color: #d97706;">${outcomes.neutral}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Habit Question</th>
                <th>Answer</th>
                <th>Outcome Snapshot</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map((e) => {
                const q = qMap.get(e.questionId);
                const qText = q ? q.text : 'Unknown';
                const badgeClass = e.outcomeSnapshot === 'positive' ? 'badge-pos' : e.outcomeSnapshot === 'negative' ? 'badge-neg' : 'badge-neu';
                return `
                  <tr>
                    <td>${e.date}</td>
                    <td>${formatSlotLabel(e.timeSlot)}</td>
                    <td><strong>${qText}</strong></td>
                    <td>${e.value}</td>
                    <td class="${badgeClass}">${e.outcomeSnapshot.toUpperCase()}</td>
                    <td>${e.notes || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="disclaimer">
            HabitFlow Privacy &amp; Data Contract: Unanswered slots represent missing data, not negative results. Historical outcome snapshots preserve tracking context.
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err: any) {
      console.error('Print PDF error:', err);
      setExportError(err.message || 'PDF print report generation failed');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Export Habit Data</h3>
              <p className="text-xs text-slate-400">CSV spreadsheet or print-ready PDF audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {exportError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Date Range Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Date Window</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRangeType(opt.id as any)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  rangeType === opt.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-750 hover:text-white hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {rangeType === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Start Date
                </span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  End Date
                </span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Question Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Habit Filter</span>
          </label>
          <select
            value={selectedQuestionId}
            onChange={(e) => setSelectedQuestionId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Habits ({questions.length} total)</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.text} ({q.category})
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Download CSV Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs border border-slate-700 transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Printable PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
