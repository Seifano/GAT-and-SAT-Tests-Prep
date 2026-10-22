import React, { useState } from 'react';
import { TestAttempt, Question, UserProfile } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { ArrowRight, ChevronDown, ChevronUp, RotateCcw, Award, CheckCircle2, XCircle, Calendar } from 'lucide-react';

interface ResultsViewProps {
  attempt?: TestAttempt | null;
  allAttempts?: TestAttempt[];
  allQuestions: Question[];
  profile: UserProfile;
  onRetake: () => void;
  onPracticeWeak: (skills: string[]) => void;
  onReturnDashboard: () => void;
  onRetakeMissed?: (qids: string[]) => void;
  onSelectAttempt?: (att: TestAttempt) => void;
  onNavigateToPractice?: () => void;
  onCheckKsaBooking?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  attempt,
  allAttempts = [],
  allQuestions,
  profile,
  onRetake,
  onPracticeWeak,
  onReturnDashboard,
  onRetakeMissed,
  onSelectAttempt,
  onNavigateToPractice,
  onCheckKsaBooking
}) => {
  const [filterMode, setFilterMode] = useState<'missed' | 'all' | 'flagged'>('missed');
  const [openPassageId, setOpenPassageId] = useState<string | null>(null);

  if (!attempt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1e3a8a] border border-blue-200 flex items-center justify-center mx-auto shadow-2xs">
          <Award className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">No Test Reports Yet</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            You haven't completed any test sessions yet. Take a timed mock exam or a 5-minute warmup to see your score, question-by-question breakdown, and explanations here.
          </p>
        </div>
        <button
          onClick={onReturnDashboard}
          className="px-6 py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
        >
          <span>Go to Practice Hub</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const conf = EXAM_CONFIGS[attempt.exam];
  const defaultTarget = attempt.exam === 'NAFS' ? 650 : attempt.exam === 'GAT' ? 88 : 1450;
  const target = profile.targets[attempt.exam] || defaultTarget;
  const targetDiff = target - attempt.score;
  const isGAT = attempt.exam === 'GAT';

  // Compute percentile estimate
  const getPercentile = (s: number) => {
    if (attempt.exam === 'NAFS') {
      if (s >= 700) return 98;
      if (s >= 650) return 92;
      if (s >= 600) return 85;
      if (s >= 550) return 74;
      if (s >= 500) return 60;
      if (s >= 450) return 45;
      return 30;
    }
    if (isGAT) {
      if (s >= 95) return 99;
      if (s >= 90) return 96;
      if (s >= 85) return 91;
      if (s >= 80) return 83;
      if (s >= 75) return 72;
      if (s >= 70) return 58;
      return 40;
    } else {
      if (s >= 1550) return 99;
      if (s >= 1500) return 98;
      if (s >= 1450) return 96;
      if (s >= 1400) return 93;
      if (s >= 1350) return 89;
      if (s >= 1300) return 84;
      if (s >= 1200) return 74;
      return 55;
    }
  };
  const percentile = getPercentile(attempt.score);

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
    const isFlagged = !!attempt.flagged[idx];

    return {
      index: idx + 1,
      q,
      chosenIdx,
      isSkipped,
      isCorrect,
      isFlagged
    };
  });

  const missedItems = reviewItems.filter(item => !item.isCorrect);
  const flaggedItems = reviewItems.filter(item => item.isFlagged);
  const displayedItems =
    filterMode === 'missed'
      ? missedItems
      : filterMode === 'flagged'
      ? flaggedItems
      : reviewItems;

  const weakSkills = attempt.bySkill
    .filter(s => s.correct < s.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, 3);

  const missedQIds = missedItems.map(item => item.q.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Test Attempt Switcher (if multiple attempts) */}
      {allAttempts.length > 1 && onSelectAttempt && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">Past Sessions:</span>
          {allAttempts.slice(0, 6).map(att => (
            <button
              key={att.id}
              onClick={() => onSelectAttempt(att)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                att.id === attempt.id
                  ? 'bg-[#1e3a8a] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{att.label || att.exam} · {att.score} pts ({att.date})</span>
            </button>
          ))}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 pb-5 border-b-2 border-[#201e1d]/30">
        <div className="flex-1 min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1.5">
            <span className="font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[11px]">
              {attempt.exam} Report
            </span>
            <span>·</span>
            <span>{attempt.label}</span>
            <span>·</span>
            <span className="text-slate-500 font-medium">{attempt.date}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-normal leading-snug">
            {targetDiff <= 0 ? 'Target Score Achieved!' : `${targetDiff} points from your ${target} goal.`}
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Comprehensive session diagnostic breakdown with error analysis and step-by-step rationales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={onReturnDashboard}
            className="px-4 py-2.5 border border-slate-300 rounded-xl bg-white hover:bg-slate-100 text-xs font-bold text-[#201e1d] cursor-pointer shadow-2xs"
          >
            Practice Hub
          </button>
          {missedQIds.length > 0 && onRetakeMissed && (
            <button
              onClick={() => onRetakeMissed(missedQIds)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Missed ({missedQIds.length})</span>
            </button>
          )}
          <button
            onClick={onRetake}
            className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#162c68] text-white text-xs font-black rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Session Again</span>
          </button>
          {onNavigateToPractice && (
            <button
              onClick={onNavigateToPractice}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Next Practice Drill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onCheckKsaBooking && (
            <button
              onClick={onCheckKsaBooking}
              className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] border border-blue-200 text-xs font-black rounded-xl cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Riyadh Test Dates</span>
            </button>
          )}
        </div>
      </div>

      {/* Gamification XP Reward Box */}
      <div className="bg-gradient-to-r from-[#172554] to-[#1e3a8a] text-white p-5 border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
            +{attempt.correct * 20 + attempt.total * 15 + (attempt.kind === 'mock' ? 120 : 0)}
          </div>
          <div>
            <span className="text-sm font-black block tracking-tight">Experience Points (XP) Credited!</span>
            <span className="text-xs text-slate-300">
              +{attempt.correct * 20} XP accuracy bonus · +{attempt.total * 15} XP completion{attempt.kind === 'mock' ? ' · +120 XP full mock bonus' : ''}
            </span>
          </div>
        </div>
        <div className="text-xs font-bold text-amber-300 bg-amber-400/20 px-3 py-1.5 border border-amber-400/40">
          Rank Progression Updated
        </div>
      </div>

      {/* 4 Diagnostic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-l-2 border-[#201e1d]/30 bg-white">
        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">Scaled Score</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[#1f3d7a] tracking-tight tabular-nums">
              {attempt.score}
            </span>
            <span className="text-xs text-slate-500 font-bold">/ {conf.max}</span>
          </div>
          <span className="text-xs text-slate-700 font-bold">Target: {target}</span>
        </div>

        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">Standing Rank</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-emerald-700 tracking-tight tabular-nums">
              {percentile}th
            </span>
            <span className="text-xs text-slate-500 font-bold">Percentile</span>
          </div>
          <span className="text-xs text-slate-700 font-bold">Top {100 - percentile}% national bracket</span>
        </div>

        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">Raw Accuracy</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[#201e1d] tracking-tight tabular-nums">
              {attempt.correct}<span className="text-xl font-normal text-slate-400">/{attempt.total}</span>
            </span>
            <span className="text-xs text-slate-500 font-bold">
              ({Math.round((attempt.correct / (attempt.total || 1)) * 100)}%)
            </span>
          </div>
          <span className="text-xs text-slate-700 font-bold">
            {missedItems.length} missed · {reviewItems.filter(i => i.isSkipped).length} skipped
          </span>
        </div>

        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">Pacing &amp; Speed</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[#201e1d] tracking-tight tabular-nums">
              {avgSeconds}s
            </span>
            <span className="text-xs text-slate-500 font-bold">/ question</span>
          </div>
          <span className="text-xs text-slate-700 font-bold">
            {formattedTime} total elapsed time
          </span>
        </div>
      </div>

      {/* Main Grid: Skills Diagnostic & Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Skill Breakdown Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border-b-2 border-[#201e1d]/30 pb-2">
            <h3 className="text-base font-extrabold text-[#201e1d]">Domain Performance Breakdown</h3>
          </div>

          <table className="w-full text-left text-xs border-collapse bg-white border-2 border-slate-200">
            <thead>
              <tr className="border-b-2 border-[#201e1d]/30 text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">Tested Skill</th>
                <th className="py-2.5 px-2 text-right">Correct</th>
                <th className="py-2.5 px-3 text-right">Accuracy Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attempt.bySkill.map(b => {
                const pct = Math.round((b.correct / b.total) * 100);
                return (
                  <tr key={b.skill} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-[#201e1d]">
                      {b.skill}
                      <span className="block text-[10px] text-slate-400 font-normal">{b.section}</span>
                    </td>
                    <td className="py-3 px-2 text-right font-medium">{b.correct} of {b.total}</td>
                    <td className="py-3 px-3 text-right font-black tabular-nums">
                      <span className={pct >= 75 ? 'text-emerald-700' : pct >= 50 ? 'text-[#1f3d7a]' : 'text-[#e15b47]'}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column: Recommended Next Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border-2 border-[#1f3d7a] p-6 bg-white space-y-4 shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#1f3d7a] block">
              Adaptive Next Step
            </span>
            <div className="text-2xl font-black text-[#201e1d] leading-snug">
              {weakSkills.length ? weakSkills.map(s => s.skill).join(' + ') : 'Comprehensive Review'}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Targeted focus set aimed directly at the errors made in this session to solidify retention.
            </p>
            <button
              onClick={() => onPracticeWeak(weakSkills.map(s => s.skill))}
              className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer"
            >
              <span>Practice Weakest Skills</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mistake Review Area */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#201e1d]/30 pb-3">
          <div>
            <h3 className="text-lg font-black text-[#201e1d]">Question by Question Review</h3>
            <p className="text-xs text-slate-500">Examine answer keys and comprehensive rationales</p>
          </div>

          <div className="inline-flex border border-[#201e1d]/30 bg-white">
            <button
              onClick={() => setFilterMode('missed')}
              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'missed' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-100'
              }`}
            >
              Missed ({missedItems.length})
            </button>
            <button
              onClick={() => setFilterMode('flagged')}
              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'flagged' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-100'
              }`}
            >
              Flagged ({flaggedItems.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-100'
              }`}
            >
              All ({reviewItems.length})
            </button>
          </div>
        </div>

        {displayedItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#201e1d] bg-white border border-slate-200">
            No questions match the current filter.
          </div>
        ) : (
          <div className="space-y-6 divide-y divide-slate-300">
            {displayedItems.map((item, idx) => {
              const { q, chosenIdx, isCorrect, isSkipped, isFlagged } = item;
              const isPassageOpen = openPassageId === q.id;

              return (
                <div key={q.id} className={idx > 0 ? 'pt-6' : ''}>
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className="font-extrabold text-[#201e1d]">Question {item.index}</span>
                    <span
                      className={`font-black text-[11px] px-2 py-0.5 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-50 text-red-900 border border-red-300'
                      }`}
                    >
                      {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                    </span>
                    {isFlagged && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 border border-amber-300">
                        Flagged
                      </span>
                    )}
                    <span className="text-slate-500">· {q.section} · {q.skill}</span>
                  </div>

                  {q.passage && (
                    <div className="mb-2">
                      <button
                        onClick={() => setOpenPassageId(isPassageOpen ? null : q.id)}
                        className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>{isPassageOpen ? 'Hide reading passage' : 'Show reading passage'}</span>
                        {isPassageOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isPassageOpen && (
                        <div className="mt-2 p-4 bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 max-h-60 overflow-y-auto whitespace-pre-line">
                          {q.passage}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-base font-bold text-[#201e1d] mb-3 whitespace-pre-line break-normal leading-relaxed">
                    {q.prompt}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 border-t-2 border-l-2 border-[#201e1d]/30 max-w-xl mb-3 bg-white shadow-2xs">
                    <div className="p-3.5 border-r-2 border-b-2 border-[#201e1d]/30 text-xs">
                      <div className="text-[11px] text-slate-500 font-bold mb-0.5">Your Selected Answer</div>
                      <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-[#e15b47] font-bold'}>
                        {isSkipped ? 'No answer provided' : `ABCD`[chosenIdx] + ') ' + q.options[chosenIdx]}
                      </span>
                    </div>
                    <div className="p-3.5 border-r-2 border-b-2 border-[#201e1d]/30 text-xs">
                      <div className="text-[11px] text-slate-500 font-bold mb-0.5">Correct Answer</div>
                      <span className="font-extrabold text-[#201e1d]">
                        {`ABCD`[q.answer] + ') ' + q.options[q.answer]}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-100/90 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed max-w-3xl shadow-2xs">
                    <span className="font-black text-[#1f3d7a] block mb-1">Step-by-Step Rationale: </span>
                    <p className="whitespace-pre-line break-normal">{q.explain}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Bar for Student after completing question review */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200 bg-slate-50 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">
              Finished reviewing your explanations?
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Reinforce what you learned right now or jump to the next curriculum topic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onRetake}
              className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#162c68] text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Again</span>
            </button>
            {onNavigateToPractice && (
              <button
                type="button"
                onClick={onNavigateToPractice}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Move to Next Practice Drill</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onCheckKsaBooking && (
              <button
                type="button"
                onClick={onCheckKsaBooking}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] border border-blue-200 text-xs font-black rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Riyadh Test Dates</span>
              </button>
            )}
            <button
              type="button"
              onClick={onReturnDashboard}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
