import React, { useState } from 'react';
import { ExamType, UserProfile, Question } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { ScoreTrajectoryChart } from './charts/ScoreTrajectoryChart';
import { SkillRadarChart } from './charts/SkillRadarChart';
import { PacingQuadrantChart } from './charts/PacingQuadrantChart';
import { ScoreSimulator } from './charts/ScoreSimulator';
import { ActivityHeatmap } from './charts/ActivityHeatmap';
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
  const currentScore = history.length ? history[history.length - 1].score : (activeExam === 'GAT' ? 78 : 1340);

  const allSkills = conf.sections.flatMap(s => s.skills);
  const sortedSkills = [...allSkills].sort((a, b) => (mastery[a] ?? 50) - (mastery[b] ?? 50));
  const weakestSkills = sortedSkills.slice(0, 3);
  const strongestSkills = [...sortedSkills].reverse().slice(0, 3);

  // Section level averages
  const sectionBreakdown = conf.sections.map(sec => {
    const avg = Math.round(
      sec.skills.reduce((sum, sk) => sum + (mastery[sk] ?? 50), 0) / (sec.skills.length || 1)
    );
    return { name: sec.name, avg, count: sec.skills.length };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            Diagnostic Intelligence · {conf.full}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
            Performance Analytics &amp; Visualizations
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Multi-axis competency radar, speed vs. accuracy pacing quadrants, score growth trajectories, and predictive score simulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onStartFocus(weakestSkills)}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#201e1d] flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Sprint Weakest 3</span>
          </button>
          <button
            onClick={onStartMock}
            className="btn-primary px-5 py-2.5 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Start Full Mock</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Filter Bar */}
      <div className="flex border-b-2 border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-1 text-xs font-black">
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
            className={`pb-2.5 border-b-2 -mb-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#1f3d7a] text-[#1f3d7a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* High-level Section Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sectionBreakdown.map((sec, i) => (
          <div key={i} className="p-4 bg-white border-2 border-[#201e1d]/30 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">
              {sec.name} Domain
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#1f3d7a] tabular-nums">
                {sec.avg}%
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {sec.count} skills tested
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200">
              <div
                className="h-full bg-[#1f3d7a]"
                style={{ width: `${sec.avg}%` }}
              />
            </div>
          </div>
        ))}

        <div className="p-4 bg-white border-2 border-[#201e1d]/30 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">
            Top Scoring Skill
          </span>
          <div className="text-lg font-black text-emerald-800 truncate">
            {strongestSkills[0]}
          </div>
          <div className="text-xs font-bold text-emerald-700">
            {mastery[strongestSkills[0]] ?? 50}% Mastery · Solid strength
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-[#201e1d]/30 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">
            Primary Improvement Target
          </span>
          <div className="text-lg font-black text-[#e15b47] truncate">
            {weakestSkills[0]}
          </div>
          <div className="text-xs font-bold text-[#e15b47]">
            {mastery[weakestSkills[0]] ?? 50}% Mastery · Biggest score lever
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="space-y-8">
        {/* Visual 1: Score Trajectory */}
        {(activeTab === 'all' || activeTab === 'trajectory') && (
          <ScoreTrajectoryChart
            exam={activeExam}
            history={history}
            targetScore={target}
          />
        )}

        {/* Visual 2 & 3: Radar and Pacing Quadrant */}
        {(activeTab === 'all' || activeTab === 'radar' || activeTab === 'pacing') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          </div>
        )}

        {/* Visual 4: Predictive Simulator */}
        {(activeTab === 'all' || activeTab === 'simulator') && (
          <ScoreSimulator
            exam={activeExam}
            currentScore={currentScore}
            targetScore={target}
          />
        )}

        {/* Visual 5: Study Frequency Heatmap */}
        {activeTab === 'all' && (
          <ActivityHeatmap streak={streak} />
        )}
      </div>
    </div>
  );
};
