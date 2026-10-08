import React, { useState, useRef } from 'react';
import { QuestionDraft, Question, ExamType } from '../types';
import { parseRawQuestionsText } from '../utils/questionParser';
import { extractTextFromFile } from '../utils/documentParser';
import { EXAM_CONFIGS } from '../data/mockData';
import { UploadCloud, FileText, Check, Trash2, Edit3, X, Sparkles, Loader2, FileCheck, AlertCircle } from 'lucide-react';

interface AdminImportViewProps {
  onImportDrafts: (questions: Question[]) => void | Promise<void>;
  onCancel: () => void;
}

export const AdminImportView: React.FC<AdminImportViewProps> = ({ onImportDrafts, onCancel }) => {
  const [examPref, setExamPref] = useState<ExamType | 'Auto'>('Auto');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'word' | 'pdf' | 'text' | null>(null);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractionMsg, setExtractionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextParse = (text: string, name = 'Pasted Questions', type: 'word' | 'pdf' | 'text' = 'text') => {
    setFileName(name);
    setFileType(type);
    setRawText(text);
    const parsed = parseRawQuestionsText(text, examPref);
    setDrafts(parsed);
  };

  const processFile = async (file: File) => {
    setIsExtracting(true);
    setErrorMsg(null);
    const lowerName = file.name.toLowerCase();
    let detectedType: 'word' | 'pdf' | 'text' = 'text';

    if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      detectedType = 'word';
      setExtractionMsg('Reading Word document & extracting questions...');
    } else if (lowerName.endsWith('.pdf')) {
      detectedType = 'pdf';
      setExtractionMsg('Parsing PDF pages & extracting question text...');
    } else {
      detectedType = 'text';
      setExtractionMsg('Reading text file...');
    }

    try {
      const extractedText = await extractTextFromFile(file);
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No readable text could be extracted from this file. Please verify file content.');
      }
      handleTextParse(extractedText, file.name, detectedType);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(`Failed to extract text from ${file.name}: ${err?.message || 'Unsupported or corrupted format'}`);
    } finally {
      setIsExtracting(false);
      setExtractionMsg('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  };

  const loadSample = () => {
    const sample = `ANALOGY
1. FLAME : FIRE
A) heat : cold
B) smoke : chimney
C) drop : rain
D) wheel : car
Answer: C
Explanation: A flame is a constituent unit of fire; a drop is a constituent unit of rain.

SENTENCE COMPLETION
2. The ancient library was so ______ that scholars spent decades ______ its historical scrolls.
A) small … ignoring
B) vast … cataloging
C) empty … writing
D) noisy … reading
Answer: B
Explanation: "Vast" fits a library requiring decades of scholarship, and "cataloging" fits organizing scrolls.

ALGEBRA
3. If 5x - 7 = 3(x + 5), what is the value of x?
A) 8
B) 10
C) 11
D) 12
Answer: C
Explanation: 5x - 7 = 3x + 15 -> 2x = 22 -> x = 11.`;

    setRawText(sample);
    handleTextParse(sample, 'Sample Questions Template');
  };

  const toggleInclude = (idx: number) => {
    setDrafts(dList =>
      dList.map((d, i) => (i === idx ? { ...d, include: !d.include } : d))
    );
  };

  const handleConfirmImport = async () => {
    const validDrafts = drafts.filter(
      d => d.include && d.options.every(Boolean) && d.answer >= 0 && d.prompt
    );

    const questionsToAdd: Question[] = validDrafts.map((d, i) => ({
      id: `${d.exam.toLowerCase()}-imp-${Date.now().toString(36)}-${i}`,
      exam: d.exam,
      section: d.section,
      skill: d.skill,
      prompt: d.prompt,
      options: d.options,
      answer: d.answer,
      explain: d.explain || 'No explanation provided.',
      src: fileName.replace(/\.[^/.]+$/, '') || 'Imported File',
      passage: d.passage
    }));

    setIsSaving(true);
    try {
      await onImportDrafts(questionsToAdd);
    } finally {
      setIsSaving(false);
    }
  };

  const readyCount = drafts.filter(
    d => d.include && d.options.every(Boolean) && d.answer >= 0 && d.prompt
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            Import
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            Upload questions from a file
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mt-2 leading-relaxed break-words">
            Upload text files or paste questions directly. Detected questions are listed for review before anything is added to the bank.
          </p>
        </div>

        <button
          onClick={loadSample}
          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#1f3d7a] cursor-pointer shrink-0"
        >
          Load format sample
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#201e1d]">Exam</span>
            <div className="inline-flex border border-[#201e1d]/30 bg-transparent">
              {(['Auto', 'NAFS', 'GAT', 'SAT'] as (ExamType | 'Auto')[]).map(t => (
                <button
                  key={t}
                  onClick={() => setExamPref(t)}
                  className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    examPref === t ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
                  }`}
                >
                  {t === 'Auto' ? 'Auto-detect' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async e => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) {
                await processFile(file);
              }
            }}
            onClick={() => !isExtracting && fileInputRef.current?.click()}
            className={`border-2 p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 bg-white ${
              isDragging ? 'border-[#1f3d7a] bg-[#1f3d7a]/5' : 'border-[#201e1d]/30 hover:border-[#1f3d7a]'
            } ${isExtracting ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.pdf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {isExtracting ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="w-10 h-10 text-[#1f3d7a] animate-spin" />
                <div className="font-extrabold text-sm text-[#1f3d7a]">{extractionMsg || 'Processing document...'}</div>
                <div className="text-xs text-slate-500">Extracting questions, options, and answer keys</div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-[#1f3d7a] shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-extrabold text-base text-[#201e1d]">
                    Drop your question file here or click to browse
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Upload Word documents, PDF question banks, or plain text transcripts
                  </div>
                </div>

                {/* Badges for Supported Formats */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-blue-50 text-blue-800 ring-1 ring-blue-200">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Word Doc (.docx, .doc)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-red-50 text-red-800 ring-1 ring-red-200">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    PDF (.pdf)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Text & Notes (.txt)
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Error notification if extraction fails */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Extraction Error:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Extracted file feedback */}
          {fileName && !isExtracting && (
            <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2 truncate">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Loaded: <strong>{fileName}</strong></span>
                {fileType === 'word' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-extrabold uppercase">Word Doc</span>
                )}
                {fileType === 'pdf' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-extrabold uppercase">PDF</span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                {drafts.length} questions detected
              </span>
            </div>
          )}

          {/* Paste Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#201e1d]">
              Or paste questions directly
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={e => {
                setRawText(e.target.value);
                handleTextParse(e.target.value, 'Direct Paste');
              }}
              placeholder="Paste formatted questions here..."
              className="w-full p-3 font-mono text-xs border border-slate-300 bg-white text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
            />
          </div>
        </div>

        {/* Right Column: Guide (5 cols) */}
        <div className="lg:col-span-5 border-2 border-[#201e1d]/30 p-6 bg-white space-y-4">
          <div className="border-b-2 border-[#201e1d]/30 pb-2">
            <h3 className="text-base font-extrabold text-[#201e1d]">Format the file like this</h3>
          </div>

          <div className="font-mono text-xs leading-relaxed bg-[#eae9e9] p-3 text-[#201e1d] whitespace-pre-wrap">
{`ANALOGY
12. PALM : TREE
A) feather : bird
B) rose : flower
C) needle : sew
D) button : hole
Answer: B
Explanation: A palm is a kind of tree.`}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Number each question and put options on lines starting A) to D). "Answer:" and "Explanation:" lines are optional. Skill headings are optional too; questions are sorted automatically.
          </p>
        </div>
      </div>

      {/* Review Section */}
      {drafts.length > 0 && (
        <div className="space-y-4 pt-6 border-t-2 border-[#201e1d]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#201e1d]/30 pb-3">
            <div>
              <h3 className="text-lg font-black text-[#201e1d]">
                {drafts.length} questions found in {fileName}
              </h3>
              <div className="text-xs text-slate-500">
                {readyCount} ready · {drafts.length - readyCount} need review. Only questions with text, 4 options and a key will be imported.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-slate-400 bg-white text-xs font-bold text-[#201e1d] cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={readyCount === 0 || isSaving}
                className="btn-primary px-5 py-2 text-white text-xs font-black cursor-pointer disabled:opacity-40 inline-flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSaving ? 'Saving to Database...' : `Add & Save ${readyCount} to Bank`}</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-300">
            {drafts.map((draft, idx) => {
              const hasAllOptions = draft.options.every(Boolean);
              const hasAnswer = draft.answer >= 0;
              const isReady = hasAllOptions && hasAnswer && !!draft.prompt;

              return (
                <div key={idx} className="py-4 flex items-start gap-4">
                  <button
                    onClick={() => toggleInclude(idx)}
                    className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 cursor-pointer mt-0.5 ${
                      draft.include ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {draft.include && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-extrabold text-[#201e1d]">Q{draft.num || idx + 1}</span>
                      <span className="px-1.5 py-0.2 bg-[#eae9e9] font-bold text-[#201e1d] text-[10px]">
                        {draft.exam} · {draft.skill}
                      </span>
                      {draft.guessed && (
                        <span className="text-[10px] font-bold text-[#1f3d7a] border border-[#1f3d7a] px-1">
                          Check skill
                        </span>
                      )}
                      {!isReady && (
                        <span className="text-[10px] font-bold text-[#e15b47] bg-[#e15b47]/10 px-1">
                          Needs key / options
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-sm text-[#201e1d]">{draft.prompt}</div>

                    <div className="text-xs text-slate-600 truncate">
                      {draft.options.map((o, i) => `${['A', 'B', 'C', 'D'][i]}) ${o}${draft.answer === i ? ' ✓' : ''}`).join('   ')}
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingDraftIndex(idx)}
                    className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-[#201e1d] cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Draft Review Modal */}
      {editingDraftIndex !== null && drafts[editingDraftIndex] && (
        <div className="fixed inset-0 z-50 bg-[#201e1d]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#f3f2f2] max-w-xl w-full p-6 border-2 border-[#201e1d] max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#201e1d]/30">
              <h4 className="text-lg font-black text-[#201e1d]">Review question</h4>
              <button
                onClick={() => setEditingDraftIndex(null)}
                className="p-1 text-slate-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Skill</label>
              <select
                value={drafts[editingDraftIndex].skill}
                onChange={e => {
                  const val = e.target.value;
                  setDrafts(ds => {
                    const c = [...ds];
                    c[editingDraftIndex] = { ...c[editingDraftIndex], skill: val, guessed: false };
                    return c;
                  });
                }}
                className="w-full p-2.5 bg-white border border-slate-300 font-bold"
              >
                {EXAM_CONFIGS[drafts[editingDraftIndex].exam].sections.flatMap(sec =>
                  sec.skills.map(sk => (
                    <option key={sk} value={sk}>
                      {sec.name} · {sk}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Question</label>
              <textarea
                rows={3}
                value={drafts[editingDraftIndex].prompt}
                onChange={e => {
                  const val = e.target.value;
                  setDrafts(ds => {
                    const c = [...ds];
                    c[editingDraftIndex] = { ...c[editingDraftIndex], prompt: val };
                    return c;
                  });
                }}
                className="w-full p-2.5 bg-white border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Options (Click letter to set key)
              </label>
              <div className="space-y-2">
                {drafts[editingDraftIndex].options.map((opt, oIdx) => {
                  const isAnswer = drafts[editingDraftIndex].answer === oIdx;
                  const letter = ['A', 'B', 'C', 'D'][oIdx];
                  return (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDrafts(ds => {
                            const c = [...ds];
                            c[editingDraftIndex] = { ...c[editingDraftIndex], answer: oIdx };
                            return c;
                          });
                        }}
                        className={`w-8 h-8 font-black flex items-center justify-center border-2 cursor-pointer ${
                          isAnswer ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white' : 'border-slate-300 bg-white text-[#201e1d]'
                        }`}
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const val = e.target.value;
                          setDrafts(ds => {
                            const c = [...ds];
                            const opts = [...c[editingDraftIndex].options];
                            opts[oIdx] = val;
                            c[editingDraftIndex] = { ...c[editingDraftIndex], options: opts };
                            return c;
                          });
                        }}
                        className="flex-1 p-2 bg-white border border-slate-300"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t-2 border-[#201e1d]/30">
              <button
                type="button"
                onClick={() => setEditingDraftIndex(null)}
                className="btn-primary px-5 py-2 text-white text-xs font-black cursor-pointer"
              >
                Save and include
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
