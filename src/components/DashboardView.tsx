import React, { useState, useEffect } from 'react';
import { ExamType, UserProfile, Question, TestAttempt, UserAccount, DifficultyLevel } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { Language, t } from '../utils/i18n';
import { getQuestionDifficulty, getDifficultyBadgeColor } from '../utils/difficulty';
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
  Layers,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Clock,
  Calculator,
  GraduationCap,
  School,
  Hourglass
} from 'lucide-react';
import { CalculatorModal } from './tools/CalculatorModal';
import { ReferenceSheetModal } from './tools/ReferenceSheetModal';

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
  onStartMock: (difficulty?: DifficultyLevel) => void;
  onStartFocus: (skills: string[], difficulty?: DifficultyLevel) => void;
  onStartQuick: (difficulty?: DifficultyLevel) => void;
  onViewSkills: () => void;
  onViewResults: () => void;
  onViewAnalytics?: () => void;
  onViewAchievements?: () => void;
  onNavigateToPractice?: () => void;
  onNavigateToBrowser?: () => void;
  onNavigateToKsaBooking?: () => void;
  onRetakeMissed?: (qids: string[]) => void;
  hasPastResults: boolean;
  onUpdateTargetDate?: (exam: ExamType, date: string) => void;
  onSelectExam?: (exam: ExamType) => void;
  onGoBackToMainMenu?: () => void;
  onSyncAllToCloud?: () => Promise<void> | void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'idle';
  lastCloudSyncTime?: string;
  language?: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeExam,
  profile,
  mastery,
  history,
  streak,
  weekDone = [true, true, true, false, true, false, true],
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
  onNavigateToKsaBooking,
  onRetakeMissed,
  hasPastResults,
  onUpdateTargetDate,
  onSelectExam,
  onGoBackToMainMenu,
  onSyncAllToCloud,
  cloudSyncStatus = 'idle',
  lastCloudSyncTime = 'Connected',
  language = 'en'
}) => {
  const [showSkillBreakdown, setShowSkillBreakdown] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showRefSheetModal, setShowRefSheetModal] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'All'>('All');

  // Live countdown timer state (Next major GAT Paper Test Window: Dec 10, 2026 08:00:00 AST)
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 44,
    hours: 14,
    minutes: 32,
    seconds: 15
  });

  useEffect(() => {
    // Official upcoming date: December 10, 2026 08:00:00 AM AST
    const targetDate = new Date('2026-12-10T08:00:00+03:00').getTime();

    const updateCounter = () => {
      const now = new Date().getTime();
      const difference = Math.max(0, targetDate - now);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Core stats calculation
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

  // AI Recommendation Engine: Find lowest mastery topic to recommend targeted drill
  const recommendedSkill = (() => {
    if (activeSkills.length === 0) return 'Algebra';
    const sorted = [...activeSkills].sort((a, b) => {
      const ma = mastery[a] !== undefined ? mastery[a] : 50;
      const mb = mastery[b] !== undefined ? mastery[b] : 50;
      return ma - mb;
    });
    return sorted[0];
  })();

  // Extract missed questions
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

  const firstName = userName ? userName.split(' ')[0] : (language === 'ar' ? 'طالبنا المميز' : 'Scholar');
  const projectedScore = latestScore || (activeExam === 'SAT' ? 1220 : activeExam === 'GAT' ? 76 : 520);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 1. Institutional Hero Banner: Adhwa'a Al-Hedaya International Schools */}
      <section className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-indigo-900/60 bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 min-w-0">
            {/* Bilingual Institutional Heading */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white font-bold text-xs border border-white/20">
                <School className="w-3.5 h-3.5 text-sky-400" />
                <span>{language === 'ar' ? 'مدارس أضواء الهداية العالمية' : "Adhwa'a Al-Hedaya International Schools"}</span>
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-sky-300 font-bold">{language === 'ar' ? "Adhwa'a Al-Hedaya" : "مدارس أضواء الهداية"}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">{t('campus', language)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {t('welcomeBack', language)}, {firstName}!
            </h1>
            
            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              {hasCompletedTests
                ? (language === 'ar'
                    ? `أتممت ${studentAttempts.length} جلسة تدريبية بنجاح. واصل التدرب لتأكيد درجتك المتوقعة للقبول الجامعي.`
                    : `You've completed ${studentAttempts.length} practice session${studentAttempts.length > 1 ? 's' : ''}. Keep training to lock in your projected university admission target.`)
                : t('dashboardSubtitle', language)}
            </p>

            {/* Quick Student Context Tagline */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
              <span className="px-2.5 py-0.5 rounded-md font-bold bg-indigo-900/80 text-sky-300 border border-indigo-700/50">
                {activeExam} {t('track', language)}
              </span>
              {currentUser?.studentLevel && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-white font-semibold">{currentUser.studentLevel}</span>
                </>
              )}
              {currentUser?.studentClass && (
                <>
                  <span className="text-slate-500">·</span>
                  <span>{language === 'ar' ? `الشعبة ${currentUser.studentClass}` : `Section ${currentUser.studentClass}`}</span>
                </>
              )}
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{language === 'ar' ? 'العام الأكاديمي 1447 / 2026' : 'Academic Year 2025–2026'}</span>
            </div>
          </div>

          {/* Right Action Widgets: Streak & Track Switch */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            {streak > 0 && (
              <div
                title={`${streak}-day active practice streak`}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-2xl text-amber-300 text-xs font-bold shadow-xs"
              >
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="font-black">{streak}d {t('streakLabel', language)}</span>
              </div>
            )}

            {onGoBackToMainMenu && (
              <button
                type="button"
                onClick={onGoBackToMainMenu}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-white/25 hover:border-white/40 shadow-2xs"
                title="Switch between exam tracks"
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                <span>{currentUser?.studentLevel === 'High School' ? t('switchTrack', language) : t('examPathway', language)}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Official Riyadh Testing Window & Live GAT Countdown Timer */}
      <section className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-7 rounded-3xl shadow-sm border border-indigo-800/60 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Calendar className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-200 bg-sky-950/70 px-2 py-0.5 rounded-lg border border-sky-400/30">
                  {t('riyadhSessionTitle', language)}
                </span>
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t('registrationActive', language)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                {t('gatNextCbtTitle', language)}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {t('gatCbtContinuous', language)}
              </p>
            </div>
          </div>

          {onNavigateToKsaBooking && (
            <button
              type="button"
              onClick={onNavigateToKsaBooking}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer self-start md:self-auto"
            >
              <span>{t('viewRiyadhDates', language)}</span>
              <ArrowRight className={`w-4 h-4 text-indigo-700 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Live GAT Official Testing Countdown Clock */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Hourglass className="w-5 h-5 text-amber-400 animate-spin [animation-duration:8s]" />
            <div>
              <span className="text-xs font-black text-white block">
                {t('gatCounterLabel', language)}
              </span>
              <span className="text-[11px] text-slate-400">
                {language === 'ar' ? 'فترة الاختبار الورقي الرسمية: 10 - 14 ديسمبر 2026' : 'Official Paper Window: Dec 10 – Dec 14, 2026 (Continuous CBT Active)'}
              </span>
            </div>
          </div>

          {/* 4 Countdown Tiles */}
          <div className="flex items-center gap-2 sm:gap-3" dir="ltr">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-center min-w-[58px] shadow-2xs">
              <span className="text-lg sm:text-xl font-black font-mono text-amber-300 tabular-nums block leading-tight">
                {timeLeft.days}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('days', language)}
              </span>
            </div>

            <div className="text-slate-500 font-black text-lg">:</div>

            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-center min-w-[58px] shadow-2xs">
              <span className="text-lg sm:text-xl font-black font-mono text-white tabular-nums block leading-tight">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('hours', language)}
              </span>
            </div>

            <div className="text-slate-500 font-black text-lg">:</div>

            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-center min-w-[58px] shadow-2xs">
              <span className="text-lg sm:text-xl font-black font-mono text-white tabular-nums block leading-tight">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('minutes', language)}
              </span>
            </div>

            <div className="text-slate-500 font-black text-lg">:</div>

            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-center min-w-[58px] shadow-2xs">
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-400 tabular-nums block leading-tight">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('seconds', language)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI Study Coach: Highest-Yield Focus Recommendation */}
      <section className="bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 border border-indigo-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-200/70 px-2 py-0.5 rounded-md">
                {t('aiCoachTitle', language)}
              </span>
              <span className="text-xs font-bold text-indigo-700">{t('aiCoachScoreBooster', language)}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              {t('targetedDrillOn', language)} <span className="text-indigo-700 underline decoration-indigo-300">{recommendedSkill}</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              {t('aiCoachDescription', language)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStartFocus([recommendedSkill], selectedDifficulty !== 'All' ? selectedDifficulty : undefined)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:shadow-md"
        >
          <span>{t('startSkillDrill', language)}</span>
          <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
        </button>
      </section>

      {/* 4. University Benchmark Readiness Index */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>{t('readinessIndex', language)}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {t('readinessSubtitle', language)}
            </p>
          </div>
          <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200/60 self-start sm:self-auto">
            {t('projectedScore', language)}: {projectedScore} pts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1: KFUPM & Elite Medical/Engineering */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">{t('kfupmBenchmark', language)}</span>
              <span className="font-mono font-bold text-indigo-700">
                {activeExam === 'SAT' ? '1450+' : activeExam === 'GAT' ? '88+' : '650+'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((projectedScore / (activeExam === 'SAT' ? 1450 : activeExam === 'GAT' ? 88 : 650)) * 100))}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              {projectedScore >= (activeExam === 'SAT' ? 1450 : activeExam === 'GAT' ? 88 : 650)
                ? t('competitiveStanding', language)
                : `${(activeExam === 'SAT' ? 1450 : activeExam === 'GAT' ? 88 : 650) - projectedScore} ${t('ptsToBenchmark', language)}`}
            </span>
          </div>

          {/* Tier 2: Global Top 50 / Ivy League / UK Russell Group */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">{t('ivyLeagueBenchmark', language)}</span>
              <span className="font-mono font-bold text-blue-700">
                {activeExam === 'SAT' ? '1520+' : activeExam === 'GAT' ? '92+' : '700+'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((projectedScore / (activeExam === 'SAT' ? 1520 : activeExam === 'GAT' ? 92 : 700)) * 100))}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              {projectedScore >= (activeExam === 'SAT' ? 1520 : activeExam === 'GAT' ? 92 : 700)
                ? t('eliteStanding', language)
                : `${(activeExam === 'SAT' ? 1520 : activeExam === 'GAT' ? 92 : 700) - projectedScore} ${t('ptsToBenchmark', language)}`}
            </span>
          </div>

          {/* Tier 3: National Public Universities */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">{t('nationalBenchmark', language)}</span>
              <span className="font-mono font-bold text-emerald-700">
                {activeExam === 'SAT' ? '1250+' : activeExam === 'GAT' ? '78+' : '550+'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((projectedScore / (activeExam === 'SAT' ? 1250 : activeExam === 'GAT' ? 78 : 550)) * 100))}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 block">
              {projectedScore >= (activeExam === 'SAT' ? 1250 : activeExam === 'GAT' ? 78 : 550)
                ? t('targetMet', language)
                : `${(activeExam === 'SAT' ? 1250 : activeExam === 'GAT' ? 78 : 550) - projectedScore} ${t('ptsToBenchmark', language)}`}
            </span>
          </div>
        </div>
      </section>

      {/* 5. Primary Practice Action Cards with Difficulty Mode Selector */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {t('choosePracticeMode', language)}
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {bank.length} {t('questionsAvailable', language)} {activeExam}
            </span>
          </div>

          {/* Difficulty Tier Selector (School Colors: Navy, Crimson, Green) */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedDifficulty('All')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedDifficulty === 'All'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'ar' ? 'الكل' : 'All Modes'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDifficulty('Easy')}
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedDifficulty === 'Easy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{language === 'ar' ? 'سهل' : 'Easy'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDifficulty('Medium')}
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedDifficulty === 'Medium'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-blue-900 hover:bg-blue-100/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>{language === 'ar' ? 'متوسط' : 'Medium'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDifficulty('Hard')}
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedDifficulty === 'Hard'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-rose-900 hover:bg-rose-100/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{language === 'ar' ? 'صعب' : 'Hard'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Full Mock Exam (Primary) */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 text-white shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md ring-1 ring-blue-500/40">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shadow-2xs">
                <Target className="w-6 h-6 text-white" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-md text-white">
                    {t('officialSimulation', language)}
                  </span>
                  <span className="text-[10px] font-bold text-amber-200">
                    +200 XP
                  </span>
                  {selectedDifficulty !== 'All' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/20 text-white">
                      {selectedDifficulty}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">{t('fullMockExam', language)}</h3>
                <p className="text-xs text-white/85 mt-1 leading-relaxed">
                  {t('fullMockDesc', language)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/75 font-semibold pt-1">
                <span>{Math.min(bank.length, activeExam === 'GAT' ? 25 : 20)} {language === 'ar' ? 'سؤال' : 'Questions'}</span>
                <span aria-hidden="true">·</span>
                <span>~20–25 {language === 'ar' ? 'دقيقة' : 'Mins'}</span>
              </div>
            </div>

            <button
              onClick={() => onStartMock(selectedDifficulty !== 'All' ? selectedDifficulty : undefined)}
              disabled={bank.length === 0}
              className="mt-6 w-full py-3 px-4 bg-white hover:bg-blue-50 text-indigo-950 font-black text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{t('startMockExam', language)} {selectedDifficulty !== 'All' ? `(${selectedDifficulty})` : ''}</span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Card 2: 5-Minute Quick Warmup */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md ring-1 ring-amber-400/40">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shadow-2xs">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-md text-white">
                    {t('agilitySprint', language)}
                  </span>
                  <span className="text-[10px] font-bold text-amber-100">
                    +50 XP
                  </span>
                  {selectedDifficulty !== 'All' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/20 text-white">
                      {selectedDifficulty}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">{t('quickWarmup', language)}</h3>
                <p className="text-xs text-amber-50 mt-1 leading-relaxed">
                  {t('warmupDesc', language)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-amber-100 font-semibold pt-1">
                <span>5 {language === 'ar' ? 'أسئلة سريعة' : 'Quick Questions'}</span>
                <span aria-hidden="true">·</span>
                <span>{language === 'ar' ? 'حفظ الشعلة اليومية' : 'Streak Safeguard'}</span>
              </div>
            </div>

            <button
              onClick={() => onStartQuick(selectedDifficulty !== 'All' ? selectedDifficulty : undefined)}
              disabled={bank.length === 0}
              className="mt-6 w-full py-3 px-4 bg-white hover:bg-amber-50 text-amber-950 text-xs font-black rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{t('startQuickWarmup', language)} {selectedDifficulty !== 'All' ? `(${selectedDifficulty})` : ''}</span>
              <ArrowRight className={`w-4 h-4 text-amber-700 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Card 3: Practice by Topic */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-indigo-300">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-2xs">
                <BookOpen className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md text-indigo-800">
                    {t('targetedDrills', language)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {language === 'ar' ? 'ذاتي' : 'Self-Paced'}
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">{t('practiceByTopic', language)}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t('practiceByTopicDesc', language)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold pt-1">
                <span>{activeSkills.length} {language === 'ar' ? 'مهارة متاحة' : 'Topics Available'}</span>
                <span aria-hidden="true">·</span>
                <span>{language === 'ar' ? 'تدريب مخصص' : 'Custom Set'}</span>
              </div>
            </div>

            <button
              onClick={onNavigateToPractice || onViewSkills}
              className="mt-6 w-full py-3 px-4 bg-slate-900 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{t('chooseTopics', language)}</span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Quick Exam Tools Bar */}
      <section className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">{t('quickExamTools', language)}</h4>
            <p className="text-[11px] text-slate-500">{t('quickExamToolsDesc', language)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowCalculatorModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
          >
            <div className="w-4 h-4 rounded bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center">
              D
            </div>
            <span>{t('desmosSimulator', language)}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRefSheetModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t('mathFormulas', language)}</span>
          </button>
        </div>
      </section>

      {/* 7. Review Missed Questions Alert (if any) */}
      {missedQIds.length > 0 && (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {t('missedQuestionsNotice', language)} ({missedQIds.length})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {t('missedQuestionsDesc', language)}
              </p>
            </div>
          </div>

          <button
            onClick={handleReviewMissed}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>{t('reviewMissedBtn', language)}</span>
            <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </section>
      )}

      {/* 8. Simple Progress Metric Tiles */}
      <section className="space-y-3.5">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {t('performanceAnalytics', language)}
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Latest Scaled Score */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t('latestScore', language)}
              </span>
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              {latestScore !== null ? (
                <>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                    {latestScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / {target}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-slate-400">{t('unassessed', language)}</span>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-500 block mt-2">
              {latestScore !== null
                ? (latestScore >= target ? t('targetMet', language) : `${target - latestScore} ${t('ptsToBenchmark', language)}`)
                : 'Take a mock test to calibrate'}
            </span>
          </div>

          {/* Tests Completed */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t('testsCompleted', language)}
              </span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                {studentAttempts.length}
              </span>
              <span className="text-xs font-bold text-slate-400">{language === 'ar' ? 'جلسة' : 'sessions'}</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 block mt-2">
              {studentAttempts.length > 0 ? t('sessionsRecorded', language) : '0'}
            </span>
          </div>

          {/* Questions Practiced */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t('questionsSolved', language)}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 tabular-nums">
                {totalQuestionsAnswered}
              </span>
              <span className="text-xs font-bold text-slate-400">{language === 'ar' ? 'سؤال' : 'answered'}</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 block mt-2">
              {totalCorrect} {t('verifiedCorrect', language)}
            </span>
          </div>

          {/* Overall Accuracy */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t('accuracyRate', language)}
              </span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                {totalQuestionsAnswered > 0 ? `${accuracyPct}%` : '—'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 block mt-2">
              {totalQuestionsAnswered > 0 ? t('acrossAllTests', language) : '—'}
            </span>
          </div>
        </div>
      </section>

      {/* 9. Recent Test History Table */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">{t('recentReportsTitle', language)}</h3>
            <p className="text-xs text-slate-500">{t('recentReportsSubtitle', language)}</p>
          </div>
          {studentAttempts.length > 0 && (
            <button
              onClick={onViewResults}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{t('viewFullHistory', language)}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {studentAttempts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {studentAttempts.slice(0, 4).map((att, i) => (
              <div key={att.id || i} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {att.label || `Practice Test (${att.exam})`}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {att.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-emerald-700">
                      {att.correct} {language === 'ar' ? 'من' : 'of'} {att.total} {language === 'ar' ? 'صحيحة' : 'correct'} ({Math.round((att.correct / (att.total || 1)) * 100)}%)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {Math.round(att.timeUsed / 60)} {language === 'ar' ? 'دقيقة' : 'mins'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg font-black text-indigo-700">
                    {att.score} {language === 'ar' ? 'درجة' : 'pts'}
                  </span>
                  <button
                    onClick={onViewResults}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {t('review', language)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{t('noAttemptsYet', language)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Take your first timed mock exam or 5-minute warmup above to see your scores here.
              </p>
            </div>
            <button
              onClick={() => onStartMock(selectedDifficulty !== 'All' ? selectedDifficulty : undefined)}
              className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
            >
              {t('startFirstMock', language)}
            </button>
          </div>
        )}
      </section>

      {/* 10. Curriculum Topic Mastery Breakdown (Collapsible) */}
      <section className="border border-slate-200 rounded-3xl bg-white shadow-2xs overflow-hidden">
        <button
          onClick={() => setShowSkillBreakdown(!showSkillBreakdown)}
          className="w-full px-6 py-4.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                {showSkillBreakdown ? t('hideTopics', language) : t('showAllTopics', language)}
              </span>
              <span className="text-xs text-slate-500">
                {activeSkills.length} {t('keyCompetencies', language)}
              </span>
            </div>
          </div>
          {showSkillBreakdown ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showSkillBreakdown && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 divide-y divide-slate-100">
            {activeSkills.map(sk => {
              const pct = mastery[sk] !== undefined ? mastery[sk] : 0;
              const hasData = mastery[sk] !== undefined;
              return (
                <div key={sk} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">{sk}</span>
                    <div className="w-full max-w-sm h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          hasData
                            ? pct >= 70
                              ? 'bg-emerald-500'
                              : pct >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-slate-200'
                        }`}
                        style={{ width: `${hasData ? pct : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-500">
                      {hasData ? `${pct}%` : t('unassessed', language)}
                    </span>
                    <button
                      onClick={() => onStartFocus([sk])}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                    >
                      {t('practice', language)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Built-in Calculator Modal */}
      <CalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        exam={activeExam}
      />

      {/* Built-in Reference Sheet Modal */}
      <ReferenceSheetModal
        isOpen={showRefSheetModal}
        onClose={() => setShowRefSheetModal(false)}
        exam={activeExam}
      />

    </div>
  );
};
