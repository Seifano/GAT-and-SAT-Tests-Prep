import React, { useState, useEffect } from 'react';
import { ExamType, UserProfile, Question, TestAttempt } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { ScoreTrajectoryChart } from './charts/ScoreTrajectoryChart';
import { ActivityHeatmap } from './charts/ActivityHeatmap';
import { Achievements } from './Achievements';
import { calculateGamification } from '../utils/gamification';
import {
  ArrowRight,
  Zap,
  Flame,
  Calendar,
  Target,
  Clock,
  ShieldAlert,
  BarChart3,
  Award,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  Crown,
  BookOpen,
  Calculator,
  Compass,
  Star,
  Sun,
  Moon
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
  studentAttempts?: TestAttempt[];
  onStartMock: () => void;
  onStartFocus: (skills: string[]) => void;
  onStartQuick: () => void;
  onViewSkills: () => void;
  onViewResults: () => void;
  onViewAnalytics: () => void;
  onViewAchievements?: () => void;
  hasPastResults: boolean;
  onUpdateTargetDate?: (exam: ExamType, date: string) => void;
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
  studentAttempts = [],
  onStartMock,
  onStartFocus,
  onStartQuick,
  onViewSkills,
  onViewResults,
  onViewAnalytics,
  onViewAchievements,
  hasPastResults,
  onUpdateTargetDate
}) => {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  const conf = EXAM_CONFIGS[activeExam];
  const target = profile.targets[activeExam] || (activeExam === 'GAT' ? 88 : 1450);
  const isGAT = activeExam === 'GAT';

  // Gamification calculations strictly derived from student's authentic attempts
  const gamification = calculateGamification(studentAttempts, streak);

  const hasCompletedTests = history && history.length > 0;
  const lastScore = hasCompletedTests ? history[history.length - 1].score : null;
  const gap = lastScore !== null ? target - lastScore : null;

  // Days left calculation
  const targetDateStr = profile.dates[activeExam] || (isGAT ? '2026-11-20' : '2026-12-05');
  const [selectedExamDate, setSelectedExamDate] = useState(targetDateStr);

  useEffect(() => {
    setSelectedExamDate(targetDateStr);
  }, [targetDateStr]);

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
  const scorePct = lastScore !== null ? Math.min(100, Math.max(0, ((lastScore - conf.min) / span) * 100)) : 0;
  const targetPct = Math.min(100, Math.max(0, ((target - conf.min) / span) * 100));

  // Compute estimated percentile only when tests have been completed
  const getPercentile = (score: number | null) => {
    if (score === null) return null;
    if (isGAT) {
      if (score >= 95) return 99;
      if (score >= 90) return 96;
      if (score >= 85) return 91;
      if (score >= 80) return 83;
      if (score >= 75) return 72;
      if (score >= 70) return 58;
      return 40;
    } else {
      if (score >= 1550) return 99;
      if (score >= 1500) return 98;
      if (score >= 1450) return 96;
      if (score >= 1400) return 93;
      if (score >= 1350) return 89;
      if (score >= 1300) return 84;
      if (score >= 1200) return 74;
      return 55;
    }
  };
  const percentile = getPercentile(lastScore);

  // Assessed skills: only those with actual attempt data
  const allSkills = conf.sections.flatMap(s => s.skills);
  const assessedSkillsList = allSkills.filter(sk => mastery[sk] !== undefined);
  const assessedSkillCount = assessedSkillsList.length;

  // Real average mastery (strictly from assessed skills, NOT default 50%)
  const avgMastery = assessedSkillCount > 0
    ? Math.round(assessedSkillsList.reduce((acc, sk) => acc + (mastery[sk] || 0), 0) / assessedSkillCount)
    : 0;

  // Prioritize skills
  const skillsWithBank = allSkills.filter(sk => bank.some(q => q.skill === sk));
  const sortedSkills = [...(skillsWithBank.length ? skillsWithBank : allSkills)].sort((a, b) => {
    const valA = mastery[a] !== undefined ? mastery[a] : -1;
    const valB = mastery[b] !== undefined ? mastery[b] : -1;
    return valA - valB;
  });

  const lowestTwo = sortedSkills.slice(0, 2);
  const prioritySkills = sortedSkills.slice(0, 4);

  const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // XP level progress percentage
  const levelXpRange = Math.max(1, gamification.nextLevelXp - gamification.currentLevelBaseXp);
  const currentLevelProgressXp = Math.max(0, gamification.xp - gamification.currentLevelBaseXp);
  const levelProgressPct = Math.min(100, Math.round((currentLevelProgressXp / levelXpRange) * 100));

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-5 h-5" />;
      case 'Moon': return <Moon className="w-5 h-5" />;
      case 'Target': return <Target className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Flame': return <Flame className="w-5 h-5" />;
      case 'Calculator': return <Calculator className="w-5 h-5" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'Crown': return <Crown className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Welcome Bar & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-gray-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1e3a8a] mb-2">
            <span>{conf.full}</span>
            <span className="text-gray-300">·</span>
            {percentile !== null ? (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200/60">
                {percentile}th National Standing
              </span>
            ) : (
              <span className="text-slate-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full ring-1 ring-gray-200">
                Diagnostic Calibrating
              </span>
            )}
            {/* School Tri-Color Heritage Badge: Crimson Red · Navy Blue · Green */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white ring-1 ring-gray-200 text-gray-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-700" title="Crimson Red" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" title="Navy Blue" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="Green" />
              <span>AHS Standards</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
            Welcome back, {userName.split(' ')[0]}.
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            {hasCompletedTests
              ? 'Your diagnostic profile is calibrated based on verified test attempts. Maintain study velocity to close your target gap.'
              : 'Begin your first diagnostic session or practice drill below to establish authentic scores, skill mastery, and unlock XP.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Secondary/Ghost Button: Deep Analytics */}
          <button
            onClick={onViewAnalytics}
            className="group px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 rounded-lg shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ease-in-out flex items-center gap-2 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-[#1e3a8a] group-hover:scale-110 transition-transform duration-200" />
            <span>Deep Analytics</span>
          </button>

          {/* Secondary/Ghost Button: 5-Min Warmup */}
          <button
            onClick={onStartQuick}
            disabled={bank.length === 0}
            className="group px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 rounded-lg shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ease-in-out flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xs"
          >
            <Zap className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform duration-200" />
            <span>5-Min Warmup</span>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold px-2 py-0.5">
              +50 XP
            </span>
          </button>

          {/* Primary Action Button: Start Full Mock */}
          <button
            onClick={onStartMock}
            disabled={bank.length === 0}
            className="group px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ease-in-out flex items-center gap-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
          >
            <span>Start Full Mock</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            <span className="rounded-full bg-white/20 text-white text-[11px] font-semibold px-2.5 py-0.5 tracking-wide">
              +200 XP
            </span>
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

      {/* GAMIFICATION & PROGRESSION BANNER */}
      <div className="bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#0f172a] text-white p-6 sm:p-7 shadow-lg border border-slate-800 transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Level & XP Info */}
          <div className="space-y-3 flex-1 min-w-[280px]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-none bg-amber-400 text-[#0f172a] font-black text-xl flex items-center justify-center shadow-md border-2 border-amber-300">
                L{gamification.level}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight">{gamification.levelTitle}</span>
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider bg-amber-400/20 px-2 py-0.5 border border-amber-400/40">
                    Tier {gamification.level}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-white tabular-nums">{gamification.xp} XP</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-300 tabular-nums">{gamification.nextLevelXp} XP to Level {gamification.level + 1}</span>
                </div>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="space-y-1.5 max-w-md">
              <div className="w-full h-2.5 bg-black/40 border border-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-500 ease-out"
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-300 font-bold">
                <span>{levelProgressPct}% completed</span>
                <span>{Math.max(0, gamification.nextLevelXp - gamification.xp)} XP remaining</span>
              </div>
            </div>
          </div>

          {/* Gamification Stats: Accuracy, Solved, Streak, Quest */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="p-3 bg-white/10 backdrop-blur-xs border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200 hover:-translate-y-0.5">
              <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">Questions</span>
              <span className="text-xl font-black text-white tabular-nums">{gamification.totalQuestionsAnswered}</span>
              <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">{gamification.totalCorrect} verified correct</span>
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-xs border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200 hover:-translate-y-0.5">
              <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">Accuracy</span>
              <span className="text-xl font-black text-white tabular-nums">
                {gamification.totalQuestionsAnswered > 0 ? `${gamification.accuracy}%` : '—'}
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                {gamification.totalQuestionsAnswered > 0 ? 'Diagnostic rate' : 'No drills yet'}
              </span>
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-xs border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200 hover:-translate-y-0.5">
              <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">Streak Fire</span>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xl font-black text-amber-300 tabular-nums">{streak}d</span>
              </div>
              <span className="text-[10px] text-amber-200/90 font-bold block mt-0.5">
                {streak > 0 ? `+${Math.min(50, streak * 10)}% XP boost` : '1.0x Base XP'}
              </span>
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-xs border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200 hover:-translate-y-0.5">
              <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">Daily Goal</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white tabular-nums">
                  {gamification.dailyGoalProgress}
                </span>
                <span className="text-xs text-slate-300">/{gamification.dailyGoalTarget}</span>
              </div>
              <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                {gamification.dailyGoalProgress >= gamification.dailyGoalTarget ? '✓ Goal Reached!' : `${gamification.dailyGoalTarget - gamification.dailyGoalProgress} Qs left`}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Quest Track & Active Multipliers */}
        <div className="mt-5 p-3.5 bg-black/30 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-8 h-8 bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                <span>Daily Training Mission</span>
                <span className="text-[9px] font-bold bg-amber-400 text-slate-900 px-1.5 py-0.2 uppercase">
                  +50 XP Reward
                </span>
              </div>
              <span className="text-[11px] text-slate-300 block">
                Answer {gamification.dailyGoalTarget} questions today to maintain velocity and claim your daily study bonus.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="w-36 h-2 bg-white/20 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (gamification.dailyGoalProgress / gamification.dailyGoalTarget) * 100)}%` }}
              />
            </div>
            <button
              onClick={onStartQuick}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black transition-colors cursor-pointer shrink-0"
            >
              {gamification.dailyGoalProgress >= gamification.dailyGoalTarget ? 'Mission Completed' : 'Quick Sprint →'}
            </button>
          </div>
        </div>

        {/* Badges & Trophies Row */}
        <div className="mt-5 pt-4 border-t border-white/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Honor Badges &amp; Accolades ({gamification.badges.filter(b => b.unlocked).length} / {gamification.badges.length} Unlocked)
              </span>
            </div>
            <div className="flex items-center gap-3">
              {onViewAchievements && (
                <button
                  onClick={onViewAchievements}
                  className="text-xs font-black text-amber-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-amber-400/30"
                >
                  <span>Full Trophy Matrix</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[11px] text-slate-300">Click any trophy for criteria</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {gamification.badges.slice(0, 6).map(badge => {
              const isSelected = selectedBadge === badge.id;
              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(isSelected ? null : badge.id)}
                  title={`${badge.title}: ${badge.desc}`}
                  className={`p-2.5 rounded-xl text-left transition-all duration-200 border cursor-pointer relative group ${
                    badge.unlocked
                      ? 'bg-gradient-to-b from-amber-500/25 via-amber-500/10 to-transparent border-amber-400/70 shadow-[0_3px_0_0_#d97706] hover:border-amber-300 hover:-translate-y-1'
                      : 'bg-black/30 border-white/10 shadow-[0_2px_0_0_rgba(0,0,0,0.4)] opacity-75 hover:opacity-100 hover:border-white/30 hover:-translate-y-0.5'
                  } ${isSelected ? 'ring-2 ring-amber-400 -translate-y-1' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${badge.unlocked ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-white/5 text-slate-500'}`}>
                      {renderBadgeIcon(badge.icon)}
                    </div>
                    <div className="flex items-center gap-1">
                      {badge.unlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] font-extrabold text-white truncate">{badge.title}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-slate-300 truncate">
                      {badge.unlocked ? 'Unlocked' : `${badge.progress ?? 0}/${badge.maxProgress ?? 1}`}
                    </span>
                    <span className="text-[9px] font-black text-emerald-400">
                      +{badge.xpReward || 100} XP
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Badge Detail Drawer if selected */}
          {selectedBadge && (
            <div className="mt-3 p-3.5 rounded-xl bg-black/50 border border-amber-400/50 text-xs text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              {(() => {
                const b = gamification.badges.find(x => x.id === selectedBadge);
                if (!b) return null;
                return (
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${b.unlocked ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'}`}>
                      {renderBadgeIcon(b.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{b.title}</strong>
                        <span className="text-[10px] font-black text-amber-300 uppercase px-1.5 py-0.2 bg-amber-400/20 rounded-md border border-amber-400/40">
                          {b.tier || 'Gold'} Tier
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                          +{b.xpReward || 100} XP
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs mt-0.5">{b.desc}</p>
                      <span className="text-amber-300 font-bold text-[11px] block mt-0.5">
                        {b.unlocked ? '✓ Completed & XP Awarded!' : `Objective: ${b.requirementText || 'In Progress'} (Current: ${b.progress ?? 0} of ${b.maxProgress ?? 1})`}
                      </span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {onViewAchievements && (
                  <button
                    onClick={onViewAchievements}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    View All Badges →
                  </button>
                )}
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="text-slate-400 hover:text-white font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Executive KPI Cards - Modernized with School Colors: Navy Blue · Green · Crimson Red */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {/* Stat 1: Estimated Score & Percentile - School Color: Navy Blue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-in-out p-5 flex flex-col justify-between border-t-4 border-t-[#1e3a8a]">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span className="uppercase tracking-wider text-[11px] font-extrabold text-[#1e3a8a]">Scaled Calibration</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#1e3a8a] flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>

          {hasCompletedTests && lastScore !== null ? (
            <>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-4xl sm:text-5xl font-black text-[#1e3a8a] tracking-tight tabular-nums">
                  {lastScore}
                </span>
                <span className="text-xs text-slate-500 font-bold">/ target {target}</span>
              </div>
              <div className="space-y-1.5 mt-auto">
                <div className="relative w-full h-2 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#1e3a8a] rounded-full"
                    style={{ width: `${scorePct}%` }}
                  />
                  <div
                    className="absolute -top-1 -bottom-1 w-0.5 bg-gray-900"
                    style={{ left: `${targetPct}%` }}
                    title={`Target: ${target}`}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-700 font-bold">
                  <span>{gap !== null && gap > 0 ? `${gap} pts to target` : 'Target reached!'}</span>
                  <span className="text-emerald-700 font-black">{percentile}th %ile</span>
                </div>
              </div>
            </>
          ) : (
            <div className="my-auto space-y-2 py-2">
              <span className="text-2xl font-black text-slate-400 block tracking-tight">Unassessed</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                No verified attempts yet. Take a timed diagnostic mock to calibrate your starting score.
              </p>
              <button
                onClick={onStartMock}
                className="text-xs font-bold text-[#1e3a8a] hover:underline cursor-pointer flex items-center gap-1 pt-1"
              >
                <span>Calibrate now →</span>
              </button>
            </div>
          )}
        </div>

        {/* Stat 2: Mastery Average & Domain Breakdown - School Color: Forest Green */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-in-out p-5 flex flex-col justify-between border-t-4 border-t-emerald-600">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span className="uppercase tracking-wider text-[11px] font-extrabold text-emerald-800">Verified Mastery</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>

          {assessedSkillCount > 0 ? (
            <>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-4xl sm:text-5xl font-black text-emerald-800 tracking-tight tabular-nums">
                  {avgMastery}%
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  across {assessedSkillCount} tested skill{assessedSkillCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-xs text-slate-700 font-semibold mt-auto flex items-center justify-between">
                <span>{sortedSkills.filter(sk => (mastery[sk] || 0) >= 80).length} of {allSkills.length} skills mastered</span>
                <button onClick={onViewSkills} className="text-emerald-800 font-bold hover:underline cursor-pointer text-[11px]">
                  Matrix →
                </button>
              </div>
            </>
          ) : (
            <div className="my-auto space-y-2 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-400 block tracking-tight">0%</span>
                <span className="text-xs text-slate-400 font-bold">Unassessed</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                0 of {allSkills.length} skills assessed. Answer questions in focus drills to generate your mastery matrix.
              </p>
              <button
                onClick={onViewSkills}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1 pt-1"
              >
                <span>Inspect matrix →</span>
              </button>
            </div>
          )}
        </div>

        {/* Stat 3: Test Countdown - School Color: Crimson Red */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-in-out p-5 flex flex-col justify-between border-t-4 border-t-red-700">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span className="uppercase tracking-wider text-[11px] font-extrabold text-red-800">Official Exam Date</span>
            <button
              onClick={() => setShowDateModal(true)}
              title="Click to learn how the official date is sourced or adjust your registered test date"
              className="w-6 h-6 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl sm:text-5xl font-black text-red-800 tracking-tight tabular-nums">
              {daysLeft}
            </span>
            <span className="text-xs text-slate-500 font-bold">days left</span>
          </div>
          <div className="space-y-1.5 mt-auto">
            <div className="text-xs text-slate-700 font-bold flex items-center justify-between">
              <span>{formattedDate}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                daysLeft <= 30
                  ? 'text-red-700 bg-red-50 border border-red-200'
                  : 'text-amber-800 bg-amber-50 border border-amber-200'
              }`}>
                {daysLeft <= 30 ? 'High Urgency' : 'Preparation Phase'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <span className="text-[10px] font-bold text-slate-500">
                {isGAT ? 'ETEC / Qiyas Calendar' : 'College Board SAT Window'}
              </span>
              <button
                onClick={() => setShowDateModal(true)}
                className="text-[10px] font-bold text-red-700 hover:underline cursor-pointer"
              >
                Change Date →
              </button>
            </div>
          </div>
        </div>

        {/* Stat 4: Study Streak - Activity Velocity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-in-out p-5 flex flex-col justify-between border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span className="uppercase tracking-wider text-[11px] font-extrabold text-amber-800">Study Velocity</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl sm:text-5xl font-black text-[#201e1d] tracking-tight tabular-nums">
              {streak}
            </span>
            <span className="text-xs text-slate-500 font-bold">days active</span>
          </div>

          <div className="grid grid-cols-7 gap-1 mt-auto">
            {daysLabels.map((lbl, idx) => {
              const done = weekDone[idx];
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-full h-2 rounded-xs transition-colors ${
                      done ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                  <span className="text-[10px] font-bold text-slate-500">{lbl}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CORE DATA VISUALIZATION: Score Trajectory & Growth Chart */}
      <ScoreTrajectoryChart
        exam={activeExam}
        history={history}
        targetScore={target}
      />

      {/* Main Focus Area: Weakest Skills & Adaptive Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focus on Weakest Skills (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-baseline justify-between border-b-2 border-[#201e1d]/30 pb-2">
            <div>
              <h3 className="text-base font-extrabold text-[#201e1d]">Priority Skill Targets</h3>
              <p className="text-xs text-slate-500">Skills with highest leverage to increase your scaled score</p>
            </div>
            <button
              onClick={onViewSkills}
              className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View all skills ({allSkills.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y border-b border-slate-300 bg-white border-x border-t border-slate-200 shadow-sm">
            {prioritySkills.map(sk => {
              const hasMasteryData = mastery[sk] !== undefined;
              const pct = hasMasteryData ? mastery[sk] : 0;
              const hasQ = bank.some(q => q.skill === sk);
              const isLow = hasMasteryData && pct < 60;
              const section = conf.sections.find(s => s.skills.includes(sk))?.name;

              return (
                <div
                  key={sk}
                  className="p-4 space-y-2 hover:bg-slate-50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#201e1d] block group-hover:text-[#1f3d7a] transition-colors">
                          {sk}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{section}</span>
                        {isLow && (
                          <span className="text-[9px] font-black text-[#e15b47] uppercase tracking-wider bg-red-50 border border-red-200 px-1.5 py-0.2">
                            Needs Focus
                          </span>
                        )}
                        {!hasMasteryData && (
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-1.5 py-0.2">
                            Unassessed
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">
                        {hasMasteryData ? `${pct}% current mastery` : 'No questions answered yet in this skill'}
                      </span>
                    </div>

                    <button
                      onClick={() => onStartFocus([sk])}
                      disabled={!hasQ}
                      className="px-3.5 py-1.5 bg-white hover:bg-[#1f3d7a] hover:text-white border border-slate-300 hover:border-[#1f3d7a] text-xs font-bold text-[#201e1d] cursor-pointer flex items-center gap-1.5 disabled:opacity-40 transition-all duration-200 hover:shadow-sm"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Practice (+25 XP)</span>
                    </button>
                  </div>

                  <div className="w-full h-2 bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        !hasMasteryData
                          ? 'bg-slate-200 w-0'
                          : isLow
                          ? 'bg-[#e15b47]'
                          : 'bg-[#1f3d7a]'
                      }`}
                      style={{ width: `${hasMasteryData ? pct : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Adaptive Next Session + Recent Attempts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recommended Next Box with XP multiplier */}
          <div className="border-2 border-[#1f3d7a] p-6 bg-white space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1f3d7a] block">
                Adaptive Recommendation
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>+75 XP Bonus</span>
              </span>
            </div>

            <div className="text-2xl font-black text-[#201e1d] leading-snug group-hover:text-[#1f3d7a] transition-colors">
              {lowestTwo.length ? lowestTwo.join(' + ') : 'Comprehensive Diagnostic Sprint'}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {assessedSkillCount > 0 && lowestTwo.length
                ? `Targeted sprint combining your two highest-priority skills (${mastery[lowestTwo[0]] !== undefined ? `${mastery[lowestTwo[0]]}%` : 'Unassessed'} and ${mastery[lowestTwo[1]] !== undefined ? `${mastery[lowestTwo[1]]}%` : 'Unassessed'}).`
                : 'Balanced diagnostic drill across both quantitative and verbal domains to calibrate your baseline score.'}
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700">10 questions</span>
              <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700">~12 minutes</span>
              <span className="px-2.5 py-1 bg-blue-50 text-[#1f3d7a] font-bold border border-blue-200">
                +3.5 pts potential
              </span>
            </div>

            <button
              onClick={() => onStartFocus(lowestTwo.length ? lowestTwo : ['Analogy'])}
              disabled={bank.length === 0}
              className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40 transition-all duration-200 hover:shadow-md"
            >
              <span>Launch Recommended Sprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Recent Attempts Activity */}
          <div className="space-y-3 bg-white border border-slate-300 p-5 shadow-sm">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
              <h3 className="text-base font-extrabold text-[#201e1d]">Recent Test Sessions</h3>
              {hasPastResults && (
                <button
                  onClick={onViewResults}
                  className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
                >
                  Last diagnostic →
                </button>
              )}
            </div>

            {hasCompletedTests ? (
              <div className="divide-y divide-slate-200 text-xs">
                {history.slice(-4).reverse().map((h, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="font-bold text-[#201e1d] block">{h.kind}</span>
                      <span className="text-[11px] text-slate-500">{h.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-base text-[#1f3d7a] tabular-nums block">{h.score}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{getPercentile(h.score)}th %ile</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                <span>No test sessions completed yet. Take a diagnostic or quick warmup to record your first score.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL ACHIEVEMENTS & BADGES SHOWCASE ON DASHBOARD */}
      <Achievements
        compact
        studentAttempts={studentAttempts}
        streak={streak}
        userName={userName}
        onStartMock={onStartMock}
        onStartQuick={onStartQuick}
        onStartFocus={onStartFocus}
      />

      {/* Study Frequency Activity Heatmap */}
      <ActivityHeatmap streak={streak} attempts={studentAttempts} />

      {/* Official Exam Date Information & Customization Modal */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in duration-200">
            {/* Header with School Tri-Color Badge */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-red-800">
                    Official Examination Authority
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  {isGAT ? 'Saudi GAT (Qudrat) Official Schedule' : 'Digital SAT Official Schedule'}
                </h3>
              </div>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Explanation of Authority & Source */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Calendar className="w-4 h-4 text-red-700" />
                <span>How is the official examination date determined?</span>
              </div>
              {isGAT ? (
                <p>
                  <strong>ETEC / Qiyas National Board:</strong> Saudi General Aptitude Test (قدرات) test windows are officially scheduled by the Education & Training Evaluation Commission (ETEC). Paper-based exams run during national seasonal sessions, while Computer-Based Testing (CBT / محوسب) appointments are open throughout the academic year.
                </p>
              ) : (
                <p>
                  <strong>College Board International Calendar:</strong> The Digital SAT is administered globally on published Saturday testing administrations (March, May, June, August, October, November, December) at accredited testing centers.
                </p>
              )}
              <p className="text-slate-500">
                The platform defaults to the upcoming national testing window. If you already booked an individual appointment on the official testing portal, specify your exact booking date below to calibrate your daily study countdown and pacing velocity.
              </p>
            </div>

            {/* Date Customization Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                Your Registered Examination Appointment Date
              </label>
              <input
                type="date"
                value={selectedExamDate}
                onChange={e => setSelectedExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-gray-500">
                Currently calibrated for: <strong className="text-gray-800">{formattedDate} ({daysLeft} days remaining)</strong>
              </p>
            </div>

            {/* School Heritage Tri-Color Note */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-50 via-blue-50 to-emerald-50 rounded-lg border border-gray-200 text-[11px] text-gray-700 font-medium">
              <div className="flex gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-red-700" title="Crimson Red" />
                <span className="w-2 h-2 rounded-full bg-[#1e3a8a]" title="Navy Blue" />
                <span className="w-2 h-2 rounded-full bg-emerald-600" title="Green" />
              </div>
              <span>Calibrated with AHS institutional prep standards for maximum performance.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (selectedExamDate && onUpdateTargetDate) {
                    onUpdateTargetDate(activeExam, selectedExamDate);
                  }
                  setShowDateModal(false);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ease-in-out cursor-pointer"
              >
                Save Registered Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
