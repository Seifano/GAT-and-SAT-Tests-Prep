import { ExamConfig, UserAccount, UserProfile, TestAttempt } from '../types';

export const EXAM_CONFIGS: Record<'GAT' | 'SAT', ExamConfig> = {
  GAT: {
    id: 'GAT',
    full: 'General Aptitude Test (Qudurat)',
    desc: 'Verbal and quantitative reasoning for Saudi university admissions. Scored 50–100.',
    min: 50,
    max: 100,
    step: 1,
    hint: 'Competitive tier ≈ 80+, Top 5% ≈ 88+',
    sections: [
      {
        name: 'Verbal',
        skills: ['Analogy', 'Sentence Completion', 'Contextual Error', 'Odd One Out', 'Reading Comprehension']
      },
      {
        name: 'Quantitative',
        skills: ['Arithmetic', 'Algebra', 'Geometry', 'Statistics']
      }
    ]
  },
  SAT: {
    id: 'SAT',
    full: 'Digital SAT',
    desc: 'Reading, Writing, and Mathematics for global university admissions. Scored 400–1600.',
    min: 400,
    max: 1600,
    step: 10,
    hint: 'Competitive tier ≈ 1300+, Top tier ≈ 1450+',
    sections: [
      {
        name: 'Reading & Writing',
        skills: ['Words in Context', 'Conventions', 'Transitions', 'Central Ideas']
      },
      {
        name: 'Math',
        skills: ['Algebra', 'Advanced Math', 'Data Analysis', 'Geometry & Trig']
      }
    ]
  }
};

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    name: 'Head of Department (Admin)',
    username: 'Admin',
    email: 'admin@prepline.app',
    role: 'Admin',
    password: 'HOD123',
    created: 'Oct 5'
  },
  {
    name: 'Abdullah Ali',
    username: 'abdullah.a',
    email: 'abdullah.ali@prepline.app',
    role: 'Teacher',
    password: 'password123',
    created: 'Oct 6'
  },
  {
    name: 'Houssem Hammami',
    username: 'houssem.h',
    email: 'houssem.hammami@prepline.app',
    role: 'Teacher',
    password: 'password123',
    created: 'Oct 6'
  },
  {
    name: 'Sara Al-Qahtani',
    username: 'sara.q',
    email: 'sara@school.edu',
    role: 'Student',
    password: 'password123',
    created: 'Sep 15'
  },
  {
    name: 'Omar Khalid',
    username: 'omar.k',
    email: 'omar@school.edu',
    role: 'Student',
    password: 'password123',
    created: 'Sep 18'
  },
  {
    name: 'Lina Haddad',
    username: 'lina.h',
    email: 'lina@school.edu',
    role: 'Student',
    password: 'password123',
    created: 'Sep 22'
  }
];

export const INITIAL_PROFILE: UserProfile = {
  exams: ['GAT', 'SAT'],
  targets: {
    GAT: 90,
    SAT: 1450
  },
  dates: {
    GAT: '2026-11-20',
    SAT: '2026-12-05'
  }
};

export const INITIAL_MASTERY: Record<'GAT' | 'SAT', Record<string, number>> = {
  GAT: {},
  SAT: {}
};

export const INITIAL_HISTORY: Record<'GAT' | 'SAT', Array<{ score: number; date: string; kind: string }>> = {
  GAT: [],
  SAT: []
};

export const DEFAULT_APP_SETTINGS: import('../types').AppSettings = {
  appName: 'AHS Exams Prepline',
  logoUrl: '',
  loginTitle: 'AHS Exams Prepline',
  loginHeadline: 'GAT and SAT practice, in one place.',
  loginDescription: 'Timed mock exams, an authentic question bank built from recent test reports, and targeted feedback on the skills that move your score.',
  loginFootnotes: [
    { title: 'GAT', subtitle: 'Verbal · Quant' },
    { title: 'SAT', subtitle: 'R&W · Math' },
    { title: 'Feedback', subtitle: 'By skill' }
  ]
};

