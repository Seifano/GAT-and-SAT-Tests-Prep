import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Question, ExamType, UserAccount, TestAttempt, DifficultyLevel } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { getQuestionDifficulty, getDifficultyBadgeColor } from '../utils/difficulty';
import {
  Search,
  Filter,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  RotateCcw,
  Award,
  Check
} from 'lucide-react';
import { CalculatorModal } from './tools/CalculatorModal';
import { saveAttemptToDb } from '../firebase';
import {
  playCorrectSound,
  playIncorrectSound,
  playCelebrationSound,
  isSoundEnabled,
  toggleSound
} from '../utils/soundEffects';

interface QuestionBrowserViewProps {
  activeExam: ExamType;
  bank: Record<ExamType, Question[]>;
  currentUser?: UserAccount | null;
  onSelectExam?: (exam: ExamType) => void;
  isStudent?: boolean;
  onGoBackToMainMenu?: () => void;
}

export const QuestionBrowserView: React.FC<QuestionBrowserViewProps> = ({
  activeExam,
  bank,
  currentUser,
  onSelectExam,
  isStudent = false,
  onGoBackToMainMenu
}) => {
  const [skillFilter, setSkillFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [openPassageId, setOpenPassageId] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // Gamified interactive state
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [animatingQId, setAnimatingQId] = useState<string | null>(null);
  const [animationFeedback, setAnimationFeedback] = useState<{ qid: string; isCorrect: boolean } | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [recordedAttempt, setRecordedAttempt] = useState<TestAttempt | null>(null);
  const [showMasteryModal, setShowMasteryModal] = useState(false);

  const studentLevel = currentUser?.studentLevel;
  const isActualStudent = currentUser?.role === 'Student' || isStudent;

  // Filter questions bank based on grade level access:
  // - Grade 6: only Grade 6 NAFS questions
  // - Grade 9: only Grade 9 NAFS questions
  // - High School: SAT and GAT questions
  const getDisplayQuestions = (): Question[] => {
    const rawBank = bank[activeExam] || [];
    if (!currentUser || currentUser.role !== 'Student') {
      return rawBank;
    }

    if (activeExam === 'NAFS') {
      if (studentLevel === 'Grade 6') {
        return rawBank.filter(q => q.section.includes('Grade 6') || q.section.includes('G6'));
      }
      if (studentLevel === 'Grade 9') {
        return rawBank.filter(q => q.section.includes('Grade 9') || q.section.includes('G9'));
      }
      return []; // High School denied NAFS
    }

    if (activeExam === 'GAT' || activeExam === 'SAT') {
      if (studentLevel === 'Grade 6' || studentLevel === 'Grade 9') {
        return []; // Grade 6 & 9 denied SAT/GAT
      }
    }

    return rawBank;
  };

  const questions = getDisplayQuestions();
  const conf = EXAM_CONFIGS[activeExam];

  // Restrict visible skills list for Grade 6 & 9 in NAFS with deduplication
  const allSkills = (() => {
    if (currentUser?.role === 'Student' && activeExam === 'NAFS') {
      if (studentLevel === 'Grade 6') {
        const sec = conf.sections.find(s => s.name.includes('Grade 6') || s.name.includes('G6'));
        return sec ? Array.from(new Set(sec.skills)) : Array.from(new Set(conf.sections.flatMap(s => s.skills)));
      }
      if (studentLevel === 'Grade 9') {
        const sec = conf.sections.find(s => s.name.includes('Grade 9') || s.name.includes('G9'));
        return sec ? Array.from(new Set(sec.skills)) : Array.from(new Set(conf.sections.flatMap(s => s.skills)));
      }
    }
    return Array.from(new Set(conf.sections.flatMap(s => s.skills)));
  })();

  const toggleSolution = (id: string) => {
    setRevealedSolutions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = questions.filter(q => {
    const matchSkill = skillFilter === 'All' || q.skill === skillFilter;
    const matchDifficulty = difficultyFilter === 'All' || getQuestionDifficulty(q) === difficultyFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (q.prompt + ' ' + (q.passage || '') + ' ' + q.options.join(' ')).toLowerCase().includes(term);
    return matchSkill && matchDifficulty && matchSearch;
  });

  const answeredFilteredCount = filtered.filter(q => userAnswers[q.id] !== undefined).length;
  const correctFilteredCount = filtered.filter(q => userAnswers[q.id] === q.answer).length;
  const currentAccuracy = answeredFilteredCount > 0
    ? Math.round((correctFilteredCount / answeredFilteredCount) * 100)
    : 0;

  const areAllRevealed = filtered.length > 0 && filtered.every(q => !!revealedSolutions[q.id]);

  const toggleAllSolutions = () => {
    if (areAllRevealed) {
      setRevealedSolutions({});
    } else {
      const all: Record<string, boolean> = {};
      filtered.forEach(q => {
        all[q.id] = true;
      });
      setRevealedSolutions(all);
    }
  };

  const handleToggleSound = () => {
    const nextState = toggleSound();
    setSoundOn(nextState);
  };

  // Immediate feedback on option click
  const handleSelectOption = (q: Question, optIdx: number) => {
    const isCorrect = optIdx === q.answer;
    const nextAnswers = { ...userAnswers, [q.id]: optIdx };
    setUserAnswers(nextAnswers);

    // Auto-reveal explanation immediately
    setRevealedSolutions(prev => ({ ...prev, [q.id]: true }));

    // Sound effect
    if (isCorrect) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }

    // Gamified visual feedback animation
    setAnimatingQId(q.id);
    setAnimationFeedback({ qid: q.id, isCorrect });
    setTimeout(() => {
      setAnimatingQId(prev => (prev === q.id ? null : prev));
      setAnimationFeedback(prev => (prev?.qid === q.id ? null : prev));
    }, 1800);

    // Check if ALL filtered questions are answered
    const totalAnswered = filtered.filter(item => nextAnswers[item.id] !== undefined).length;
    if (totalAnswered === filtered.length && filtered.length > 0) {
      const correctCount = filtered.filter(item => nextAnswers[item.id] === item.answer).length;
      const totalCount = filtered.length;
      const score = Math.round((correctCount / totalCount) * 100);

      const skillStats: Record<string, { skill: string; section: string; correct: number; total: number }> = {};
      filtered.forEach(item => {
        if (!skillStats[item.skill]) {
          skillStats[item.skill] = { skill: item.skill, section: item.section, correct: 0, total: 0 };
        }
        skillStats[item.skill].total++;
        if (nextAnswers[item.id] === item.answer) {
          skillStats[item.skill].correct++;
        }
      });

      const attemptObj: TestAttempt = {
        id: `bank-attempt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        username: currentUser?.username || 'user',
        exam: activeExam,
        kind: 'quick',
        label: `${activeExam} Question Bank Drill (${skillFilter === 'All' ? 'All Skills' : skillFilter})`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: Date.now(),
        hour: new Date().getHours(),
        score,
        correct: correctCount,
        total: totalCount,
        timeUsed: Math.max(30, totalCount * 25),
        bySkill: Object.values(skillStats),
        answers: filtered.reduce((acc, item, i) => {
          acc[i] = nextAnswers[item.id];
          return acc;
        }, {} as Record<number, number>),
        flagged: {},
        qids: filtered.map(item => item.id)
      };

      setRecordedAttempt(attemptObj);
      saveAttemptToDb(attemptObj).catch(err => console.error('Failed to save attempt to db:', err));
      playCelebrationSound();
      setShowMasteryModal(true);
    }
  };

  const handleResetMastery = () => {
    setUserAnswers({});
    setRevealedSolutions({});
    setShowMasteryModal(false);
  };

  // Allowed exams for staff vs student
  const allowedExams: ExamType[] = (() => {
    if (!currentUser || currentUser.role !== 'Student') {
      return ['NAFS', 'GAT', 'SAT'];
    }
    if (studentLevel === 'High School') {
      return ['GAT', 'SAT'];
    }
    return ['NAFS'];
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-indigo-700 mb-1">
            Question Bank Library &amp; Interactive Trainer
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight break-words">
            Browse &amp; Study {activeExam} Questions
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mt-1.5 leading-relaxed break-words">
            Click any option for instant True/False feedback, solution rationale, and sound effects. Complete all questions to record your mastery in the cloud database!
          </p>
        </div>

        {/* Exam Toggle / Locked Track Display */}
        {isActualStudent ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {allowedExams.length > 1 ? (
              <div className="inline-flex border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-2xs p-1">
                {allowedExams.map(e => (
                  <button
                    key={e}
                    onClick={() => {
                      onSelectExam?.(e);
                      setSkillFilter('All');
                    }}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      activeExam === e ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {e} ({bank[e]?.length || 0})
                  </button>
                ))}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Track:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-2xs ${
                    activeExam === 'NAFS' ? 'bg-emerald-600' : activeExam === 'GAT' ? 'bg-rose-600' : 'bg-indigo-600'
                  }`}
                >
                  {activeExam} {studentLevel ? `(${studentLevel})` : ''} · {questions.length} Qs
                </span>
              </div>
            )}

            {onGoBackToMainMenu && (
              <button
                onClick={onGoBackToMainMenu}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer"
                title="Return to Main Menu to select a different track"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch Track</span>
              </button>
            )}
          </div>
        ) : (
          <div className="inline-flex border border-slate-200 bg-white p-1 rounded-2xl shadow-2xs shrink-0">
            {(['NAFS', 'GAT', 'SAT'] as ExamType[]).map(e => (
              <button
                key={e}
                onClick={() => {
                  onSelectExam?.(e);
                  setSkillFilter('All');
                }}
                className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  activeExam === e ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {e} ({bank[e]?.length || 0})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Progress & Gamification Stats Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 flex items-center gap-2">
              <span>Interactive Progress:</span>
              <span className="text-indigo-700 font-black">{answeredFilteredCount} / {filtered.length} answered</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Accuracy: <strong className={currentAccuracy >= 80 ? 'text-emerald-700 font-black' : 'text-slate-700 font-bold'}>{currentAccuracy}%</strong>
              {answeredFilteredCount > 0 && ` (${correctFilteredCount} correct)`}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full md:w-64 flex-1 max-w-xs">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${filtered.length > 0 ? (answeredFilteredCount / filtered.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Control Buttons: Sound, Reset, Calc */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleToggleSound}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              soundOn
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={soundOn ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Enable)'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{soundOn ? 'Sound On' : 'Muted'}</span>
          </button>

          {answeredFilteredCount > 0 && (
            <button
              type="button"
              onClick={handleResetMastery}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-all"
              title="Clear answers and practice this question set again"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCalculator(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-black text-emerald-950 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
            title="Open Calculator"
          >
            <div className="w-3.5 h-3.5 rounded bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center">
              D
            </div>
            <span>{activeExam === 'SAT' ? 'Desmos Graphing' : 'Calculator'}</span>
          </button>
        </div>
      </div>

      {/* Grade Level Access Notice Banner for Students */}
      {isActualStudent && studentLevel && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
            studentLevel === 'Grade 6'
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
              : studentLevel === 'Grade 9'
              ? 'bg-teal-50/80 border-teal-300 text-teal-900'
              : 'bg-blue-50/80 border-blue-300 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wide">
                Enrolled: {studentLevel} {currentUser?.studentClass ? `(Class ${currentUser.studentClass})` : ''}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">
                {studentLevel === 'Grade 6'
                  ? 'Showing verified Grade 6 NAFS questions. GAT, SAT, and Grade 9 questions are restricted.'
                  : studentLevel === 'Grade 9'
                  ? 'Showing verified Grade 9 NAFS questions. GAT, SAT, and Grade 6 questions are restricted.'
                  : 'High School curriculum: GAT & SAT question banks enabled. NAFS primary/middle assessments restricted.'}
              </p>
            </div>
          </div>
          <span className="font-black text-xs px-2.5 py-1 rounded-full bg-white/80 border shadow-2xs shrink-0">
            {questions.length} Items Available
          </span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search questions by topic, words, or passage..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-[#201e1d] focus:outline-none focus:border-indigo-600 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value as DifficultyLevel | 'All')}
            className="select-modern text-xs font-bold w-full sm:w-auto shrink-0"
          >
            <option value="All">All Difficulties ({questions.length})</option>
            <option value="Easy">Easy Mode (Green)</option>
            <option value="Medium">Medium Mode (Navy)</option>
            <option value="Hard">Hard Mode (Crimson)</option>
          </select>

          <select
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="select-modern text-xs font-bold w-full sm:w-auto shrink-0"
          >
            <option value="All">All skills ({questions.length})</option>
            {allSkills.map(s => (
              <option key={s} value={s}>
                {s} ({questions.filter(q => q.skill === s).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-bold">
          <span>
            Showing {filtered.length} of {questions.length} questions
            {answeredFilteredCount > 0 && ` · ${answeredFilteredCount} answered`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAllSolutions}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-[#1f3d7a] cursor-pointer shadow-2xs transition-colors"
            >
              {areAllRevealed ? 'Hide All Explanations' : 'Show All Explanations'}
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-slate-300 rounded-2xl space-y-2">
            <h3 className="font-bold text-sm text-[#201e1d]">No questions match your search</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or skill filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((q, idx) => {
              const isRevealed = !!revealedSolutions[q.id];
              const isPassageOpen = openPassageId === q.id;
              const hasAnswered = userAnswers[q.id] !== undefined;
              const selectedOption = userAnswers[q.id];
              const isUserCorrect = hasAnswered && selectedOption === q.answer;
              const isAnimating = animatingQId === q.id;

              return (
                <div
                  key={q.id}
                  className={`p-6 bg-white border-2 rounded-2xl space-y-4 shadow-2xs transition-all duration-200 ${
                    isAnimating && isUserCorrect
                      ? 'border-emerald-500 ring-2 ring-emerald-300 scale-[1.005]'
                      : isAnimating && !isUserCorrect
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : hasAnswered
                      ? isUserCorrect
                        ? 'border-emerald-400/70'
                        : 'border-rose-300'
                      : 'border-[#201e1d]/30'
                  }`}
                >
                  {/* Metadata & Interactive Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-[#1f3d7a]">#{idx + 1}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          q.section.includes('Grade 6')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : q.section.includes('Grade 9')
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {q.section}
                      </span>
                      <span className="text-slate-600">· {q.skill}</span>
                      {(() => {
                        const qDiff = getQuestionDifficulty(q);
                        const b = getDifficultyBadgeColor(qDiff);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${b.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                            <span>{qDiff}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Live Gamified Badge */}
                      {isAnimating && (
                        <div
                          className={`animate-bounce px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm ${
                            isUserCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {isUserCorrect ? (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>+10 XP · Correct!</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Incorrect · Review Rationale</span>
                            </>
                          )}
                        </div>
                      )}

                      {!isAnimating && hasAnswered && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 ${
                            isUserCorrect
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {isUserCorrect ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{isUserCorrect ? 'Correct' : 'Needs Review'}</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleSolution(q.id)}
                        className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
                      >
                        {isRevealed ? 'Hide solution' : 'Show solution & explanation'}
                      </button>
                    </div>
                  </div>

                  {/* Reading Passage if attached */}
                  {q.passage && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setOpenPassageId(isPassageOpen ? null : q.id)}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-[#1f3d7a]" />
                          <span>Reading Passage for Question #{idx + 1}</span>
                        </div>
                        {isPassageOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isPassageOpen && (
                        <div className="p-4 bg-white text-xs text-slate-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap border-t border-slate-200">
                          {q.passage}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Figure / Graph / Diagram if attached */}
                  {q.figureSvg && (
                    <div 
                      className="my-3 p-3 bg-white border border-slate-300 rounded-xl shadow-xs overflow-x-auto flex flex-col items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: q.figureSvg }}
                    />
                  )}

                  {/* Question Prompt */}
                  <div className="text-sm font-bold text-[#201e1d] leading-relaxed whitespace-pre-wrap">
                    {q.prompt}
                  </div>

                  {/* Interactive Options List (Instant feedback on click) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected = hasAnswered && selectedOption === optIdx;
                      const isCorrect = isRevealed && optIdx === q.answer;
                      const isWrongSelection = isSelected && !isCorrect;

                      let containerStyle =
                        'bg-white border-slate-200 hover:border-[#1f3d7a] hover:bg-slate-50 text-slate-800';
                      let letterStyle = 'bg-slate-100 text-slate-700';

                      if (hasAnswered) {
                        if (isCorrect) {
                          containerStyle =
                            'bg-emerald-50/90 border-emerald-500 font-bold text-emerald-950 ring-1 ring-emerald-400 shadow-xs';
                          letterStyle = 'bg-emerald-600 text-white font-black';
                        } else if (isWrongSelection) {
                          containerStyle =
                            'bg-rose-50 border-rose-400 font-bold text-rose-950 ring-1 ring-rose-300';
                          letterStyle = 'bg-rose-600 text-white font-black';
                        } else {
                          containerStyle = 'bg-slate-50/60 border-slate-200 text-slate-500 opacity-70';
                          letterStyle = 'bg-slate-200 text-slate-600';
                        }
                      } else if (isRevealed && isCorrect) {
                        containerStyle =
                          'bg-emerald-50 border-emerald-500 font-bold text-emerald-950';
                        letterStyle = 'bg-emerald-600 text-white font-black';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(q, optIdx)}
                          className={`p-3 border-2 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left ${containerStyle}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${letterStyle}`}
                          >
                            {letter}
                          </span>
                          <span className="text-xs leading-snug flex-1">{opt}</span>

                          {/* Status Indicator */}
                          {hasAnswered && isCorrect && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded ml-auto shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Correct</span>
                            </span>
                          )}
                          {hasAnswered && isWrongSelection && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded ml-auto shrink-0">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Your Choice</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Solution Rationale & Diagnostic Box */}
                  {isRevealed && (
                    hasAnswered && !isUserCorrect ? (
                      <div className="p-4 bg-rose-50/90 border-2 border-rose-300 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between gap-2 border-b border-rose-200/80 pb-2">
                          <div className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Incorrect Answer — Solution Rationale &amp; Error Diagnostic</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900 shrink-0">
                            Review Concept
                          </span>
                        </div>

                        {/* Choice vs Correct Comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-white border border-rose-300">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Your Choice:</span>
                            <span className="font-bold text-rose-700">
                              Option {String.fromCharCode(65 + selectedOption)}: "{q.options[selectedOption]}"
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-emerald-400">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Correct Answer:</span>
                            <span className="font-extrabold text-emerald-800">
                              Option {String.fromCharCode(65 + q.answer)}: "{q.options[q.answer]}"
                            </span>
                          </div>
                        </div>

                        {/* Detailed Step-by-Step Explanation */}
                        <div className="pt-1">
                          <span className="text-[11px] font-black text-rose-950 uppercase tracking-wide block mb-1">
                            Why your choice was incorrect &amp; How to solve:
                          </span>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white/70 p-3 rounded-lg border border-rose-200">
                            {q.explain && q.explain.trim() !== 'No explanation provided.'
                              ? q.explain
                              : `Option ${String.fromCharCode(65 + q.answer)} ("${q.options[q.answer]}") is the verified standard answer based on the curriculum criteria for ${q.skill}. Option ${String.fromCharCode(65 + selectedOption)} is incorrect because it does not satisfy the requirements of ${q.section}.`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in duration-150">
                        <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            {hasAnswered && isUserCorrect ? 'Correct! Solution Breakdown & Concept Notes' : `Correct Answer: Option ${String.fromCharCode(65 + q.answer)}`}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-950 leading-relaxed font-medium bg-white/60 p-3 rounded-lg border border-emerald-200">
                          {q.explain && q.explain.trim() !== 'No explanation provided.'
                            ? q.explain
                            : `Option ${String.fromCharCode(65 + q.answer)} ("${q.options[q.answer]}") is the verified correct answer based on the curriculum standard for ${q.skill}.`}
                        </p>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Built-in Calculator / Desmos Modal */}
      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        exam={activeExam}
      />

      {/* Mastery & Performance Summary Modal (Auto-pops when all questions in view are answered) */}
      {showMasteryModal &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border-2 border-[#201e1d] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-amber-100 border-2 border-amber-400 rounded-full mx-auto flex items-center justify-center shadow-md animate-bounce">
                  <Trophy className="w-8 h-8 text-amber-600" />
                </div>
                <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a]">
                  Practice Set Completed · Recorded to Database
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#201e1d]">
                  {recordedAttempt && recordedAttempt.score >= 80 ? 'Mastery Achieved! 🎉' : 'Practice Completed! 📚'}
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your results have been synchronized to Firestore database. You can review all explanations or reset to achieve 100% mastery.
                </p>
              </div>

              {/* Performance Stats Cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Score</div>
                  <div className="text-xl font-black text-[#1f3d7a] mt-0.5">
                    {recordedAttempt ? `${recordedAttempt.score}%` : '100%'}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Correct</div>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">
                    {recordedAttempt?.correct || 0} / {recordedAttempt?.total || 0}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-[10px] font-bold text-amber-800 uppercase">XP Earned</div>
                  <div className="text-xl font-black text-amber-700 mt-0.5">
                    +{((recordedAttempt?.correct || 0) * 10)} XP
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetMastery}
                  className="flex-1 py-3 px-4 bg-[#1f3d7a] hover:bg-[#152a54] text-white text-xs font-black rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Practice Again for Mastery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMasteryModal(false)}
                  className="py-3 px-5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Review Answers
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
