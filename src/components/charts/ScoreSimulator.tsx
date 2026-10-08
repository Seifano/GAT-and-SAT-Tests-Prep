import React, { useState } from 'react';
import { ExamType } from '../../types';
import { EXAM_CONFIGS } from '../../data/mockData';
import { Calculator, Sparkles, Award, ArrowRight } from 'lucide-react';

interface ScoreSimulatorProps {
  exam: ExamType;
  currentScore: number;
  targetScore: number;
}

export const ScoreSimulator: React.FC<ScoreSimulatorProps> = ({
  exam,
  currentScore,
  targetScore
}) => {
  const isGAT = exam === 'GAT';
  const conf = EXAM_CONFIGS[exam];

  // Sliders: section 1 gains and section 2 gains (in questions correct)
  const [section1Gain, setSection1Gain] = useState(3);
  const [section2Gain, setSection2Gain] = useState(2);

  // Points per additional question
  const ptsPerQ = exam === 'GAT' ? 0.75 : exam === 'NAFS' ? 12 : 18;

  // Projected score
  const totalGain = Math.round((section1Gain + section2Gain) * ptsPerQ);
  const projectedScore = Math.min(conf.max, currentScore + totalGain);

  const getPercentile = (s: number) => {
    if (exam === 'NAFS') {
      if (s >= 700) return 98;
      if (s >= 650) return 92;
      if (s >= 600) return 85;
      if (s >= 550) return 74;
      if (s >= 500) return 60;
      if (s >= 450) return 45;
      return 30;
    }
    if (isGAT) {
      if (s >= 95) return 99;
      if (s >= 90) return 96;
      if (s >= 85) return 91;
      if (s >= 80) return 83;
      if (s >= 75) return 72;
      if (s >= 70) return 58;
      return 40;
    } else {
      if (s >= 1550) return 99;
      if (s >= 1500) return 98;
      if (s >= 1450) return 96;
      if (s >= 1400) return 93;
      if (s >= 1350) return 89;
      if (s >= 1300) return 84;
      if (s >= 1200) return 74;
      return 55;
    }
  };

  const getAdmissionTier = (s: number) => {
    if (isGAT) {
      if (s >= 90) return { tier: 'Tier 1 Elite', target: 'KFUPM, Medicine & Direct Engineering (Top 3% national)' };
      if (s >= 85) return { tier: 'Highly Competitive', target: 'KSU, KAU Health Sciences & Computing programs' };
      if (s >= 80) return { tier: 'Competitive Tier', target: 'Top University General Admission & Standard Engineering' };
      return { tier: 'Standard Tier', target: 'Accredited University programs' };
    } else {
      if (s >= 1500) return { tier: 'Tier 1 Global', target: 'Ivy League, MIT, Stanford, Oxford & Cambridge' };
      if (s >= 1400) return { tier: 'Top 30 Global', target: 'UCLA, Berkeley, NYU, Top International Scholarships' };
      if (s >= 1300) return { tier: 'Selective Tier', target: 'Top 100 Global & Major Honors Colleges' };
      return { tier: 'Standard Tier', target: 'Standard university admissions' };
    }
  };

  const currentPercentile = getPercentile(currentScore);
  const projectedPercentile = getPercentile(projectedScore);
  const tierInfo = getAdmissionTier(projectedScore);

  const sec1Name = isGAT ? 'Verbal Section' : 'Reading & Writing';
  const sec2Name = isGAT ? 'Quantitative Section' : 'Mathematics';

  return (
    <div className="bg-white border-2 border-[#201e1d]/30 p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#1f3d7a]" />
            <h3 className="text-base font-extrabold text-[#201e1d] tracking-tight">
              Predictive Score Impact Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Model how modest question gains in each section transform your score and standing
          </p>
        </div>

        <div className="px-2.5 py-1 bg-amber-50 border border-amber-300 text-[11px] font-black text-amber-900">
          Interactive Model
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Slider 1 */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#201e1d]">{sec1Name} Additional Correct Answers</span>
              <span className="font-mono text-sm font-black text-[#1f3d7a]">+{section1Gain} Qs</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              value={section1Gain}
              onChange={e => setSection1Gain(Number(e.target.value))}
              className="w-full accent-[#1f3d7a] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>+0 Qs</span>
              <span>+6 Qs</span>
              <span>+12 Qs</span>
            </div>
          </div>

          {/* Slider 2 */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#201e1d]">{sec2Name} Additional Correct Answers</span>
              <span className="font-mono text-sm font-black text-[#1f3d7a]">+{section2Gain} Qs</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              value={section2Gain}
              onChange={e => setSection2Gain(Number(e.target.value))}
              className="w-full accent-[#1f3d7a] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>+0 Qs</span>
              <span>+6 Qs</span>
              <span>+12 Qs</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 border border-slate-200">
            💡 <strong>Pacing Strategy:</strong> Converting just <strong>+{section1Gain + section2Gain} total questions</strong> correctly yields an estimated <strong>+{totalGain} scaled points</strong>.
          </div>
        </div>

        {/* Projection Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0a1730] to-[#1f3d7a] text-white p-5 space-y-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Simulated Outcome</span>
          </div>

          <div className="flex items-baseline justify-between border-b border-blue-400/30 pb-3">
            <div>
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                {projectedScore}
              </span>
              <span className="text-xs text-blue-200 font-bold ml-1.5">
                (was {currentScore})
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-300 block">
                +{totalGain} pts
              </span>
              <span className="text-[10px] text-blue-200 font-bold">gain</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-blue-100">
              <span>National Standing:</span>
              <span className="font-black text-white">
                {currentPercentile}th → <strong className="text-emerald-300">{projectedPercentile}th %ile</strong>
              </span>
            </div>
            <div className="flex justify-between text-blue-100">
              <span>Projected Tier:</span>
              <span className="font-black text-amber-300">{tierInfo.tier}</span>
            </div>
            <div className="text-[11px] text-blue-200 pt-1 leading-relaxed border-t border-blue-400/20">
              {tierInfo.target}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
