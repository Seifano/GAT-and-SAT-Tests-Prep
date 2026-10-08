import React, { useState } from 'react';
import { ExamType } from '../../types';
import { EXAM_CONFIGS } from '../../data/mockData';
import { Compass, Play, Zap } from 'lucide-react';

interface SkillRadarChartProps {
  exam: ExamType;
  mastery: Record<string, number>;
  onStartSkillDrill?: (skill: string) => void;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  exam,
  mastery,
  onStartSkillDrill
}) => {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const conf = EXAM_CONFIGS[exam];

  // Flatten all skills for this exam
  const skills = conf.sections.flatMap(s => s.skills);
  const count = skills.length;

  const size = 380;
  const center = size / 2;
  const radius = center - 58;

  // Angles for each vertex (starting at top = -PI/2)
  const angleStep = (Math.PI * 2) / count;

  const getCoordinates = (index: number, valPercent: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (valPercent / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Concentric polygon levels: 25%, 50%, 75%, 100%
  const levels = [25, 50, 75, 100];

  const hasMasteryData = Object.keys(mastery).length > 0;

  // Polygon points for mastery data (0 if not tested)
  const dataPoints = skills.map((sk, i) => {
    const val = mastery[sk] ?? 0;
    const { x, y } = getCoordinates(i, val);
    return `${x},${y}`;
  }).join(' ');

  const activeSkillObj = selectedSkill ? {
    name: selectedSkill,
    val: mastery[selectedSkill] !== undefined ? mastery[selectedSkill] : null,
    section: conf.sections.find(s => s.skills.includes(selectedSkill))?.name || 'General'
  } : null;

  return (
    <div className="bg-white border-2 border-[#201e1d]/30 p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#1f3d7a]" />
            <h3 className="text-base font-extrabold text-[#201e1d] tracking-tight">
              Domain Competency Radar
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic multi-axis balance across {exam} verbal &amp; quantitative competencies
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Target Benchmark</span>
          <span className="text-xs font-black text-[#1f3d7a]">80% Mastery</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Radar Visual (7 cols) */}
        <div className="md:col-span-7 flex justify-center relative">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[340px] h-auto select-none"
          >
            {/* Concentric Guide Polygons */}
            {levels.map((lvl, lIdx) => {
              const polyPoints = Array.from({ length: count }).map((_, i) => {
                const { x, y } = getCoordinates(i, lvl);
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={`lvl-${lIdx}`}>
                  <polygon
                    points={polyPoints}
                    fill={lvl === 100 ? '#f8fafc' : 'none'}
                    stroke={lvl === 100 ? '#cbd5e1' : '#e2e8f0'}
                    strokeWidth="1.2"
                    strokeDasharray={lvl === 75 ? '3 3' : ''}
                  />
                  <text
                    x={center + 3}
                    y={center - (lvl / 100) * radius + 10}
                    fontSize="9"
                    fill="#94a3b8"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {lvl}%
                  </text>
                </g>
              );
            })}

            {/* Axis Spokes from center to edge */}
            {skills.map((_, i) => {
              const { x, y } = getCoordinates(i, 100);
              return (
                <line
                  key={`spoke-${i}`}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}

            {/* Benchmark 80% Ring */}
            <polygon
              points={Array.from({ length: count }).map((_, i) => {
                const { x, y } = getCoordinates(i, 80);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              opacity="0.8"
            />

            {/* Student's Actual Mastery Area Polygon */}
            {hasMasteryData && (
              <polygon
                points={dataPoints}
                fill="#1f3d7a"
                fillOpacity="0.28"
                stroke="#1f3d7a"
                strokeWidth="2.8"
              />
            )}

            {/* Vertices & Skill Labels */}
            {skills.map((sk, i) => {
              const isAssessed = mastery[sk] !== undefined;
              const val = isAssessed ? mastery[sk] : 0;
              const { x, y } = getCoordinates(i, val);
              const labelPos = getCoordinates(i, 116);
              const isSelected = selectedSkill === sk;

              return (
                <g
                  key={`vert-${i}`}
                  onClick={() => setSelectedSkill(sk)}
                  className="cursor-pointer group"
                >
                  {/* Skill Label around outer perimeter */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 3}
                    textAnchor={labelPos.x > center + 10 ? 'start' : labelPos.x < center - 10 ? 'end' : 'middle'}
                    fontSize="9.5"
                    fill={isSelected ? '#1f3d7a' : isAssessed ? '#334155' : '#94a3b8'}
                    fontWeight={isSelected ? '900' : isAssessed ? '700' : '500'}
                    className="hover:fill-[#1f3d7a] transition-colors"
                  >
                    {sk.length > 14 ? sk.slice(0, 12) + '…' : sk}
                  </text>

                  {/* Node point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : isAssessed ? 4 : 3}
                    fill={!isAssessed ? '#cbd5e1' : val >= 75 ? '#10b981' : val >= 55 ? '#1f3d7a' : '#e15b47'}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                </g>
              );
            })}
          </svg>

          {!hasMasteryData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
              <div className="bg-white/95 backdrop-blur-xs p-4 border border-slate-300 shadow-sm text-center max-w-[220px]">
                <Compass className="w-5 h-5 text-[#1f3d7a] mx-auto mb-1.5" />
                <span className="text-xs font-black text-[#201e1d] block">Unassessed Radar</span>
                <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                  Complete questions to generate your diagnostic polygon
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Skill Inspector / Drilldown (5 cols) */}
        <div className="md:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-200 text-xs">
          {activeSkillObj ? (
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {activeSkillObj.section}
                </span>
                <h4 className="text-base font-extrabold text-[#201e1d]">{activeSkillObj.name}</h4>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-600">Mastery Level</span>
                  <span className="text-sm font-black text-[#1f3d7a]">
                    {activeSkillObj.val !== null ? `${activeSkillObj.val}%` : 'Unassessed'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${
                      activeSkillObj.val === null
                        ? 'bg-slate-300'
                        : activeSkillObj.val >= 75
                        ? 'bg-emerald-500'
                        : activeSkillObj.val >= 55
                        ? 'bg-[#1f3d7a]'
                        : 'bg-[#e15b47]'
                    }`}
                    style={{ width: `${activeSkillObj.val ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-600 leading-relaxed">
                {activeSkillObj.val === null ? (
                  <span className="text-slate-500 font-semibold">
                    Not yet assessed in completed test sessions. Practice questions in this skill to calculate mastery.
                  </span>
                ) : activeSkillObj.val >= 80 ? (
                  <span className="text-emerald-700 font-semibold">
                    ✓ Strong retention. Maintain accuracy with periodic warmups.
                  </span>
                ) : activeSkillObj.val >= 60 ? (
                  <span className="text-slate-700">
                    ▲ Approaching benchmark. Practice 5–10 problems to push over 80%.
                  </span>
                ) : (
                  <span className="text-red-700 font-bold">
                    ⚠️ Priority improvement area. Low score here is dragging down your total.
                  </span>
                )}
              </div>

              {onStartSkillDrill && (
                <button
                  onClick={() => onStartSkillDrill(activeSkillObj.name)}
                  className="btn-primary w-full py-2 px-3 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Practice {activeSkillObj.name}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-center py-6">
              <Compass className="w-8 h-8 text-slate-400 mx-auto stroke-[1.5]" />
              <div className="font-extrabold text-[#201e1d] text-sm">Select Any Skill Axis</div>
              <p className="text-slate-500 text-[11px] max-w-[200px] mx-auto">
                Click any node on the spider chart to inspect mastery, target gap, and launch instant practice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
