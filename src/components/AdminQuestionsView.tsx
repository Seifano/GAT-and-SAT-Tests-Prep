import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Question, ExamType } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { Plus, Search, Filter, Trash2, Edit3, X, UploadCloud, Cloud, RefreshCw, ChevronDown } from 'lucide-react';

interface AdminQuestionsViewProps {
  bank: Record<ExamType, Question[]>;
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (q: Question) => void;
  onDeleteQuestion: (exam: ExamType, id: string) => void;
  onNavigateImport?: () => void;
  onSyncAllToCloud?: () => Promise<void> | void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'idle';
  lastCloudSyncTime?: string;
}

export const AdminQuestionsView: React.FC<AdminQuestionsViewProps> = ({
  bank,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onNavigateImport,
  onSyncAllToCloud,
  cloudSyncStatus = 'idle',
  lastCloudSyncTime = 'Connected'
}) => {
  const [activeExam, setActiveExam] = useState<ExamType>('GAT');
  const [skillFilter, setSkillFilter] = useState('All');
  const [showCoverageGrid, setShowCoverageGrid] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formExam, setFormExam] = useState<ExamType>('GAT');
  const [formSkill, setFormSkill] = useState('');
  const [formPassage, setFormPassage] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formAnswer, setFormAnswer] = useState<number>(0);
  const [formExplain, setFormExplain] = useState('');
  const [formError, setFormError] = useState('');

  const conf = EXAM_CONFIGS[activeExam];
  const allSkills = Array.from(new Set(conf.sections.flatMap(s => s.skills)));
  const currentBank = bank[activeExam] || [];

  const filtered = currentBank.filter(q => {
    const matchSkill = skillFilter === 'All' || q.skill === skillFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (q.prompt + ' ' + (q.passage || '') + ' ' + q.options.join(' ') + ' ' + (q.explain || '')).toLowerCase().includes(term);
    return matchSkill && matchSearch;
  });

  const openAddModal = () => {
    setFormExam(activeExam);
    setFormSkill(allSkills[0]);
    setFormPassage('');
    setFormPrompt('');
    setFormOptions(['', '', '', '']);
    setFormAnswer(0);
    setFormExplain('');
    setFormError('');
    setIsNewModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormExam(q.exam);
    setFormSkill(q.skill);
    setFormPassage(q.passage || '');
    setFormPrompt(q.prompt);
    setFormOptions([...q.options]);
    setFormAnswer(q.answer);
    setFormExplain(q.explain || '');
    setFormError('');
  };

  const handleSaveModal = () => {
    if (!formPrompt.trim()) {
      setFormError('Enter the question text.');
      return;
    }
    if (formOptions.some(opt => !opt.trim())) {
      setFormError('Fill in all four options.');
      return;
    }
    if (formAnswer < 0 || formAnswer > 3) {
      setFormError('Mark the correct answer.');
      return;
    }

    const section = EXAM_CONFIGS[formExam].sections.find(s => s.skills.includes(formSkill))?.name || 'General';

    const questionObj: Question = {
      id: editingQuestion ? editingQuestion.id : `${formExam.toLowerCase()}-${Date.now().toString(36)}`,
      exam: formExam,
      section,
      skill: formSkill,
      prompt: formPrompt.trim(),
      options: formOptions.map(o => o.trim()),
      answer: formAnswer,
      explain: formExplain.trim() || `Option ${['A', 'B', 'C', 'D'][formAnswer]} is the verified correct answer.`,
      passage: formPassage.trim() || undefined
    };

    if (editingQuestion) {
      onUpdateQuestion(questionObj);
    } else {
      onAddQuestion(questionObj);
    }

    setIsNewModalOpen(false);
    setEditingQuestion(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            Question bank
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            {currentBank.length} {activeExam} questions
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onSyncAllToCloud && (
            <button
              onClick={onSyncAllToCloud}
              disabled={cloudSyncStatus === 'syncing'}
              className="px-4 py-2.5 bg-[#1f3d7a] hover:bg-[#152a55] text-white shadow-xs text-xs font-black flex items-center gap-2 cursor-pointer transition-all duration-200 rounded-lg hover:-translate-y-0.5 active:translate-y-0"
              title="Save and synchronize all uploaded questions to Cloud Firestore"
            >
              {cloudSyncStatus === 'syncing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4 text-sky-300" />
              )}
              <span>{cloudSyncStatus === 'syncing' ? 'Syncing to Cloud...' : 'Save to Cloud'}</span>
            </button>
          )}

          {onNavigateImport && (
            <button
              onClick={onNavigateImport}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:border-[#1f3d7a] text-slate-800 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200"
            >
              <UploadCloud className="w-4 h-4 text-[#1f3d7a]" />
              <span>Upload Word / PDF</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="btn-primary px-5 py-2.5 text-white text-xs font-black flex items-center gap-2 cursor-pointer"
          >
            <span>Add question</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Modern Exam Switcher Tabs */}
      <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 shadow-[inset_0_2px_3px_rgba(0,0,0,0.06)] gap-1">
        {(['NAFS', 'GAT', 'SAT'] as ExamType[]).map(exam => {
          const isSelected = activeExam === exam;
          const count = bank[exam]?.length || 0;
          return (
            <button
              key={exam}
              onClick={() => {
                setActiveExam(exam);
                setSkillFilter('All');
              }}
              className={`px-4 py-1.5 text-xs font-black cursor-pointer rounded-lg transition-all duration-200 ${
                isSelected
                  ? 'bg-white text-[#1f3d7a] shadow-[0_2px_0_0_#1f3d7a,0_2px_4px_rgba(0,0,0,0.1)] -translate-y-0.5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {exam} · {count}
            </button>
          );
        })}
      </div>

      {/* Collapsible Skill Coverage Matrix */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCoverageGrid(!showCoverageGrid)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          aria-expanded={showCoverageGrid}
        >
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 text-[#1f3d7a]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider group-hover:text-[#1f3d7a] transition-colors">
                  Skill Coverage Matrix ({allSkills.length} Domains)
                </span>
                {skillFilter !== 'All' && (
                  <span className="text-[10px] font-bold text-[#1f3d7a] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Active Filter: {skillFilter}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click to inspect inventory counts by domain; fewer than 2 questions is flagged
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>{showCoverageGrid ? 'Hide Matrix' : 'Show Matrix'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCoverageGrid ? 'rotate-180 text-[#1f3d7a]' : ''}`} />
          </div>
        </button>

        {showCoverageGrid && (
          <div className="border-t border-slate-200 p-3 bg-slate-50/50 animate-viewFadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 border-t border-l border-slate-200 bg-white">
              {allSkills.map(sk => {
                const count = currentBank.filter(q => q.skill === sk).length;
                const isSelected = skillFilter === sk;
                const isLow = count < 2;

                return (
                  <button
                    key={sk}
                    onClick={() => setSkillFilter(isSelected ? 'All' : sk)}
                    className={`p-3 border-r border-b border-slate-200 text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-[#1f3d7a]/15 ring-1 ring-[#1f3d7a] z-10' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs text-slate-700 block truncate font-medium">{sk}</span>
                    <span className={`text-2xl font-black block mt-1 tabular-nums ${isLow ? 'text-[#e15b47]' : 'text-[#201e1d]'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search question text or options..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 text-xs text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
          />
        </div>

        <select
          value={skillFilter}
          onChange={e => setSkillFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-300 text-xs text-[#201e1d] font-bold focus:outline-none focus:border-[#1f3d7a] w-full sm:w-auto"
        >
          <option value="All">All skills</option>
          {allSkills.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-t-2 border-[#201e1d]/30">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-[#201e1d]/30 text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-2 w-10">#</th>
              <th className="py-2.5 px-3">Question</th>
              <th className="py-2.5 px-3 w-40">Skill</th>
              <th className="py-2.5 px-3 w-16">Key</th>
              <th className="py-2.5 px-3">Explanation</th>
              <th className="py-2.5 px-3 w-28 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  No questions match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((q, idx) => {
                const keyLetter = ['A', 'B', 'C', 'D'][q.answer] || '—';
                const isConfirming = confirmDeleteId === q.id;

                return (
                  <tr key={q.id} className="hover:bg-slate-100/50">
                    <td className="py-3 px-2 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 max-w-md">
                      <div className="font-bold text-[#201e1d] line-clamp-2">{q.prompt}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-1">
                        {q.options.map((o, i) => `${['A', 'B', 'C', 'D'][i]}) ${o}`).join('   ')}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#201e1d] font-semibold">{q.skill}</td>
                    <td className="py-3 px-3 font-extrabold text-[#1f3d7a] text-sm">{keyLetter}</td>
                    <td className="py-3 px-3 text-slate-600 text-xs truncate max-w-xs" title={q.explain}>{q.explain || '—'}</td>
                    <td className="py-3 px-3 text-right">
                      {isConfirming ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              onDeleteQuestion(activeExam, q.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 bg-[#e15b47] text-white text-xs font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-slate-200 text-[#201e1d] text-xs font-bold cursor-pointer"
                          >
                            Keep
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(q)}
                            className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(q.id)}
                            className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Question Modal */}
      {(isNewModalOpen || editingQuestion) && createPortal(
        <div className="fixed inset-0 z-50 bg-[#201e1d]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#f3f2f2] max-w-2xl w-full p-6 sm:p-8 border-2 border-[#201e1d] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#201e1d]/30">
              <h3 className="text-xl font-black text-[#201e1d]">
                {editingQuestion ? 'Edit question' : 'Add question'}
              </h3>
              <button
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingQuestion(null);
                }}
                className="p-1 text-slate-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam</label>
                  <select
                    value={formExam}
                    onChange={e => {
                      const ex = e.target.value as ExamType;
                      setFormExam(ex);
                      setFormSkill(EXAM_CONFIGS[ex].sections[0].skills[0]);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 font-bold"
                  >
                    <option value="NAFS">NAFS (Grade 6 & Grade 9)</option>
                    <option value="GAT">GAT</option>
                    <option value="SAT">SAT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skill</label>
                  <select
                    value={formSkill}
                    onChange={e => setFormSkill(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 font-bold"
                  >
                    {EXAM_CONFIGS[formExam].sections.flatMap(sec =>
                      sec.skills.map(sk => (
                        <option key={`${sec.name}-${sk}`} value={sk}>
                          {sec.name} · {sk}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Passage (optional)</label>
                <textarea
                  rows={3}
                  value={formPassage}
                  onChange={e => setFormPassage(e.target.value)}
                  placeholder="Paste multi-paragraph reading passage..."
                  className="w-full p-2.5 bg-white border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Question</label>
                <textarea
                  rows={3}
                  value={formPrompt}
                  onChange={e => setFormPrompt(e.target.value)}
                  placeholder="Enter the question..."
                  className="w-full p-2.5 bg-white border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Options. Click a letter to mark the correct answer.
                </label>
                <div className="space-y-2">
                  {formOptions.map((opt, i) => {
                    const isKey = formAnswer === i;
                    const letter = ['A', 'B', 'C', 'D'][i];
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormAnswer(i)}
                          className={`w-9 h-9 font-black flex items-center justify-center shrink-0 border-2 cursor-pointer ${
                            isKey ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white' : 'border-slate-300 bg-white text-[#201e1d]'
                          }`}
                        >
                          {letter}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...formOptions];
                            newOpts[i] = e.target.value;
                            setFormOptions(newOpts);
                          }}
                          placeholder={`Option ${letter}`}
                          className="flex-1 p-2.5 bg-white border border-slate-300 text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Explanation</label>
                <textarea
                  rows={3}
                  value={formExplain}
                  onChange={e => setFormExplain(e.target.value)}
                  placeholder="Explain why the answer is correct..."
                  className="w-full p-2.5 bg-white border border-slate-300 text-xs rounded"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-900 font-bold">
                  {formError}
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-[#201e1d]/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingQuestion(null);
                }}
                className="px-4 py-2 border border-slate-400 bg-white text-xs font-bold text-[#201e1d] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="btn-primary px-5 py-2 text-white text-xs font-black cursor-pointer"
              >
                {editingQuestion ? 'Save question' : 'Add question'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
