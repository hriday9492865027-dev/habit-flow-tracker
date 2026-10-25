'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Download, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { registerServiceWorker } from '@/lib/notifications/client';

export function PwaOfflineManager() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  const flushOfflineQueue = React.useCallback(async () => {
    try {
      const rawQueue = localStorage.getItem('habitflow_offline_queue');
      if (!rawQueue) return;

      const queue: any[] = JSON.parse(rawQueue);
      if (queue.length === 0) return;

      setIsSyncing(true);
      let successCount = 0;

      for (const item of queue) {
        try {
          const res = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          if (res.ok) successCount++;
        } catch (err) {
          console.error('Failed to sync item:', err);
        }
      }

      localStorage.removeItem('habitflow_offline_queue');
      setSyncedCount(successCount);
      setTimeout(() => setSyncedCount(null), 4000);
    } catch (err) {
      console.error('Error flushing offline queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // 1. Register Service Worker safely
    registerServiceWorker();

    // 2. Online / offline status listeners
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. PWA beforeinstallprompt capture
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [flushOfflineQueue]);

  async function handleInstallClick() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  }

  return (
    <>
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-500/90 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between sticky top-16 z-50 shadow-md">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              You are currently working offline. HabitFlow will preserve your inputs and sync safely once your connection is restored.
            </span>
          </div>
        </div>
      )}

      {/* Sync Recovery Notification */}
      {syncedCount !== null && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Restored connection: Synchronized {syncedCount} offline entry update(s)!</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && installPrompt && (
        <div className="fixed bottom-4 left-4 z-50 p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 text-white shadow-2xl max-w-sm flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">Install HabitFlow</span>
              <span className="text-[11px] text-slate-400 block">Fast offline tracking on your home screen</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
