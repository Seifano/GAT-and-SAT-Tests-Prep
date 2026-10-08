export type ExamType = 'GAT' | 'SAT';

export interface ExamSection {
  name: string;
  skills: string[];
}

export interface ExamConfig {
  id: ExamType;
  full: string;
  desc: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  sections: ExamSection[];
}

export interface Question {
  id: string;
  exam: ExamType;
  section: string;
  skill: string;
  prompt: string;
  options: string[];
  answer: number; // 0, 1, 2, 3 corresponding to A, B, C, D
  explain: string;
  src?: string;
  passage?: string;
}

export interface QuestionDraft extends Omit<Question, 'id'> {
  id?: string;
  num?: number;
  include: boolean;
  guessed?: boolean;
}

export type UserRole = 'Student' | 'Teacher' | 'Admin';

export interface UserAccount {
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  password?: string;
  created: string;
}

export interface UserProfile {
  exams: ExamType[];
  targets: Record<ExamType, number>;
  dates: Record<ExamType, string>;
}

export interface SkillPerformance {
  skill: string;
  section: string;
  correct: number;
  total: number;
  mastery?: number;
  note?: string;
}

export interface TestAttempt {
  id: string;
  username?: string;
  exam: ExamType;
  kind: 'mock' | 'focus' | 'quick';
  label: string;
  date: string;
  timestamp?: number;
  hour?: number;
  score: number;
  correct: number;
  total: number;
  timeUsed: number; // in seconds
  bySkill: SkillPerformance[];
  answers: Record<number, number>;
  flagged: Record<number, boolean>;
  qids: string[];
}

export interface ActiveSession {
  exam: ExamType;
  kind: 'mock' | 'focus' | 'quick';
  label: string;
  qids: string[];
  answers: Record<number, number>;
  flagged: Record<number, boolean>;
  cur: number;
  timeLeft: number;
  total: number;
}

export interface AppSettings {
  appName: string;
  logoUrl?: string;
  loginTitle: string;
  loginHeadline: string;
  loginDescription: string;
  loginFootnotes: Array<{ title: string; subtitle: string }>;
}

export interface AchievementBadge {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  category?: 'habit' | 'streak' | 'accuracy' | 'mastery' | 'milestone';
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward?: number;
  requirementText?: string;
}

export interface StudentGamification {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  currentLevelBaseXp: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  accuracy: number;
  badges: AchievementBadge[];
  streak: number;
  dailyGoalProgress: number;
  dailyGoalTarget: number;
  badgeBonusXp?: number;
}
