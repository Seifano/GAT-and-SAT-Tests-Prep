import React, { useState, useEffect } from 'react';
import { ActiveSession, Question } from '../types';
import { Clock, Flag, X, ArrowLeft, ArrowRight, Bookmark, ZoomIn, ZoomOut } from 'lucide-react';

interface ExamViewProps {
  session: ActiveSession;
  allQuestions: Question[];
  onAnswer: (index: number) => void;
  onNavigateIndex: (index: number) => void;
  onToggleFlag: () => void;
  onSubmit: () => void;
  onExit: () => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  session,
  allQuestions,
  onAnswer,
  onNavigateIndex,
  onToggleFlag,
  onSubmit,
  onExit
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [passageFontSize, setPassageFontSize] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');

  const currentQId = session.qids[session.cur];
  const currentQ = allQuestions.find(q => q.id === currentQId) || {
    id: currentQId,
    exam: session.exam,
    section: 'General',
    skill: 'General',
    prompt: 'Question could not be loaded.',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: 0,
    explain: ''
  };

  const answeredCount = Object.keys(session.answers).length;
  const totalCount = session.qids.length;
  const unansweredCount = totalCount - answeredCount;
  const flaggedCount = Object.values(session.flagged).filter(Boolean).length;
  const isFlagged = !!session.flagged[session.cur];

  const mins = Math.floor(session.timeLeft / 60);
  const secs = session.timeLeft % 60;
  const timeFormatted = `${mins}:${String(secs).padStart(2, '0')}`;
  const isTimeCritical = session.timeLeft <= 120;

  const progressPercent = (answeredCount / totalCount) * 100;
  const isBigPrompt = currentQ.skill === 'Analogy' || currentQ.skill === 'Odd One Out';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal) return;
      if (e.target && /INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;

      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) {
        onAnswer(['a', 'b', 'c', 'd'].indexOf(key));
      } else if (e.key === 'ArrowRight' && session.cur < totalCount - 1) {
        onNavigateIndex(session.cur + 1);
      } else if (e.key === 'ArrowLeft' && session.cur > 0) {
        onNavigateIndex(session.cur - 1);
      } else if (key === 'f') {
        onToggleFlag();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session.cur, totalCount, onAnswer, onNavigateIndex, onToggleFlag, showSubmitModal]);

  return (
    <div className="min-h-screen bg-[#f3f2f2] flex flex-col font-sans text-[#201e1d]">
      {/* Test Bar */}
      <header className="sticky top-0 z-30 bg-[#f3f2f2] border-b-2 border-[#201e1d]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              title="Exit exam"
              className="p-1 text-slate-700 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="font-extrabold text-sm text-[#201e1d] flex items-center gap-2">
                <span>{session.label}</span>
                <span className="text-xs bg-[#1f3d7a] text-white px-1.5 py-0.2">
                  {session.exam}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                {answeredCount} of {totalCount} answered
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Timer */}
            <div
              className={`flex items-center gap-1.5 text-lg font-black font-mono tabular-nums ${
                isTimeCritical ? 'text-[#e15b47] animate-pulse' : 'text-[#201e1d]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeFormatted}</span>
            </div>

            <button
              onClick={() => setShowNavigator(!showNavigator)}
              className="px-3 py-1.5 text-xs font-bold border border-[#201e1d]/40 bg-white hover:bg-slate-100 cursor-pointer"
            >
              {showNavigator ? 'Hide Grid' : 'Questions'}
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn-primary px-4 py-2 text-white text-xs font-black cursor-pointer"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-slate-300">
          <div
            className="h-full bg-[#1f3d7a] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-8 items-start">
        {/* Reading Passage Left Column */}
        {currentQ.passage && (
          <div className="w-full lg:w-1/2 bg-[#eae9e9] p-6 flex flex-col max-h-[calc(100vh-160px)] overflow-hidden border border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-[#1f3d7a]">
                Reading Passage
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPassageFontSize('text-sm')}
                  className={`px-2 py-1 text-xs font-bold ${passageFontSize === 'text-sm' ? 'bg-[#1f3d7a] text-white' : 'text-slate-600'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setPassageFontSize('text-base')}
                  className={`px-2 py-1 text-xs font-bold ${passageFontSize === 'text-base' ? 'bg-[#1f3d7a] text-white' : 'text-slate-600'}`}
                >
                  Aa
                </button>
                <button
                  onClick={() => setPassageFontSize('text-lg')}
                  className={`px-2 py-1 text-xs font-bold ${passageFontSize === 'text-lg' ? 'bg-[#1f3d7a] text-white' : 'text-slate-600'}`}
                >
                  A+
                </button>
              </div>
            </div>

            <div className={`overflow-y-auto pr-3 leading-relaxed text-[#201e1d] space-y-4 whitespace-pre-line font-normal ${passageFontSize}`}>
              {currentQ.passage}
            </div>
          </div>
        )}

        {/* Question + Options Column */}
        <div className={`w-full ${currentQ.passage ? 'lg:w-1/2' : 'max-w-3xl mx-auto'} space-y-6`}>
          <div>
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-bold">
              <span>Question {session.cur + 1}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{currentQ.section}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{currentQ.skill}</span>
              {currentQ.src && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-normal italic">{currentQ.src}</span>
                </>
              )}
            </div>

            {/* Prompt */}
            <div
              className={`text-[#201e1d] leading-snug mb-8 whitespace-pre-line ${
                isBigPrompt ? 'text-2xl sm:text-3xl font-black tracking-tight' : 'text-lg sm:text-xl font-bold'
              }`}
            >
              {currentQ.prompt}
            </div>

            {/* Options A-D */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = session.answers[session.cur] === oIdx;
                const letter = ['A', 'B', 'C', 'D'][oIdx];

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => onAnswer(oIdx)}
                    className={`w-full text-left p-4 border-2 transition-all flex items-center gap-4 cursor-pointer min-h-[52px] ${
                      isSelected
                        ? 'border-[#1f3d7a] bg-[#1f3d7a]/10 text-[#1f3d7a]'
                        : 'border-slate-300 bg-white hover:border-slate-400 text-[#201e1d]'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center font-extrabold text-xs shrink-0 border-2 ${
                        isSelected
                          ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white'
                          : 'border-slate-300 bg-transparent text-[#201e1d]'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-base font-semibold leading-relaxed flex-1">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="pt-6 border-t-2 border-[#201e1d]/30 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigateIndex(session.cur - 1)}
              disabled={session.cur === 0}
              className="px-4 py-2.5 border border-slate-400 bg-white hover:bg-slate-100 text-xs font-bold text-[#201e1d] disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>

            <button
              onClick={onToggleFlag}
              className={`px-4 py-2.5 border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isFlagged
                  ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white'
                  : 'border-slate-400 bg-white hover:bg-slate-100 text-[#201e1d]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
              <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
            </button>

            {session.cur === totalCount - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="btn-primary px-5 py-2.5 text-white text-xs font-black cursor-pointer"
              >
                Review &amp; submit
              </button>
            ) : (
              <button
                onClick={() => onNavigateIndex(session.cur + 1)}
                className="btn-primary px-5 py-2.5 text-white text-xs font-black flex items-center gap-2 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-2">
            Keys: A–D to answer · ← → to navigate · F to flag
          </div>
        </div>

        {/* Question Grid Navigator */}
        {showNavigator && (
          <aside className="w-full lg:w-72 bg-white border-2 border-[#201e1d]/30 p-5 shrink-0 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#201e1d]/30">
              <span className="font-extrabold text-xs text-[#201e1d] uppercase">
                Questions
              </span>
              <span className="text-xs text-slate-500">
                {answeredCount}/{totalCount}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {session.qids.map((id, idx) => {
                const isCurrent = idx === session.cur;
                const isAnswered = session.answers[idx] !== undefined;
                const flagged = !!session.flagged[idx];

                let bgStyle = 'bg-white text-[#201e1d] border-slate-300';
                if (isCurrent) {
                  bgStyle = 'bg-[#201e1d] text-white border-[#201e1d] font-black';
                } else if (isAnswered) {
                  bgStyle = 'bg-[#1f3d7a]/15 text-[#1f3d7a] border-[#1f3d7a]/30 font-bold';
                }

                return (
                  <button
                    key={id}
                    onClick={() => onNavigateIndex(idx)}
                    className={`h-10 border-2 text-xs relative flex items-center justify-center cursor-pointer transition-all ${bgStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {flagged && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#1f3d7a]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#1f3d7a]/15 border border-[#1f3d7a]" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-[#1f3d7a]" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#201e1d]" />
                <span>Current</span>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-[#201e1d]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#f3f2f2] max-w-md w-full p-6 border-2 border-[#201e1d] space-y-4">
            <h3 className="text-xl font-black text-[#201e1d]">
              Submit this {session.kind === 'mock' ? 'mock exam' : 'focus set'}?
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {unansweredCount > 0
                ? `${unansweredCount} question${unansweredCount > 1 ? 's are' : ' is'} unanswered. Unanswered questions count as incorrect, with no extra penalty.`
                : 'All questions are answered.'}
              {flaggedCount > 0 && ` ${flaggedCount} flagged for review.`}
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t-2 border-[#201e1d]/30">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-slate-400 bg-white hover:bg-slate-100 text-xs font-bold text-[#201e1d] cursor-pointer"
              >
                Keep working
              </button>
              <button
                type="button"
                onClick={onSubmit}
                className="btn-primary px-5 py-2 text-white text-xs font-black cursor-pointer"
              >
                Submit and see results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
