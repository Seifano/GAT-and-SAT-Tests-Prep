import React, { useState } from 'react';
import { ExamType, Question } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { ArrowRight, Check, Zap, Target, Sparkles, BookOpen } from 'lucide-react';

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
      <div className="pb-6 border-b border-slate-300 min-w-0">
        <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
          Gamified Training Grounds
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
          Choose Your {activeExam} Training Arena
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mt-1.5 leading-relaxed break-words">
          From high-velocity warmup sprints to full-length timed simulations, earn XP and level up your mastery with every completed set.
        </p>
      </div>

      {/* 3 Training Modes Grid with XP Tags & Hover Lift */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Mock */}
        <div className="border border-slate-300 hover:border-[#1f3d7a] p-6 bg-white flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-sm group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f3d7a] block">
                Official Simulation
              </span>
              <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5">
                +200 XP
              </span>
            </div>
            <h3 className="text-xl font-black text-[#201e1d] mb-2 group-hover:text-[#1f3d7a] transition-colors">
              Full Mock Exam
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Simulates authentic test pacing, balanced section distributions, and difficulty. Generates an official projected scaled score upon completion.
            </p>
            <div className="text-xs text-slate-500 space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1f3d7a] rounded-full" />
                <span>~48 seconds per question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1f3d7a] rounded-full" />
                <span>Full diagnostic report upon submission</span>
              </div>
            </div>
          </div>

          <button
            onClick={onStartMock}
            disabled={bank.length === 0}
            className="btn-primary mt-6 w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <span>Launch Mock Exam</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Min Warmup */}
        <div className="border border-slate-300 hover:border-[#1f3d7a] p-6 bg-white flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-sm group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f3d7a] block">
                Agility Sprint
              </span>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                +50 XP
              </span>
            </div>
            <h3 className="text-xl font-black text-[#201e1d] mb-2 group-hover:text-[#1f3d7a] transition-colors">
              5-Question Warmup
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              A rapid 5-question sprint drawn across random skills to maintain your daily study streak and sharpen response agility.
            </p>
            <div className="text-xs text-slate-500 space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                <span>~4–5 minutes duration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                <span>Protects daily study streak flame</span>
              </div>
            </div>
          </div>

          <button
            onClick={onStartQuick}
            disabled={bank.length === 0}
            className="btn-primary mt-6 w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <span>Start 5-Min Sprint</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Targeted Focus Drill */}
        <div className="border-2 border-[#1f3d7a] p-6 bg-white flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f3d7a] block">
                Custom Drill
              </span>
              <span className="text-[10px] font-black text-blue-800 bg-blue-50 border border-blue-300 px-2 py-0.5">
                +75 XP
              </span>
            </div>
            <h3 className="text-xl font-black text-[#201e1d] mb-2 group-hover:text-[#1f3d7a] transition-colors">
              Targeted Skill Sprint
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Select one or multiple specific skills below to generate an intensive drill set aimed directly at your weakest areas.
            </p>
            <div className="text-xs text-slate-500 space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1f3d7a] rounded-full" />
                <span>{selectedSkills.length ? `${selectedSkills.length} skills selected` : 'Select skills below'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1f3d7a] rounded-full" />
                <span>Precision focus on lowest-mastery items</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onStartFocus(selectedSkills.length ? selectedSkills : allSkills.slice(0, 2))}
            disabled={bank.length === 0}
            className="btn-primary mt-6 w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <span>{selectedSkills.length ? `Drill ${selectedSkills.length} Skills` : 'Choose Skills Below'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom Drill Picker */}
      <div className="space-y-4 pt-6 border-t border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#201e1d]">Select Skills for Practice Drill</h3>
            <span className="text-xs text-slate-500">Pick any combination of skills to build your personalized quiz set</span>
          </div>
          <div className="flex gap-3 text-xs">
            <button
              onClick={selectAll}
              className="font-bold text-[#1f3d7a] hover:underline cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-400">·</span>
            <button
              onClick={clearAll}
              className="font-bold text-slate-600 hover:text-black cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {allSkills.map(skill => {
            const isSelected = selectedSkills.includes(skill);
            const isAssessed = mastery[skill] !== undefined;
            const m = isAssessed ? mastery[skill] : 0;
            const availableCount = bank.filter(q => q.skill === skill).length;

            return (
              <div
                key={skill}
                onClick={() => availableCount > 0 && toggleSkill(skill)}
                className={`p-4 border transition-all duration-200 flex items-start gap-3.5 ${
                  availableCount === 0
                    ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                    : isSelected
                    ? 'border-[#1f3d7a] bg-blue-50/50 shadow-xs cursor-pointer'
                    : 'border-slate-300 bg-white hover:border-[#1f3d7a] hover:shadow-sm cursor-pointer'
                }`}
              >
                <div
                  className={`w-5 h-5 border flex items-center justify-center text-xs mt-0.5 shrink-0 transition-colors ${
                    isSelected ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#201e1d] block truncate">{skill}</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{isAssessed ? `${m}% mastery` : 'Unassessed'}</span>
                    <span className="font-mono">{availableCount} Qs</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedSkills.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-fadeIn">
            <span className="text-xs font-bold text-[#1f3d7a]">
              Ready to drill {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''}: {selectedSkills.join(', ')}
            </span>
            <button
              onClick={() => onStartFocus(selectedSkills)}
              className="btn-primary py-2.5 px-5 text-white text-xs font-black cursor-pointer shadow-sm hover:shadow-md transition-all shrink-0"
            >
              Start Custom Drill (+75 XP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
