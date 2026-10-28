import React, { useState } from 'react';
import { ExamType, UserAccount } from '../types';
import { BookOpen, Zap, Target, Sparkles, ArrowRight, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

interface StudentExamGatewayProps {
  user?: UserAccount | null;
  userName: string;
  onSelectTrack: (exam: ExamType) => void;
  questionsCount?: Record<ExamType, number>;
  onBack?: () => void;
}

export const StudentExamGateway: React.FC<StudentExamGatewayProps> = ({
  user,
  userName,
  onSelectTrack,
  questionsCount,
  onBack
}) => {
  const [deniedNotice, setDeniedNotice] = useState<string | null>(null);

  const isStudent = user?.role === 'Student';
  const studentLevel = user?.studentLevel || 'Grade 6';
  const studentClass = user?.studentClass;

  // Determine authorized exams:
  // - High School: SAT and GAT ONLY, NAFS denied
  // - Grade 6 & Grade 9: NAFS ONLY, SAT and GAT denied
  const isAuthorized = (exam: ExamType): boolean => {
    if (!isStudent) return true;
    if (studentLevel === 'High School') {
      return exam === 'SAT' || exam === 'GAT';
    }
    if (studentLevel === 'Grade 6' || studentLevel === 'Grade 9') {
      return exam === 'NAFS';
    }
    return true;
  };

  const getDenialReason = (exam: ExamType): string => {
    if (studentLevel === 'High School') {
      return 'Access Denied: NAFS assessments are restricted to Grade 6 and Grade 9 cohorts.';
    }
    return `Access Denied: ${exam} preparation is restricted to High School students. Your account is authorized for ${studentLevel} NAFS.`;
  };

  const handleTrackClick = (exam: ExamType) => {
    if (!isAuthorized(exam)) {
      const reason = getDenialReason(exam);
      setDeniedNotice(reason);
      return;
    }
    setDeniedNotice(null);
    onSelectTrack(exam);
  };

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
    btnClass: string;
    borderActive: string;
    accentColor: string;
  }> = [
    {
      id: 'SAT',
      title: 'Digital SAT',
      arabicTitle: 'Digital SAT',
      subtitle: 'Reading, Writing & Math',
      badge: 'High School Admissions',
      count: questionsCount?.SAT || 25,
      desc: 'Official adaptive digital modules, reading & writing conventions, transitions, advanced math, algebra & geometry with Desmos calculator.',
      theme: 'navy',
      icon: Target,
      gradient: 'from-blue-600 via-indigo-600 to-indigo-800',
      btnClass: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-indigo-500/25',
      borderActive: 'border-indigo-400 hover:border-indigo-600',
      accentColor: 'text-indigo-600'
    },
    {
      id: 'GAT',
      title: 'GAT Practice',
      arabicTitle: 'القدرات العامة',
      subtitle: 'Verbal & Quantitative (Qudurat)',
      badge: 'Saudi University Admissions',
      count: questionsCount?.GAT || 25,
      desc: 'Authentic verbal analogies, sentence completions, contextual errors, quantitative arithmetic, algebra & geometry for Saudi universities.',
      theme: 'crimson',
      icon: Zap,
      gradient: 'from-rose-600 via-red-600 to-rose-800',
      btnClass: 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white shadow-rose-500/25',
      borderActive: 'border-rose-400 hover:border-rose-600',
      accentColor: 'text-rose-600'
    },
    {
      id: 'NAFS',
      title: isStudent && (studentLevel === 'Grade 6' || studentLevel === 'Grade 9')
        ? `NAFS Assessment · ${studentLevel}`
        : 'NAFS Assessment',
      arabicTitle: 'الاختبار الوطني نافس',
      subtitle: isStudent && (studentLevel === 'Grade 6' || studentLevel === 'Grade 9')
        ? `${studentLevel} Reading & Math`
        : 'Grade 6 & Grade 9 Cohorts',
      badge: 'National Assessment',
      count: questionsCount?.NAFS || 500,
      desc: isStudent && studentLevel === 'Grade 6'
        ? 'Curated national reading literacy, text analysis, and vocabulary questions specifically calibrated for Grade 6 learners.'
        : isStudent && studentLevel === 'Grade 9'
        ? 'Curated national reading literacy, text analysis, and vocabulary questions specifically calibrated for Grade 9 learners.'
        : 'Standardized national reading literacy, text analysis, vocabulary in context, and language skills for G6 & G9 students.',
      theme: 'emerald',
      icon: BookOpen,
      gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
      btnClass: 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-500/25',
      borderActive: 'border-emerald-400 hover:border-emerald-600',
      accentColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 font-sans">
      {/* Central Hero Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm border border-slate-200/90 relative overflow-hidden text-center">
        {/* Heritage Tri-Color Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-indigo-600 to-emerald-500" />

        {onBack && (
          <div className="mb-6 flex justify-start">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-700" />
              <span>Back to Admin Console</span>
            </button>
          </div>
        )}

        {/* Student Account & Class Identification Banner */}
        <div className="max-w-2xl mx-auto space-y-3 mb-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-indigo-900 text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Welcome, {userName.split(' ')[0]}</span>
            {isStudent && (
              <>
                <span className="text-slate-300">·</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black text-white ${
                  studentLevel === 'Grade 6' ? 'bg-emerald-600' : studentLevel === 'Grade 9' ? 'bg-teal-600' : 'bg-indigo-600'
                }`}>
                  {studentLevel}
                </span>
                {studentClass && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-white text-slate-800 border border-slate-200">
                    Class {studentClass}
                  </span>
                )}
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {isStudent ? 'Select Your Examination Pathway' : 'Institutional Examination Pathways'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            {isStudent ? (
              studentLevel === 'High School' ? (
                <>High School students have access to the <strong>SAT and GAT</strong> examination pathways. Select a track to launch practice drills.</>
              ) : (
                <><strong>{studentLevel}</strong> students are assigned exclusively to the <strong>NAFS</strong> examination pathway, calibrated for your grade level.</>
              )
            ) : (
              'Faculty & Admin Portal: Direct access to inspect questions, analytics, and practice modes across all pathways.'
            )}
          </p>
        </div>

        {/* Access Denied Warning Toast */}
        {deniedNotice && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-left animate-in fade-in duration-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-rose-900 uppercase tracking-wider">Access Restricted</div>
              <div className="text-xs text-rose-700 font-semibold mt-0.5 leading-relaxed">{deniedNotice}</div>
            </div>
            <button
              onClick={() => setDeniedNotice(null)}
              className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Track Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch max-w-5xl mx-auto">
          {tracks.map(track => {
            const authorized = isAuthorized(track.id);
            const Icon = track.icon;

            return (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track.id)}
                className={`group relative flex flex-col items-center justify-between p-6 sm:p-7 rounded-3xl border transition-all duration-300 ${
                  authorized
                    ? `bg-white hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ${track.borderActive} border-slate-200/90 shadow-xs`
                    : 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Top Badge */}
                <div className="w-full flex items-center justify-between mb-5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                    {track.badge}
                  </span>

                  {!authorized ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Authorized</span>
                    </span>
                  )}
                </div>

                {/* Circular Icon Feature */}
                <div className="relative mb-5">
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center text-white transition-all duration-300 shadow-md ${
                      authorized
                        ? `group-hover:scale-105 bg-gradient-to-br ${track.gradient}`
                        : 'bg-slate-400 grayscale'
                    }`}
                  >
                    {!authorized ? (
                      <Lock className="w-8 h-8 mb-1 drop-shadow-xs text-white" />
                    ) : (
                      <Icon className="w-8 h-8 sm:w-9 sm:h-9 mb-1 drop-shadow-xs" />
                    )}
                    <span className="text-base sm:text-lg font-black tracking-tight leading-none">
                      {track.id}
                    </span>
                    <span className="text-[11px] opacity-90 font-bold mt-0.5">
                      {track.arabicTitle}
                    </span>
                  </div>
                </div>

                {/* Track Details */}
                <div className="space-y-2 mb-6 flex-1 flex flex-col items-center text-center">
                  <h3 className={`text-lg sm:text-xl font-black transition-colors ${
                    authorized ? 'text-slate-900 group-hover:text-indigo-700' : 'text-slate-500'
                  }`}>
                    {track.title}
                  </h3>

                  <span className="inline-block text-xs font-semibold text-slate-500">
                    {track.subtitle}
                  </span>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mt-2">
                    {track.desc}
                  </p>

                  <div className="pt-2">
                    <span className="text-xs font-black text-slate-700">
                      {authorized ? `${track.count} Questions Available` : 'Track Restricted'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                {authorized ? (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectTrack(track.id);
                    }}
                    className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 shadow-xs cursor-pointer ${track.btnClass}`}
                  >
                    <span>Enter {track.id} Track</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setDeniedNotice(getDenialReason(track.id));
                    }}
                    className="w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked ({isStudent ? studentLevel : 'Restricted'})</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Guidance */}
        <div className="mt-10 sm:mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Adhwa'a Al-Hedaya International Schools (مدارس أضواء الهداية العالمية) · Examination Standards</span>
          </div>
          {isStudent && (
            <span className="font-semibold text-slate-700">
              Class Roster: <strong>{studentClass || 'Section'}</strong> ({studentLevel})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
