import React from 'react';
import { ExamType, UserProfile, Question } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface SkillsViewProps {
  activeExam: ExamType;
  profile: UserProfile;
  mastery: Record<string, number>;
  history: Array<{ score: number; date: string; kind: string }>;
  bank: Question[];
  onStartFocus: (skills: string[]) => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({
  activeExam,
  profile,
  mastery,
  history,
  bank,
  onStartFocus
}) => {
  const conf = EXAM_CONFIGS[activeExam];
  const target = profile.targets[activeExam];

  const allSkills = conf.sections.flatMap(s => s.skills);
  const avgMastery = Math.round(
    allSkills.reduce((acc, sk) => acc + (mastery[sk] ?? 50), 0) / allSkills.length
  );
  const focusCount = allSkills.filter(sk => (mastery[sk] ?? 50) < 60).length;

  const span = conf.max - conf.min;
  const targetPct = Math.min(95, Math.max(10, ((target - conf.min) / span) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            {conf.id} skills
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
            Where your points are.
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mt-2 leading-relaxed">
            Mastery is the share of questions answered correctly for each skill, weighted toward your most recent sessions. Skills under 60% are marked for focus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-white border border-slate-300 text-xs font-bold text-[#201e1d]">
            Average: {avgMastery}%
          </div>
          {focusCount > 0 && (
            <div className="px-3.5 py-1.5 bg-[#1f3d7a] text-white text-xs font-bold flex items-center gap-1.5">
              <span>{focusCount} focus skills</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Skills by Section (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {conf.sections.map(section => {
            const sectionAvg = Math.round(
              section.skills.reduce((acc, sk) => acc + (mastery[sk] ?? 50), 0) / section.skills.length
            );

            return (
              <div key={section.name} className="space-y-4">
                <div className="flex items-baseline justify-between border-b-2 border-[#201e1d]/30 pb-2">
                  <h2 className="text-lg font-black text-[#201e1d]">{section.name}</h2>
                  <span className="font-extrabold text-sm text-[#201e1d]">{sectionAvg}%</span>
                </div>

                <div className="divide-y border-b border-slate-300">
                  {section.skills.map(sk => {
                    const pct = mastery[sk] ?? 50;
                    const availableQuestions = bank.filter(q => q.skill === sk).length;
                    const isFocus = pct < 60;

                    return (
                      <div key={sk} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 pr-4 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#201e1d]">{sk}</span>
                            {isFocus && (
                              <span className="text-[10px] font-black text-[#e15b47] uppercase tracking-wider">
                                Focus
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-300">
                              <div
                                className={`h-full ${isFocus ? 'bg-[#e15b47]' : 'bg-[#1f3d7a]'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-[#201e1d] tabular-nums w-10 text-right">
                              {pct}%
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onStartFocus([sk])}
                          disabled={availableQuestions === 0}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#201e1d] cursor-pointer disabled:opacity-40 self-start sm:self-auto"
                        >
                          Practice ({availableQuestions})
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Score Trajectory Chart (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border-b-2 border-[#201e1d]/30 pb-2">
            <h3 className="text-base font-extrabold text-[#201e1d]">Mock score trend</h3>
          </div>

          <div className="relative h-48 flex items-end gap-3 pt-6 pb-2 border-b-2 border-[#201e1d]">
            {/* Target Line */}
            <div
              className="absolute left-0 right-0 border-b-2 border-dashed border-[#1f3d7a] pointer-events-none z-10"
              style={{ bottom: `${targetPct}%` }}
            />

            {history.map((h, i) => {
              const heightPct = Math.min(95, Math.max(15, ((h.score - conf.min) / span) * 100));
              const isLatest = i === history.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-[11px] font-black text-[#201e1d] tabular-nums">{h.score}</span>
                  <div
                    className={`w-full transition-all ${isLatest ? 'bg-[#1f3d7a]' : 'bg-[#201e1d]'}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-slate-600 font-bold">
            {history.map((h, i) => (
              <span key={i} className="flex-1 text-center truncate">
                {h.date}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-2">
            <span className="w-4 border-b-2 border-dashed border-[#1f3d7a]" />
            <span>Target {target}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
