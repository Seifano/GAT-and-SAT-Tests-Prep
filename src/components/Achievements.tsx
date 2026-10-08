import React, { useState } from 'react';
import { TestAttempt, AchievementBadge } from '../types';
import { calculateGamification } from '../utils/gamification';
import {
  Trophy,
  Award,
  Flame,
  Sun,
  Moon,
  Zap,
  Target,
  BookOpen,
  Calculator,
  Crown,
  Compass,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';

interface AchievementsProps {
  studentAttempts: TestAttempt[];
  streak: number;
  userName: string;
  onStartMock?: () => void;
  onStartQuick?: () => void;
  onStartFocus?: (skills: string[]) => void;
  compact?: boolean;
}

export const Achievements: React.FC<AchievementsProps> = ({
  studentAttempts = [],
  streak = 0,
  userName,
  onStartMock,
  onStartQuick,
  onStartFocus,
  compact = false
}) => {
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');

  const gamification = calculateGamification(studentAttempts, streak);
  const badges = gamification.badges;

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalBadges = badges.length;
  const completionPct = Math.round((unlockedCount / totalBadges) * 100);

  // Badge tier color & 3D styling helpers
  const getBadgeStyle = (tier: string = 'Bronze', unlocked: boolean) => {
    if (!unlocked) {
      return {
        cardBg: 'bg-gradient-to-b from-slate-100 to-slate-200/90 text-slate-500 border-slate-300 shadow-[0_4px_0_0_#cbd5e1]',
        iconBg: 'bg-slate-200 text-slate-400 border-slate-300',
        ringColor: 'ring-slate-300',
        badgePill: 'bg-slate-200 text-slate-600 border-slate-300',
        ribbon: 'text-slate-400',
        accentGlow: ''
      };
    }

    switch (tier) {
      case 'Diamond':
        return {
          cardBg: 'bg-gradient-to-b from-cyan-50 via-white to-blue-50 text-cyan-950 border-cyan-400 shadow-[0_5px_0_0_#0284c7,0_10px_15px_-3px_rgba(2,132,199,0.2)]',
          iconBg: 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-md',
          ringColor: 'ring-cyan-300',
          badgePill: 'bg-cyan-100 text-cyan-800 border-cyan-300',
          ribbon: 'text-cyan-600',
          accentGlow: 'hover:shadow-[0_7px_0_0_#0284c7,0_15px_25px_-5px_rgba(2,132,199,0.35)]'
        };
      case 'Gold':
        return {
          cardBg: 'bg-gradient-to-b from-amber-50/90 via-white to-yellow-50/80 text-amber-950 border-amber-400 shadow-[0_5px_0_0_#d97706,0_10px_15px_-3px_rgba(217,119,6,0.2)]',
          iconBg: 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-md',
          ringColor: 'ring-amber-300',
          badgePill: 'bg-amber-100 text-amber-800 border-amber-300',
          ribbon: 'text-amber-600',
          accentGlow: 'hover:shadow-[0_7px_0_0_#d97706,0_15px_25px_-5px_rgba(217,119,6,0.35)]'
        };
      case 'Silver':
        return {
          cardBg: 'bg-gradient-to-b from-slate-50 via-white to-gray-100 text-slate-900 border-slate-400 shadow-[0_5px_0_0_#64748b,0_10px_15px_-3px_rgba(100,116,139,0.15)]',
          iconBg: 'bg-gradient-to-tr from-slate-400 to-slate-600 text-white border-slate-300 shadow-md',
          ringColor: 'ring-slate-300',
          badgePill: 'bg-slate-200 text-slate-800 border-slate-300',
          ribbon: 'text-slate-600',
          accentGlow: 'hover:shadow-[0_7px_0_0_#64748b,0_15px_25px_-5px_rgba(100,116,139,0.3)]'
        };
      default: // Bronze
        return {
          cardBg: 'bg-gradient-to-b from-orange-50/70 via-white to-amber-100/60 text-amber-950 border-amber-600/70 shadow-[0_5px_0_0_#b45309,0_10px_15px_-3px_rgba(180,83,9,0.2)]',
          iconBg: 'bg-gradient-to-tr from-amber-600 to-amber-800 text-white border-amber-500 shadow-md',
          ringColor: 'ring-amber-400',
          badgePill: 'bg-amber-100 text-amber-900 border-amber-400',
          ribbon: 'text-amber-700',
          accentGlow: 'hover:shadow-[0_7px_0_0_#b45309,0_15px_25px_-5px_rgba(180,83,9,0.35)]'
        };
    }
  };

  const renderBadgeIcon = (iconName: string, className: string = 'w-6 h-6') => {
    switch (iconName) {
      case 'Sun': return <Sun className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Moon': return <Moon className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'Calculator': return <Calculator className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Crown': return <Crown className={className} />;
      default: return <Star className={className} />;
    }
  };

  const filteredBadges = badges.filter(b => {
    const matchCategory = filterCategory === 'all' || b.category === filterCategory;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unlocked' && b.unlocked) ||
      (filterStatus === 'locked' && !b.unlocked);
    return matchCategory && matchStatus;
  });

  const selectedBadge = badges.find(b => b.id === selectedBadgeId) || null;

  return (
    <div className={`space-y-6 ${compact ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans'}`}>
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#1e1b4b] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-700 relative overflow-hidden">
        {/* Decorative 3D Ambient Circles */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>AHS Student Achievements &amp; Honors</span>
              <span className="text-slate-400">·</span>
              {/* School Tri-Color Badge */}
              <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-white font-bold backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified Milestones</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Badges &amp; Mastery Accolades
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Earn prestigious badges based on your authentic testing activity, study streaks, and high-accuracy milestones. Every unlocked badge grants bonus XP towards your student rank!
            </p>
          </div>

          {/* Quick Metrics Pods */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
            {/* Unlocked Count */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 min-w-[130px] shadow-inner text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 block">
                Badges Earned
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums my-0.5">
                {unlockedCount} <span className="text-xs text-slate-400 font-bold">/ {totalBadges}</span>
              </div>
              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-amber-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

            {/* Streak Indicator */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 min-w-[125px] shadow-inner text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 block">
                Study Velocity
              </span>
              <div className="flex items-center justify-center gap-1.5 my-0.5">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {streak}d
                </span>
              </div>
              <span className="text-[10px] text-amber-300 font-bold block">
                {streak >= 3 ? 'Consistency King Active' : `${3 - streak}d to Consistency King`}
              </span>
            </div>

            {/* Bonus XP Earned */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 min-w-[130px] shadow-inner text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 block">
                Accolade Bonus
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums my-0.5">
                +{gamification.badgeBonusXp || 0}
              </div>
              <span className="text-[10px] text-slate-300 font-bold block">XP Awarded</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Modern Category & Status Filter Rail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        {/* 3D Tactile Segmented Pill Rail for Categories */}
        <div className="p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] inline-flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'All Badges', icon: Trophy },
            { id: 'habit', label: 'Habits & Time', icon: Sun },
            { id: 'streak', label: 'Streaks', icon: Flame },
            { id: 'accuracy', label: 'Accuracy', icon: Zap },
            { id: 'mastery', label: 'Domain Mastery', icon: Crown },
            { id: 'milestone', label: 'Milestones', icon: Award }
          ].map(tab => {
            const isActive = filterCategory === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl cursor-pointer transition-all duration-200 ease-out ${
                  isActive
                    ? 'bg-white text-[#1e3a8a] shadow-[0_3px_0_0_#1e3a8a,0_4px_8px_-1px_rgba(30,58,138,0.2)] -translate-y-0.5 border-t border-x border-white ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1e3a8a]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter (All / Unlocked / Locked) with 3D tactile buttons */}
        <div className="p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 shadow-[inset_0_2px_3px_rgba(0,0,0,0.05)] inline-flex gap-1 shrink-0 self-start sm:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
            { id: 'locked', label: `In Progress (${totalBadges - unlockedCount})` }
          ].map(tab => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`text-[11px] font-bold px-3 py-1 rounded-lg cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-gray-900 font-black shadow-[0_2px_0_0_#94a3b8,0_2px_4px_rgba(0,0,0,0.08)] -translate-y-0.5'
                    : 'text-slate-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges 3D Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filteredBadges.map(badge => {
          const style = getBadgeStyle(badge.tier, badge.unlocked);
          const isSelected = selectedBadgeId === badge.id;
          const progressVal = badge.progress ?? (badge.unlocked ? 1 : 0);
          const maxVal = badge.maxProgress ?? 1;
          const progressPct = Math.min(100, Math.round((progressVal / maxVal) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadgeId(badge.id)}
              className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all duration-200 ease-out flex flex-col justify-between ${style.cardBg} ${style.accentGlow} ${
                isSelected ? 'ring-3 ring-blue-600 -translate-y-1' : 'hover:-translate-y-1'
              }`}
            >
              {/* Header row: Medallion Icon & Tier Tag */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  {/* 3D Medallion Emblem */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-transform duration-200 group-hover:scale-110 ${style.iconBg}`}>
                    {renderBadgeIcon(badge.icon, 'w-6 h-6')}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {/* Tier Pill */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${style.badgePill}`}>
                      {badge.tier}
                    </span>

                    {/* XP Bonus Pill */}
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                      +{badge.xpReward || 100} XP
                    </span>
                  </div>
                </div>

                {/* Badge Title & Description */}
                <h3 className="text-base font-extrabold tracking-tight text-gray-900 mb-1 flex items-center gap-1.5">
                  <span>{badge.title}</span>
                  {badge.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {badge.desc}
                </p>
              </div>

              {/* Footer Progress & Status Bar */}
              <div className="space-y-2 pt-3 border-t border-slate-200/60 mt-auto">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={badge.unlocked ? 'text-emerald-700 font-black' : 'text-slate-500'}>
                    {badge.unlocked ? '✓ Completed' : badge.requirementText || 'In Progress'}
                  </span>
                  <span className="text-slate-700 tabular-nums font-black">
                    {badge.unlocked ? '100%' : `${progressVal}/${maxVal}`}
                  </span>
                </div>

                {/* 3D Recessed Progress Meter */}
                <div className="w-full h-2 rounded-full bg-slate-200/90 shadow-inner overflow-hidden border border-slate-300/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    }`}
                    style={{ width: `${badge.unlocked ? 100 : progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Inspection Modal / Details Drawer */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${getBadgeStyle(selectedBadge.tier, selectedBadge.unlocked).iconBg}`}>
                  {renderBadgeIcon(selectedBadge.icon, 'w-7 h-7')}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getBadgeStyle(selectedBadge.tier, selectedBadge.unlocked).badgePill}`}>
                      {selectedBadge.tier} Tier
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      +{selectedBadge.xpReward || 100} XP Bonus
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    {selectedBadge.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedBadgeId(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lore & Criteria */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="block text-slate-900 mb-1 font-extrabold">Badge Objective:</strong>
                {selectedBadge.desc}
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Current Metric Progress:</span>
                  <span className="text-blue-700 font-extrabold tabular-nums">
                    {selectedBadge.progress ?? 0} / {selectedBadge.maxProgress ?? 1}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 shadow-inner overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedBadge.unlocked ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${
                        selectedBadge.unlocked
                          ? 100
                          : Math.min(100, Math.round(((selectedBadge.progress ?? 0) / (selectedBadge.maxProgress ?? 1)) * 100))
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* How to unlock advice */}
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block">How to earn this honor:</span>
              {selectedBadge.id === 'early_bird' && (
                <p>Launch any timed diagnostic or practice warmup sprint between 5:00 AM and 11:00 AM.</p>
              )}
              {selectedBadge.id === 'consistency_king' && (
                <p>Complete at least 1 study session or practice set each day for 3 consecutive days to build your momentum streak.</p>
              )}
              {selectedBadge.id === 'night_owl' && (
                <p>Complete a practice set or diagnostic mock after 8:00 PM in the evening.</p>
              )}
              {selectedBadge.id === 'sharp_shooter' && (
                <p>Take your time on answer verification and achieve an accuracy of 80% or higher in any session.</p>
              )}
              {selectedBadge.id === 'marathon_runner' && (
                <p>Take a full-length timed mock simulation from your dashboard or practice sets arena.</p>
              )}
              {selectedBadge.id === 'century_club' && (
                <p>Keep answering practice questions; each question answered across any test counts towards your 50-question milestone.</p>
              )}
              {['first_blood', 'quant_master', 'verbal_master', 'speed_demon', 'tier1_elite'].includes(selectedBadge.id) && (
                <p>{selectedBadge.requirementText}. Your attempts are evaluated automatically in real-time.</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedBadgeId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              {onStartQuick && !selectedBadge.unlocked && (
                <button
                  onClick={() => {
                    setSelectedBadgeId(null);
                    onStartQuick();
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Start Practice Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
