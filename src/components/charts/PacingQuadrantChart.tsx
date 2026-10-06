import React, { useState } from 'react';
import { ExamType } from '../../types';
import { EXAM_CONFIGS } from '../../data/mockData';
import { Clock, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PacingQuadrantChartProps {
  exam: ExamType;
  mastery: Record<string, number>;
  onStartSkillDrill?: (skill: string) => void;
}

export const PacingQuadrantChart: React.FC<PacingQuadrantChartProps> = ({
  exam,
  mastery,
  onStartSkillDrill
}) => {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const conf = EXAM_CONFIGS[exam];
  const isGAT = exam === 'GAT';

  // Benchmark pacing targets
  const targetSec = isGAT ? 50 : 78;

  // Generate realistic pacing stats for each skill based on mastery
  const skills = conf.sections.flatMap(s => s.skills);
  const data = skills.map((sk, i) => {
    const acc = mastery[sk] ?? 55;
    // Estimated time per question: harder skills take more time
    const seed = (i * 7 + 13) % 19;
    const estimatedTime = Math.round(
      targetSec + (100 - acc) * 0.35 + (seed - 9) * 1.5
    );
    return {
      skill: sk,
      accuracy: acc,
      time: Math.max(isGAT ? 25 : 45, Math.min(isGAT ? 85 : 125, estimatedTime)),
      section: conf.sections.find(s => s.skills.includes(sk))?.name || 'General'
    };
  });

  const width = 580;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const minTime = isGAT ? 25 : 40;
  const maxTime = isGAT ? 80 : 120;
  const minAcc = 35;
  const maxAcc = 100;

  const getX = (t: number) => {
    const norm = (t - minTime) / (maxTime - minTime);
    return padding.left + norm * graphWidth;
  };

  const getY = (a: number) => {
    const norm = (a - minAcc) / (maxAcc - minAcc);
    return padding.top + (1 - norm) * graphHeight;
  };

  const splitX = getX(targetSec);
  const splitY = getY(70);

  return (
    <div className="bg-white border-2 border-[#201e1d]/30 p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1f3d7a]" />
            <h3 className="text-base font-extrabold text-[#201e1d] tracking-tight">
              Speed vs. Accuracy Quadrant
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnose whether score gaps stem from rushing vs. conceptual friction
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-bold">Standard Target:</span>
          <span className="font-mono font-black text-[#1f3d7a]">{targetSec}s / question · &gt;70% Accuracy</span>
        </div>
      </div>

      {/* SVG Quadrant Graph */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Quadrant Background Shading */}
          {/* Top-Left: Fast & High Acc (Optimal) */}
          <rect
            x={padding.left}
            y={padding.top}
            width={splitX - padding.left}
            height={splitY - padding.top}
            fill="#10b981"
            fillOpacity="0.05"
          />
          {/* Top-Right: Slow & High Acc (Needs Pacing) */}
          <rect
            x={splitX}
            y={padding.top}
            width={width - padding.right - splitX}
            height={splitY - padding.top}
            fill="#3b82f6"
            fillOpacity="0.04"
          />
          {/* Bottom-Left: Fast & Low Acc (Rushed/Careless) */}
          <rect
            x={padding.left}
            y={splitY}
            width={splitX - padding.left}
            height={height - padding.bottom - splitY}
            fill="#f59e0b"
            fillOpacity="0.05"
          />
          {/* Bottom-Right: Slow & Low Acc (Critical Focus) */}
          <rect
            x={splitX}
            y={splitY}
            width={width - padding.right - splitX}
            height={height - padding.bottom - splitY}
            fill="#e15b47"
            fillOpacity="0.06"
          />

          {/* Quadrant Watermark Labels */}
          <text x={padding.left + 8} y={padding.top + 16} fontSize="10" fill="#059669" fontWeight="800">
            OPTIMAL (FAST &amp; ACCURATE)
          </text>
          <text x={width - padding.right - 8} y={padding.top + 16} textAnchor="end" fontSize="10" fill="#2563eb" fontWeight="800">
            ACCURATE BUT SLOW
          </text>
          <text x={padding.left + 8} y={height - padding.bottom - 8} fontSize="10" fill="#d97706" fontWeight="800">
            RUSHED / CARELESS
          </text>
          <text x={width - padding.right - 8} y={height - padding.bottom - 8} textAnchor="end" fontSize="10" fill="#dc2626" fontWeight="800">
            HIGH FRICTION (CRITICAL)
          </text>

          {/* Threshold Divider Lines */}
          <line
            x1={splitX}
            y1={padding.top}
            x2={splitX}
            y2={height - padding.bottom}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <line
            x1={padding.left}
            y1={splitY}
            x2={width - padding.right}
            y2={splitY}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* X Axis & Label */}
          <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#475569" fontWeight="700">
            Average Time (Seconds / Question) →
          </text>

          {/* Y Axis & Label */}
          <text
            x={12}
            y={height / 2}
            textAnchor="middle"
            fontSize="11"
            fill="#475569"
            fontWeight="700"
            transform={`rotate(-90 12 ${height / 2})`}
          >
            Accuracy % →
          </text>

          {/* Data Points */}
          {data.map((d, i) => {
            const cx = getX(d.time);
            const cy = getY(d.accuracy);
            const isHovered = hoveredSkill === d.skill;

            // Color coding based on quadrant
            const isAccurate = d.accuracy >= 70;
            const isFast = d.time <= targetSec;
            const dotColor = isAccurate && isFast
              ? '#10b981'
              : isAccurate && !isFast
              ? '#2563eb'
              : !isAccurate && isFast
              ? '#f59e0b'
              : '#dc2626';

            return (
              <g
                key={`pacing-${i}`}
                onMouseEnter={() => setHoveredSkill(d.skill)}
                onMouseLeave={() => setHoveredSkill(null)}
                className="cursor-pointer"
              >
                <circle cx={cx} cy={cy} r="14" fill="transparent" />
                {isHovered && <circle cx={cx} cy={cy} r="10" fill={dotColor} fillOpacity="0.25" />}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6.5 : 5}
                  fill={dotColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#1e293b"
                  fontWeight="800"
                >
                  {d.skill.length > 10 ? d.skill.slice(0, 8) + '…' : d.skill}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredSkill && (() => {
          const item = data.find(d => d.skill === hoveredSkill);
          if (!item) return null;
          return (
            <div className="absolute top-2 right-2 bg-[#201e1d] text-white p-3 text-xs shadow-xl border border-slate-700 min-w-[200px] z-10">
              <div className="font-extrabold text-white text-sm">{item.skill}</div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">{item.section}</div>
              <div className="mt-2 space-y-1 text-slate-200">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-black text-white">{item.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pacing:</span>
                  <span className="font-black text-white">{item.time}s / q</span>
                </div>
              </div>
              {onStartSkillDrill && (
                <button
                  onClick={() => onStartSkillDrill(item.skill)}
                  className="mt-2.5 w-full py-1.5 bg-[#1f3d7a] hover:bg-blue-600 text-white font-bold text-[11px] cursor-pointer"
                >
                  Launch Pacing Sprint
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
