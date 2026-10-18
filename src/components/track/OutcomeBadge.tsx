'use client';

import React from 'react';
import type { Outcome } from '@/types';

interface OutcomeBadgeProps {
  outcome: Outcome;
  label?: string;
  className?: string;
}

export function OutcomeBadge({ outcome, label, className = '' }: OutcomeBadgeProps) {
  const displayLabel = label || outcome.charAt(0).toUpperCase() + outcome.slice(1);

  if (outcome === 'positive') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        {displayLabel}
      </span>
    );
  }

  if (outcome === 'negative') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/50 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        {displayLabel}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-600 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      {displayLabel}
    </span>
  );
}
