import React, { useState } from 'react';
import { ExamType } from '../../types';
import { EXAM_CONFIGS } from '../../data/mockData';
import { TrendingUp, Award, Target, HelpCircle } from 'lucide-react';

interface ScorePoint {
  score: number;
  date: string;
  kind: string;
}

interface ScoreTrajectoryChartProps {
  exam: ExamType;
  history: ScorePoint[];
  targetScore: number;
}

export const ScoreTrajectoryChart: React.FC<ScoreTrajectoryChartProps> = ({
  exam,
  history,
  targetScore
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'recent'>('all');

  const conf = EXAM_CONFIGS[exam];
  const isGAT = exam === 'GAT';

  // Compute percentile estimate from score
  const getPercentile = (score: number) => {
    if (isGAT) {
      if (score >= 95) return 99;
      if (score >= 90) return 96;
      if (score >= 85) return 91;
      if (score >= 80) return 83;
      if (score >= 75) return 72;
      if (score >= 70) return 58;
      if (score >= 65) return 44;
      return 30;
    } else {
      if (score >= 1550) return 99;
      if (score >= 1500) return 98;
      if (score >= 1450) return 96;
      if (score >= 1400) return 93;
      if (score >= 1350) return 89;
      if (score >= 1300) return 84;
      if (score >= 1200) return 74;
      if (score >= 1100) return 60;
      return 45;
    }
  };

  const hasData = history && history.length > 0;
  const rawData = hasData ? history : [];
  const data = filterMode === 'recent' ? rawData.slice(-5) : rawData;

  if (!hasData) {
    return (
      <div className="bg-white border-2 border-[#201e1d]/30 p-6 sm:p-8 space-y-4 text-center">
        <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded-none flex items-center justify-center mx-auto text-[#1f3d7a]">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-base font-extrabold text-[#201e1d]">No Verified Test Attempts Yet</h3>
          <p className="text-xs text-slate-600 mt-1">
            Complete your first diagnostic test or full timed mock exam to plot your authentic scaled score trajectory, percentile growth, and target gap.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
          <Target className="w-4 h-4 text-[#1f3d7a]" />
          <span>Configured Target: {targetScore}</span>
        </div>
      </div>
    );
  }

  // Min and max bounds for y-axis
  const scores = data.map(d => d.score);
  const minScore = Math.max(conf.min, Math.min(...scores, targetScore) - (isGAT ? 8 : 80));
  const maxScore = Math.min(conf.max, Math.max(...scores, targetScore) + (isGAT ? 6 : 60));
  const scoreRange = Math.max(1, maxScore - minScore);

  // SVG dimensions
  const width = 640;
  const height = 240;
  const padding = { top: 30, right: 35, bottom: 40, left: 55 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Coordinate mapping functions
  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (data.length - 1)) * graphWidth;
  };

  const getY = (score: number) => {
    const norm = (score - minScore) / scoreRange;
    return padding.top + (1 - norm) * graphHeight;
  };

  // Generate polyline and area path
  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  const areaPoints = `${getX(0)},${padding.top + graphHeight} ${points} ${getX(data.length - 1)},${padding.top + graphHeight}`;

  // Target line Y
  const targetY = getY(targetScore);

  // Benchmarks for reference lines
  const benchmarks = isGAT
    ? [
        { label: 'Tier 1 Top 5% (88+)', score: 88, color: '#f59e0b' },
        { label: 'Competitive (80+)', score: 80, color: '#94a3b8' }
      ]
    : [
        { label: 'Ivy / Top 2% (1480+)', score: 1480, color: '#f59e0b' },
        { label: 'Top Tier (1350+)', score: 1350, color: '#94a3b8' }
      ];

  const baselineScore = data[0].score;
  const latestScore = data[data.length - 1].score;
  const delta = latestScore - baselineScore;
  const currentPercentile = getPercentile(latestScore);

  return (
    <div className="bg-white border-2 border-[#201e1d]/30 p-5 sm:p-6 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1f3d7a]" />
            <h3 className="text-base font-extrabold text-[#201e1d] tracking-tight">
              Score Trajectory &amp; Growth Curve
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified testing progress toward your {targetScore} target
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Growth Delta Tag */}
          <div className={`px-2.5 py-1 text-xs font-black flex items-center gap-1 ${
            delta >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-red-50 text-red-800 border border-red-300'
          }`}>
            <span>{delta >= 0 ? `+${delta}` : delta} pts total growth</span>
          </div>

          {/* Timeframe Filter */}
          <div className="inline-flex border border-slate-300 bg-slate-50">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${
                filterMode === 'all' ? 'bg-[#1f3d7a] text-white' : 'text-slate-600 hover:text-black'
              }`}
            >
              All ({rawData.length})
            </button>
            <button
              onClick={() => setFilterMode('recent')}
              className={`px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${
                filterMode === 'recent' ? 'bg-[#1f3d7a] text-white' : 'text-slate-600 hover:text-black'
              }`}
            >
              Recent 5
            </button>
          </div>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px] font-bold">Latest Score</span>
          <span className="text-lg font-black text-[#1f3d7a] tabular-nums">{latestScore}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px] font-bold">Estimated Standing</span>
          <span className="text-lg font-black text-emerald-700 tabular-nums">{currentPercentile}th <span className="text-xs font-bold text-slate-500">Percentile</span></span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px] font-bold">Target Score</span>
          <span className="text-lg font-black text-[#201e1d] tabular-nums">{targetScore}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px] font-bold">Gap to Target</span>
          <span className={`text-lg font-black tabular-nums ${targetScore - latestScore <= 0 ? 'text-emerald-700' : 'text-[#e15b47]'}`}>
            {targetScore - latestScore <= 0 ? 'Goal Achieved' : `${targetScore - latestScore} pts to go`}
          </span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          <defs>
            <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f3d7a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1f3d7a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const yVal = padding.top + ratio * graphHeight;
            const scoreLabel = Math.round(maxScore - ratio * scoreRange);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yVal}
                  x2={width - padding.right}
                  y2={yVal}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 || ratio === 1 ? '' : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={yVal + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {scoreLabel}
                </text>
              </g>
            );
          })}

          {/* Benchmark Reference Lines */}
          {benchmarks.map((bm, i) => {
            if (bm.score < minScore || bm.score > maxScore) return null;
            const bY = getY(bm.score);
            return (
              <g key={`bm-${i}`}>
                <line
                  x1={padding.left}
                  y1={bY}
                  x2={width - padding.right}
                  y2={bY}
                  stroke={bm.color}
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - padding.right - 4}
                  y={bY - 4}
                  textAnchor="end"
                  fontSize="9.5"
                  fill={bm.color}
                  fontWeight="800"
                >
                  {bm.label}
                </text>
              </g>
            );
          })}

          {/* Target Reference Line */}
          {targetScore >= minScore && targetScore <= maxScore && (
            <g>
              <line
                x1={padding.left}
                y1={targetY}
                x2={width - padding.right}
                y2={targetY}
                stroke="#1f3d7a"
                strokeWidth="1.8"
                strokeDasharray="5 5"
              />
              <rect
                x={width - padding.right - 95}
                y={targetY - 11}
                width="95"
                height="18"
                fill="#1f3d7a"
                rx="0"
              />
              <text
                x={width - padding.right - 48}
                y={targetY + 2}
                textAnchor="middle"
                fontSize="10"
                fill="#ffffff"
                fontWeight="900"
              >
                Target: {targetScore}
              </text>
            </g>
          )}

          {/* Area Gradient Fill */}
          <polygon points={areaPoints} fill="url(#scoreAreaGrad)" />

          {/* Connected Trend Line */}
          <polyline
            fill="none"
            stroke="#1f3d7a"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* X Axis Date Labels */}
          {data.map((d, i) => (
            <text
              key={`x-${i}`}
              x={getX(i)}
              y={height - 12}
              textAnchor="middle"
              fontSize="10.5"
              fill={hoveredIdx === i ? '#1f3d7a' : '#64748b'}
              fontWeight={hoveredIdx === i ? '900' : '600'}
            >
              {d.date}
            </text>
          ))}

          {/* Interactive Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.score);
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={`p-${i}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Hit area */}
                <circle cx={cx} cy={cy} r="18" fill="transparent" />

                {/* Outer halo on hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="9"
                    fill="#1f3d7a"
                    fillOpacity="0.2"
                  />
                )}

                {/* Point dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? '6' : '4.5'}
                  fill="#ffffff"
                  stroke="#1f3d7a"
                  strokeWidth={isHovered ? '3.5' : '2.5'}
                />

                {/* Score label above point */}
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#1f3d7a"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {d.score}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute z-20 pointer-events-none bg-[#201e1d] text-white text-xs p-2.5 shadow-xl border border-slate-700 min-w-[150px]"
            style={{
              left: `${Math.min(78, Math.max(12, (hoveredIdx / (data.length - 1 || 1)) * 100))}%`,
              top: '10px'
            }}
          >
            <div className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">
              {data[hoveredIdx].kind || 'Mock Exam'} · {data[hoveredIdx].date}
            </div>
            <div className="text-base font-black text-white mt-0.5">
              Score: {data[hoveredIdx].score} <span className="text-xs font-normal text-slate-300">/ {conf.max}</span>
            </div>
            <div className="text-[11px] text-emerald-300 font-bold mt-1">
              {getPercentile(data[hoveredIdx].score)}th national percentile
            </div>
            {hoveredIdx > 0 && (
              <div className="text-[10px] text-slate-400 mt-1">
                {data[hoveredIdx].score - data[hoveredIdx - 1].score >= 0 ? '+' : ''}
                {data[hoveredIdx].score - data[hoveredIdx - 1].score} pts vs previous attempt
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
