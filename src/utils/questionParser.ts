import { QuestionDraft, ExamType } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';

const GAT_SKILLS = EXAM_CONFIGS.GAT.sections.flatMap(s => s.skills);
const SAT_SKILLS = EXAM_CONFIGS.SAT.sections.flatMap(s => s.skills);
const ALL_SKILLS = [...GAT_SKILLS, ...SAT_SKILLS];

export function classifySkill(exam: ExamType, prompt: string, passage?: string, options?: string[]): { skill: string; guessed: boolean } {
  const p = prompt || '';
  const text = (p + ' ' + (passage || '')).toLowerCase();
  const opts = (options || []).filter(Boolean);

  if (exam === 'SAT') {
    if (/precise word|logical and precise|most nearly means|context/.test(text)) return { skill: 'Words in Context', guessed: false };
    if (/conventions of standard english|standard english|grammatically/.test(text)) return { skill: 'Conventions', guessed: false };
    if (/logical transition|transition/.test(text)) return { skill: 'Transitions', guessed: false };
    if (/main idea|main purpose|best states|overall structure|central idea/.test(text)) return { skill: 'Central Ideas', guessed: false };
  } else {
    if (/odd one out|does not belong|odd word/.test(text)) return { skill: 'Odd One Out', guessed: false };
    if (opts.filter(x => x.includes(':')).length >= 2 || /^[^:\d]{1,30}\s*:\s*[^:\d]{1,30}$/.test(p.trim())) return { skill: 'Analogy', guessed: false };
    if (/contextual error|used incorrectly|incorrect in (this )?context/.test(text)) return { skill: 'Contextual Error', guessed: false };
    if (/_{2,}|\.{4,}|…/.test(p)) return { skill: 'Sentence Completion', guessed: false };
    if (opts.length >= 3 && !/\d/.test(p) && opts.every(w => !/\s/.test(w) && p.toLowerCase().includes(w.toLowerCase()))) return { skill: 'Contextual Error', guessed: false };
    if (passage || /\bpassage\b|the author|according to the text/.test(text)) return { skill: 'Reading Comprehension', guessed: false };
  }

  // Check math heuristics
  const hasMath = /\d/.test(text) && /[=+\-×÷√%°²<>^/]|triangle|angle|radius|diameter|area|volume|perimeter|equation|average|mean|median|probability|ratio/.test(text);
  if (hasMath) {
    if (/triangle|angle|circle|radius|diameter|rectangle|square|perimeter|area|volume|cube|cylinder|°|hypotenuse|polygon|parallel|sin|cos|tan/.test(text)) {
      return { skill: exam === 'SAT' ? 'Geometry & Trig' : 'Geometry', guessed: false };
    }
    if (exam === 'SAT') {
      if (/²|\^2|quadratic|f\(x\)|g\(x\)|exponential|polynomial/.test(text)) return { skill: 'Advanced Math', guessed: false };
      if (/average|mean|median|percent|%|\$|probability|ratio|rate|discount|table|survey/.test(text)) return { skill: 'Data Analysis', guessed: false };
      return { skill: 'Algebra', guessed: false };
    }
    if (/average|mean|median|mode|probability|ratio|data|table|chart|graph/.test(text)) return { skill: 'Statistics', guessed: false };
    if (/[xyz]\b|equation|²|\^/.test(text)) return { skill: 'Algebra', guessed: false };
    return { skill: 'Arithmetic', guessed: false };
  }

  const defaultSkill = exam === 'SAT' ? 'Words in Context' : 'Analogy';
  return { skill: defaultSkill, guessed: true };
}

export function detectExamType(prompt: string, passage?: string): ExamType {
  const text = ((prompt || '') + ' ' + (passage || '')).toLowerCase();
  if (/which choice|standard english|student'?s notes|most logical and precise/.test(text)) return 'SAT';
  if (/qudurat|gat|tajmeeat|odd one out|analogy/.test(text)) return 'GAT';
  return 'GAT';
}

export function parseRawQuestionsText(text: string, preferredExam: ExamType | 'Auto' = 'Auto'): QuestionDraft[] {
  let detectedHeadingSkill: string | null = null;
  const questions: QuestionDraft[] = [];
  let current: Partial<QuestionDraft> | null = null;
  let mode: 'prompt' | 'options' | 'explain' | 'passage' = 'prompt';
  let pendingOptionIndex = -1;

  const lines = text.split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

  const flushCurrent = () => {
    if (current && (current.prompt || current.options?.some(Boolean))) {
      const qPrompt = (current.prompt || '').trim();
      const qOptions = current.options || ['', '', '', ''];
      const exam = preferredExam === 'Auto' ? detectExamType(qPrompt, current.passage) : preferredExam;
      const { skill, guessed } = detectedHeadingSkill
        ? { skill: detectedHeadingSkill, guessed: false }
        : classifySkill(exam, qPrompt, current.passage, qOptions);

      const section = EXAM_CONFIGS[exam].sections.find(s => s.skills.includes(skill))?.name || 'General';

      questions.push({
        num: current.num || questions.length + 1,
        exam,
        section,
        skill,
        prompt: qPrompt,
        options: qOptions,
        answer: current.answer !== undefined && current.answer !== null ? current.answer : -1,
        explain: current.explain?.trim() || 'No explanation provided.',
        passage: current.passage?.trim() || undefined,
        include: qOptions.every(Boolean) && current.answer !== undefined && current.answer >= 0 && !!qPrompt,
        guessed
      });
    }
  };

  for (const line of lines) {
    // Check if line is a skill header
    if (line.length <= 40 && !/^\d/.test(line)) {
      const up = line.toUpperCase();
      const matched = ALL_SKILLS.find(s => up === s.toUpperCase() || up.includes(s.toUpperCase()));
      if (matched) {
        detectedHeadingSkill = matched;
        continue;
      }
    }

    // Check for question start like "1. ", "Question 1:", "12) ", "[1] ", "Q1. "
    const qMatch = line.match(/^(?:Q(?:uestion)?\s*#?|\[|\()?\s*(\d{1,3})\s*(?:[.)\]\-:]|\s*:)\s*(.*)$/i);
    if (qMatch && !/^\(?[A-D][).]/i.test(line)) {
      flushCurrent();
      current = {
        num: parseInt(qMatch[1], 10),
        prompt: qMatch[2] || '',
        options: ['', '', '', ''],
        answer: -1,
        explain: ''
      };
      mode = 'prompt';
      pendingOptionIndex = -1;
      continue;
    }

    if (!current) continue;

    // Check for answer key like "Answer: B", "Ans: A", "Key: C", "Correct: D", "Solution: A"
    const ansMatch = line.match(/^(?:answer|ans|correct answer|correct|key|solution|sol)\s*[:\-]?\s*(?:is\s*)?\(?\[?([A-D])\]?\)?\b/i);
    if (ansMatch) {
      current.answer = 'ABCD'.indexOf(ansMatch[1].toUpperCase());
      mode = 'explain';
      continue;
    }

    // Check for explanation like "Explanation:", "Rationale:", "Why:"
    const expMatch = line.match(/^(?:explanation|explain|rationale|why|solution notes)\s*[:\-]\s*(.*)$/i);
    if (expMatch) {
      current.explain = expMatch[1];
      mode = 'explain';
      continue;
    }

    // Check for options like "A) ... B) ...", "A. ...", "(A) ...", "[A] ..."
    const optionMatches = [...line.matchAll(/(?:^|\s)(?:\(|\[)?([A-Da-d])(?:[).\]\-:]|\s*:)\s*/g)];
    if (optionMatches.length && (optionMatches[0].index === 0 || /^\s*\(?[A-Da-d][).\]]/.test(line))) {
      optionMatches.forEach((match, k) => {
        const optLetter = match[1].toUpperCase();
        const optIdx = 'ABCD'.indexOf(optLetter);
        const start = match.index! + match[0].length;
        const end = k + 1 < optionMatches.length ? optionMatches[k + 1].index! : line.length;
        if (optIdx >= 0 && current && current.options) {
          current.options[optIdx] = line.slice(start, end).trim();
          pendingOptionIndex = current.options[optIdx] ? -1 : optIdx;
        }
      });
      mode = 'options';
      continue;
    }

    if (pendingOptionIndex >= 0 && current && current.options) {
      current.options[pendingOptionIndex] = line;
      pendingOptionIndex = -1;
      continue;
    }

    if (mode === 'explain') {
      current.explain = ((current.explain || '') + ' ' + line).trim();
    } else if (mode === 'prompt') {
      current.prompt = ((current.prompt || '') + ' ' + line).trim();
    }
  }

  flushCurrent();
  return questions;
}
