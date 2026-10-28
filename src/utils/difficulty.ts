import { Question, DifficultyLevel } from '../types';
import { Language } from './i18n';

/**
 * Derives a consistent difficulty level for any question (Easy, Medium, Hard).
 * If the question already has an assigned difficulty, returns it directly.
 * Otherwise deterministically assigns based on question id and characteristics.
 */
export function getQuestionDifficulty(q: Question): DifficultyLevel {
  if (q.difficulty) return q.difficulty;

  // Deterministic hash based on question ID
  let hash = 0;
  for (let i = 0; i < q.id.length; i++) {
    hash = (hash << 5) - hash + q.id.charCodeAt(i);
    hash |= 0;
  }
  const mod = Math.abs(hash) % 10;

  // 35% Easy, 40% Medium, 25% Hard
  if (mod < 3) return 'Easy';
  if (mod < 7) return 'Medium';
  return 'Hard';
}

export function getDifficultyLabel(difficulty: DifficultyLevel, language: Language = 'en'): string {
  if (language === 'ar') {
    switch (difficulty) {
      case 'Easy':
        return 'سهل';
      case 'Medium':
        return 'متوسط';
      case 'Hard':
        return 'صعب';
    }
  }
  return difficulty;
}

export function getDifficultyBadgeColor(difficulty: DifficultyLevel): {
  badge: string;
  dot: string;
  border: string;
  text: string;
  bg: string;
  iconColor: string;
} {
  switch (difficulty) {
    case 'Easy':
      return {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
        dot: 'bg-emerald-500',
        border: 'border-emerald-300',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        iconColor: 'text-emerald-600'
      };
    case 'Medium':
      return {
        badge: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100',
        dot: 'bg-blue-600',
        border: 'border-blue-300',
        text: 'text-blue-800',
        bg: 'bg-blue-50',
        iconColor: 'text-blue-600'
      };
    case 'Hard':
      return {
        badge: 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100',
        dot: 'bg-rose-600',
        border: 'border-rose-300',
        text: 'text-rose-800',
        bg: 'bg-rose-50',
        iconColor: 'text-rose-600'
      };
  }
}
