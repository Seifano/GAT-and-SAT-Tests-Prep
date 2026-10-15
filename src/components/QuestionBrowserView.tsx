import React, { useState } from 'react';
import { Question, ExamType, UserAccount } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { Search, Filter, BookOpen, ChevronDown, ChevronUp, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';

interface QuestionBrowserViewProps {
  activeExam: ExamType;
  bank: Record<ExamType, Question[]>;
  currentUser?: UserAccount | null;
  onSelectExam?: (exam: ExamType) => void;
  isStudent?: boolean;
  onGoBackToMainMenu?: () => void;
}

export const QuestionBrowserView: React.FC<QuestionBrowserViewProps> = ({
  activeExam,
  bank,
  currentUser,
  onSelectExam,
  isStudent = false,
  onGoBackToMainMenu
}) => {
  const [skillFilter, setSkillFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [openPassageId, setOpenPassageId] = useState<string | null>(null);

  const studentLevel = currentUser?.studentLevel;
  const isActualStudent = currentUser?.role === 'Student' || isStudent;

  // Filter questions bank based on grade level access:
  // - Grade 6: only Grade 6 NAFS questions
  // - Grade 9: only Grade 9 NAFS questions
  // - High School: SAT and GAT questions
  const getDisplayQuestions = (): Question[] => {
    const rawBank = bank[activeExam] || [];
    if (!currentUser || currentUser.role !== 'Student') {
      return rawBank;
    }

    if (activeExam === 'NAFS') {
      if (studentLevel === 'Grade 6') {
        return rawBank.filter(q => q.section.includes('Grade 6') || q.section.includes('G6'));
      }
      if (studentLevel === 'Grade 9') {
        return rawBank.filter(q => q.section.includes('Grade 9') || q.section.includes('G9'));
      }
      return []; // High School denied NAFS
    }

    if (activeExam === 'GAT' || activeExam === 'SAT') {
      if (studentLevel === 'Grade 6' || studentLevel === 'Grade 9') {
        return []; // Grade 6 & 9 denied SAT/GAT
      }
    }

    return rawBank;
  };

  const questions = getDisplayQuestions();
  const conf = EXAM_CONFIGS[activeExam];

  // Restrict visible skills list for Grade 6 & 9 in NAFS
  const allSkills = (() => {
    if (currentUser?.role === 'Student' && activeExam === 'NAFS') {
      if (studentLevel === 'Grade 6') {
        const sec = conf.sections.find(s => s.name.includes('Grade 6') || s.name.includes('G6'));
        return sec ? sec.skills : conf.sections.flatMap(s => s.skills);
      }
      if (studentLevel === 'Grade 9') {
        const sec = conf.sections.find(s => s.name.includes('Grade 9') || s.name.includes('G9'));
        return sec ? sec.skills : conf.sections.flatMap(s => s.skills);
      }
    }
    return conf.sections.flatMap(s => s.skills);
  })();

  const toggleSolution = (id: string) => {
    setRevealedSolutions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = questions.filter(q => {
    const matchSkill = skillFilter === 'All' || q.skill === skillFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (q.prompt + ' ' + (q.passage || '') + ' ' + q.options.join(' ')).toLowerCase().includes(term);
    return matchSkill && matchSearch;
  });

  const areAllRevealed = filtered.length > 0 && filtered.every(q => !!revealedSolutions[q.id]);

  const toggleAllSolutions = () => {
    if (areAllRevealed) {
      setRevealedSolutions({});
    } else {
      const all: Record<string, boolean> = {};
      filtered.forEach(q => {
        all[q.id] = true;
      });
      setRevealedSolutions(all);
    }
  };

  // Allowed exams for staff vs student
  const allowedExams: ExamType[] = (() => {
    if (!currentUser || currentUser.role !== 'Student') {
      return ['NAFS', 'GAT', 'SAT'];
    }
    if (studentLevel === 'High School') {
      return ['GAT', 'SAT'];
    }
    return ['NAFS'];
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            Question Bank Library
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            Browse &amp; Study {activeExam} Questions
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mt-2 leading-relaxed break-words">
            {isActualStudent && studentLevel
              ? `Curriculum restricted to ${studentLevel} competencies. Review questions and detailed solution rationales.`
              : 'Review questions, study detailed answer keys, and explore real test passages at your own pace outside of timed simulations.'}
          </p>
        </div>

        {/* Exam Toggle / Locked Track Display */}
        {isActualStudent ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {allowedExams.length > 1 ? (
              <div className="inline-flex border border-[#201e1d]/30 bg-white rounded-xl overflow-hidden shadow-2xs">
                {allowedExams.map(e => (
                  <button
                    key={e}
                    onClick={() => {
                      onSelectExam?.(e);
                      setSkillFilter('All');
                    }}
                    className={`px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                      activeExam === e ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-100'
                    }`}
                  >
                    {e} ({bank[e]?.length || 0})
                  </button>
                ))}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-300 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Track:</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-black text-white shadow-2xs ${
                  activeExam === 'NAFS' ? 'bg-emerald-700' : activeExam === 'GAT' ? 'bg-red-700' : 'bg-[#1e3a8a]'
                }`}>
                  {activeExam} {studentLevel ? `(${studentLevel})` : ''} · {questions.length} Qs
                </span>
              </div>
            )}

            {onGoBackToMainMenu && (
              <button
                onClick={onGoBackToMainMenu}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#1e3a8a] text-xs font-black rounded-xl border border-slate-300 shadow-2xs hover:border-[#1e3a8a] transition-all cursor-pointer"
                title="Return to Main Menu to select a different track"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Main Menu</span>
              </button>
            )}
          </div>
        ) : (
          <div className="inline-flex border border-[#201e1d]/30 bg-transparent shrink-0">
            {(['NAFS', 'GAT', 'SAT'] as ExamType[]).map(e => (
              <button
                key={e}
                onClick={() => {
                  onSelectExam?.(e);
                  setSkillFilter('All');
                }}
                className={`px-3 sm:px-4 py-1.5 text-xs font-black transition-all cursor-pointer ${
                  activeExam === e ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
                }`}
              >
                {e} ({bank[e]?.length || 0})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grade Level Access Notice Banner for Students */}
      {isActualStudent && studentLevel && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
          studentLevel === 'Grade 6'
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
            : studentLevel === 'Grade 9'
            ? 'bg-teal-50/80 border-teal-300 text-teal-900'
            : 'bg-blue-50/80 border-blue-300 text-blue-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wide">
                Enrolled: {studentLevel} {currentUser?.studentClass ? `(Class ${currentUser.studentClass})` : ''}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">
                {studentLevel === 'Grade 6'
                  ? 'Showing verified Grade 6 NAFS questions. GAT, SAT, and Grade 9 questions are restricted.'
                  : studentLevel === 'Grade 9'
                  ? 'Showing verified Grade 9 NAFS questions. GAT, SAT, and Grade 6 questions are restricted.'
                  : 'High School curriculum: GAT & SAT question banks enabled. NAFS primary/middle assessments restricted.'}
              </p>
            </div>
          </div>
          <span className="font-black text-xs px-2.5 py-1 rounded-full bg-white/80 border shadow-2xs shrink-0">
            {questions.length} Items Available
          </span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search questions by topic, words, or passage..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-[#201e1d] font-bold focus:outline-none focus:border-[#1f3d7a] w-full sm:w-auto"
          >
            <option value="All">All skills ({questions.length})</option>
            {allSkills.map(s => (
              <option key={s} value={s}>
                {s} ({questions.filter(q => q.skill === s).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-bold">
          <span>Showing {filtered.length} of {questions.length} questions</span>
          <button
            type="button"
            onClick={toggleAllSolutions}
            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-[#1f3d7a] cursor-pointer shadow-2xs transition-colors"
          >
            {areAllRevealed ? 'Hide All Explanations' : 'Show All Explanations'}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-slate-300 rounded-2xl space-y-2">
            <h3 className="font-bold text-sm text-[#201e1d]">No questions match your search</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or skill filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((q, idx) => {
              const isRevealed = !!revealedSolutions[q.id];
              const isPassageOpen = openPassageId === q.id;

              return (
                <div key={q.id} className="p-6 bg-white border-2 border-[#201e1d]/30 rounded-2xl space-y-4 shadow-2xs">
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-[#1f3d7a]">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        q.section.includes('Grade 6')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : q.section.includes('Grade 9')
                          ? 'bg-teal-100 text-teal-800 border border-teal-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {q.section}
                      </span>
                      <span className="text-slate-600">· {q.skill}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSolution(q.id)}
                      className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
                    >
                      {isRevealed ? 'Hide solution' : 'Show solution & explanation'}
                    </button>
                  </div>

                  {/* Reading Passage if attached */}
                  {q.passage && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setOpenPassageId(isPassageOpen ? null : q.id)}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-[#1f3d7a]" />
                          <span>Reading Passage for Question #{idx + 1}</span>
                        </div>
                        {isPassageOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isPassageOpen && (
                        <div className="p-4 bg-white text-xs text-slate-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap border-t border-slate-200">
                          {q.passage}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Prompt */}
                  <div className="text-sm font-bold text-[#201e1d] leading-relaxed whitespace-pre-wrap">
                    {q.prompt}
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = isRevealed && optIdx === q.answer;

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 border rounded-xl flex items-center gap-3 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-xs leading-snug">{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Solution Rationale Box */}
                  {isRevealed && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                      <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Correct Answer: Option {String.fromCharCode(65 + q.answer)}</span>
                      </div>
                      <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                        {q.explain && q.explain.trim() !== 'No explanation provided.'
                          ? q.explain
                          : `Option ${String.fromCharCode(65 + q.answer)} ("${q.options[q.answer]}") is the verified correct answer based on the curriculum standard for ${q.skill}.`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
