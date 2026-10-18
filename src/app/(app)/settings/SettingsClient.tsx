'use client';

import React, { useState } from 'react';
import { Clock, Globe, Shield, Check, AlertCircle } from 'lucide-react';
import type { UserSettings } from '@/types';

interface SettingsClientProps {
  initialSettings: UserSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [startHour, setStartHour] = useState(initialSettings.trackingStartHour);
  const [endHour, setEndHour] = useState(initialSettings.trackingEndHour);
  const [timezone, setTimezone] = useState(initialSettings.timezone || 'UTC');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const HOURS = Array.from({ length: 24 }, (_, i) => {
    const period = i >= 12 ? 'PM' : 'AM';
    const displayH = i === 0 ? 12 : i > 12 ? i - 12 : i;
    return { value: i, label: `${displayH}:00 ${period}` };
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (startHour >= endHour) {
      setError('Start hour must be earlier than end hour');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingStartHour: startHour,
          trackingEndHour: endHour,
          timezone,
        }),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      const data = await res.json();
      setSettings(data.settings);
      setSuccessMessage('Settings updated successfully!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Settings Form */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-white tracking-tight mb-1">
          Tracking Schedule &amp; Preferences
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Customize active daily tracking hours displayed on the Track Sheet (Phase 1 default is 6 AM – 9 PM)
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Day Start Hour</span>
              </label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {HOURS.filter((h) => h.value < 23).map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Day End Hour</span>
              </label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {HOURS.filter((h) => h.value > 0).map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Timezone</span>
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York or UTC"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-md shadow-emerald-600/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & System Info */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Security &amp; Data Isolation Contract</h4>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Every query and mutation enforces strict user-level authorization server-side. Client-supplied user IDs are ignored; all sessions are verified via cryptographically signed HTTP-only cookies.
        </p>
      </div>
    </div>
  );
}
