'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  Clock,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Calendar,
  Info,
  Download,
  Share2,
} from 'lucide-react';
import type { NotificationPreferences } from '@/lib/data-access/notifications';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  showLocalNotification,
} from '@/lib/notifications/client';

interface NotificationManagerProps {
  initialPreferences: NotificationPreferences;
}

export function NotificationManager({ initialPreferences }: NotificationManagerProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPreferences);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [newTimeInput, setNewTimeInput] = useState<string>('12:00');

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(getNotificationPermission());
  }, []);

  async function handleEnablePush() {
    setIsSaving(true);
    setFeedback(null);

    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setFeedback({
          type: 'error',
          message: 'Notification permission was denied. Please update your browser site settings.',
        });
        return;
      }

      // Fetch VAPID key
      const vapidRes = await fetch('/api/notifications/vapid-public-key');
      const { publicKey } = await vapidRes.json();

      const sub = await subscribeToPush(publicKey);
      if (!sub) {
        setFeedback({
          type: 'info',
          message: 'Permission granted! Local notifications are enabled. (Background Web Push configured).',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Push notifications successfully subscribed on this device!',
        });
      }

      // Automatically enable preferences on server
      await handleSavePreferences({ enabled: true });
    } catch (err: any) {
      console.error('Error enabling push:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to enable push notifications' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDisablePush() {
    setIsSaving(true);
    try {
      await unsubscribeFromPush();
      await handleSavePreferences({ enabled: false });
      setFeedback({ type: 'info', message: 'Notifications disabled on this device.' });
    } catch (err: any) {
      console.error('Error disabling push:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePreferences(updated: Partial<NotificationPreferences>) {
    setIsSaving(true);
    setFeedback(null);

    try {
      const nextPrefs = { ...prefs, ...updated };
      setPrefs(nextPrefs);

      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPrefs),
      });

      if (!res.ok) throw new Error('Failed to update preferences on server');
      const data = await res.json();
      setPrefs(data.preferences);
      setFeedback({ type: 'success', message: 'Notification preferences saved.' });
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save preferences' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendTest() {
    setIsTesting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/notifications/send-test', { method: 'POST' });
      const data = await res.json();

      if (data.success && data.deliveredCount > 0) {
        setFeedback({
          type: 'success',
          message: `Test notification delivered to ${data.deliveredCount} active subscription(s)!`,
        });
      } else {
        // Fallback to local notification if in browser
        showLocalNotification(
          'HabitFlow Test Reminder 🚀',
          'Your hourly habit check-in reminder pipeline is active!'
        );
        setFeedback({
          type: 'info',
          message: data.message || 'Triggered local browser test notification.',
        });
      }
    } catch (err: any) {
      console.error('Test notification failed:', err);
      // Local fallback
      showLocalNotification('HabitFlow Test 🚀', 'Local browser notification test.');
      setFeedback({
        type: 'info',
        message: 'Dispatched immediate local notification fallback.',
      });
    } finally {
      setIsTesting(false);
    }
  }

  function handleAddSpecificTime() {
    if (!newTimeInput || prefs.specificTimes.includes(newTimeInput)) return;
    const sorted = [...prefs.specificTimes, newTimeInput].sort();
    handleSavePreferences({ specificTimes: sorted });
  }

  function handleRemoveSpecificTime(time: string) {
    const filtered = prefs.specificTimes.filter((t) => t !== time);
    handleSavePreferences({ specificTimes: filtered });
  }

  function handleToggleDay(dayIndex: number) {
    let nextDays: number[];
    if (prefs.daysOfWeek.includes(dayIndex)) {
      nextDays = prefs.daysOfWeek.filter((d) => d !== dayIndex);
    } else {
      nextDays = [...prefs.daysOfWeek, dayIndex].sort();
    }
    handleSavePreferences({ daysOfWeek: nextDays });
  }

  const DAY_LABELS = [
    { index: 1, label: 'Mon' },
    { index: 2, label: 'Tue' },
    { index: 3, label: 'Wed' },
    { index: 4, label: 'Thu' },
    { index: 5, label: 'Fri' },
    { index: 6, label: 'Sat' },
    { index: 0, label: 'Sun' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Scope & Status Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                  Notifications &amp; Reminders
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    permission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : permission === 'denied'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  Permission: {permission}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Hourly Check-in Reminders &amp; Web Push
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {permission !== 'granted' ? (
              <button
                onClick={handleEnablePush}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                <span>Enable Push Notifications</span>
              </button>
            ) : (
              <button
                onClick={handleSendTest}
                disabled={isTesting}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Test Notification</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : feedback.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="ml-4 text-xs underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule & Intervals */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Reminder Schedule</h3>
            </div>

            {/* Master toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => handleSavePreferences({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Mode Switcher */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Reminder Timing Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSavePreferences({ mode: 'interval' })}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                  prefs.mode === 'interval'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-800/60 text-slate-400 border-slate-750 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold block">Hourly Interval</span>
                <span className="text-[10px] opacity-80">During tracking hours</span>
              </button>

              <button
                type="button"
                onClick={() => handleSavePreferences({ mode: 'specific_times' })}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                  prefs.mode === 'specific_times'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-800/60 text-slate-400 border-slate-750 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold block">Specific Clock Times</span>
                <span className="text-[10px] opacity-80">Custom alarms</span>
              </button>
            </div>
          </div>

          {/* Interval Configuration */}
          {prefs.mode === 'interval' && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Interval Frequency</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 30, label: 'Every 30m' },
                  { value: 60, label: 'Every 60m (Hourly)' },
                  { value: 120, label: 'Every 2 Hours' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleSavePreferences({ intervalMinutes: item.value })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      prefs.intervalMinutes === item.value
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                        : 'bg-slate-800/60 text-slate-400 border-slate-750 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Specific Times Configuration */}
          {prefs.mode === 'specific_times' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">Configured Clock Times</span>
              <div className="flex flex-wrap gap-2">
                {prefs.specificTimes.map((time) => (
                  <span
                    key={time}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-purple-300"
                  >
                    <span>{time}</span>
                    <button
                      onClick={() => handleRemoveSpecificTime(time)}
                      className="text-slate-400 hover:text-rose-400 ml-1"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="time"
                  value={newTimeInput}
                  onChange={(e) => setNewTimeInput(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddSpecificTime}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
                >
                  Add Time
                </button>
              </div>
            </div>
          )}

          {/* Days of Week Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block">Active Days</span>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((d) => {
                const isSelected = prefs.daysOfWeek.includes(d.index);
                return (
                  <button
                    key={d.index}
                    type="button"
                    onClick={() => handleToggleDay(d.index)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Quiet Hours Start (Mute)
              </span>
              <input
                type="time"
                value={prefs.quietHoursStart}
                onChange={(e) => handleSavePreferences({ quietHoursStart: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Quiet Hours End (Resume)
              </span>
              <input
                type="time"
                value={prefs.quietHoursEnd}
                onChange={(e) => handleSavePreferences({ quietHoursEnd: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Privacy & PWA Background Requirements */}
        <div className="space-y-4">
          {/* Privacy & Safe Payloads */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Shield className="w-4 h-4" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Privacy-Safe Habit Notifications
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In strict accordance with the HabitFlow specification, push notifications never
              expose your private habit questions or sensitive answers in system notifications.
              Alerts read simply:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              &ldquo;HabitFlow Check-in: Time to log your habits for 2:00 PM • Keep your streak alive!&rdquo;
            </div>
          </div>

          {/* PWA & Mobile Installation Instructions */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-sky-400">
              <Smartphone className="w-4 h-4" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                PWA Mobile Installation (iOS &amp; Android)
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              For reliable background notifications and standalone offline tracking:
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="font-bold text-white block mb-0.5">iOS Safari:</span>
                Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> Share icon &rarr; select{' '}
                <strong>&ldquo;Add to Home Screen&rdquo;</strong>. (iOS 16.4+ enables full background Web Push for installed PWAs).
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="font-bold text-white block mb-0.5">Chrome / Edge / Android:</span>
                Click the install icon in the address bar or tap &ldquo;Install HabitFlow&rdquo;.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
