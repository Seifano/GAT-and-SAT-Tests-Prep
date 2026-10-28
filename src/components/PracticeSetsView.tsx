import React, { useState } from 'react';
import { ExamType, Question, UserAccount, DifficultyLevel } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import {
  ArrowRight,
  Check,
  Zap,
  Target,
  BookOpen,
  Sparkles,
  Flame,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Award
} from 'lucide-react';
import { getQuestionDifficulty, getDifficultyBadgeColor, getDifficultyLabel } from '../utils/difficulty';
import { Language } from '../utils/i18n';

interface PracticeSetsViewProps {
  activeExam: ExamType;
  bank: Question[];
  mastery: Record<string, number>;
  currentUser?: UserAccount | null;
  onStartMock: (difficulty?: DifficultyLevel) => void;
  onStartFocus: (skills: string[], difficulty?: DifficultyLevel) => void;
  onStartQuick: (difficulty?: DifficultyLevel) => void;
  language?: Language;
}

export const PracticeSetsView: React.FC<PracticeSetsViewProps> = ({
  activeExam,
  bank,
  mastery,
  currentUser,
  onStartMock,
  onStartFocus,
  onStartQuick,
  language = 'en'
}) => {
  const conf = EXAM_CONFIGS[activeExam];
  const allSkills = (() => {
    if (currentUser?.role === 'Student' && activeExam === 'NAFS') {
      if (currentUser.studentLevel === 'Grade 6') {
        const sec = conf.sections.find(s => s.name.includes('Grade 6') || s.name.includes('G6'));
        return sec ? Array.from(new Set(sec.skills)) : Array.from(new Set(conf.sections.flatMap(s => s.skills)));
      }
      if (currentUser.studentLevel === 'Grade 9') {
        const sec = conf.sections.find(s => s.name.includes('Grade 9') || s.name.includes('G9'));
        return sec ? Array.from(new Set(sec.skills)) : Array.from(new Set(conf.sections.flatMap(s => s.skills)));
      }
    }
    return Array.from(new Set(conf.sections.flatMap(s => s.skills)));
  })();

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [previewFilter, setPreviewFilter] = useState<DifficultyLevel | 'All'>('All');
  const [expandedQId, setExpandedQId] = useState<string | null>(null);

  const toggleSkill = (sk: string) => {
    setSelectedSkills(prev =>
      prev.includes(sk) ? prev.filter(s => s !== sk) : [...prev, sk]
    );
  };

  const selectAll = () => setSelectedSkills(allSkills);
  const clearAll = () => setSelectedSkills([]);

  // Calculate difficulty counts for the current accessible bank
  const easyCount = bank.filter(q => getQuestionDifficulty(q) === 'Easy').length;
  const mediumCount = bank.filter(q => getQuestionDifficulty(q) === 'Medium').length;
  const hardCount = bank.filter(q => getQuestionDifficulty(q) === 'Hard').length;

  const effectiveDifficulty = selectedDifficulty !== 'All' ? selectedDifficulty : undefined;

  // Filter questions for the question bank preview list
  const previewQuestions = bank.filter(q => {
    if (previewFilter !== 'All' && getQuestionDifficulty(q) !== previewFilter) return false;
    if (selectedSkills.length > 0 && !selectedSkills.includes(q.skill)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans animate-viewFadeIn">
      {/* Header Banner with School Heritage Colors */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>
                {currentUser?.role === 'Student' && currentUser.studentLevel
                  ? `${currentUser.studentLevel} · ${activeExam} Practice Arena`
                  : `${activeExam} Examination Arena`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {language === 'ar' ? 'اختر ساحة التدريب ومستوى الصعوبة' : 'Choose Your Practice Arena & Difficulty Mode'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              {language === 'ar'
                ? 'حدد مستوى الصعوبة المناسب لك (سهل، متوسط، صعب) واصقل مهاراتك من خلال الاختبارات المحاكية السريعة أو بنك الأسئلة التفاعلي.'
                : 'Select your preferred challenge tier (Easy, Medium, Hard) or launch full-length timed simulations to level up your mastery with every completed set.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
            <div className="text-center px-3 border-r border-white/20">
              <span className="text-lg font-black text-white block">{bank.length}</span>
              <span className="text-[10px] text-blue-200 uppercase tracking-wider font-bold">Total Qs</span>
            </div>
            <div className="text-center px-3 border-r border-white/20">
              <span className="text-lg font-black text-emerald-300 block">{easyCount}</span>
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-bold">Easy</span>
            </div>
            <div className="text-center px-3 border-r border-white/20">
              <span className="text-lg font-black text-blue-300 block">{mediumCount}</span>
              <span className="text-[10px] text-blue-200 uppercase tracking-wider font-bold">Medium</span>
            </div>
            <div className="text-center px-3">
              <span className="text-lg font-black text-rose-300 block">{hardCount}</span>
              <span className="text-[10px] text-rose-200 uppercase tracking-wider font-bold">Hard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Mode Selector Bar (School Colors: Navy, Crimson, Green) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-700" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {language === 'ar' ? 'مستوى صعوبة التدريب (Difficulty Mode)' : 'Target Practice Difficulty Mode'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'اختر مستوى الصعوبة لتصفية بنك الأسئلة أو بدء اختبار مصمم خصيصاً لمستواك'
                : 'Select a difficulty tier to prioritize in your mock exams, warmups, and custom drills'}
            </p>
          </div>
          {selectedDifficulty !== 'All' && (
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/80 self-start sm:self-auto">
              ✓ {selectedDifficulty} Mode Active
            </span>
          )}
        </div>

        {/* 4 Difficulty Pills with School Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          {/* Mode 1: All Modes (Mixed) */}
          <button
            type="button"
            onClick={() => setSelectedDifficulty('All')}
            className={`p-3.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-center justify-between ${
              selectedDifficulty === 'All'
                ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div>
              <span className="text-xs font-black text-slate-900 block">
                {language === 'ar' ? 'جميع المستويات (مختلط)' : 'All Difficulties (Mixed)'}
              </span>
              <span className="text-[11px] text-slate-500">
                {language === 'ar' ? 'توزيع متوازن كالاختبار الرسمي' : 'Balanced official exam pacing'}
              </span>
            </div>
            <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
              {bank.length} Qs
            </span>
          </button>

          {/* Mode 2: Easy Mode (Saudi Emerald Green) */}
          <button
            type="button"
            onClick={() => setSelectedDifficulty('Easy')}
            className={`p-3.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-center justify-between ${
              selectedDifficulty === 'Easy'
                ? 'border-emerald-600 bg-emerald-50/90 shadow-xs ring-2 ring-emerald-500/30'
                : 'border-emerald-200/80 bg-white hover:bg-emerald-50/40'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-black text-emerald-950 block">
                  {language === 'ar' ? 'النمط السهل (Easy)' : 'Easy Mode'}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {language === 'ar' ? 'بناء الثقة والأساسيات' : 'Build speed & core fundamentals'}
              </span>
            </div>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-300">
              {easyCount} Qs
            </span>
          </button>

          {/* Mode 3: Medium Mode (Royal Navy Blue) */}
          <button
            type="button"
            onClick={() => setSelectedDifficulty('Medium')}
            className={`p-3.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-center justify-between ${
              selectedDifficulty === 'Medium'
                ? 'border-blue-900 bg-blue-50/90 shadow-xs ring-2 ring-blue-700/30'
                : 'border-blue-200/80 bg-white hover:bg-blue-50/40'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-700" />
                <span className="text-xs font-black text-blue-950 block">
                  {language === 'ar' ? 'النمط المتوسط (Medium)' : 'Medium Mode'}
                </span>
              </div>
              <span className="text-[11px] text-blue-800 font-semibold">
                {language === 'ar' ? 'مستوى الاختبار المعياري' : 'Standard competitive testing'}
              </span>
            </div>
            <span className="text-xs font-black text-blue-900 bg-blue-100/90 px-2.5 py-1 rounded-xl border border-blue-300">
              {mediumCount} Qs
            </span>
          </button>

          {/* Mode 4: Hard Mode (Crimson Red) */}
          <button
            type="button"
            onClick={() => setSelectedDifficulty('Hard')}
            className={`p-3.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-center justify-between ${
              selectedDifficulty === 'Hard'
                ? 'border-rose-700 bg-rose-50/90 shadow-xs ring-2 ring-rose-600/30'
                : 'border-rose-200/80 bg-white hover:bg-rose-50/40'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span className="text-xs font-black text-rose-950 block">
                  {language === 'ar' ? 'النمط الصعب (Hard)' : 'Hard Mode'}
                </span>
              </div>
              <span className="text-[11px] text-rose-700 font-semibold">
                {language === 'ar' ? 'تحديات النخبة +1450/90+' : 'Elite tier challenges (90+/1450+)'}
              </span>
            </div>
            <span className="text-xs font-black text-rose-900 bg-rose-100/90 px-2.5 py-1 rounded-xl border border-rose-300">
              {hardCount} Qs
            </span>
          </button>
        </div>
      </div>

      {/* 3 Training Modes Grid with School Colors & Active Difficulty Label */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Mock Exam */}
        <div className="rounded-3xl border border-slate-200 hover:border-indigo-400 p-6 sm:p-7 bg-white flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-sm group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Official Simulation
              </span>
              <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
                +200 XP
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 mb-4 shadow-2xs group-hover:scale-105 transition-transform">
              <Target className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                Full Mock Exam
              </h3>
              {selectedDifficulty !== 'All' && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getDifficultyBadgeColor(selectedDifficulty).badge}`}>
                  {selectedDifficulty}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Simulates authentic test pacing, balanced section distributions, and difficulty. Generates an official projected scaled score upon completion.
            </p>
            <div className="text-xs text-slate-500 space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                <span>Timed official pacing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                <span>Full diagnostic report with answer review</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onStartMock(effectiveDifficulty)}
            disabled={bank.length === 0}
            className="btn-primary mt-6 w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-40 shadow-xs transition-all duration-200 hover:shadow-md"
          >
            <span>Launch Mock Exam {selectedDifficulty !== 'All' ? `(${selectedDifficulty})` : ''}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Min Warmup */}
        <div className="rounded-3xl border border-slate-200 hover:border-amber-400 p-6 sm:p-7 bg-white flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-sm group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Agility Sprint
              </span>
              <span className="text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                +50 XP
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-2xs group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                5-Question Warmup
              </h3>
              {selectedDifficulty !== 'All' && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getDifficultyBadgeColor(selectedDifficulty).badge}`}>
                  {selectedDifficulty}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              A rapid 5-question sprint drawn across random skills to maintain your daily study streak and sharpen response agility.
            </p>
            <div className="text-xs text-slate-500 space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span>~4–5 minutes duration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span>Protects daily study streak flame</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onStartQuick(effectiveDifficulty)}
            disabled={bank.length === 0}
            className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black rounded-2xl flex items-center justify-between cursor-pointer disabled:opacity-40 shadow-xs transition-all duration-200 hover:shadow-md"
          >
            <span>Start 5-Min Sprint {selectedDifficulty !== 'All' ? `(${selectedDifficulty})` : ''}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Targeted Skill Sprint */}
        <div className="rounded-3xl border border-slate-200 hover:border-blue-400 p-6 sm:p-7 bg-white flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-sm group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Custom Skill Drill
              </span>
              <span className="text-[11px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                +75 XP
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-2xs group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                Targeted Skill Sprint
              </h3>
              {selectedDifficulty !== 'All' && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getDifficultyBadgeColor(selectedDifficulty).badge}`}>
                  {selectedDifficulty}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Select one or multiple specific skills below to generate an intensive drill set aimed directly at your weakest areas.
            </p>
            <div className="text-xs text-slate-500 space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                <span>{selectedSkills.length ? `${selectedSkills.length} skills selected` : 'Select skills below'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                <span>Focused practice with instant feedback</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onStartFocus(selectedSkills.length ? selectedSkills : allSkills.slice(0, 2), effectiveDifficulty)}
            disabled={bank.length === 0}
            className="mt-6 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl flex items-center justify-between cursor-pointer disabled:opacity-40 shadow-xs transition-all duration-200 hover:shadow-md"
          >
            <span>{selectedSkills.length ? `Drill ${selectedSkills.length} Skills` : 'Choose Skills Below'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom Drill Topic Picker */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Select Specific Topics &amp; Skills</h3>
            <span className="text-xs text-slate-500">Pick any combination of skills to build your personalized quiz set</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={selectAll}
              className="font-bold text-indigo-700 hover:underline cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={clearAll}
              className="font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {allSkills.map(skill => {
            const isSelected = selectedSkills.includes(skill);
            const isAssessed = mastery[skill] !== undefined;
            const m = isAssessed ? mastery[skill] : 0;
            const availableCount = bank.filter(q => q.skill === skill).length;

            return (
              <div
                key={skill}
                onClick={() => availableCount > 0 && toggleSkill(skill)}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                  availableCount === 0
                    ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs cursor-pointer ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs cursor-pointer'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs mt-0.5 shrink-0 transition-colors ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">{skill}</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className={isAssessed ? (m >= 70 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold') : ''}>
                      {isAssessed ? `${m}% mastery` : 'Unassessed'}
                    </span>
                    <span className="font-bold text-slate-400">{availableCount} Qs</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedSkills.length > 0 && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-viewFadeIn">
            <div>
              <span className="text-xs font-black text-indigo-950 block">
                {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected
              </span>
              <span className="text-xs text-indigo-700">
                {selectedSkills.join(', ')}
              </span>
            </div>
            <button
              onClick={() => onStartFocus(selectedSkills, effectiveDifficulty)}
              className="btn-primary py-2.5 px-6 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all shrink-0"
            >
              Start Custom Drill {selectedDifficulty !== 'All' ? `(${selectedDifficulty})` : ''} (+75 XP)
            </button>
          </div>
        )}
      </div>

      {/* Interactive Question Bank Explorer with Clear Difficulty Badging */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-700" />
              <h3 className="text-base font-black text-slate-900">
                {language === 'ar' ? 'استعراض أسئلة بنك التدريب مع مستوى الصعوبة' : 'Interactive Questions Pool & Difficulty Badging'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'عرض الأسئلة مصنفة حسب مستوى الصعوبة (أخضر = سهل، أزرق = متوسط، أحمر = صعب)'
                : 'Browse questions labeled by official difficulty tier (Green = Easy, Navy = Medium, Crimson = Hard)'}
            </p>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPreviewFilter('All')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                previewFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({bank.length})
            </button>
            <button
              type="button"
              onClick={() => setPreviewFilter('Easy')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                previewFilter === 'Easy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Easy ({easyCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewFilter('Medium')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                previewFilter === 'Medium'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Medium ({mediumCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewFilter('Hard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                previewFilter === 'Hard'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Hard ({hardCount})</span>
            </button>
          </div>
        </div>

        {/* Questions Cards List */}
        <div className="space-y-3">
          {previewQuestions.slice(0, 10).map((q, idx) => {
            const diff = getQuestionDifficulty(q);
            const badge = getDifficultyBadgeColor(diff);
            const isExpanded = expandedQId === q.id;

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition-all duration-200 shadow-2xs hover:shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    
                    {/* Difficulty Badge with School Colors */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${badge.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{diff} Mode</span>
                    </span>

                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                      {q.skill}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{q.section}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Question & Solution'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Prompt Preview */}
                <p className="text-sm font-bold text-slate-800 mt-2.5 line-clamp-2 leading-relaxed">
                  {q.prompt}
                </p>

                {/* Expanded Solution & Options */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-viewFadeIn">
                    {q.figureSvg && (
                      <div
                        className="my-3 p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto flex justify-center"
                        dangerouslySetInnerHTML={{ __html: q.figureSvg }}
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                            oIdx === q.answer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            oIdx === q.answer ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {['A', 'B', 'C', 'D'][oIdx]}
                          </span>
                          <span className="truncate">{opt}</span>
                          {oIdx === q.answer && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />}
                        </div>
                      ))}
                    </div>

                    {q.explain && (
                      <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-950 font-medium leading-relaxed">
                        <span className="font-black text-indigo-900 block mb-0.5">Explanation & Reasoning:</span>
                        {q.explain}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {previewQuestions.length > 10 && (
          <div className="text-center pt-2 text-xs text-slate-500 font-semibold">
            Showing first 10 of {previewQuestions.length} questions in this difficulty tier. Launch a mock exam or sprint above to practice the complete pool!
          </div>
        )}
      </div>
    </div>
  );
};
