import React, { useState } from 'react';
import { Question, ExamType } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { Search, Filter, BookOpen, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface QuestionBrowserViewProps {
  activeExam: ExamType;
  bank: Record<ExamType, Question[]>;
  onSelectExam: (exam: ExamType) => void;
}

export const QuestionBrowserView: React.FC<QuestionBrowserViewProps> = ({
  activeExam,
  bank,
  onSelectExam
}) => {
  const [skillFilter, setSkillFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [openPassageId, setOpenPassageId] = useState<string | null>(null);

  const conf = EXAM_CONFIGS[activeExam];
  const allSkills = conf.sections.flatMap(s => s.skills);
  const questions = bank[activeExam] || [];

  const toggleSolution = (id: string) => {
    setRevealedSolutions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = questions.filter(q => {
    const matchSkill = skillFilter === 'All' || q.skill === skillFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (q.prompt + ' ' + (q.passage || '') + ' ' + q.options.join(' ') + ' ' + (q.src || '')).toLowerCase().includes(term);
    return matchSkill && matchSearch;
  });

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
            Review questions, study detailed answer keys, and explore real test passages at your own pace outside of timed simulations.
          </p>
        </div>

        {/* Exam Toggle */}
        <div className="inline-flex border border-[#201e1d]/30 bg-transparent shrink-0">
          {(['GAT', 'SAT'] as ExamType[]).map(e => (
            <button
              key={e}
              onClick={() => {
                onSelectExam(e);
                setSkillFilter('All');
              }}
              className={`px-4 py-1.5 text-xs font-black transition-all cursor-pointer ${
                activeExam === e ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
              }`}
            >
              {e} ({bank[e]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search questions by topic, words, passage, or source..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 text-xs text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-300 text-xs text-[#201e1d] font-bold focus:outline-none focus:border-[#1f3d7a] w-full sm:w-auto"
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
        <div className="text-xs text-slate-500 font-bold">
          Showing {filtered.length} of {questions.length} questions
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-slate-300 space-y-2">
            <h3 className="font-bold text-sm text-[#201e1d]">No questions match your search</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or skill filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((q, idx) => {
              const isRevealed = !!revealedSolutions[q.id];
              const isPassageOpen = openPassageId === q.id;

              return (
                <div key={q.id} className="p-6 bg-white border-2 border-[#201e1d]/30 space-y-4">
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-[#1f3d7a]">#{idx + 1}</span>
                      <span className="px-1.5 py-0.5 bg-[#eae9e9] text-[10px]">{q.section}</span>
                      <span className="text-slate-600">· {q.skill}</span>
                      {q.src && <span className="text-slate-400 font-normal italic">· {q.src}</span>}
                    </div>

                    <button
                      onClick={() => toggleSolution(q.id)}
                      className="px-3 py-1 bg-[#eae9e9] hover:bg-slate-300 text-xs font-bold text-[#1f3d7a] cursor-pointer transition-colors"
                    >
                      {isRevealed ? 'Hide solution' : 'Show solution & key'}
                    </button>
                  </div>

                  {/* Optional Passage */}
                  {q.passage && (
                    <div>
                      <button
                        onClick={() => setOpenPassageId(isPassageOpen ? null : q.id)}
                        className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer flex items-center gap-1 mb-2"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isPassageOpen ? 'Hide reading passage' : 'Show reading passage'}</span>
                        {isPassageOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isPassageOpen && (
                        <div className="p-4 bg-[#eae9e9] border border-slate-300 text-xs sm:text-sm text-slate-800 whitespace-pre-line max-h-64 overflow-y-auto leading-relaxed">
                          {q.passage}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prompt */}
                  <div className="text-base font-bold text-[#201e1d] whitespace-pre-line">
                    {q.prompt}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, oIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][oIdx];
                      const isCorrect = isRevealed && q.answer === oIdx;

                      return (
                        <div
                          key={oIdx}
                          className={`p-3 border-2 text-xs sm:text-sm flex items-start gap-2.5 transition-all ${
                            isCorrect
                              ? 'border-[#1f3d7a] bg-[#1f3d7a]/10 font-bold text-[#1f3d7a]'
                              : 'border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 border ${
                              isCorrect
                                ? 'bg-[#1f3d7a] text-white border-[#1f3d7a]'
                                : 'bg-slate-100 text-[#201e1d] border-slate-300'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="pt-0.5 leading-snug flex-1">{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] uppercase font-black text-[#1f3d7a] shrink-0">
                              ✓ Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Revealed Explanation */}
                  {isRevealed && (
                    <div className="p-4 bg-[#eae9e9] border-l-4 border-[#1f3d7a] text-xs sm:text-sm text-slate-800 space-y-1">
                      <span className="font-extrabold text-[#201e1d] block">
                        Correct Answer: {['A', 'B', 'C', 'D'][q.answer]}
                      </span>
                      <p className="leading-relaxed text-slate-700">{q.explain}</p>
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
