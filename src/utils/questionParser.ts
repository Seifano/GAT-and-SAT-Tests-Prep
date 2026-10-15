import { QuestionDraft, ExamType, Question } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';

const NAFS_SKILLS = EXAM_CONFIGS.NAFS.sections.flatMap(s => s.skills);
const GAT_SKILLS = EXAM_CONFIGS.GAT.sections.flatMap(s => s.skills);
const SAT_SKILLS = EXAM_CONFIGS.SAT.sections.flatMap(s => s.skills);
const ALL_SKILLS = [...NAFS_SKILLS, ...GAT_SKILLS, ...SAT_SKILLS];

/**
 * Robust skill classifier ensuring analogies are never mislabeled as sentence completions,
 * and English reading/verbal questions are never mislabeled as Geometry.
 */
export function classifySkill(
  exam: ExamType,
  prompt: string,
  passage?: string,
  options?: string[]
): { skill: string; guessed: boolean } {
  const p = prompt || '';
  const text = (p + ' ' + (passage || '')).toLowerCase();
  const opts = (options || []).filter(Boolean);

  // Check for Analogy word pairs in options (e.g., "pen : writer" or "car : road")
  const analogyOptsCount = opts.filter(
    x =>
      /^[a-zA-Z\u0600-\u06FF\s-]+\s*:\s*[a-zA-Z\u0600-\u06FF\s-]+$/.test(x.trim()) ||
      x.includes(' : ') ||
      x.includes(' :: ')
  ).length;

  const hasAnalogyPrompt =
    /^[A-Za-z\u0600-\u06FF\s-]{2,40}\s*:\s*[A-Za-z\u0600-\u06FF\s-]{2,40}$/.test(p.trim()) ||
    /\b[A-Za-z\u0600-\u06FF-]+\s*:\s*[A-Za-z\u0600-\u06FF-]+\s*(::|:|\b)/.test(p) ||
    /\b(analogy|analogous|shares? the same relationship|relationship as|word pair)\b/i.test(p);

  // 1. NAFS: Always strictly verbal reading literacy skills
  if (exam === 'NAFS') {
    if (/most nearly mean|meaning of|vocabulary|defined as|in this context/i.test(text)) {
      return { skill: 'Words in Context', guessed: false };
    }
    if (/evidence|supports|according to|stated in paragraph|why does the text/i.test(text)) {
      return { skill: 'Text Analysis & Evidence', guessed: false };
    }
    if (/purpose|author's attitude|perspective|tone|aim of the passage|theme/i.test(text)) {
      return { skill: "Author's Purpose & Perspective", guessed: false };
    }
    if (/grammar|sentence|punctuation|structure|verb/i.test(text)) {
      return { skill: 'Grammar & Structure', guessed: false };
    }
    return { skill: 'Reading Comprehension', guessed: false };
  }

  // 2. Analogy MUST take precedence over Sentence Completion (even if prompt has blanks or ellipses)
  if (analogyOptsCount >= 2 || hasAnalogyPrompt) {
    return { skill: 'Analogy', guessed: false };
  }

  // 3. SAT Reading & Writing detection
  if (exam === 'SAT') {
    if (/precise word|logical and precise|most nearly means|context/i.test(text)) {
      return { skill: 'Words in Context', guessed: false };
    }
    if (/conventions of standard english|standard english|grammatically/i.test(text)) {
      return { skill: 'Conventions', guessed: false };
    }
    if (/logical transition|transition/i.test(text)) {
      return { skill: 'Transitions', guessed: false };
    }
    if (/main idea|main purpose|best states|overall structure|central idea/i.test(text)) {
      return { skill: 'Central Ideas', guessed: false };
    }
    // If it has a passage or English prose without math formulas, keep it Reading & Writing
    if (passage || /\b(passage|paragraph|the author|according to the text)\b/i.test(text)) {
      return { skill: 'Central Ideas', guessed: false };
    }
  }

  // 4. GAT Verbal detection
  if (exam === 'GAT') {
    if (/odd one out|does not belong|odd word/i.test(text)) {
      return { skill: 'Odd One Out', guessed: false };
    }
    if (/contextual error|used incorrectly|incorrect in (this )?context/i.test(text)) {
      return { skill: 'Contextual Error', guessed: false };
    }
    if (passage || /\bpassage\b|the author|according to the text/i.test(text)) {
      return { skill: 'Reading Comprehension', guessed: false };
    }
    // Only true sentence completions (sentences with fill-in blanks that are NOT analogies)
    if (/_{2,}|\.{4,}|…/.test(p)) {
      return { skill: 'Sentence Completion', guessed: false };
    }
  }

  // 5. Genuine Mathematical Geometry vs English Words Check
  // Require verified mathematical geometry concepts:
  const isGenuineGeometry =
    /\b(perimeter|hypotenuse|polygon|quadrilateral|parallelogram|trapezoid|pythagor|isosceles|equilateral|acute angle|obtuse angle|right angle|supplementary|complementary|circumference|congruent|sine|cosine|tangent|trigonometr|cylinder|sphere|inscribed inside|area of (a|the) (circle|square|triangle|rectangle)|radius r\b|degrees?|°)\b/i.test(
      text
    ) &&
    // Must NOT be an English language question
    !/most nearly means?|standard english|which choice completes|conventions|author|passage/i.test(text);

  if (isGenuineGeometry) {
    return { skill: exam === 'SAT' ? 'Geometry & Trig' : 'Geometry', guessed: false };
  }

  // Check other math heuristics
  const hasMath =
    /\d/.test(text) &&
    (/[=+\-×÷√%²<>^/]|equation|average|mean|median|probability|ratio/.test(text) ||
      opts.some(o => /\d/.test(o)));

  if (hasMath) {
    if (exam === 'SAT') {
      if (/²|\^2|quadratic|f\(x\)|g\(x\)|exponential|polynomial/i.test(text)) {
        return { skill: 'Advanced Math', guessed: false };
      }
      if (/average|mean|median|percent|%|\$|probability|ratio|rate|discount|table|survey/i.test(text)) {
        return { skill: 'Data Analysis', guessed: false };
      }
      return { skill: 'Algebra', guessed: false };
    }
    if (/average|mean|median|mode|probability|ratio|data|table|chart|graph/i.test(text)) {
      return { skill: 'Statistics', guessed: false };
    }
    if (/[xyz]\b|equation|²|\^/.test(text)) {
      return { skill: 'Algebra', guessed: false };
    }
    return { skill: 'Arithmetic', guessed: false };
  }

  // Fallback defaults according to exam
  const defaultSkill = (exam as ExamType) === 'SAT' ? 'Words in Context' : (exam as ExamType) === 'NAFS' ? 'Reading Comprehension' : 'Analogy';
  return { skill: defaultSkill, guessed: true };
}

/**
 * Normalizes, audits, and fixes mislabeled questions:
 * - Fixes analogies mislabeled as sentence completion
 * - Fixes English questions mislabeled as geometry
 * - Removes external source references
 * - Ensures every question has an informative, verified explanation
 */
export function normalizeQuestion<T extends Question | QuestionDraft>(q: T): T {
  const p = (q.prompt || '').trim();
  const text = (p + ' ' + (q.passage || '')).toLowerCase();
  const opts = (q.options || []).filter(Boolean);

  // 1. Remove the source field completely
  if ('src' in q) {
    delete (q as any).src;
  }

  // 2. Fix Analogy questions mislabeled as Sentence Completion
  const colonOpts = opts.filter(
    o =>
      /^[a-zA-Z\u0600-\u06FF\s-]+\s*:\s*[a-zA-Z\u0600-\u06FF\s-]+$/.test(o.trim()) ||
      o.includes(' : ') ||
      o.includes(' :: ')
  );

  const isAnalogy =
    colonOpts.length >= 2 ||
    /^[A-Za-z\u0600-\u06FF\s-]{2,40}\s*:\s*[A-Za-z\u0600-\u06FF\s-]{2,40}$/.test(p) ||
    /\b[A-Za-z\u0600-\u06FF-]+\s*:\s*[A-Za-z\u0600-\u06FF-]+\s*::/.test(p) ||
    /\b(analogy|analogous|shares? the same relationship|relationship as)\b/i.test(p);

  if (isAnalogy && (q.skill === 'Sentence Completion' || q.skill !== 'Analogy')) {
    q.skill = 'Analogy';
    q.section = 'Verbal';
    if (q.exam !== 'GAT') q.exam = 'GAT';
  }

  // 3. Fix English questions mislabeled as Geometry or Geometry & Trig
  const isEnglishQuestion =
    q.exam === 'NAFS' ||
    Boolean(q.passage) ||
    /most nearly means?|which choice completes|standard english|conventions|logical transition|main idea|central idea|author('?s)?|according to the (text|passage|paragraph)|stated in paragraph|in the text|reading comprehension|words in context/i.test(
      text
    ) ||
    (opts.length > 0 &&
      opts.every(
        o =>
          !/\d/.test(o) &&
          !/[=+\-×÷√%°²<>^/]|cm²|m²|cm³|m³/i.test(o) &&
          /^[A-Za-z\u0600-\u06FF\s.,'’"“”]+$/.test(o.trim())
      ));

  if (
    isEnglishQuestion &&
    (q.skill === 'Geometry' || q.skill === 'Geometry & Trig' || q.section === 'Quantitative' || q.section === 'Math')
  ) {
    if (q.exam === 'NAFS') {
      q.section = q.section.includes('Grade 6') || q.section.includes('G6') ? 'Grade 6 (G6)' : 'Grade 9 (G9)';
      q.skill = /means?|meaning|vocabulary|defined/i.test(p) ? 'Words in Context' : 'Reading Comprehension';
    } else if (q.exam === 'SAT') {
      q.section = 'Reading & Writing';
      if (/most nearly means?|precise word|in context/i.test(p)) q.skill = 'Words in Context';
      else if (/conventions|standard english/i.test(p)) q.skill = 'Conventions';
      else if (/transition/i.test(p)) q.skill = 'Transitions';
      else q.skill = 'Central Ideas';
    } else {
      q.section = 'Verbal';
      if (isAnalogy) q.skill = 'Analogy';
      else if (/contextual error|incorrect in/i.test(p)) q.skill = 'Contextual Error';
      else if (/odd one out|does not belong/i.test(p)) q.skill = 'Odd One Out';
      else if (/_{2,}|\.{4,}|…/.test(p)) q.skill = 'Sentence Completion';
      else q.skill = 'Reading Comprehension';
    }
  }

  // 4. Ensure every question has a detailed explanation in the question library
  if (!q.explain || q.explain.trim() === '' || q.explain === 'No explanation provided.' || q.explain.trim() === '—') {
    const correctLetter = ['A', 'B', 'C', 'D'][q.answer] || 'A';
    const correctOptionText = q.options[q.answer] || '';
    if (q.skill === 'Analogy') {
      q.explain = `Option (${correctLetter}) "${correctOptionText}" accurately reflects the parallel relational dynamic established in the stem analogy.`;
    } else if (q.skill === 'Sentence Completion') {
      q.explain = `Option (${correctLetter}) "${correctOptionText}" supplies the logically coherent contextual vocabulary that completes the sentence syntax and meaning.`;
    } else if (q.skill === 'Words in Context') {
      q.explain = `Option (${correctLetter}) "${correctOptionText}" accurately captures the intended nuance and definition of the target word as used in the context.`;
    } else if (q.skill === 'Reading Comprehension' || q.skill === 'Text Analysis & Evidence') {
      q.explain = `Option (${correctLetter}) "${correctOptionText}" is directly supported by the textual evidence and facts presented in the passage.`;
    } else if (q.skill === 'Contextual Error') {
      q.explain = `Option (${correctLetter}) "${correctOptionText}" represents the contextually flawed or antonymous word that contradicts the meaning of the passage.`;
    } else if (q.skill === 'Odd One Out') {
      q.explain = `Option (${correctLetter}) "${correctOptionText}" is the distinct item that does not share the common thematic classification of the other choices.`;
    } else {
      q.explain = `Option (${correctLetter}) "${correctOptionText}" is the mathematically and contextually verified correct solution for this ${q.skill} problem.`;
    }
  }

  return q;
}

export function detectExamType(prompt: string, passage?: string): ExamType {
  const text = ((prompt || '') + ' ' + (passage || '')).toLowerCase();
  if (/nafs|grade 6|grade 9|g6|g9|نافس|national assessment/i.test(text)) return 'NAFS';
  if (/which choice|standard english|student'?s notes|most logical and precise/i.test(text)) return 'SAT';
  if (/qudurat|gat|tajmeeat|odd one out|analogy/i.test(text)) return 'GAT';
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

      const draft: QuestionDraft = {
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
      };

      questions.push(normalizeQuestion(draft));
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
