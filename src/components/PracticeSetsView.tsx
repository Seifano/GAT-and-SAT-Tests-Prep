import React, { useState } from 'react';
import { ExamType, Question } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { ArrowRight, Check } from 'lucide-react';

interface PracticeSetsViewProps {
  activeExam: ExamType;
  bank: Question[];
  mastery: Record<string, number>;
  onStartMock: () => void;
  onStartFocus: (skills: string[]) => void;
  onStartQuick: () => void;
}

export const PracticeSetsView: React.FC<PracticeSetsViewProps> = ({
  activeExam,
  bank,
  mastery,
  onStartMock,
  onStartFocus,
  onStartQuick
}) => {
  const conf = EXAM_CONFIGS[activeExam];
  const allSkills = conf.sections.flatMap(s => s.skills);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (sk: string) => {
    setSelectedSkills(prev =>
      prev.includes(sk) ? prev.filter(s => s !== sk) : [...prev, sk]
    );
  };

  const selectAll = () => setSelectedSkills(allSkills);
  const clearAll = () => setSelectedSkills([]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="pb-4 border-b-2 border-[#201e1d]/30">
        <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
          Practice modules
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
          Choose your {activeExam} training mode
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mt-2 leading-relaxed">
          From quick 5-minute warmups to full-length timed simulations, train with purpose.
        </p>
      </div>

      {/* 3 Training Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Mock */}
        <div className="border-2 border-[#201e1d]/30 hover:border-[#1f3d7a] p-6 bg-white flex flex-col justify-between transition-all">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f3d7a] block mb-1">
              Simulation
            </span>
            <h3 className="text-xl font-black text-[#201e1d] mb-2">Full mock exam</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Simulates real test pacing, balanced section distributions, and difficulty. Generates an official projected scaled score upon completion.
            </p>
            <div className="text-xs text-slate-500 space-y-1 pt-3 border-t border-slate-200">
              <div>~45 seconds per question</div>
              <div>Balanced section coverage</div>
            </div>
          </div>

          <button
            onClick={onStartMock}
            disabled={bank.length === 0}
            className="btn-primary mt-6 w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40"
          >
            <span>Start full mock</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Min Warmup */}
        <div className="border-2 border-[#201e1d]/30 hover:border-[#1f3d7a] p-6 bg-white flex flex-col justify-between transition-all">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f3d7a] block mb-1">
              Micro practice
            </span>
            <h3 className="text-xl font-black text-[#201e1d] mb-2">5-question warmup</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              A rapid 5-question sprint drawn across random skills to maintain your daily study streak and sharpen response agility.
            </p>
            <div className="text-xs text-slate-500 space-y-1 pt-3 border-t border-slate-200">
              <div>~4–5 minutes</div>
              <div>Keeps daily streak active</div>
            </div>
          </div>

          <button
            onClick={onStartQuick}
            disabled={bank.length === 0}
            className="btn-primary mt-6 w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40"
          >
            <span>Start 5-min warmup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Targeted Focus Drill */}
        <div className="border-2 border-[#1f3d7a] p-6 bg-white flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f3d7a] block mb-1">
              Targeted drill
            </span>
            <h3 className="text-xl font-black text-[#201e1d] mb-2">Custom skill set</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Select one or multiple specific skills below to generate an intensive drill set aimed directly at your weakest areas.
            </p>
            <div className="text-xs text-slate-500 space-y-1 pt-3 border-t border-slate-200">
              <div>{selectedSkills.length ? `${selectedSkills.length} skills selected` : 'Select skills below'}</div>
              <div>Focuses on weaknesses</div>
            </div>
          </div>

          <button
            onClick={() => onStartFocus(selectedSkills.length ? selectedSkills : allSkills.slice(0, 2))}
            disabled={bank.length === 0}
            className="btn-primary mt-6 w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40"
          >
            <span>{selectedSkills.length ? `Drill ${selectedSkills.length} skills` : 'Choose skills below'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom Drill Picker */}
      <div className="space-y-4 pt-4 border-t-2 border-[#201e1d]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#201e1d]/30 pb-2">
          <div>
            <h3 className="text-base font-extrabold text-[#201e1d]">Pick skills for custom drill</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
            >
              Select all
            </button>
            <span className="text-slate-400">·</span>
            <button
              onClick={clearAll}
              className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {allSkills.map(skill => {
            const isSelected = selectedSkills.includes(skill);
            const m = mastery[skill] ?? 50;
            const availableCount = bank.filter(q => q.skill === skill).length;

            return (
              <div
                key={skill}
                onClick={() => availableCount > 0 && toggleSkill(skill)}
                className={`p-3.5 border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  availableCount === 0
                    ? 'opacity-40 bg-slate-100 border-slate-300 cursor-not-allowed'
                    : isSelected
                    ? 'border-[#1f3d7a] bg-[#1f3d7a]/5'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 border-2 flex items-center justify-center text-xs mt-0.5 shrink-0 ${
                    isSelected ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#201e1d] block truncate">{skill}</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{m}% mastery</span>
                    <span>{availableCount} items</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedSkills.length > 0 && (
          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#201e1d]">
              Ready to drill {selectedSkills.join(', ')}
            </span>
            <button
              onClick={() => onStartFocus(selectedSkills)}
              className="btn-primary py-2.5 px-5 text-white text-xs font-black cursor-pointer"
            >
              Start drill
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
