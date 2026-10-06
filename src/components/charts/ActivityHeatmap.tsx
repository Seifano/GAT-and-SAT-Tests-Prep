import React, { useState } from 'react';
import { Calendar, Flame, CheckCircle, Zap } from 'lucide-react';

interface ActivityHeatmapProps {
  streak: number;
  attempts?: import('../../types').TestAttempt[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ streak, attempts = [] }) => {
  const [hoveredDay, setHoveredDay] = useState<{ day: string; count: number; acc: number } | null>(null);

  // Map real attempts by short date string or ISO date string
  const attemptMap: Record<string, { count: number; correct: number }> = {};
  attempts.forEach(att => {
    const key = att.date;
    if (!attemptMap[key]) {
      attemptMap[key] = { count: 0, correct: 0 };
    }
    attemptMap[key].count += att.total || 0;
    attemptMap[key].correct += att.correct || 0;
  });

  // Generate 35 days (5 weeks) of authentic activity data
  const days: Array<{ day: string; date: string; count: number; acc: number; isToday: boolean }> = [];
  const now = new Date();

  for (let i = 34; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isToday = i === 0;

    // Check if there is real attempt data on this day
    const matching = attemptMap[dayStr];
    let count = matching ? matching.count : 0;
    let acc = matching && matching.count > 0 ? Math.round((matching.correct / matching.count) * 100) : 0;

    days.push({
      day: dayStr,
      date: d.toISOString().split('T')[0],
      count,
      acc,
      isToday
    });
  }

  const totalQuestions = days.reduce((sum, d) => sum + d.count, 0);
  const activeDays = days.filter(d => d.count > 0).length;

  return (
    <div className="bg-white border-2 border-[#201e1d]/30 p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1f3d7a]" />
            <h3 className="text-base font-extrabold text-[#201e1d] tracking-tight">
              Study Frequency &amp; Retention Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            5-week practice velocity across timed mocks and skill drills
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streak}-Day Streak</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-[#1f3d7a]">{totalQuestions} Qs Solved</span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-emerald-700">{activeDays} / 35 Active Days</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 sm:grid-cols-7 gap-1.5 max-w-full">
          {days.map((d, i) => {
            const level = d.count === 0 ? 0 : d.count <= 8 ? 1 : d.count <= 18 ? 2 : 3;
            const bgClass =
              level === 0
                ? 'bg-slate-100 border border-slate-200'
                : level === 1
                ? 'bg-blue-200 border border-blue-300'
                : level === 2
                ? 'bg-[#1f3d7a]/70 text-white'
                : 'bg-[#1f3d7a] text-white';

            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredDay({ day: d.day, count: d.count, acc: d.acc })}
                onMouseLeave={() => setHoveredDay(null)}
                className={`h-11 sm:h-12 p-1.5 flex flex-col justify-between cursor-pointer transition-transform hover:scale-105 ${bgClass} ${
                  d.isToday ? 'ring-2 ring-[#e15b47]' : ''
                }`}
              >
                <div className="flex justify-between items-center text-[9px] font-bold opacity-80">
                  <span>{d.day.split(' ')[1]}</span>
                  {d.isToday && <span className="text-[8px] uppercase font-black text-amber-300">Today</span>}
                </div>
                <div className="text-[11px] font-mono font-black text-right">
                  {d.count > 0 ? `${d.count}q` : '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend & Tooltip row */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="w-3 h-3 bg-slate-100 border border-slate-200" />
            <div className="w-3 h-3 bg-blue-200" />
            <div className="w-3 h-3 bg-[#1f3d7a]/70" />
            <div className="w-3 h-3 bg-[#1f3d7a]" />
            <span>More Questions</span>
          </div>

          {hoveredDay ? (
            <div className="font-bold text-[#201e1d] bg-amber-50 px-2 py-0.5 border border-amber-300">
              {hoveredDay.day}: {hoveredDay.count} questions solved ({hoveredDay.acc}% accuracy)
            </div>
          ) : (
            <div className="text-slate-400">Hover over any day to inspect velocity</div>
          )}
        </div>
      </div>
    </div>
  );
};
