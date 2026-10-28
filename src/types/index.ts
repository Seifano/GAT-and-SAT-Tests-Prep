export type ExamType = 'NAFS' | 'GAT' | 'SAT';

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

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  exam: ExamType;
  section: string;
  skill: string;
  prompt: string;
  options: string[];
  answer: number; // 0, 1, 2, 3 corresponding to A, B, C, D
  explain: string;
  difficulty?: DifficultyLevel;
  src?: string;
  passage?: string;
  figureSvg?: string;
}

export interface QuestionDraft extends Omit<Question, 'id'> {
  id?: string;
  num?: number;
  include: boolean;
  guessed?: boolean;
}

export type UserRole = 'Student' | 'Teacher' | 'Admin';
export type StudentLevel = 'Grade 6' | 'Grade 9' | 'High School';
export type PathwayType = 'GAT' | 'SAT' | 'NAFS';

export interface UserAccount {
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  studentLevel?: StudentLevel;
  studentClass?: string;
  assignedGrades?: StudentLevel[]; // For Teachers: restricted to reviewing only these assigned grades
  assignedPathways?: PathwayType[]; // Teachers/Students can be assigned multiple pathways e.g. both GAT and SAT
  status?: 'Active' | 'Inactive' | 'Pending'; // Activity status
  lastLogin?: string; // ISO 8601 timestamp of last login
  password?: string;
  passwordHash?: string; // Cryptographic SHA-256 salted hash for verification
  encryptedPassword?: string; // AES-GCM 256-bit encrypted credential for institutional card handouts
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
  backgroundUrl?: string;
  backgroundTheme?: string;
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

// ----------------------------------------------------
// BLOOKET-STYLE LIVE GAME HOSTING & ARENA TYPES
// ----------------------------------------------------
export type GameMode = 'point_heist' | 'gold_quest' | 'speed_sprint' | 'mastery_paced';

export interface GameRuleSettings {
  timeLimitSeconds: number; // 0 = self-paced untimed; or 20, 30, 45, 60s per question
  allowGuests: boolean; // whether guest nicknames without login are permitted
  showExplanations: boolean; // show step-by-step reasoning after answering
  basePoints: number; // base points per question, default 100
  streakMultipliers: boolean; // x1.5, x2, x3 for consecutive correct answers
  powerChestRewards: boolean; // mystery gold chest rewards after correct answers (Blooket-style)
  maxPlayers: number; // maximum joined students, strictly 25 limit
  stealPointsEnabled?: boolean; // allow students to steal points from classmates (Blooket style)
}

export interface GamePlayer {
  id: string; // username or guest-uuid
  name: string;
  isGuest: boolean;
  avatar: string; // icon identifier: 'falcon', 'camel', 'palm', 'crown', 'shield', 'star', 'rocket', 'diamond'
  score: number;
  gold: number;
  currentQuestionIndex: number;
  correctCount: number;
  streak: number;
  highestStreak: number;
  answers: Record<number, number>; // index of question -> chosen option index
  finished: boolean;
  lastUpdated: number;
  shields?: number; // active energy shields protecting against incoming steals
  stealsCount?: number; // total successful steals performed
  pointsStolen?: number; // total points stolen from others
}

export interface GameLiveEvent {
  id: string;
  timestamp: number;
  type: 'steal' | 'shield_block' | 'jackpot' | 'chest' | 'swap';
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  targetId?: string;
  targetName?: string;
  targetAvatar?: string;
  amount?: number;
  text: string;
  textAr?: string;
}

export interface LiveGameSession {
  pin: string; // 6-digit PIN e.g. "582914"
  hostTeacherUsername: string;
  hostTeacherName: string;
  title: string;
  exam: ExamType;
  sectionFilter?: string;
  skillFilter?: string;
  difficultyFilter?: DifficultyLevel | 'All';
  mode: GameMode;
  ruleSettings: GameRuleSettings;
  questionIds: string[];
  questions: Question[]; // Snapshot of selected questions from the question bank
  status: 'lobby' | 'active' | 'completed' | 'paused';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  players: Record<string, GamePlayer>;
  recentEvents?: GameLiveEvent[]; // real-time feed of point steals, shield blocks, and achievements
}
