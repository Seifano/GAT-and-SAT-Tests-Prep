import React from 'react';
import { ExamType, UserProfile, Question } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { ArrowRight, Play, Zap, Flame, Calendar, Target, Clock, ShieldAlert, BarChart3, CheckCircle2 } from 'lucide-react';

interface DashboardViewProps {
  activeExam: ExamType;
  profile: UserProfile;
  mastery: Record<string, number>;
  history: Array<{ score: number; date: string; kind: string }>;
  streak: number;
  weekDone: boolean[];
  bank: Question[];
  userName: string;
  onStartMock: () => void;
  onStartFocus: (skills: string[]) => void;
  onStartQuick: () => void;
  onViewSkills: () => void;
  onViewResults: () => void;
  hasPastResults: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeExam,
  profile,
  mastery,
  history,
  streak,
  weekDone,
  bank,
  userName,
  onStartMock,
  onStartFocus,
  onStartQuick,
  onViewSkills,
  onViewResults,
  hasPastResults
}) => {
  const conf = EXAM_CONFIGS[activeExam];
  const target = profile.targets[activeExam];
  const lastScore = history.length ? history[history.length - 1].score : conf.min;
  const gap = target - lastScore;

  // Days left calculation
  const targetDateStr = profile.dates[activeExam] || '2026-11-20';
  const targetDate = new Date(targetDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const formattedDate = targetDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Calculate score progress percentage
  const span = conf.max - conf.min;
  const scorePct = Math.min(100, Math.max(0, ((lastScore - conf.min) / span) * 100));
  const targetPct = Math.min(100, Math.max(0, ((target - conf.min) / span) * 100));

  // Find lowest mastery skills with available questions
  const allSkills = conf.sections.flatMap(s => s.skills);
  const skillsWithBank = allSkills.filter(sk => bank.some(q => q.skill === sk));
  const sortedSkills = [...skillsWithBank].sort((a, b) => (mastery[a] ?? 50) - (mastery[b] ?? 50));
  const lowestTwo = sortedSkills.slice(0, 2);
  const prioritySkills = sortedSkills.slice(0, 4);

  // Overall average mastery
  const avgMastery = Math.round(
    allSkills.reduce((acc, sk) => acc + (mastery[sk] ?? 50), 0) / (allSkills.length || 1)
  );

  const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            {conf.full}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
            Hi {userName.split(' ')[0]}.
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track your target gap, focus on your lowest skills, and take full timed mocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onStartQuick}
            disabled={bank.length === 0}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#201e1d] transition-colors cursor-pointer disabled:opacity-40"
          >
            5-Min Warmup
          </button>
          <button
            onClick={onStartMock}
            disabled={bank.length === 0}
            className="btn-primary px-5 py-2.5 text-white text-xs font-black flex items-center gap-3 transition-all cursor-pointer disabled:opacity-40"
          >
            <span>Start full mock</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {bank.length === 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">No questions currently loaded for {activeExam}</strong>
            <span>Switch to the Admin hub in the top navigation to add or import questions.</span>
          </div>
        </div>
      )}

      {/* Clean 4-Card Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-l-2 border-[#201e1d]/30 bg-white">
        {/* Stat 1: Estimated score */}
        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Estimated score</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl sm:text-5xl font-black text-[#1f3d7a] tracking-tight tabular-nums">
              {lastScore}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              / target {target}
            </span>
          </div>
          <div className="space-y-1.5 mt-auto">
            <div className="relative w-full h-1.5 bg-slate-200">
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#1f3d7a]"
                style={{ width: `${scorePct}%` }}
              />
              <div
                className="absolute -top-1 -bottom-1 w-0.5 bg-[#201e1d]"
                style={{ left: `${targetPct}%` }}
                title={`Target: ${target}`}
              />
            </div>
            <div className="text-xs text-slate-700 font-bold">
              {gap > 0 ? `${gap} points to go` : 'Target reached!'}
            </div>
          </div>
        </div>

        {/* Stat 2: Mastery Average */}
        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Average mastery</span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl sm:text-5xl font-black text-[#201e1d] tracking-tight tabular-nums">
              {avgMastery}%
            </span>
          </div>
          <div className="text-xs text-slate-700 font-semibold mt-auto">
            {sortedSkills.filter(sk => (mastery[sk] ?? 50) >= 80).length} of {allSkills.length} skills mastered
          </div>
        </div>

        {/* Stat 3: Test countdown */}
        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Exam date</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl sm:text-5xl font-black text-[#201e1d] tracking-tight tabular-nums">
              {daysLeft}
            </span>
            <span className="text-xs text-slate-500 font-bold">days left</span>
          </div>
          <div className="text-xs text-slate-700 font-bold mt-auto truncate">
            {formattedDate}
          </div>
        </div>

        {/* Stat 4: Practice streak */}
        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Study streak</span>
            <Flame className="w-4 h-4 text-[#1f3d7a]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl sm:text-5xl font-black text-[#201e1d] tracking-tight tabular-nums">
              {streak}
            </span>
            <span className="text-xs text-slate-500 font-bold">days</span>
          </div>

          <div className="grid grid-cols-7 gap-1 mt-auto">
            {daysLabels.map((lbl, idx) => {
              const done = weekDone[idx];
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-full h-2 ${
                      done ? 'bg-[#1f3d7a]' : 'bg-slate-200'
                    }`}
                  />
                  <span className="text-[10px] font-bold text-slate-500">{lbl}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Focus Area: Weakest Skills & Adaptive Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focus on Weakest Skills (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-baseline justify-between border-b-2 border-[#201e1d]/30 pb-2">
            <div>
              <h3 className="text-base font-extrabold text-[#201e1d]">Focus on these skills</h3>
              <p className="text-xs text-slate-500">Skills where more points can be gained</p>
            </div>
            <button
              onClick={onViewSkills}
              className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
            >
              All skills
            </button>
          </div>

          <div className="divide-y border-b border-slate-300">
            {prioritySkills.map(sk => {
              const pct = mastery[sk] ?? 50;
              const hasQ = bank.some(q => q.skill === sk);
              const isLow = pct < 60;

              return (
                <div key={sk} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#201e1d] block">{sk}</span>
                        {isLow && (
                          <span className="text-[10px] font-black text-[#e15b47] uppercase tracking-wider bg-[#e15b47]/10 px-1.5 py-0.2">
                            Priority
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{pct}% mastery</span>
                    </div>
                    <button
                      onClick={() => onStartFocus([sk])}
                      disabled={!hasQ}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#201e1d] cursor-pointer disabled:opacity-40"
                    >
                      Practice
                    </button>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200">
                    <div
                      className={`h-full ${isLow ? 'bg-[#e15b47]' : 'bg-[#1f3d7a]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Adaptive Next Session + Recent Attempts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recommended Next Box */}
          <div className="border-2 border-[#1f3d7a] p-6 bg-white space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f3d7a] block">
              Recommended next
            </span>
            <div className="text-2xl font-black text-[#201e1d] leading-snug">
              {lowestTwo.length ? lowestTwo.join(' + ') : 'Comprehensive Review'}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {lowestTwo.length
                ? `Focus drill targeting your two lowest skills (${mastery[lowestTwo[0]] ?? 50}% and ${mastery[lowestTwo[1]] ?? 50}%).`
                : 'Targeted focus set across key competencies.'}
            </p>
            <div className="flex gap-2 text-xs">
              <span className="px-2.5 py-1 bg-[#eae9e9] font-bold text-slate-700">10 questions</span>
              <span className="px-2.5 py-1 bg-[#eae9e9] font-bold text-slate-700">~12 min</span>
            </div>
            <button
              onClick={() => onStartFocus(lowestTwo.length ? lowestTwo : ['Analogy'])}
              disabled={bank.length === 0}
              className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40"
            >
              <span>Start focus set</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Recent Attempts Activity */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between border-b-2 border-[#201e1d]/30 pb-2">
              <h3 className="text-base font-extrabold text-[#201e1d]">Recent attempts</h3>
              {hasPastResults && (
                <button
                  onClick={onViewResults}
                  className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
                >
                  Last results
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-300 text-xs">
              {history.slice(-3).reverse().map((h, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-600">{h.date} · {h.kind}</span>
                  <span className="font-extrabold text-sm text-[#201e1d] tabular-nums">{h.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
