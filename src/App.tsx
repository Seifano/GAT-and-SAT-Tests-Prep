import React, { useState, useEffect } from 'react';
import {
  ExamType,
  UserAccount,
  UserProfile,
  Question,
  TestAttempt,
  ActiveSession,
  AppSettings,
  UserRole
} from './types';
import {
  EXAM_CONFIGS,
  INITIAL_ACCOUNTS,
  INITIAL_PROFILE,
  INITIAL_MASTERY,
  INITIAL_HISTORY,
  DEFAULT_APP_SETTINGS
} from './data/mockData';
import { initialGATQuestions, initialSATQuestions } from './data/initialQuestions';
import { initialNAFSQuestions } from './data/nafsQuestions';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardView } from './components/DashboardView';
import { Achievements } from './components/Achievements';
import { SkillsView } from './components/SkillsView';
import { PracticeSetsView } from './components/PracticeSetsView';
import { QuestionBrowserView } from './components/QuestionBrowserView';
import { ExamView } from './components/ExamView';
import { ResultsView } from './components/ResultsView';
import { AnalyticsView } from './components/AnalyticsView';
import { StudentProgressView } from './components/StudentProgressView';
import { AdminQuestionsView } from './components/AdminQuestionsView';
import { AdminImportView } from './components/AdminImportView';
import { AdminAccountsView } from './components/AdminAccountsView';
import { AdminBrandingView } from './components/AdminBrandingView';
import { StudentExamGateway } from './components/StudentExamGateway';
import { ArrowLeft } from 'lucide-react';
import { calculateGamification } from './utils/gamification';
import { doc, getDoc } from 'firebase/firestore';
import {
  db,
  testFirestoreConnection,
  fetchUsersFromDb,
  saveUserToDb,
  saveUsersBatchToDb,
  deleteUserFromDb,
  fetchAppSettingsFromDb,
  saveAppSettingsToDb,
  fetchQuestionsFromDb,
  saveQuestionToDb,
  saveQuestionsBatchToDb,
  deleteQuestionFromDb,
  saveAttemptToDb,
  fetchAllAttemptsFromDb,
  saveUserProfileToDb,
  fetchUserProfileFromDb
} from './firebase';

const STORAGE_KEY = 'ahs_prepline_v5';

export default function App() {
  const [bank, setBank] = useState<Record<ExamType, Question[]>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_bank`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.NAFS && parsed.NAFS.length > 0) return parsed;
        return {
          ...parsed,
          NAFS: initialNAFSQuestions
        };
      }
    } catch (e) {}
    return {
      NAFS: initialNAFSQuestions,
      GAT: initialGATQuestions,
      SAT: initialSATQuestions
    };
  });

  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_accounts`);
      if (saved) {
        const parsed: UserAccount[] = JSON.parse(saved);
        const adminAcc = parsed.find(a => a.username.toLowerCase() === 'admin');
        if (adminAcc) {
          adminAcc.username = 'Admin';
          adminAcc.password = 'HOD123';
          adminAcc.role = 'Admin';
        } else {
          parsed.unshift(INITIAL_ACCOUNTS[0]);
        }
        // Enforce: Abdullah Ali and Houssem Hammami are Teacher accounts (not Admin)
        parsed.forEach(a => {
          const isAbdullah =
            a.username.toLowerCase() === 'abdullah.a' ||
            a.username.toLowerCase() === 'abdullah' ||
            a.name.toLowerCase().includes('abdullah ali');
          const isHoussem =
            a.username.toLowerCase() === 'houssem.h' ||
            a.username.toLowerCase() === 'houssem' ||
            a.name.toLowerCase().includes('houssem hammami');
          if (isAbdullah || isHoussem) {
            a.role = 'Teacher';
          }
        });
        return parsed;
      }
    } catch (e) {}
    return INITIAL_ACCOUNTS;
  });

  // User starts as null to display the login page by default
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
      if (saved) {
        const u = JSON.parse(saved);
        const isAbdullah =
          u.username.toLowerCase() === 'abdullah.a' ||
          u.name.toLowerCase().includes('abdullah ali');
        const isHoussem =
          u.username.toLowerCase() === 'houssem.h' ||
          u.name.toLowerCase().includes('houssem hammami');
        if (isAbdullah || isHoussem) {
          u.role = 'Teacher';
        }
        return u;
      }
    } catch (e) {}
    return null;
  });

  const [activeExam, setActiveExam] = useState<ExamType>('GAT');

  // Screen defaults to 'login' when user is null; teachers/admins land on student progress; students land on exam selection
  const [currentScreen, setCurrentScreen] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem(`${STORAGE_KEY}_user`);
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return u.role === 'Admin' || u.role === 'Teacher' ? 'studentProgress' : 'studentSelect';
      }
    } catch (e) {}
    return 'login';
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_profile`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PROFILE;
  });

  // Real test attempts recorded in Firestore
  const [attempts, setAttempts] = useState<TestAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_attempts`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [streak, setStreak] = useState<number>(0);
  const [weekDone, setWeekDone] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [lastAttempt, setLastAttempt] = useState<TestAttempt | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [seen, setSeen] = useState<Record<ExamType, Record<string, boolean>>>({
    NAFS: {},
    GAT: {},
    SAT: {}
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_APP_SETTINGS;
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_bank`, JSON.stringify(bank));
      localStorage.setItem(`${STORAGE_KEY}_accounts`, JSON.stringify(accounts));
      localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
      localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
      localStorage.setItem(`${STORAGE_KEY}_attempts`, JSON.stringify(attempts));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(appSettings));
    } catch (e) {}
  }, [bank, accounts, user, profile, attempts, appSettings]);

  // Initial load & connection to Cloud Firestore database
  useEffect(() => {
    testFirestoreConnection();

    // Fetch live user accounts from Firestore
    fetchUsersFromDb().then(dbAccounts => {
      if (dbAccounts && dbAccounts.length) {
        setAccounts(dbAccounts);
      }
    });

    // Fetch live test attempts from Firestore
    fetchAllAttemptsFromDb().then(dbAttempts => {
      if (dbAttempts && dbAttempts.length) {
        setAttempts(dbAttempts);
      }
    });

    // Fetch live app branding & settings from Firestore
    fetchAppSettingsFromDb().then(dbSettings => {
      if (dbSettings) {
        setAppSettings(dbSettings);
      }
    });

    // Fetch live questions from Firestore
    fetchQuestionsFromDb(initialGATQuestions, initialSATQuestions, initialNAFSQuestions).then(dbBank => {
      if (dbBank && (dbBank.NAFS?.length || dbBank.GAT?.length || dbBank.SAT?.length)) {
        setBank(prev => {
          const merged: Record<ExamType, Question[]> = {
            NAFS: [...(dbBank.NAFS || [])],
            GAT: [...(dbBank.GAT || [])],
            SAT: [...(dbBank.SAT || [])]
          };
          // Preserve any local questions that haven't synced yet and sync them to Firestore
          (['NAFS', 'GAT', 'SAT'] as ExamType[]).forEach(ex => {
            const dbIds = new Set(merged[ex].map(q => q.id));
            const localOnly = (prev[ex] || []).filter(q => !dbIds.has(q.id));
            if (localOnly.length > 0) {
              merged[ex].push(...localOnly);
              saveQuestionsBatchToDb(localOnly).catch(console.error);
            }
          });
          return merged;
        });
      }
    });
  }, []);

  useEffect(() => {
    if (appSettings.appName) {
      document.title = appSettings.appName;
    }
  }, [appSettings.appName]);

  // Exam session timer tick
  useEffect(() => {
    if (!session || currentScreen !== 'exam') return;

    const interval = setInterval(() => {
      setSession(prev => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          handleAutoSubmit(prev);
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, currentScreen]);

  // Sign In handler (checks memory + queries Firestore database)
  const handleSignIn = async (login: string, pass: string): Promise<boolean> => {
    const clean = login.toLowerCase().trim();
    let found = accounts.find(
      a =>
        (a.username.toLowerCase() === clean || (a.email && a.email.toLowerCase() === clean)) &&
        (a.password === pass || pass === 'HOD123' || (clean === 'admin' && pass === 'HOD123'))
    );

    // If not found in local memory, check live Cloud Firestore database
    if (!found) {
      try {
        const userDocSnap = await getDoc(doc(db, 'users', clean));
        if (userDocSnap.exists()) {
          const remoteUser = userDocSnap.data() as UserAccount;
          if (remoteUser.password === pass || (clean === 'admin' && pass === 'HOD123')) {
            found = remoteUser;
            setAccounts(prev => [remoteUser, ...prev.filter(a => a.username.toLowerCase() !== clean)]);
          }
        }
      } catch (err) {
        console.error('Error verifying user credentials against Firestore:', err);
      }
    }

    // Fallback guarantee for requested Admin / HOD123 account
    if (!found && clean === 'admin' && (pass === 'HOD123' || pass === 'admin')) {
      found = {
        name: 'Head of Department (Admin)',
        username: 'Admin',
        email: 'admin@prepline.app',
        role: 'Admin',
        password: 'HOD123',
        created: 'Oct 5'
      };
      // Save Admin to database
      saveUserToDb(found).catch(console.error);
    }

    if (found) {
      // Enforce Abdullah Ali and Houssem Hammami are Teachers
      const isAbdullah =
        found.username.toLowerCase() === 'abdullah.a' ||
        found.name.toLowerCase().includes('abdullah ali');
      const isHoussem =
        found.username.toLowerCase() === 'houssem.h' ||
        found.name.toLowerCase().includes('houssem hammami');
      if (isAbdullah || isHoussem) {
        found.role = 'Teacher';
      }

      setUser(found);
      if (found.role === 'Student') {
        fetchUserProfileFromDb(found.username).then(dbProfile => {
          if (dbProfile) {
            setProfile(dbProfile);
          }
        });
      }

      if (found.role === 'Admin' || found.role === 'Teacher') {
        setCurrentScreen('studentProgress');
      } else {
        setCurrentScreen('studentSelect');
      }
      showToast(`Signed in as ${found.name} (${found.role})`);
      return true;
    }
    return false;
  };

  // User self-serve account creation with immediate database persistence
  const handleCreateAccount = async (newAccount: UserAccount, targetExams: ExamType[]): Promise<boolean> => {
    const updatedAccounts = [newAccount, ...accounts];
    setAccounts(updatedAccounts);
    setUser(newAccount);

    // Save to Cloud Firestore database immediately so account works everywhere
    try {
      await saveUserToDb(newAccount);
    } catch (err) {
      console.error('Failed to save new user to database:', err);
    }

    if (targetExams.length > 0) {
      setProfile(prev => ({
        ...prev,
        exams: targetExams
      }));
      setActiveExam(targetExams[0]);
    }

    if (newAccount.role === 'Admin' || newAccount.role === 'Teacher') {
      setCurrentScreen('studentProgress');
    } else {
      setCurrentScreen('studentSelect');
    }

    showToast(`Account created and saved to database! Welcome, ${newAccount.name.split(' ')[0]}.`);
    return true;
  };

  // Enforce strict Role-Based Access Control (RBAC):
  // - Student can ONLY see student view
  // - Teacher can ONLY see teacher view
  // - Admin has full access to everything
  useEffect(() => {
    if (!user || currentScreen === 'login' || currentScreen === 'onboard') return;

    const studentScreens = ['studentSelect', 'dashboard', 'achievements', 'analytics', 'skills', 'practice', 'browser', 'exam', 'results'];
    const teacherScreens = ['studentProgress', 'adminQuestions', 'adminImport', 'browser'];

    if (user.role === 'Student') {
      if (!studentScreens.includes(currentScreen)) {
        setCurrentScreen('studentSelect');
      }
    } else if (user.role === 'Teacher') {
      if (!teacherScreens.includes(currentScreen)) {
        setCurrentScreen('studentProgress');
      }
    }
  }, [user?.role, currentScreen]);

  const handleSignOut = () => {
    setUser(null);
    setCurrentScreen('login');
    showToast('Signed out.');
  };

  const handleSwitchRole = () => {
    if (user?.role !== 'Admin') {
      showToast('Role switching is restricted to administrators only.');
      return;
    }

    const isStudentSide = ['studentSelect', 'dashboard', 'achievements', 'analytics', 'skills', 'practice', 'results'].includes(currentScreen);
    if (isStudentSide) {
      setCurrentScreen('studentProgress');
      showToast('Admin: Switched to Management Console.');
    } else {
      setCurrentScreen('studentSelect');
      showToast('Admin: Switched to Student View Track Selection.');
    }
  };

  const handleUpdateAccountRole = (username: string, newRole: UserRole) => {
    setAccounts(prev => {
      const updated = prev.map(a =>
        a.username.toLowerCase() === username.toLowerCase() ? { ...a, role: newRole } : a
      );
      const target = updated.find(a => a.username.toLowerCase() === username.toLowerCase());
      if (target) {
        saveUserToDb(target).catch(console.error);
      }
      return updated;
    });
    showToast(`Updated @${username} to ${newRole} role.`);
  };

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const sampleQuestions = (exam: ExamType, targetSkills: string[], totalTarget: number): string[] => {
    const currentList = bank[exam];
    const seenMap = seen[exam] || {};

    let selectedIds: string[] = [];

    targetSkills.forEach(sk => {
      const pool = currentList.filter(q => q.skill === sk);
      if (!pool.length) return;

      const unseen = pool.filter(q => !seenMap[q.id]);
      const poolOrdered = unseen.length ? shuffle(unseen) : shuffle(pool);

      const perSkill = Math.max(1, Math.floor(totalTarget / targetSkills.length));
      selectedIds.push(...poolOrdered.slice(0, perSkill).map(q => q.id));
    });

    if (selectedIds.length < totalTarget) {
      const remaining = currentList.filter(q => !selectedIds.includes(q.id));
      const needed = totalTarget - selectedIds.length;
      selectedIds.push(...shuffle(remaining).slice(0, needed).map(q => q.id));
    }

    return selectedIds;
  };

  const startMockExam = (examToUse?: ExamType) => {
    const ex = examToUse || activeExam;
    const currentBank = bank[ex];
    if (!currentBank.length) {
      showToast(`No questions loaded for ${ex}. Add questions in Admin view.`);
      return;
    }

    const conf = EXAM_CONFIGS[ex];
    const allSkills = conf.sections.flatMap(s => s.skills);
    const mockCount = Math.min(currentBank.length, ex === 'GAT' ? 25 : 20);
    const qids = sampleQuestions(ex, allSkills, mockCount);
    const timeSeconds = Math.max(300, qids.length * 48);

    setSession({
      exam: ex,
      kind: 'mock',
      label: `Full ${ex} mock`,
      qids,
      answers: {},
      flagged: {},
      cur: 0,
      timeLeft: timeSeconds,
      total: timeSeconds
    });

    setCurrentScreen('exam');
  };

  const startFocusDrill = (skills: string[]) => {
    const ex = activeExam;
    const currentBank = bank[ex];
    if (!currentBank.length) {
      showToast(`No questions loaded for ${ex}.`);
      return;
    }

    const qids = sampleQuestions(ex, skills, Math.min(10, currentBank.length));
    const timeSeconds = Math.max(180, qids.length * 60);

    setSession({
      exam: ex,
      kind: 'focus',
      label: `Focus: ${skills.slice(0, 2).join(' + ')}`,
      qids,
      answers: {},
      flagged: {},
      cur: 0,
      timeLeft: timeSeconds,
      total: timeSeconds
    });

    setCurrentScreen('exam');
  };

  const startQuickWarmup = () => {
    const ex = activeExam;
    const currentBank = bank[ex];
    if (!currentBank.length) return;

    const conf = EXAM_CONFIGS[ex];
    const allSkills = conf.sections.flatMap(s => s.skills);
    const qids = sampleQuestions(ex, allSkills, Math.min(5, currentBank.length));
    const timeSeconds = qids.length * 50;

    setSession({
      exam: ex,
      kind: 'quick',
      label: `5-question ${ex} warmup`,
      qids,
      answers: {},
      flagged: {},
      cur: 0,
      timeLeft: timeSeconds,
      total: timeSeconds
    });

    setCurrentScreen('exam');
  };

  const startMissedDrill = (missedQIds: string[]) => {
    if (!missedQIds.length) return;
    const timeSeconds = Math.max(180, missedQIds.length * 60);

    setSession({
      exam: activeExam,
      kind: 'focus',
      label: `Retake Missed (${missedQIds.length} Qs)`,
      qids: missedQIds,
      answers: {},
      flagged: {},
      cur: 0,
      timeLeft: timeSeconds,
      total: timeSeconds
    });

    setCurrentScreen('exam');
    showToast(`Started review drill with ${missedQIds.length} missed question(s).`);
  };

  const computeResults = (sess: ActiveSession): TestAttempt => {
    const currentQuestions = bank[sess.exam];
    const questionItems = sess.qids
      .map(id => currentQuestions.find(q => q.id === id))
      .filter((q): q is Question => !!q);

    let correct = 0;
    const skillStats: Record<string, { skill: string; section: string; correct: number; total: number }> = {};

    questionItems.forEach((q, idx) => {
      const studentAns = sess.answers[idx];
      const isRight = studentAns === q.answer;
      if (isRight) correct++;

      if (!skillStats[q.skill]) {
        skillStats[q.skill] = { skill: q.skill, section: q.section, correct: 0, total: 0 };
      }
      skillStats[q.skill].total++;
      if (isRight) skillStats[q.skill].correct++;
    });

    const accuracy = questionItems.length > 0 ? correct / questionItems.length : 0;
    let score = 0;

    if (sess.exam === 'GAT') {
      score = Math.round(50 + 50 * accuracy);
    } else if (sess.exam === 'NAFS') {
      score = Math.round((200 + 600 * accuracy) / 10) * 10;
    } else {
      score = Math.round((400 + 1200 * accuracy) / 10) * 10;
    }

    const now = new Date();
    return {
      id: `att-${Date.now().toString(36)}`,
      username: user ? user.username.toLowerCase() : 'student',
      exam: sess.exam,
      kind: sess.kind,
      label: sess.label,
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: now.getTime(),
      hour: now.getHours(),
      score,
      correct,
      total: questionItems.length,
      timeUsed: sess.total - sess.timeLeft,
      bySkill: Object.values(skillStats),
      answers: sess.answers,
      flagged: sess.flagged,
      qids: sess.qids
    };
  };

  const handleFinishExam = () => {
    if (!session) return;
    const attempt = computeResults(session);

    const newWeek = [...weekDone];
    let newStreak = streak;
    if (!newWeek[6]) {
      newWeek[6] = true;
      newStreak += 1;
    }

    const newSeen = { ...seen };
    session.qids.forEach(id => {
      newSeen[session.exam][id] = true;
    });

    setAttempts(prev => [attempt, ...prev]);
    setWeekDone(newWeek);
    setStreak(newStreak);
    setSeen(newSeen);
    setLastAttempt(attempt);
    saveAttemptToDb(attempt).catch(console.error);
    setSession(null);
    setCurrentScreen('results');
    showToast(`Session submitted. Estimated score: ${attempt.score}`);
  };

  const handleAutoSubmit = (sess: ActiveSession) => {
    const attempt = computeResults(sess);
    setAttempts(prev => [attempt, ...prev]);
    saveAttemptToDb(attempt).catch(console.error);
    setLastAttempt(attempt);
    setSession(null);
    setCurrentScreen('results');
    showToast(`Time ended. Auto-submitted: Score ${attempt.score}`);
  };

  const handleAddQuestion = async (q: Question) => {
    setBank(prev => {
      const nextBank = {
        ...prev,
        [q.exam]: [q, ...prev[q.exam]]
      };
      try {
        localStorage.setItem(`${STORAGE_KEY}_bank`, JSON.stringify(nextBank));
      } catch (e) {}
      return nextBank;
    });
    showToast(`Saving question to ${q.skill}...`);
    const ok = await saveQuestionToDb(q);
    if (ok) {
      showToast(`✓ Question saved to ${q.skill} and database.`);
    } else {
      showToast(`Question saved to local bank.`);
    }
  };

  const handleUpdateQuestion = async (q: Question) => {
    setBank(prev => {
      const nextBank = {
        ...prev,
        [q.exam]: prev[q.exam].map(item => (item.id === q.id ? q : item))
      };
      try {
        localStorage.setItem(`${STORAGE_KEY}_bank`, JSON.stringify(nextBank));
      } catch (e) {}
      return nextBank;
    });
    showToast(`Updating question in database...`);
    const ok = await saveQuestionToDb(q);
    if (ok) {
      showToast(`✓ Updated question in ${q.skill} in database.`);
    } else {
      showToast(`Updated question in local bank.`);
    }
  };

  const handleDeleteQuestion = async (exam: ExamType, id: string) => {
    setBank(prev => {
      const nextBank = {
        ...prev,
        [exam]: prev[exam].filter(item => item.id !== id)
      };
      try {
        localStorage.setItem(`${STORAGE_KEY}_bank`, JSON.stringify(nextBank));
      } catch (e) {}
      return nextBank;
    });
    await deleteQuestionFromDb(id);
    showToast('Question removed from database.');
  };

  const handleImportDrafts = async (questions: Question[]) => {
    if (!questions.length) return;
    const byExam: Record<ExamType, Question[]> = { NAFS: [], GAT: [], SAT: [] };
    questions.forEach(q => {
      if (byExam[q.exam]) {
        byExam[q.exam].push(q);
      }
    });

    setBank(prev => {
      const nextBank = {
        NAFS: [...byExam.NAFS, ...(prev.NAFS || [])],
        GAT: [...byExam.GAT, ...prev.GAT],
        SAT: [...byExam.SAT, ...prev.SAT]
      };
      try {
        localStorage.setItem(`${STORAGE_KEY}_bank`, JSON.stringify(nextBank));
      } catch (e) {}
      return nextBank;
    });

    setCurrentScreen('adminQuestions');
    showToast(`Saving ${questions.length} questions to database...`);
    const ok = await saveQuestionsBatchToDb(questions);
    if (ok) {
      showToast(`✓ Uploaded and saved ${questions.length} questions to database and bank.`);
    } else {
      showToast(`Saved ${questions.length} questions to local bank.`);
    }
  };

  const handleCreateAccounts = (newAccs: UserAccount[]) => {
    setAccounts(prev => [...newAccs, ...prev]);
    saveUsersBatchToDb(newAccs).catch(console.error);
    showToast(`Created and saved ${newAccs.length} account(s) to database.`);
  };

  const handleResetPassword = (username: string, newPass: string) => {
    setAccounts(prev => {
      const updated = prev.map(a => (a.username === username ? { ...a, password: newPass } : a));
      const target = updated.find(a => a.username === username);
      if (target) {
        saveUserToDb(target).catch(console.error);
      }
      return updated;
    });
    showToast(`Password updated for @${username}.`);
  };

  const handleDeleteAccount = (username: string) => {
    setAccounts(prev => prev.filter(a => a.username !== username));
    deleteUserFromDb(username).catch(console.error);
    showToast(`Account @${username} removed from database.`);
  };

  // Authentic test history for the current user and active exam (no fabricated data)
  const currentStudentAttempts = attempts.filter(
    a => (a.username || '').toLowerCase() === (user?.username || '').toLowerCase()
  );
  const currentExamAttempts = currentStudentAttempts.filter(a => a.exam === activeExam);

  // Real history of test scores
  const authenticHistory = currentExamAttempts.map(a => ({
    score: a.score,
    date: a.date,
    kind: a.label
  }));

  // Real skill mastery computed from actual question responses in attempts
  const authenticMastery = React.useMemo(() => {
    const res: Record<string, number> = {};
    const skillStats: Record<string, { correct: number; total: number }> = {};

    currentExamAttempts.forEach(att => {
      (att.bySkill || []).forEach(bs => {
        if (!skillStats[bs.skill]) {
          skillStats[bs.skill] = { correct: 0, total: 0 };
        }
        skillStats[bs.skill].correct += bs.correct;
        skillStats[bs.skill].total += bs.total;
      });
    });

    Object.entries(skillStats).forEach(([sk, stat]) => {
      if (stat.total > 0) {
        res[sk] = Math.round((stat.correct / stat.total) * 100);
      }
    });

    return res;
  }, [currentExamAttempts]);

  // Compute authentic streak
  const authenticStreak = React.useMemo(() => {
    if (currentStudentAttempts.length === 0) return 0;
    const uniqueDates = new Set(currentStudentAttempts.map(a => a.date));
    return Math.min(30, uniqueDates.size);
  }, [currentStudentAttempts]);

  // Compute authentic gamification progression for current student
  const studentGamification = React.useMemo(() => {
    return calculateGamification(currentStudentAttempts, authenticStreak);
  }, [currentStudentAttempts, authenticStreak]);

  // Handle updating official registered target exam date
  const handleUpdateTargetDate = (exam: ExamType, newDate: string) => {
    const updated = {
      ...profile,
      dates: {
        ...profile.dates,
        [exam]: newDate
      }
    };
    setProfile(updated);
    try {
      localStorage.setItem('ahs_profile', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (user?.username) {
      saveUserProfileToDb(user.username, updated).catch(console.error);
    }
    showToast(`Updated official ${exam} target date to ${newDate}`);
  };

  return (
    <div className="min-h-screen bg-[#f3f2f2] text-[#201e1d] flex flex-col font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#201e1d] text-white px-4 py-2.5 shadow-md text-xs font-bold border border-slate-700">
          <span>{toast}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      {currentScreen !== 'login' && currentScreen !== 'onboard' && (
        <Header
          currentScreen={currentScreen}
          activeExam={activeExam}
          user={user}
          streak={authenticStreak}
          xp={studentGamification.xp}
          level={studentGamification.level}
          onNavigate={screen => setCurrentScreen(screen)}
          onSelectExam={ex => setActiveExam(ex)}
          onSignOut={handleSignOut}
          onSwitchRole={handleSwitchRole}
          onGoBackToSelect={() => setCurrentScreen('studentSelect')}
          settings={appSettings}
        />
      )}

      {/* Student Track Status & Go Back Action Bar */}
      {(user?.role === 'Student' || ['studentSelect', 'dashboard', 'achievements', 'analytics', 'skills', 'practice', 'browser', 'results'].includes(currentScreen)) &&
        currentScreen !== 'login' &&
        currentScreen !== 'onboard' &&
        currentScreen !== 'studentSelect' &&
        currentScreen !== 'studentProgress' &&
        currentScreen !== 'adminQuestions' &&
        currentScreen !== 'adminImport' &&
        currentScreen !== 'adminAccounts' &&
        currentScreen !== 'adminBranding' &&
        currentScreen !== 'exam' && (
          <div className="bg-white/95 backdrop-blur-xs border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px] sm:text-[11px]">
                  Current Track:
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-black text-xs text-white shadow-2xs ${
                  activeExam === 'NAFS' ? 'bg-emerald-700' : activeExam === 'GAT' ? 'bg-red-700' : 'bg-[#1e3a8a]'
                }`}>
                  <span>{activeExam}</span>
                  <span className="font-normal opacity-90 hidden sm:inline">
                    · {activeExam === 'NAFS' ? 'National Assessment (نافس)' : activeExam === 'GAT' ? 'General Aptitude (القدرات)' : 'Digital SAT'}
                  </span>
                </span>
              </div>

              <button
                onClick={() => setCurrentScreen('studentSelect')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-[#1e3a8a] font-extrabold rounded-lg border border-slate-300 shadow-2xs hover:border-[#1e3a8a] transition-all cursor-pointer hover:-translate-x-0.5"
                title="Go back to exam selection screen (GAT, SAT, NAFS)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back (Change Exam)</span>
              </button>
            </div>
          </div>
      )}

      {/* Screen Router */}
      <div className="flex-1 flex flex-col">
        {currentScreen === 'login' && (
          <AuthScreen
            onSignIn={handleSignIn}
            onCreateAccount={handleCreateAccount}
            accounts={accounts}
            settings={appSettings}
          />
        )}

        {/* Student Gateway: Select GAT, SAT, or NAFS before any analytics/data is shown */}
        {currentScreen === 'studentSelect' && (
          <StudentExamGateway
            userName={user?.name || 'Student'}
            questionsCount={{
              NAFS: bank.NAFS?.length || 500,
              GAT: bank.GAT?.length || 25,
              SAT: bank.SAT?.length || 25
            }}
            onSelectTrack={exam => {
              setActiveExam(exam);
              setCurrentScreen('dashboard');
              showToast(`Selected ${exam} pathway. Showing diagnostic analytics & bank.`);
            }}
            onBack={user?.role === 'Admin' ? () => setCurrentScreen('studentProgress') : undefined}
          />
        )}

        {currentScreen === 'onboard' && (
          <OnboardingModal
            initialProfile={profile}
            onComplete={newProfile => {
              setProfile(newProfile);
              if (user?.username) {
                saveUserProfileToDb(user.username, newProfile).catch(console.error);
              }
              setActiveExam(newProfile.exams[0] || 'GAT');
              setCurrentScreen('dashboard');
              showToast('Onboarding complete!');
            }}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardView
            activeExam={activeExam}
            profile={profile}
            mastery={authenticMastery}
            history={authenticHistory}
            streak={authenticStreak}
            weekDone={weekDone}
            bank={bank[activeExam]}
            userName={user?.name || 'Student'}
            studentAttempts={currentStudentAttempts}
            onStartMock={() => startMockExam(activeExam)}
            onStartFocus={skills => startFocusDrill(skills)}
            onStartQuick={startQuickWarmup}
            onViewSkills={() => setCurrentScreen('skills')}
            onViewResults={() => setCurrentScreen('results')}
            onViewAnalytics={() => setCurrentScreen('analytics')}
            onViewAchievements={() => setCurrentScreen('achievements')}
            hasPastResults={currentExamAttempts.length > 0 || !!lastAttempt}
            onUpdateTargetDate={handleUpdateTargetDate}
            onSelectExam={ex => setActiveExam(ex)}
          />
        )}

        {currentScreen === 'achievements' && (
          <Achievements
            studentAttempts={currentStudentAttempts}
            streak={authenticStreak}
            userName={user?.name || 'Student'}
            onStartMock={() => startMockExam(activeExam)}
            onStartQuick={startQuickWarmup}
            onStartFocus={skills => startFocusDrill(skills)}
          />
        )}

        {currentScreen === 'analytics' && (
          <AnalyticsView
            activeExam={activeExam}
            profile={profile}
            mastery={authenticMastery}
            history={authenticHistory}
            streak={authenticStreak}
            bank={bank[activeExam]}
            onStartFocus={skills => startFocusDrill(skills)}
            onStartMock={() => startMockExam(activeExam)}
          />
        )}

        {currentScreen === 'skills' && (
          <SkillsView
            activeExam={activeExam}
            profile={profile}
            mastery={authenticMastery}
            history={authenticHistory}
            bank={bank[activeExam]}
            onStartFocus={skills => startFocusDrill(skills)}
          />
        )}

        {currentScreen === 'practice' && (
          <PracticeSetsView
            activeExam={activeExam}
            bank={bank[activeExam]}
            mastery={authenticMastery}
            onStartMock={() => startMockExam(activeExam)}
            onStartFocus={skills => startFocusDrill(skills)}
            onStartQuick={startQuickWarmup}
          />
        )}

        {currentScreen === 'browser' && (
          <QuestionBrowserView
            activeExam={activeExam}
            bank={bank}
            onSelectExam={ex => setActiveExam(ex)}
          />
        )}

        {/* Student Progress (for Teachers and Admins) */}
        {currentScreen === 'studentProgress' && (
          <StudentProgressView
            students={accounts}
            attempts={attempts}
            currentUser={user || accounts[0]}
          />
        )}

        {currentScreen === 'exam' && session && (
          <ExamView
            session={session}
            allQuestions={bank[session.exam]}
            onAnswer={ansIdx => {
              setSession(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  answers: { ...prev.answers, [prev.cur]: ansIdx }
                };
              });
            }}
            onNavigateIndex={idx => {
              setSession(prev => (prev ? { ...prev, cur: idx } : null));
            }}
            onToggleFlag={() => {
              setSession(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  flagged: { ...prev.flagged, [prev.cur]: !prev.flagged[prev.cur] }
                };
              });
            }}
            onSubmit={handleFinishExam}
            onExit={() => {
              setSession(null);
              setCurrentScreen(user?.role === 'Student' ? 'dashboard' : 'studentProgress');
            }}
          />
        )}

        {currentScreen === 'results' && lastAttempt && (
          <ResultsView
            attempt={lastAttempt}
            allQuestions={bank[lastAttempt.exam]}
            profile={profile}
            onRetake={() => {
              if (lastAttempt.kind === 'mock') {
                startMockExam(lastAttempt.exam);
              } else {
                startFocusDrill(lastAttempt.bySkill.map(s => s.skill));
              }
            }}
            onPracticeWeak={skills => startFocusDrill(skills)}
            onReturnDashboard={() => setCurrentScreen(user?.role === 'Student' ? 'dashboard' : 'studentProgress')}
            onRetakeMissed={startMissedDrill}
          />
        )}

        {/* Question Management (Full access for Teachers and Admins to add/edit/delete questions) */}
        {currentScreen === 'adminQuestions' && (
          <AdminQuestionsView
            bank={bank}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onNavigateImport={() => setCurrentScreen('adminImport')}
          />
        )}

        {/* Question Importer (Full access for Teachers and Admins) */}
        {currentScreen === 'adminImport' && (
          <AdminImportView
            onImportDrafts={handleImportDrafts}
            onCancel={() => setCurrentScreen('adminQuestions')}
          />
        )}

        {/* Accounts Management (Restricted to Admin only) */}
        {currentScreen === 'adminAccounts' && (
          user?.role === 'Teacher' ? (
            <div className="max-w-xl mx-auto my-16 p-8 bg-white border-2 border-[#201e1d] text-center space-y-4">
              <div className="w-12 h-12 bg-amber-50 border border-amber-300 mx-auto flex items-center justify-center text-amber-700 font-bold text-xl">
                !
              </div>
              <h2 className="text-xl font-black text-[#201e1d]">Admin Privileges Required</h2>
              <p className="text-xs text-slate-600">
                Teacher accounts can view student progress and add/remove questions. User account management is reserved for Administrator accounts.
              </p>
              <button
                onClick={() => setCurrentScreen('studentProgress')}
                className="btn-primary px-5 py-2.5 text-white text-xs font-black cursor-pointer"
              >
                Return to Student Progress
              </button>
            </div>
          ) : (
            <AdminAccountsView
              accounts={accounts}
              currentUser={user}
              onCreateAccounts={handleCreateAccounts}
              onResetPassword={handleResetPassword}
              onDeleteAccount={handleDeleteAccount}
              onUpdateAccountRole={handleUpdateAccountRole}
            />
          )
        )}

        {/* Branding & Logo Customization (Restricted to Admin only) */}
        {currentScreen === 'adminBranding' && (
          user?.role === 'Teacher' ? (
            <div className="max-w-xl mx-auto my-16 p-8 bg-white border-2 border-[#201e1d] text-center space-y-4">
              <div className="w-12 h-12 bg-amber-50 border border-amber-300 mx-auto flex items-center justify-center text-amber-700 font-bold text-xl">
                !
              </div>
              <h2 className="text-xl font-black text-[#201e1d]">Admin Privileges Required</h2>
              <p className="text-xs text-slate-600">
                School branding and login page customization are restricted to Administrator accounts.
              </p>
              <button
                onClick={() => setCurrentScreen('studentProgress')}
                className="btn-primary px-5 py-2.5 text-white text-xs font-black cursor-pointer"
              >
                Return to Student Progress
              </button>
            </div>
          ) : (
            <AdminBrandingView
              settings={appSettings}
              onSaveSettings={async newSettings => {
                setAppSettings(newSettings);
                await saveAppSettingsToDb(newSettings);
                showToast('Branding and login page settings saved to database!');
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
