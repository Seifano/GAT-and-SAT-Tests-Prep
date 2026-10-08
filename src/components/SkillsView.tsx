import React from 'react';
import { ExamType, UserProfile, Question } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { TrendingUp, AlertTriangle, Zap, CheckCircle2, BookOpen } from 'lucide-react';

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
  const assessedSkills = allSkills.filter(sk => mastery[sk] !== undefined);
  const avgMastery = assessedSkills.length > 0
    ? Math.round(assessedSkills.reduce((acc, sk) => acc + (mastery[sk] || 0), 0) / assessedSkills.length)
    : 0;

  const focusCount = assessedSkills.filter(sk => (mastery[sk] || 0) < 60).length;

  const span = conf.max - conf.min;
  const targetPct = Math.min(95, Math.max(10, ((target - conf.min) / span) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-300">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            {conf.id} Competency Matrix
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            Authentic Skill Diagnostics
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mt-1.5 leading-relaxed break-words">
            Mastery is calculated solely from your authentic submitted test and practice responses. Skills under 60% are marked for high-priority focus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-white border border-slate-300 text-xs font-bold text-[#201e1d] shadow-sm">
            {assessedSkills.length > 0 ? (
              <span>Average Mastery: <strong className="text-[#1f3d7a]">{avgMastery}%</strong></span>
            ) : (
              <span className="text-slate-500">Unassessed Baseline</span>
            )}
          </div>
          {focusCount > 0 && (
            <div className="px-3.5 py-2 bg-[#e15b47] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{focusCount} focus skills</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Skills by Section (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {conf.sections.map(section => {
            const secAssessed = section.skills.filter(sk => mastery[sk] !== undefined);
            const sectionAvg = secAssessed.length > 0
              ? Math.round(secAssessed.reduce((acc, sk) => acc + (mastery[sk] || 0), 0) / secAssessed.length)
              : null;

            return (
              <div key={section.name} className="space-y-4">
                <div className="flex items-baseline justify-between border-b-2 border-[#201e1d]/30 pb-2">
                  <h2 className="text-lg font-black text-[#201e1d] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#1f3d7a]" />
                    <span>{section.name} Domain</span>
                  </h2>
                  <span className="font-extrabold text-sm text-[#1f3d7a]">
                    {sectionAvg !== null ? `${sectionAvg}% avg` : 'Unassessed'}
                  </span>
                </div>

                <div className="divide-y border border-slate-300 bg-white shadow-sm">
                  {section.skills.map(sk => {
                    const isAssessed = mastery[sk] !== undefined;
                    const pct = isAssessed ? mastery[sk] : 0;
                    const availableQuestions = bank.filter(q => q.skill === sk).length;
                    const isFocus = isAssessed && pct < 60;
                    const isMastered = isAssessed && pct >= 80;

                    return (
                      <div
                        key={sk}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-all duration-200 group"
                      >
                        <div className="flex-1 min-w-0 pr-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#201e1d] group-hover:text-[#1f3d7a] transition-colors">
                              {sk}
                            </span>
                            {isFocus && (
                              <span className="text-[10px] font-black text-[#e15b47] uppercase tracking-wider bg-red-50 border border-red-200 px-1.5 py-0.2">
                                Focus
                              </span>
                            )}
                            {isMastered && (
                              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-1.5 py-0.2">
                                Mastered
                              </span>
                            )}
                            {!isAssessed && (
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-1.5 py-0.2">
                                Unassessed
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2.5 bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  !isAssessed
                                    ? 'bg-slate-300 w-0'
                                    : isFocus
                                    ? 'bg-[#e15b47]'
                                    : isMastered
                                    ? 'bg-emerald-600'
                                    : 'bg-[#1f3d7a]'
                                }`}
                                style={{ width: `${isAssessed ? pct : 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-[#201e1d] tabular-nums w-12 text-right">
                              {isAssessed ? `${pct}%` : '—'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onStartFocus([sk])}
                          disabled={availableQuestions === 0}
                          className="px-3.5 py-2 bg-white hover:bg-[#1f3d7a] hover:text-white border border-slate-300 hover:border-[#1f3d7a] text-xs font-bold text-[#201e1d] cursor-pointer disabled:opacity-40 self-start sm:self-auto transition-all duration-200 hover:shadow-sm flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>Practice ({availableQuestions})</span>
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
            <h3 className="text-base font-extrabold text-[#201e1d]">Mock Score Velocity</h3>
          </div>

          {history.length > 0 ? (
            <div className="bg-white p-5 border border-slate-300 shadow-sm space-y-4">
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
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <div className="text-[10px] font-black text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {h.score}
                      </div>
                      <div
                        className={`w-full transition-all duration-300 ${
                          isLatest ? 'bg-[#1f3d7a]' : 'bg-slate-300 group-hover:bg-slate-400'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-slate-500 font-bold mt-1.5 truncate">
                        {h.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#1f3d7a] inline-block" />
                  <span>Target: {target}</span>
                </span>
                <span className="text-[#1f3d7a] font-bold">
                  Latest: {history[history.length - 1].score}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white border border-slate-300 text-center space-y-3 shadow-sm">
              <div className="w-10 h-10 bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#201e1d]">No Verified Mocks Yet</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete your first diagnostic test to establish authentic score trend tracking.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
