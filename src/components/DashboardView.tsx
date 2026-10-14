import React, { useState } from 'react';
import { ExamType, UserProfile, Question, TestAttempt, UserAccount } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import {
  ArrowRight,
  ArrowLeft,
  Zap,
  Flame,
  Target,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Layers
} from 'lucide-react';

interface DashboardViewProps {
  activeExam: ExamType;
  profile: UserProfile;
  mastery: Record<string, number>;
  history: Array<{ score: number; date: string; kind: string }>;
  streak: number;
  weekDone: boolean[];
  bank: Question[];
  userName: string;
  currentUser?: UserAccount | null;
  studentAttempts?: TestAttempt[];
  onStartMock: () => void;
  onStartFocus: (skills: string[]) => void;
  onStartQuick: () => void;
  onViewSkills: () => void;
  onViewResults: () => void;
  onViewAnalytics?: () => void;
  onViewAchievements?: () => void;
  onNavigateToPractice?: () => void;
  onNavigateToBrowser?: () => void;
  onRetakeMissed?: (qids: string[]) => void;
  hasPastResults: boolean;
  onUpdateTargetDate?: (exam: ExamType, date: string) => void;
  onSelectExam?: (exam: ExamType) => void;
  onGoBackToMainMenu?: () => void;
  onSyncAllToCloud?: () => Promise<void> | void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'idle';
  lastCloudSyncTime?: string;
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
  currentUser,
  studentAttempts = [],
  onStartMock,
  onStartFocus,
  onStartQuick,
  onViewSkills,
  onViewResults,
  onViewAnalytics,
  onViewAchievements,
  onNavigateToPractice,
  onNavigateToBrowser,
  onRetakeMissed,
  hasPastResults,
  onUpdateTargetDate,
  onSelectExam,
  onGoBackToMainMenu,
  onSyncAllToCloud,
  cloudSyncStatus = 'idle',
  lastCloudSyncTime = 'Connected'
}) => {
  const [showSkillBreakdown, setShowSkillBreakdown] = useState(false);

  const conf = EXAM_CONFIGS[activeExam];
  const defaultTarget = activeExam === 'NAFS' ? 650 : activeExam === 'GAT' ? 88 : 1450;
  const target = profile.targets[activeExam] || defaultTarget;

  // Grade-aware skills list
  const activeSkills = (() => {
    if (currentUser?.role === 'Student' && activeExam === 'NAFS') {
      if (currentUser.studentLevel === 'Grade 6') {
        const sec = conf.sections.find(s => s.name.includes('Grade 6') || s.name.includes('G6'));
        if (sec) return sec.skills;
      } else if (currentUser.studentLevel === 'Grade 9') {
        const sec = conf.sections.find(s => s.name.includes('Grade 9') || s.name.includes('G9'));
        if (sec) return sec.skills;
      }
    }
    return conf.sections.flatMap(s => s.skills);
  })();

  // Core stats calculation (simple, clear numbers for students)
  const hasCompletedTests = studentAttempts.length > 0;
  const latestAttempt = hasCompletedTests ? studentAttempts[0] : null;
  const latestScore = latestAttempt ? latestAttempt.score : (history.length > 0 ? history[history.length - 1].score : null);

  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;
  studentAttempts.forEach(att => {
    totalQuestionsAnswered += att.total;
    totalCorrect += att.correct;
  });

  const accuracyPct = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;

  // Extract missed questions across attempts for quick review
  const missedQIds: string[] = [];
  studentAttempts.forEach(att => {
    att.qids.forEach((qid, idx) => {
      const q = bank.find(item => item.id === qid);
      if (q && att.answers[idx] !== undefined && att.answers[idx] !== q.answer) {
        if (!missedQIds.includes(qid)) {
          missedQIds.push(qid);
        }
      }
    });
  });

  const handleReviewMissed = () => {
    if (!missedQIds.length) return;
    if (onRetakeMissed) {
      onRetakeMissed(missedQIds);
    } else {
      onStartFocus(activeSkills);
    }
  };

  const firstName = userName ? userName.split(' ')[0] : 'Student';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      
      {/* 1. Welcoming Hero Card - Simple, Clean & Personal */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 relative overflow-hidden">
        {/* Track Accent Strip */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          activeExam === 'NAFS'
            ? 'bg-emerald-600'
            : activeExam === 'GAT'
            ? 'bg-red-700'
            : 'bg-[#1e3a8a]'
        }`} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            {/* Student Grade & Class Context (Unboxed quiet text) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              {currentUser?.studentLevel && (
                <>
                  <span className="text-[#1e3a8a] font-bold">{currentUser.studentLevel}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              {currentUser?.studentClass && (
                <>
                  <span>Class {currentUser.studentClass}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="font-bold text-slate-800">{conf.full} ({activeExam})</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {firstName}!
            </h1>
            
            <p className="text-sm text-slate-600 max-w-xl">
              {hasCompletedTests
                ? `You've completed ${studentAttempts.length} practice session${studentAttempts.length > 1 ? 's' : ''}. Keep going to boost your score!`
                : 'Ready to begin? Choose a practice mode below to start answering questions.'}
            </p>
          </div>

          {/* Right Action / Track Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {streak > 0 && (
              <div
                title={`${streak}-day active practice streak`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold shadow-2xs"
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{streak}d Streak</span>
              </div>
            )}

            {onGoBackToMainMenu && (
              <button
                type="button"
                onClick={onGoBackToMainMenu}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                title="Switch between exam tracks"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{currentUser?.studentLevel === 'High School' ? 'Switch Track' : 'Exam Track'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Primary Action Cards ("What would you like to do?") */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Start Practicing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {/* Card 1: Full Mock Exam (Primary) */}
          <div className={`p-6 rounded-2xl flex flex-col justify-between text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
            activeExam === 'NAFS'
              ? 'bg-gradient-to-br from-emerald-800 to-teal-900 ring-1 ring-emerald-700'
              : activeExam === 'GAT'
              ? 'bg-gradient-to-br from-red-800 to-rose-900 ring-1 ring-red-700'
              : 'bg-gradient-to-br from-[#1e3a8a] to-blue-950 ring-1 ring-blue-800'
          }`}>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight text-white">Full Mock Exam</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Timed test with authentic questions, official scoring, and full answer review.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-white/70 font-semibold pt-1">
                <span>{Math.min(bank.length, activeExam === 'GAT' ? 25 : 20)} Questions</span>
                <span aria-hidden="true">·</span>
                <span>~20-25 Mins</span>
              </div>
            </div>

            <button
              onClick={onStartMock}
              disabled={bank.length === 0}
              className="mt-6 w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Start Mock Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: 5-Minute Quick Warmup */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">5-Minute Warmup</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Fast 5-question sprint to test your knowledge and maintain your study streak.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold pt-1">
                <span>5 Quick Questions</span>
                <span aria-hidden="true">·</span>
                <span>~5 Mins</span>
              </div>
            </div>

            <button
              onClick={onStartQuick}
              disabled={bank.length === 0}
              className="mt-6 w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Start Quick Warmup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Practice by Topic */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1e3a8a]">
                <BookOpen className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Practice by Topic</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Choose specific topics and skills matching your grade level to practice at your own pace.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold pt-1">
                <span>{activeSkills.length} Topics</span>
                <span aria-hidden="true">·</span>
                <span>{bank.length} Questions Available</span>
              </div>
            </div>

            <button
              onClick={onNavigateToPractice || onViewSkills}
              className="mt-6 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Choose Topics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Review Missed Questions Alert (if any) */}
      {missedQIds.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                You have {missedQIds.length} missed question{missedQIds.length > 1 ? 's' : ''} to review
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Retrying missed questions is the best way to improve and reinforce what you've learned.
              </p>
            </div>
          </div>

          <button
            onClick={handleReviewMissed}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Review Missed Questions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* 4. Simple Progress Snapshot (No confusing charts, just clear metrics) */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
          My Progress
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Latest Scaled Score */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Latest Score
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              {latestScore !== null ? (
                <>
                  <span className="text-3xl font-black text-[#1e3a8a] tabular-nums">
                    {latestScore}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    / target {target}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-slate-400">Not taken yet</span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              {latestScore !== null
                ? (latestScore >= target ? 'Target reached!' : `${target - latestScore} pts to target`)
                : 'Take a mock test to calibrate'}
            </span>
          </div>

          {/* Tests Completed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Tests Completed
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {studentAttempts.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">sessions</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              {studentAttempts.length > 0 ? 'Full & quick tests' : '0 sessions taken'}
            </span>
          </div>

          {/* Questions Practiced */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Questions Solved
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-700 tabular-nums">
                {totalQuestionsAnswered}
              </span>
              <span className="text-xs font-semibold text-slate-500">answered</span>
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold block mt-1">
              {totalCorrect} verified correct
            </span>
          </div>

          {/* Overall Accuracy */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Overall Accuracy
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {totalQuestionsAnswered > 0 ? `${accuracyPct}%` : '—'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              {totalQuestionsAnswered > 0 ? 'Across all attempts' : 'Start practicing to see rate'}
            </span>
          </div>
        </div>
      </section>

      {/* 5. Recent Test History (Simple & direct) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Recent Test Reports</h3>
            <p className="text-xs text-slate-500">Your most recent practice sessions and results</p>
          </div>
          {studentAttempts.length > 0 && (
            <button
              onClick={onViewResults}
              className="text-xs font-bold text-[#1e3a8a] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View full history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {studentAttempts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {studentAttempts.slice(0, 4).map((att, i) => (
              <div key={att.id || i} className="py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {att.label || `Practice Test (${att.exam})`}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {att.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-emerald-700">
                      {att.correct} of {att.total} correct ({Math.round((att.correct / (att.total || 1)) * 100)}%)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{Math.round(att.timeUsed / 60)} mins</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-black text-[#1e3a8a]">
                    {att.score} pts
                  </span>
                  <button
                    onClick={onViewResults}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No test attempts recorded yet</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Take your first timed mock exam or 5-minute warmup above to see your scores here.
              </p>
            </div>
            <button
              onClick={onStartMock}
              className="px-4 py-2 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Start First Mock Exam
            </button>
          </div>
        )}
      </section>

      {/* 6. Optional Collapsible Topic Mastery Breakdown (Quiet, non-intrusive) */}
      <section className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
        <button
          onClick={() => setShowSkillBreakdown(!showSkillBreakdown)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-800">
              {showSkillBreakdown ? 'Hide Topic & Skill Breakdown' : 'Show All Topics & Skills'}
            </span>
            <span className="text-xs text-slate-500">
              ({activeSkills.length} topics in your curriculum)
            </span>
          </div>
          {showSkillBreakdown ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showSkillBreakdown && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 divide-y divide-slate-100">
            {activeSkills.map(sk => {
              const pct = mastery[sk] !== undefined ? mastery[sk] : 0;
              const hasData = mastery[sk] !== undefined;
              return (
                <div key={sk} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">{sk}</span>
                    <div className="w-full max-w-xs h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${hasData ? (pct >= 70 ? 'bg-emerald-600' : 'bg-amber-500') : 'bg-slate-200'}`}
                        style={{ width: `${hasData ? pct : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-500">
                      {hasData ? `${pct}%` : 'Unassessed'}
                    </span>
                    <button
                      onClick={() => onStartFocus([sk])}
                      className="px-2.5 py-1 text-xs font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Practice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
