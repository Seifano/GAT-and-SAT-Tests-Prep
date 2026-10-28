import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ActiveSession, Question } from '../types';
import { Clock, X, ArrowRight, Bookmark, BookOpen, Calculator, Strikethrough, Sparkles, CheckCircle2, XCircle, Grid } from 'lucide-react';
import { ReferenceSheetModal } from './tools/ReferenceSheetModal';
import { CalculatorModal } from './tools/CalculatorModal';
import { playCorrectSound, playIncorrectSound } from '../utils/soundEffects';
import { getQuestionDifficulty, getDifficultyBadgeColor } from '../utils/difficulty';

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
  const [showRefSheet, setShowRefSheet] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, boolean>>({});
  const [passageFontSize, setPassageFontSize] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');
  const [gamifiedFeedback, setGamifiedFeedback] = useState<{ isCorrect: boolean; qid: string } | null>(null);

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

  const handleOptionSelect = (oIdx: number) => {
    if (eliminatedOptions[oIdx]) return;
    onAnswer(oIdx);
    const isCorrect = oIdx === currentQ.answer;
    if (isCorrect) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
    setGamifiedFeedback({ isCorrect, qid: currentQ.id });
    setTimeout(() => {
      setGamifiedFeedback(prev => (prev?.qid === currentQ.id ? null : prev));
    }, 1500);
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
  const isTimeWarning = session.timeLeft <= 300 && session.timeLeft > 120;

  const progressPercent = (answeredCount / totalCount) * 100;
  const isBigPrompt = currentQ.skill === 'Analogy' || currentQ.skill === 'Odd One Out';

  // Toggle option strikethrough (eliminator)
  const toggleEliminate = (e: React.MouseEvent, oIdx: number) => {
    e.stopPropagation();
    setEliminatedOptions(prev => ({
      ...prev,
      [oIdx]: !prev[oIdx]
    }));
  };

  // Reset eliminated options when question changes
  useEffect(() => {
    setEliminatedOptions({});
  }, [session.cur]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || showCalculator || showRefSheet) return;
      if (e.target && /INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;

      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) {
        handleOptionSelect(['a', 'b', 'c', 'd'].indexOf(key));
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
  }, [session.cur, totalCount, onNavigateIndex, onToggleFlag, showSubmitModal, showCalculator, showRefSheet, currentQ, eliminatedOptions]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Test Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={onExit}
              title="Exit exam"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2 min-w-0">
                <span className="truncate max-w-[130px] sm:max-w-[220px] md:max-w-xs">{session.label}</span>
                <span className={`text-[10px] sm:text-xs text-white px-2 py-0.5 rounded-md font-black shrink-0 ${
                  session.exam === 'SAT' ? 'bg-indigo-600' : session.exam === 'GAT' ? 'bg-rose-600' : 'bg-emerald-600'
                }`}>
                  {session.exam}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate mt-0.5">
                {answeredCount}/{totalCount} answered · Question {session.cur + 1}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Built-in Exam Tools */}
            {session.exam === 'SAT' ? (
              <button
                onClick={() => setShowCalculator(true)}
                title="Open Official Desmos Graphing Calculator for SAT Math"
                className="px-3 py-1.5 text-xs font-black border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-xl transition-all"
              >
                <div className="w-4 h-4 rounded bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  D
                </div>
                <span className="hidden sm:inline">Desmos Calculator</span>
                <span className="sm:hidden">Desmos</span>
              </button>
            ) : (
              <button
                onClick={() => setShowCalculator(true)}
                title="Open Scientific Calculator"
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 rounded-xl shadow-2xs text-slate-700"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Calculator</span>
              </button>
            )}

            <button
              onClick={() => setShowRefSheet(true)}
              title="Open Official Math Reference Sheet"
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 rounded-xl shadow-2xs text-slate-700"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Reference</span>
            </button>

            {/* Countdown Timer with color transitions */}
            <div
              className={`flex items-center gap-1.5 text-sm sm:text-base font-black font-mono tabular-nums px-3 py-1 rounded-xl shadow-2xs ${
                isTimeCritical
                  ? 'text-rose-700 bg-rose-50 border border-rose-300 animate-pulse'
                  : isTimeWarning
                  ? 'text-amber-800 bg-amber-50 border border-amber-300'
                  : 'text-slate-800 bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeFormatted}</span>
            </div>

            <button
              onClick={() => setShowNavigator(!showNavigator)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 rounded-xl cursor-pointer shadow-2xs text-slate-700 flex items-center gap-1.5"
            >
              <Grid className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">{showNavigator ? 'Hide Grid' : 'Questions'}</span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn-primary px-4 py-1.5 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100">
          <div
            className={`h-full transition-all duration-300 ${
              session.exam === 'SAT' ? 'bg-indigo-600' : session.exam === 'GAT' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* Reading Passage Left Column */}
        {currentQ.passage && (
          <div className="w-full lg:w-1/2 bg-white p-6 sm:p-7 rounded-3xl flex flex-col max-h-[calc(100vh-160px)] overflow-hidden border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                Reading Passage
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPassageFontSize('text-sm')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors cursor-pointer ${passageFontSize === 'text-sm' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setPassageFontSize('text-base')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors cursor-pointer ${passageFontSize === 'text-base' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'}`}
                >
                  Aa
                </button>
                <button
                  onClick={() => setPassageFontSize('text-lg')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors cursor-pointer ${passageFontSize === 'text-lg' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'}`}
                >
                  A+
                </button>
              </div>
            </div>

            <div className={`overflow-y-auto pr-3 leading-relaxed text-slate-800 space-y-4 whitespace-pre-line font-normal ${passageFontSize}`}>
              {currentQ.passage}
            </div>
          </div>
        )}

        {/* Question + Options Column */}
        <div className={`w-full ${currentQ.passage ? 'lg:w-1/2' : 'max-w-3xl mx-auto'} bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6`}>
          <div>
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900">Question {session.cur + 1} of {totalCount}</span>
              <span className="text-slate-300">·</span>
              <span>{currentQ.section}</span>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-700 font-bold">{currentQ.skill}</span>
              <span className="text-slate-300">·</span>
              {(() => {
                const qDiff = getQuestionDifficulty(currentQ);
                const b = getDifficultyBadgeColor(qDiff);
                return (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${b.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                    <span>{qDiff}</span>
                  </span>
                );
              })()}
              <span className="text-slate-300">·</span>
              <span className="text-[10px] text-emerald-800 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +25 XP for correct
              </span>

              {session.exam === 'SAT' && (
                <button
                  type="button"
                  onClick={() => setShowCalculator(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full cursor-pointer transition-all shadow-2xs"
                  title="Open Desmos Graphing Calculator"
                >
                  <span className="w-3.5 h-3.5 rounded bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center">
                    D
                  </span>
                  <span>Desmos Graphing</span>
                </button>
              )}
            </div>

            {/* Gamified Feedback Animation Badge */}
            {gamifiedFeedback && gamifiedFeedback.qid === currentQ.id && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-md animate-bounce mb-3 ${
                  gamifiedFeedback.isCorrect
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{gamifiedFeedback.isCorrect ? 'Correct! +25 XP' : 'Answer Logged'}</span>
              </div>
            )}

            {/* Figure / Graph / Diagram if attached */}
            {currentQ.figureSvg && (
              <div 
                className="my-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs overflow-x-auto flex flex-col items-center justify-center transition-all"
                dangerouslySetInnerHTML={{ __html: currentQ.figureSvg }}
              />
            )}

            {/* Prompt */}
            <div
              className={`text-slate-900 leading-snug mb-8 whitespace-pre-line ${
                isBigPrompt ? 'text-2xl sm:text-3xl font-black tracking-tight' : 'text-lg sm:text-xl font-bold'
              }`}
            >
              {currentQ.prompt}
            </div>

            {/* Options A-D with Strikethrough Eliminator */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = session.answers[session.cur] === oIdx;
                const isEliminated = !!eliminatedOptions[oIdx];
                const letter = ['A', 'B', 'C', 'D'][oIdx];

                return (
                  <div
                    key={oIdx}
                    onClick={() => {
                      if (!isEliminated) handleOptionSelect(oIdx);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer min-h-[56px] ${
                      isEliminated
                        ? 'opacity-35 bg-slate-100 border-slate-200 line-through'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs ring-1 ring-indigo-500/30'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60 hover:shadow-2xs text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className={`text-base font-semibold leading-relaxed flex-1 ${isEliminated ? 'line-through text-slate-400' : ''}`}>
                        {opt}
                      </span>
                    </div>

                    {/* Strikethrough Eliminator button */}
                    <button
                      type="button"
                      onClick={(e) => toggleEliminate(e, oIdx)}
                      title={isEliminated ? 'Restore option' : 'Cross out / eliminate option'}
                      className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isEliminated
                          ? 'bg-slate-200 text-slate-800'
                          : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Immediate Explanation on Incorrect / Selected Answer */}
            {session.answers[session.cur] !== undefined && (
              session.answers[session.cur] !== currentQ.answer ? (
                <div className="mb-8 p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-viewFadeIn shadow-2xs">
                  <div className="flex items-center justify-between gap-2 border-b border-rose-200 pb-2.5">
                    <div className="flex items-center gap-2 text-xs font-black text-rose-950">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Incorrect Choice — Solution Rationale</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 shrink-0">
                      Curriculum Standard
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-rose-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Your Selection:</span>
                      <span className="font-bold text-rose-700">
                        Option {['A', 'B', 'C', 'D'][session.answers[session.cur]]}: "{currentQ.options[session.answers[session.cur]]}"
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-emerald-300">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Correct Answer:</span>
                      <span className="font-black text-emerald-800">
                        Option {['A', 'B', 'C', 'D'][currentQ.answer]}: "{currentQ.options[currentQ.answer]}"
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 text-xs text-slate-800 leading-relaxed bg-white/90 p-3.5 rounded-xl border border-rose-100">
                    <strong className="text-indigo-900 block mb-1 font-black">
                      Step-by-Step Educational Explanation:
                    </strong>
                    <p className="whitespace-pre-line font-medium text-slate-700">
                      {currentQ.explain && currentQ.explain.trim() !== 'No explanation provided.'
                        ? currentQ.explain
                        : `Option ${['A', 'B', 'C', 'D'][currentQ.answer]} ("${currentQ.options[currentQ.answer]}") is the verified correct answer according to official curriculum standards for ${currentQ.skill}. Option ${['A', 'B', 'C', 'D'][session.answers[session.cur]]} is incorrect.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 animate-viewFadeIn">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Correct Answer! Solution Breakdown</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-emerald-100">
                    {currentQ.explain && currentQ.explain.trim() !== 'No explanation provided.'
                      ? currentQ.explain
                      : `Option ${['A', 'B', 'C', 'D'][currentQ.answer]} ("${currentQ.options[currentQ.answer]}") is verified correct for ${currentQ.skill}.`}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Navigation Controls Bar */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigateIndex(session.cur - 1)}
              disabled={session.cur === 0}
              className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl disabled:opacity-40 cursor-pointer shadow-2xs transition-colors"
            >
              Previous
            </button>

            <button
              onClick={onToggleFlag}
              className={`px-4 py-2.5 border text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
                isFlagged
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
              <span>{isFlagged ? 'Flagged for Review' : 'Mark for Review'}</span>
            </button>

            {session.cur === totalCount - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="btn-primary px-5 py-2.5 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all"
              >
                Review &amp; Submit
              </button>
            ) : (
              <button
                onClick={() => onNavigateIndex(session.cur + 1)}
                className="btn-primary px-5 py-2.5 text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between">
            <span>Keys: A–D to choose answer · ← → to navigate · F to flag</span>
            <span>Click strikethrough icon to eliminate wrong choices</span>
          </div>
        </div>

        {/* Question Grid Navigator */}
        {showNavigator && (
          <aside className="w-full lg:w-72 bg-white border border-slate-200 p-5 rounded-3xl shrink-0 space-y-4 shadow-sm animate-viewFadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-black text-xs text-slate-900 uppercase tracking-wider">
                Question Grid
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {answeredCount}/{totalCount} Completed
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {session.qids.map((id, idx) => {
                const isCurrent = idx === session.cur;
                const isAnswered = session.answers[idx] !== undefined;
                const flagged = !!session.flagged[idx];

                let bgStyle = 'bg-white text-slate-700 border-slate-200 hover:border-slate-300';
                if (isCurrent) {
                  bgStyle = 'bg-slate-900 text-white border-slate-900 font-black shadow-xs';
                } else if (isAnswered) {
                  bgStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
                }

                return (
                  <button
                    key={id}
                    onClick={() => onNavigateIndex(idx)}
                    className={`h-10 border rounded-xl text-xs relative flex items-center justify-center cursor-pointer transition-all ${bgStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {flagged && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-300" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-900" />
                <span>Current</span>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Built-in Reference Sheet Modal */}
      <ReferenceSheetModal
        exam={session.exam}
        isOpen={showRefSheet}
        onClose={() => setShowRefSheet(false)}
      />

      {/* Built-in Calculator Modal */}
      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        exam={session.exam}
      />

      {/* Submit Confirmation Modal */}
      {showSubmitModal && createPortal(
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 space-y-4 shadow-2xl animate-viewFadeIn">
            <h3 className="text-xl font-black text-slate-900">
              Submit this {session.kind === 'mock' ? 'mock exam' : 'practice session'}?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {unansweredCount > 0
                ? `${unansweredCount} question${unansweredCount > 1 ? 's are' : ' is'} unanswered. In official scoring, unanswered questions count as incorrect.`
                : 'All questions have been answered.'}
              {flaggedCount > 0 && ` ${flaggedCount} marked for review.`}
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
              >
                Keep working
              </button>
              <button
                type="button"
                onClick={onSubmit}
                className="btn-primary px-5 py-2 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all"
              >
                Submit and View Diagnostics
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
