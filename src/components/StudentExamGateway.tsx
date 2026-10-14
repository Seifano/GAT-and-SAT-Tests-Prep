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

  // Determine authorized exams based on strict institutional rules:
  // - High School: SAT and GAT ONLY, NAFS denied
  // - Grade 6 & Grade 9: NAFS ONLY, SAT and GAT denied
  const isAuthorized = (exam: ExamType): boolean => {
    if (!isStudent) return true; // Admins and Teachers can inspect all
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
      return 'Access Denied: NAFS assessments are restricted to Grade 6 and Grade 9 students.';
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
      badge: 'High School Admissions',
      count: questionsCount?.GAT || 25,
      desc: 'Authentic verbal analogies, sentence completions, contextual errors, quantitative arithmetic, algebra & geometry for Saudi universities.',
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
      badge: 'High School Admissions',
      count: questionsCount?.SAT || 25,
      desc: 'Official adaptive digital modules, reading & writing conventions, transitions, advanced math, algebra & geometry for university admissions.',
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
      title: isStudent && (studentLevel === 'Grade 6' || studentLevel === 'Grade 9')
        ? `NAFS Assessment · ${studentLevel}`
        : 'NAFS Assessment',
      arabicTitle: 'نافس',
      subtitle: isStudent && (studentLevel === 'Grade 6' || studentLevel === 'Grade 9')
        ? `${studentLevel} Literacy Curriculum`
        : 'Grade 6 & Grade 9 (G6 · G9)',
      badge: 'National Assessment',
      count: questionsCount?.NAFS || 500,
      desc: isStudent && studentLevel === 'Grade 6'
        ? 'Curated national reading literacy, text analysis, and vocabulary questions specifically matched for Grade 6 students.'
        : isStudent && studentLevel === 'Grade 9'
        ? 'Curated national reading literacy, text analysis, and vocabulary questions specifically matched for Grade 9 students.'
        : 'Standardized national reading literacy, text analysis, vocabulary in context, and language skills for G6 & G9 students.',
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

        {/* Student Account & Class Identification Banner */}
        <div className="max-w-2xl mx-auto space-y-3 mb-8">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-[#1e3a8a] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Welcome, {userName.split(' ')[0]}</span>
            {isStudent && (
              <>
                <span className="text-slate-300">·</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black text-white ${
                  studentLevel === 'Grade 6' ? 'bg-emerald-600' : studentLevel === 'Grade 9' ? 'bg-teal-600' : 'bg-[#1e3a8a]'
                }`}>
                  {studentLevel}
                </span>
                {studentClass && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white text-slate-800 border border-slate-300">
                    Class {studentClass}
                  </span>
                )}
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
            {isStudent ? `Select Your Examination Pathway` : `Institutional Examination Pathways`}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {isStudent ? (
              studentLevel === 'High School' ? (
                <>High School students are assigned to the <strong>SAT and GAT</strong> examination pathways. NAFS primary/middle school resources are restricted.</>
              ) : (
                <><strong>{studentLevel}</strong> students are assigned exclusively to the <strong>NAFS</strong> examination pathway, matching your grade-level curriculum. SAT &amp; GAT pathways are restricted.</>
              )
            ) : (
              'Faculty & Admin Portal: You have unrestricted access to inspect and manage all three examination pathways.'
            )}
          </p>
        </div>

        {/* Access Denied Warning Toast/Alert */}
        {deniedNotice && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center gap-3 text-left animate-in fade-in duration-200">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-red-900 uppercase tracking-wider">Access Restricted</div>
              <div className="text-xs text-red-700 font-semibold mt-0.5 leading-relaxed">{deniedNotice}</div>
            </div>
            <button
              onClick={() => setDeniedNotice(null)}
              className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* 3 Prominent Circular Icons in the Middle of Screen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-5xl mx-auto">
          {tracks.map(track => {
            const authorized = isAuthorized(track.id);
            const Icon = track.icon;

            return (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track.id)}
                className={`group relative flex flex-col items-center justify-between p-6 sm:p-7 rounded-2xl border-2 transition-all duration-300 ${
                  authorized
                    ? `bg-slate-50/60 hover:bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer ${track.borderActive}`
                    : 'bg-slate-100/70 border-slate-300/80 opacity-75 cursor-not-allowed hover:bg-slate-100'
                }`}
              >
                {/* Top Badge */}
                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                    {track.badge}
                  </span>

                  {/* Access Status Pill */}
                  {!authorized ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                      <Lock className="w-3 h-3" />
                      <span>Denied</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Authorized</span>
                    </span>
                  )}
                </div>

                {/* Circular Icon Circle */}
                <div className="relative mb-5">
                  <div
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 shadow-lg ${
                      authorized
                        ? `group-hover:scale-108 bg-gradient-to-br ${track.gradient} ring-4 ${track.ring} ${track.hoverRing}`
                        : 'bg-slate-500 ring-4 ring-slate-300 grayscale-[0.6]'
                    }`}
                  >
                    {!authorized ? (
                      <Lock className="w-10 h-10 mb-1 drop-shadow-xs text-white" />
                    ) : (
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 mb-1 drop-shadow-xs" />
                    )}
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
                  <h3 className={`text-lg sm:text-xl font-black transition-colors ${
                    authorized ? 'text-gray-900 group-hover:text-[#1e3a8a]' : 'text-slate-600'
                  }`}>
                    {track.title}
                  </h3>

                  <span className="inline-block text-xs font-bold text-slate-700 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                    {track.subtitle}
                  </span>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mt-2">
                    {track.desc}
                  </p>

                  <div className="pt-2">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-md border ${
                      authorized
                        ? 'text-[#1e3a8a] bg-blue-50 border-blue-200/60'
                        : 'text-slate-500 bg-slate-200/50 border-slate-300'
                    }`}>
                      {authorized ? `${track.count} Questions Bank` : 'Curriculum Locked'}
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
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 shadow-md group-hover:shadow-lg cursor-pointer ${track.btnClass}`}
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
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Access Denied ({isStudent ? studentLevel : 'Restricted'})</span>
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
            <span>Al-Hussan Model Schools Exam Preparation &amp; Grade Access Standards</span>
          </div>
          {isStudent && (
            <span className="font-medium">
              Class Roster: <strong>{studentClass || 'Standard Section'}</strong> ({studentLevel})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
