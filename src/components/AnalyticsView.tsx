import React, { useState } from 'react';
import { ExamType, UserProfile, Question } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { ScoreTrajectoryChart } from './charts/ScoreTrajectoryChart';
import { SkillRadarChart } from './charts/SkillRadarChart';
import { PacingQuadrantChart } from './charts/PacingQuadrantChart';
import { ScoreSimulator } from './charts/ScoreSimulator';
import { BarChart3, TrendingUp, Compass, Clock, Calculator, Calendar, ArrowRight, Zap, Award } from 'lucide-react';

interface AnalyticsViewProps {
  activeExam: ExamType;
  profile: UserProfile;
  mastery: Record<string, number>;
  history: Array<{ score: number; date: string; kind: string }>;
  streak: number;
  bank: Question[];
  onStartFocus: (skills: string[]) => void;
  onStartMock: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  activeExam,
  profile,
  mastery,
  history,
  streak,
  bank,
  onStartFocus,
  onStartMock
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'trajectory' | 'radar' | 'pacing' | 'simulator'>('all');
  const conf = EXAM_CONFIGS[activeExam];
  const target = profile.targets[activeExam] || (activeExam === 'GAT' ? 88 : 1450);

  const hasData = history && history.length > 0;
  const currentScore = hasData ? history[history.length - 1].score : (activeExam === 'GAT' ? 65 : 1000);

  const allSkills = conf.sections.flatMap(s => s.skills);
  const assessedSkills = allSkills.filter(sk => mastery[sk] !== undefined);
  const hasAssessedSkills = assessedSkills.length > 0;

  const sortedSkills = [...assessedSkills].sort((a, b) => (mastery[a] || 0) - (mastery[b] || 0));
  const weakestSkills = sortedSkills.slice(0, 3);
  const strongestSkills = [...sortedSkills].reverse().slice(0, 3);

  // Section level averages strictly from assessed skills
  const sectionBreakdown = conf.sections.map(sec => {
    const secAssessed = sec.skills.filter(sk => mastery[sk] !== undefined);
    const avg = secAssessed.length > 0
      ? Math.round(secAssessed.reduce((sum, sk) => sum + (mastery[sk] || 0), 0) / secAssessed.length)
      : 0;
    return { name: sec.name, avg, count: sec.skills.length, assessedCount: secAssessed.length };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-300">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            Diagnostic Intelligence · {conf.full}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            Performance Analytics &amp; Visualizations
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed break-words">
            Multi-axis competency radar, speed vs. accuracy pacing quadrants, score growth trajectories, and predictive score simulation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onStartFocus(weakestSkills.length > 0 ? weakestSkills : [allSkills[0]])}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-[#201e1d] flex items-center gap-2 cursor-pointer transition-all duration-200 hover:shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Sprint Priority Skills</span>
          </button>
          <button
            onClick={onStartMock}
            className="btn-primary px-5 py-2.5 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <span>Start Full Mock</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Modern Tab Filter Bar */}
      <div className="p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] inline-flex flex-wrap gap-1.5 overflow-x-auto text-xs font-black">
        {[
          { id: 'all', label: 'All Visualizations' },
          { id: 'trajectory', label: 'Score Trajectory' },
          { id: 'radar', label: 'Competency Radar' },
          { id: 'pacing', label: 'Speed vs. Accuracy' },
          { id: 'simulator', label: 'Predictive Simulator' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ease-out whitespace-nowrap cursor-pointer uppercase tracking-wider text-[11px] font-black ${
              activeTab === tab.id
                ? 'bg-white text-[#1f3d7a] shadow-[0_3px_0_0_#1f3d7a,0_4px_8px_-1px_rgba(31,61,122,0.22)] -translate-y-0.5 border-t border-x border-white ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* High-level Section Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sectionBreakdown.map((sec, i) => (
          <div
            key={i}
            className="p-5 bg-white border border-slate-300 shadow-sm space-y-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <span className="text-[11px] font-bold text-slate-500 block uppercase">
              {sec.name} Domain
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#1f3d7a] tabular-nums">
                {sec.assessedCount > 0 ? `${sec.avg}%` : '—'}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {sec.assessedCount}/{sec.count} assessed
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#1f3d7a] transition-all duration-500"
                style={{ width: `${sec.assessedCount > 0 ? sec.avg : 0}%` }}
              />
            </div>
          </div>
        ))}

        <div className="p-5 bg-white border border-slate-300 shadow-sm space-y-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">
            Top Scoring Skill
          </span>
          <div className="text-lg font-black text-emerald-800 truncate">
            {hasAssessedSkills ? strongestSkills[0] : 'Unassessed'}
          </div>
          <div className="text-xs font-bold text-emerald-700">
            {hasAssessedSkills
              ? `${mastery[strongestSkills[0]]}% Mastery · Verified strength`
              : 'Complete a practice drill to calibrate'}
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-300 shadow-sm space-y-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">
            Priority Growth Target
          </span>
          <div className="text-lg font-black text-[#e15b47] truncate">
            {hasAssessedSkills ? weakestSkills[0] : 'General Diagnostic'}
          </div>
          <div className="text-xs font-bold text-[#e15b47]">
            {hasAssessedSkills
              ? `${mastery[weakestSkills[0]]}% Mastery · Priority focus`
              : 'No errors recorded yet'}
          </div>
        </div>
      </div>

      {/* Visualizations Grid based on Active Tab */}
      {(activeTab === 'all' || activeTab === 'trajectory') && (
        <ScoreTrajectoryChart
          exam={activeExam}
          history={history}
          targetScore={target}
        />
      )}

      {(activeTab === 'all' || activeTab === 'radar') && (
        <SkillRadarChart
          exam={activeExam}
          mastery={mastery}
          onStartSkillDrill={skill => onStartFocus([skill])}
        />
      )}

      {(activeTab === 'all' || activeTab === 'pacing') && (
        <PacingQuadrantChart
          exam={activeExam}
          mastery={mastery}
          onStartSkillDrill={skill => onStartFocus([skill])}
        />
      )}

      {(activeTab === 'all' || activeTab === 'simulator') && (
        <ScoreSimulator
          exam={activeExam}
          currentScore={currentScore}
          targetScore={target}
        />
      )}
    </div>
  );
};
