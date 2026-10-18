'use client';

import React from 'react';
import { Sun, CloudSun, Moon } from 'lucide-react';
import type { TimeOfDaySummary } from '@/types';

interface TimeOfDayBreakdownProps {
  timeOfDay: TimeOfDaySummary;
}

export function TimeOfDayBreakdown({ timeOfDay }: TimeOfDayBreakdownProps) {
  const segments = [
    {
      title: 'Morning',
      timeframe: '6 AM – 11:59 AM',
      icon: Sun,
      data: timeOfDay.morning,
      color: 'text-amber-400',
    },
    {
      title: 'Afternoon',
      timeframe: '12 PM – 4:59 PM',
      icon: CloudSun,
      data: timeOfDay.afternoon,
      color: 'text-orange-400',
    },
    {
      title: 'Evening',
      timeframe: '5 PM – 9 PM',
      icon: Moon,
      data: timeOfDay.evening,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">Time of Day Distribution</h3>
        <p className="text-xs text-slate-400">
          Pattern breakdown of recorded outcomes across day partitions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {segments.map((seg) => {
          const Icon = seg.icon;
          const total = seg.data.totalAnswered;

          return (
            <div
              key={seg.title}
              className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${seg.color}`} />
                  <span className="text-sm font-bold text-white">{seg.title}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">{seg.timeframe}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Answered:</span>
                  <span className="font-bold text-white">{total} slots</span>
                </div>

                {/* Progress outcome stacked bar */}
                {total > 0 ? (
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${(seg.data.positive / total) * 100}%` }}
                      className="bg-emerald-500 h-full"
                      title={`${seg.data.positive} Positive`}
                    ></div>
                    <div
                      style={{ width: `${(seg.data.negative / total) * 100}%` }}
                      className="bg-rose-500 h-full"
                      title={`${seg.data.negative} Negative`}
                    ></div>
                    <div
                      style={{ width: `${(seg.data.neutral / total) * 100}%` }}
                      className="bg-slate-500 h-full"
                      title={`${seg.data.neutral} Neutral`}
                    ></div>
                  </div>
                ) : (
                  <div className="w-full h-2.5 rounded-full bg-slate-800"></div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-emerald-400 font-medium">+{seg.data.positive} Pos</span>
                  <span className="text-rose-400 font-medium">-{seg.data.negative} Neg</span>
                  <span className="text-slate-400 font-medium">~{seg.data.neutral} Neu</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
