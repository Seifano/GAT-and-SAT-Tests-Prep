import React from 'react';
import { ExamType } from '../types';
import { BookOpen, Zap, Target, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface StudentExamGatewayProps {
  userName: string;
  onSelectTrack: (exam: ExamType) => void;
  questionsCount?: Record<ExamType, number>;
  onBack?: () => void;
}

export const StudentExamGateway: React.FC<StudentExamGatewayProps> = ({
  userName,
  onSelectTrack,
  questionsCount,
  onBack
}) => {
  const tracks: Array<{
    id: ExamType;
    title: string;
    arabicTitle: string;
    subtitle: string;
    badge: string;
    count: number;
    desc: string;
    theme: 'emerald' | 'crimson' | 'navy';
    icon: typeof BookOpen;
    gradient: string;
    ring: string;
    hoverRing: string;
    btnClass: string;
    borderActive: string;
  }> = [
    {
      id: 'GAT',
      title: 'GAT Practice',
      arabicTitle: 'القدرات',
      subtitle: 'Verbal & Quantitative (Qudurat)',
      badge: 'Saudi University Admissions',
      count: questionsCount?.GAT || 25,
      desc: 'Authentic verbal analogies, sentence completions, contextual errors, quantitative arithmetic, algebra & geometry.',
      theme: 'crimson',
      icon: Zap,
      gradient: 'from-red-600 via-rose-700 to-red-800',
      ring: 'ring-red-200',
      hoverRing: 'group-hover:ring-red-400',
      btnClass: 'bg-red-700 hover:bg-red-800 text-white shadow-red-700/20',
      borderActive: 'border-red-600 hover:border-red-500'
    },
    {
      id: 'SAT',
      title: 'Digital SAT',
      arabicTitle: 'Digital',
      subtitle: 'Reading, Writing & Math',
      badge: 'Global Admissions (400–1600)',
      count: questionsCount?.SAT || 25,
      desc: 'Official adaptive digital modules, reading & writing conventions, transitions, advanced math, algebra & geometry.',
      theme: 'navy',
      icon: Target,
      gradient: 'from-blue-700 via-indigo-800 to-[#1e3a8a]',
      ring: 'ring-blue-200',
      hoverRing: 'group-hover:ring-blue-400',
      btnClass: 'bg-[#1e3a8a] hover:bg-[#152a65] text-white shadow-blue-900/20',
      borderActive: 'border-[#1e3a8a] hover:border-blue-600'
    },
    {
      id: 'NAFS',
      title: 'NAFS Assessment',
      arabicTitle: 'نافس',
      subtitle: 'Grade 6 & Grade 9 (G6 · G9)',
      badge: 'National Assessment',
      count: questionsCount?.NAFS || 500,
      desc: 'Standardized national reading literacy, text analysis, vocabulary in context, and language skills for G6 & G9 students.',
      theme: 'emerald',
      icon: BookOpen,
      gradient: 'from-emerald-600 via-teal-700 to-emerald-800',
      ring: 'ring-emerald-200',
      hoverRing: 'group-hover:ring-emerald-400',
      btnClass: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20',
      borderActive: 'border-emerald-600 hover:border-emerald-500'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 font-sans">
      {/* Central Hero Container */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-10 md:p-12 shadow-md relative overflow-hidden text-center">
        {/* Heritage Tri-Color Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-red-700 to-[#1e3a8a]" />

        {onBack && (
          <div className="mb-6 flex justify-start">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>← Back to Admin Console</span>
            </button>
          </div>
        )}

        {/* Header Introduction */}
        <div className="max-w-2xl mx-auto space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 text-[#1e3a8a] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Welcome, {userName.split(' ')[0]}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
            Select Your Examination Pathway
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Please choose the exam track you are preparing for. Once selected, your personalized diagnostic analytics, competency matrix, and question banks will load.
          </p>
        </div>

        {/* 3 Prominent Circular Icons in the Middle of Screen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-5xl mx-auto">
          {tracks.map(track => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`group relative flex flex-col items-center justify-between p-6 sm:p-7 rounded-2xl border-2 bg-slate-50/60 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${track.borderActive}`}
              >
                {/* Top Badge */}
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs mb-4">
                  {track.badge}
                </span>

                {/* Circular Icon Circle */}
                <div className="relative mb-5">
                  <div
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 shadow-lg group-hover:scale-108 bg-gradient-to-br ${track.gradient} ring-4 ${track.ring} ${track.hoverRing}`}
                  >
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 mb-1 drop-shadow-xs" />
                    <span className="text-base sm:text-lg font-black tracking-tight leading-none">
                      {track.id}
                    </span>
                    <span className="text-xs sm:text-sm opacity-90 font-medium">
                      {track.arabicTitle}
                    </span>
                  </div>
                </div>

                {/* Track Details */}
                <div className="space-y-2 mb-6 flex-1 flex flex-col items-center">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 group-hover:text-[#1e3a8a] transition-colors">
                    {track.title}
                  </h3>

                  <span className="inline-block text-xs font-bold text-slate-700 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                    {track.subtitle}
                  </span>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mt-2">
                    {track.desc}
                  </p>

                  <div className="pt-2">
                    <span className="text-[11px] font-extrabold text-[#1e3a8a] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
                      {track.count} Questions Bank
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectTrack(track.id);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 shadow-md group-hover:shadow-lg cursor-pointer ${track.btnClass}`}
                >
                  <span>Enter {track.id} Track</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Guidance */}
        <div className="mt-10 sm:mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Al-Hussan Model Schools Exam Preparation Standards</span>
          </div>
          <span>You can switch or return to this selection screen at any time.</span>
        </div>
      </div>
    </div>
  );
};
