import React, { useState } from 'react';
import { TestAttempt, Question, UserProfile } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface ResultsViewProps {
  attempt: TestAttempt;
  allQuestions: Question[];
  profile: UserProfile;
  onRetake: () => void;
  onPracticeWeak: (skills: string[]) => void;
  onReturnDashboard: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  attempt,
  allQuestions,
  profile,
  onRetake,
  onPracticeWeak,
  onReturnDashboard
}) => {
  const [filterMode, setFilterMode] = useState<'missed' | 'all'>('missed');
  const [openPassageId, setOpenPassageId] = useState<string | null>(null);

  const conf = EXAM_CONFIGS[attempt.exam];
  const target = profile.targets[attempt.exam];
  const targetDiff = target - attempt.score;

  const avgSeconds = attempt.total > 0 ? Math.round(attempt.timeUsed / attempt.total) : 0;
  const timeMins = Math.floor(attempt.timeUsed / 60);
  const timeSecs = attempt.timeUsed % 60;
  const formattedTime = `${timeMins}m ${timeSecs}s`;

  const reviewItems = attempt.qids.map((id, idx) => {
    const q = allQuestions.find(item => item.id === id) || {
      id,
      exam: attempt.exam,
      section: 'General',
      skill: 'General',
      prompt: 'Question details unavailable.',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 0,
      explain: ''
    };

    const chosenIdx = attempt.answers[idx];
    const isSkipped = chosenIdx === undefined;
    const isCorrect = !isSkipped && chosenIdx === q.answer;

    return {
      index: idx + 1,
      q,
      chosenIdx,
      isSkipped,
      isCorrect
    };
  });

  const missedItems = reviewItems.filter(item => !item.isCorrect);
  const displayedItems = filterMode === 'missed' ? missedItems : reviewItems;

  const weakSkills = attempt.bySkill
    .filter(s => s.correct < s.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            {attempt.label} · {attempt.date}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
            {targetDiff <= 0 ? 'You reached your target.' : `${targetDiff} points from your target.`}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReturnDashboard}
            className="px-4 py-2.5 border border-slate-400 bg-white hover:bg-slate-100 text-xs font-bold text-[#201e1d] cursor-pointer"
          >
            Dashboard
          </button>
          <button
            onClick={onRetake}
            className="btn-primary px-5 py-2.5 text-white text-xs font-black cursor-pointer"
          >
            Retake
          </button>
        </div>
      </div>

      {/* 3 Metric Grid in Modernist 2px Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-t-2 border-l-2 border-[#201e1d]/30 bg-white">
        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium">Estimated score</span>
          <span className="text-5xl font-black text-[#1f3d7a] tracking-tight tabular-nums my-2">
            {attempt.score}
          </span>
          <span className="text-xs text-slate-700 font-bold">Target {target}</span>
        </div>

        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium">Correct</span>
          <span className="text-5xl font-black text-[#201e1d] tracking-tight tabular-nums my-2">
            {attempt.correct}<span className="text-xl font-normal text-slate-400">/{attempt.total}</span>
          </span>
          <span className="text-xs text-slate-700 font-bold">
            {reviewItems.filter(i => i.isSkipped).length} skipped
          </span>
        </div>

        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium">Time used</span>
          <span className="text-5xl font-black text-[#201e1d] tracking-tight tabular-nums my-2">
            {formattedTime}
          </span>
          <span className="text-xs text-slate-700 font-bold">
            {avgSeconds}s per question on average
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Weakest Skills */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border-b-2 border-[#201e1d]/30 pb-2">
            <h3 className="text-base font-extrabold text-[#201e1d]">Weakest skills this session</h3>
          </div>

          <div className="divide-y border-b border-slate-300">
            {weakSkills.map(w => (
              <div key={w.skill} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-sm text-[#201e1d] block">{w.skill}</span>
                  <span className="text-xs text-slate-500">Missed {w.total - w.correct} of {w.total}</span>
                </div>
                <span className="font-extrabold text-sm text-[#e15b47] tabular-nums">
                  {w.correct}/{w.total}
                </span>
              </div>
            ))}
          </div>

          <table className="w-full text-left text-xs border-collapse mt-4">
            <thead>
              <tr className="border-b-2 border-[#201e1d]/30 text-slate-500 uppercase tracking-wider">
                <th className="py-2">Skill</th>
                <th className="py-2 text-right">Correct</th>
                <th className="py-2 text-right">Mastery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {attempt.bySkill.map(b => (
                <tr key={b.skill}>
                  <td className="py-2.5 font-bold text-[#201e1d]">{b.skill}</td>
                  <td className="py-2.5 text-right font-medium">{b.correct}/{b.total}</td>
                  <td className="py-2.5 text-right font-extrabold text-[#1f3d7a] tabular-nums">
                    {Math.round((b.correct / b.total) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column: Recommended next box */}
        <div className="lg:col-span-5">
          <div className="border-2 border-[#1f3d7a] p-6 bg-white space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f3d7a] block">
              Recommended next
            </span>
            <div className="text-2xl font-black text-[#201e1d] leading-snug">
              {weakSkills.length ? weakSkills.map(s => s.skill).join(' + ') : 'Comprehensive Drill'}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Targeted focus set aimed directly at the errors made in this session.
            </p>
            <button
              onClick={() => onPracticeWeak(weakSkills.map(s => s.skill))}
              className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer"
            >
              <span>Start focus set</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mistake Review Area */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#201e1d]/30 pb-3">
          <h3 className="text-lg font-black text-[#201e1d]">Mistake review</h3>

          <div className="inline-flex border border-[#201e1d]/30 bg-transparent">
            <button
              onClick={() => setFilterMode('missed')}
              className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'missed' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
              }`}
            >
              Missed ({missedItems.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
              }`}
            >
              All ({reviewItems.length})
            </button>
          </div>
        </div>

        {displayedItems.length === 0 ? (
          <div className="py-8 text-sm text-[#201e1d]">No missed questions in this session.</div>
        ) : (
          <div className="space-y-6 divide-y divide-slate-300">
            {displayedItems.map((item, idx) => {
              const { q, chosenIdx, isCorrect, isSkipped } = item;
              const isPassageOpen = openPassageId === q.id;

              return (
                <div key={q.id} className={idx > 0 ? 'pt-6' : ''}>
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className="font-extrabold text-[#201e1d]">Q{item.index}</span>
                    <span
                      className={`font-black text-[11px] px-1.5 py-0.5 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-[#e15b47]/15 text-[#e15b47]'
                      }`}
                    >
                      {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                    </span>
                    <span className="text-slate-500">· {q.skill}</span>
                  </div>

                  {q.passage && (
                    <div className="mb-2">
                      <button
                        onClick={() => setOpenPassageId(isPassageOpen ? null : q.id)}
                        className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>{isPassageOpen ? 'Hide passage' : 'Show passage'}</span>
                        {isPassageOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isPassageOpen && (
                        <div className="mt-2 p-4 bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 max-h-60 overflow-y-auto whitespace-pre-line">
                          {q.passage}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-base font-bold text-[#201e1d] mb-3 whitespace-pre-line">
                    {q.prompt}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 border-t-2 border-l-2 border-[#201e1d]/30 max-w-lg mb-3 bg-white">
                    <div className="p-3 border-r-2 border-b-2 border-[#201e1d]/30 text-xs">
                      <div className="text-[11px] text-slate-500 font-bold mb-0.5">Your answer</div>
                      <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-[#e15b47] font-bold'}>
                        {isSkipped ? 'No answer' : `ABCD`[chosenIdx] + ') ' + q.options[chosenIdx]}
                      </span>
                    </div>
                    <div className="p-3 border-r-2 border-b-2 border-[#201e1d]/30 text-xs">
                      <div className="text-[11px] text-slate-500 font-bold mb-0.5">Correct answer</div>
                      <span className="font-extrabold text-[#201e1d]">
                        {`ABCD`[q.answer] + ') ' + q.options[q.answer]}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
                    <span className="font-extrabold text-[#201e1d]">Why: </span>
                    {q.explain}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
