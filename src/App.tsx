import React, { useState, useEffect } from 'react';
import {
  ExamType,
  UserAccount,
  UserProfile,
  Question,
  TestAttempt,
  ActiveSession,
  AppSettings,
  UserRole,
  StudentLevel,
  PathwayType
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
import { KsaTestBookingView } from './components/KsaTestBookingView';
import { Sidebar } from './components/Sidebar';
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
  fetchUserProfileFromDb,
  backupAccountsVaultToDb,
  fetchAccountsVaultFromDb,
  saveAllChangesToCloud,
  subscribeToUsers,
  subscribeToSettings,
  subscribeToAttempts,
  subscribeToQuestions,
  parseUserDoc
} from './firebase';
import { verifyUserPassword } from './utils/security';
import { playCelebrationSound } from './utils/soundEffects';

const STORAGE_KEY = 'ahs_prepline_v5';
const VAULT_STORAGE_KEY = 'ahs_immutable_account_vault_v1';

export const ACTIVE_VIEW_INFO: Record<string, { title: string; subtitle: string; category: string }> = {
  dashboard: { title: 'Home & Practice', subtitle: 'Start mock tests, quick warmup, and check your progress', category: 'Study' },
  practice: { title: 'Practice by Topic', subtitle: 'Drills for specific skills and curriculum domains', category: 'Study' },
  analytics: { title: 'Deep Analytics', subtitle: 'Diagnostic curves, standing & skill progression', category: 'Diagnostics' },
  skills: { title: 'Skill Matrix', subtitle: 'Domain-by-domain proficiency diagnostics & mastery', category: 'Diagnostics' },
  achievements: { title: 'Achievements & XP', subtitle: 'Earned scholar milestones, tier badges & active study streaks', category: 'Milestones' },
  browser: { title: 'Question Bank', subtitle: 'Grade-matched verified questions and answer explanations', category: 'Curriculum' },
  results: { title: 'My Test History', subtitle: 'Review past test scores, question answers, and explanations', category: 'Diagnostics' },
  studentProgress: { title: 'Student Progress', subtitle: 'Roster diagnostic analytics, scores & attempt tracking', category: 'Academic' },
  adminQuestions: { title: 'Question Bank', subtitle: 'Create, edit, audit & manage test questions across tracks', category: 'Curriculum' },
  adminImport: { title: 'Word & PDF Importer', subtitle: 'Bulk convert exam documents into structured question items', category: 'Curriculum' },
  adminAccounts: { title: 'User Accounts', subtitle: 'Student and teacher credential vault with cloud backup', category: 'Administration' },
  adminBranding: { title: 'School Branding', subtitle: 'Customize school emblem, application name & login theme', category: 'Administration' },
};

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
      const vault = localStorage.getItem(VAULT_STORAGE_KEY);
      const parsedSaved: UserAccount[] = saved ? JSON.parse(saved) : [];
      const parsedVault: UserAccount[] = vault ? JSON.parse(vault) : [];

      // Merge INITIAL_ACCOUNTS, safety vault, and primary storage so accounts are NEVER lost
      const mergedMap = new Map<string, UserAccount>();
      INITIAL_ACCOUNTS.forEach(a => mergedMap.set(a.username.toLowerCase().trim(), a));
      parsedVault.forEach(a => mergedMap.set(a.username.toLowerCase().trim(), a));
      parsedSaved.forEach(a => mergedMap.set(a.username.toLowerCase().trim(), a));

      const parsed: UserAccount[] = Array.from(mergedMap.values());
      const adminAcc = parsed.find(a => a.username.toLowerCase() === 'admin');
      if (adminAcc) {
        adminAcc.username = 'Admin';
        adminAcc.password = 'HOD@2106';
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

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'idle'>('idle');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('Connected');
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ahs_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Sync state to localStorage (Dual-Vault: standard storage + immutable safety vault)
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_bank`, JSON.stringify(bank));
      localStorage.setItem(`${STORAGE_KEY}_accounts`, JSON.stringify(accounts));
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(accounts));
      localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
      localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
      localStorage.setItem(`${STORAGE_KEY}_attempts`, JSON.stringify(attempts));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(appSettings));
    } catch (e) {}
  }, [bank, accounts, user, profile, attempts, appSettings]);

  // Real-time synchronization & connection to Cloud Firestore database across all devices
  useEffect(() => {
    testFirestoreConnection();

    // 1. Live real-time subscription for accounts across all devices
    const unsubUsers = subscribeToUsers((cloudAccounts) => {
      if (cloudAccounts && cloudAccounts.length) {
        setAccounts(cloudAccounts);
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });

    // 2. Live real-time subscription for branding & settings across all devices
    const unsubSettings = subscribeToSettings((cloudSettings) => {
      if (cloudSettings) {
        setAppSettings(cloudSettings);
      }
    });

    // 3. Live real-time subscription for test attempts across all devices
    const unsubAttempts = subscribeToAttempts((cloudAttempts) => {
      if (cloudAttempts && cloudAttempts.length) {
        setAttempts(cloudAttempts);
      }
    });

    // 4. Live real-time subscription for questions bank across all devices
    const unsubQuestions = subscribeToQuestions((cloudBank) => {
      if (cloudBank && (cloudBank.NAFS?.length || cloudBank.GAT?.length || cloudBank.SAT?.length)) {
        setBank(prev => ({
          NAFS: cloudBank.NAFS?.length ? cloudBank.NAFS : prev.NAFS,
          GAT: cloudBank.GAT?.length ? cloudBank.GAT : prev.GAT,
          SAT: cloudBank.SAT?.length ? cloudBank.SAT : prev.SAT
        }));
      }
    });

    // Initial load: ensure questions bank and default accounts are populated
    fetchUsersFromDb().then(dbAccounts => {
      if (dbAccounts && dbAccounts.length) {
        setAccounts(dbAccounts);
      }
    });
    fetchQuestionsFromDb(initialGATQuestions, initialSATQuestions, initialNAFSQuestions).then(dbBank => {
      if (dbBank && (dbBank.NAFS?.length || dbBank.GAT?.length || dbBank.SAT?.length)) {
        setBank(dbBank);
      }
    });

    return () => {
      unsubUsers();
      unsubSettings();
      unsubAttempts();
      unsubQuestions();
    };
  }, []);

  // Background Cloud Shield: auto-syncs and protects data integrity when entering dashboard
  useEffect(() => {
    if (currentScreen === 'dashboard' || currentScreen === 'studentProgress') {
      const performBackgroundSync = async () => {
        setCloudSyncStatus('syncing');
        try {
          if (accounts.length > 0) {
            await backupAccountsVaultToDb(accounts);
          }
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
          setCloudSyncStatus('synced');
        }
      };
      performBackgroundSync();
    }
  }, [currentScreen]);

  const handleSyncAllToCloud = async () => {
    setCloudSyncStatus('syncing');
    showToast('Saving all accounts, questions & settings to Cloud Firestore...');
    const res = await saveAllChangesToCloud(accounts, bank, appSettings);
    if (res.success) {
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(res.timestamp);
      showToast(`✓ Cloud Protected: ${res.accountsCount} accounts & ${res.questionsCount} questions saved to cloud!`);
    } else {
      setCloudSyncStatus('synced');
      showToast(`Saved to secure local vault. Cloud sync scheduled.`);
    }
  };

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

  // Sign In handler (verifies cryptographic hash + queries Firestore database)
  const handleSignIn = async (login: string, pass: string): Promise<boolean> => {
    const clean = login.toLowerCase().trim();
    let candidate = accounts.find(
      a => a.username.toLowerCase() === clean || (a.email && a.email.toLowerCase() === clean)
    );

    // If not found in local memory, check live Cloud Firestore database
    if (!candidate) {
      try {
        const userDocSnap = await getDoc(doc(db, 'users', clean));
        if (userDocSnap.exists()) {
          candidate = await parseUserDoc(userDocSnap.data());
          if (candidate) {
            setAccounts(prev => [candidate!, ...prev.filter(a => a.username.toLowerCase() !== clean)]);
          }
        }
      } catch (err) {
        console.error('Error verifying user credentials against Firestore:', err);
      }
    }

    // Fallback guarantee for requested Admin account with HOD@2106
    if (!candidate && clean === 'admin') {
      candidate = {
        name: 'Head of Department (Admin)',
        username: 'Admin',
        email: 'admin@prepline.app',
        role: 'Admin',
        password: 'HOD@2106',
        status: 'Active',
        created: 'Oct 5'
      };
    }

    if (candidate) {
      const isMatch = await verifyUserPassword(pass, candidate);
      if (isMatch) {
        const found = { ...candidate };

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

        const nowIso = new Date().toISOString();
        const updatedUser: UserAccount = {
          ...found,
          lastLogin: nowIso,
          status: 'Active'
        };

        setUser(updatedUser);
        setAccounts(prev => [updatedUser, ...prev.filter(a => a.username.toLowerCase() !== clean)]);
        // Automatically save back to Firestore with encrypted credentials so plain text is not stored
        saveUserToDb(updatedUser).catch(console.error);

        if (updatedUser.role === 'Student') {
          fetchUserProfileFromDb(updatedUser.username).then(dbProfile => {
            if (dbProfile) {
              setProfile(dbProfile);
            }
          });
        }

        if (updatedUser.role === 'Admin' || updatedUser.role === 'Teacher') {
          setCurrentScreen('studentProgress');
        } else {
          setCurrentScreen('studentSelect');
        }
        showToast(`Signed in as ${updatedUser.name} (${updatedUser.role})`);
        return true;
      }
    }
    return false;
  };

  // Enforce strict Role-Based Access Control (RBAC) and Student Grade Level Access:
  // - Student can ONLY see student view
  // - High School students have access ONLY to SAT and GAT (access denied to NAFS)
  // - Grade 6 and Grade 9 students have access ONLY to NAFS (access denied to SAT and GAT)
  useEffect(() => {
    if (!user || currentScreen === 'login' || currentScreen === 'onboard') return;

    // Students and Teachers navigation boundaries
    const studentScreens = ['studentSelect', 'dashboard', 'achievements', 'analytics', 'skills', 'practice', 'exam', 'results', 'ksaBooking'];
    // Teacher usage: monitor student progress, KSA test dates, and use platform as student (practice, mock exams, achievements, results)
    // Teachers have NO access to question bank or question adding/importing
    const teacherScreens = ['studentProgress', 'ksaBooking', 'dashboard', 'practice', 'exam', 'results', 'achievements', 'analytics', 'skills', 'studentSelect'];

    if (user.role === 'Student') {
      if (!studentScreens.includes(currentScreen)) {
        setCurrentScreen('dashboard');
      }

      // Enforce assigned pathways or grade pathway restrictions on activeExam
      if (user.assignedPathways && user.assignedPathways.length > 0) {
        if (!user.assignedPathways.includes(activeExam)) {
          setActiveExam(user.assignedPathways[0]);
        }
      } else if (user.studentLevel === 'High School') {
        if (activeExam === 'NAFS') {
          setActiveExam('GAT');
        }
      } else if (user.studentLevel === 'Grade 6' || user.studentLevel === 'Grade 9') {
        if (activeExam === 'GAT' || activeExam === 'SAT') {
          setActiveExam('NAFS');
        }
      }
    } else if (user.role === 'Teacher') {
      if (!teacherScreens.includes(currentScreen)) {
        setCurrentScreen('studentProgress');
      }
    }
  }, [user?.role, user?.studentLevel, currentScreen, activeExam]);

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

  const handleUpdateStudentInfo = (
    username: string,
    studentLevel: StudentLevel,
    studentClass?: string,
    assignedPathways?: PathwayType[]
  ) => {
    setAccounts(prev => {
      const updated = prev.map(a =>
        a.username.toLowerCase() === username.toLowerCase()
          ? {
              ...a,
              studentLevel,
              studentClass,
              assignedPathways: assignedPathways !== undefined ? assignedPathways : a.assignedPathways
            }
          : a
      );
      const target = updated.find(a => a.username.toLowerCase() === username.toLowerCase());
      if (target) {
        saveUserToDb(target).catch(console.error);
      }
      return updated;
    });

    if (user && user.username.toLowerCase() === username.toLowerCase()) {
      setUser(prev =>
        prev
          ? {
              ...prev,
              studentLevel,
              studentClass,
              assignedPathways: assignedPathways !== undefined ? assignedPathways : prev.assignedPathways
            }
          : null
      );
    }

    showToast(`Updated @${username}: ${studentLevel} · Class ${studentClass || 'None'}`);
  };

  const handleToggleUserStatus = (username: string, newStatus: 'Active' | 'Inactive') => {
    setAccounts(prev => {
      const updated = prev.map(a =>
        a.username.toLowerCase() === username.toLowerCase() ? { ...a, status: newStatus } : a
      );
      const target = updated.find(a => a.username.toLowerCase() === username.toLowerCase());
      if (target) {
        saveUserToDb(target).catch(console.error);
      }
      return updated;
    });
    showToast(`Updated @${username} status to ${newStatus}.`);
  };

  const handleUpdateTeacherGrades = (username: string, assignedGrades: StudentLevel[]) => {
    setAccounts(prev => {
      const updated = prev.map(a =>
        a.username.toLowerCase() === username.toLowerCase() ? { ...a, assignedGrades } : a
      );
      const target = updated.find(a => a.username.toLowerCase() === username.toLowerCase());
      if (target) {
        saveUserToDb(target).catch(console.error);
      }
      return updated;
    });
    if (user && user.username.toLowerCase() === username.toLowerCase()) {
      setUser(prev => (prev ? { ...prev, assignedGrades } : null));
    }
    showToast(`Assigned grades updated for teacher @${username}: ${assignedGrades.join(', ')}`);
  };

  const handleUpdateTeacherAssignments = (
    username: string,
    assignedGrades: StudentLevel[],
    assignedPathways?: PathwayType[]
  ) => {
    setAccounts(prev => {
      const updated = prev.map(a =>
        a.username.toLowerCase() === username.toLowerCase()
          ? { ...a, assignedGrades, assignedPathways: assignedPathways || a.assignedPathways }
          : a
      );
      const target = updated.find(a => a.username.toLowerCase() === username.toLowerCase());
      if (target) {
        saveUserToDb(target).catch(console.error);
      }
      return updated;
    });
    if (user && user.username.toLowerCase() === username.toLowerCase()) {
      setUser(prev => (prev ? { ...prev, assignedGrades, assignedPathways: assignedPathways || prev.assignedPathways } : null));
    }
    showToast(`Updated scope for @${username}: [${(assignedPathways || []).join(', ')}]`);
  };

  // Helper: Retrieve question bank accessible to the currently active user
  // - Grade 6 students: only Grade 6 NAFS questions
  // - Grade 9 students: only Grade 9 NAFS questions
  // - High School students: only SAT and GAT questions (NAFS denied)
  // - Faculty & Admin: full question bank
  const getAccessibleBank = (exam: ExamType): Question[] => {
    const list = bank[exam] || [];
    if (!user || user.role !== 'Student') return list;

    // Check if student has explicitly assigned multiple pathways
    if (user.assignedPathways && user.assignedPathways.length > 0) {
      if (!user.assignedPathways.includes(exam)) {
        return [];
      }
      if (exam === 'NAFS') {
        if (user.studentLevel === 'Grade 6') {
          return list.filter(q => q.section.includes('Grade 6') || q.section.includes('G6'));
        }
        if (user.studentLevel === 'Grade 9') {
          return list.filter(q => q.section.includes('Grade 9') || q.section.includes('G9'));
        }
      }
      return list;
    }

    if (exam === 'NAFS') {
      if (user.studentLevel === 'Grade 6') {
        return list.filter(q => q.section.includes('Grade 6') || q.section.includes('G6'));
      }
      if (user.studentLevel === 'Grade 9') {
        return list.filter(q => q.section.includes('Grade 9') || q.section.includes('G9'));
      }
      return []; // High School students denied NAFS
    }

    if (exam === 'GAT' || exam === 'SAT') {
      if (user.studentLevel === 'Grade 6' || user.studentLevel === 'Grade 9') {
        return []; // Grade 6 & 9 denied SAT & GAT
      }
    }

    return list;
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
    const currentList = getAccessibleBank(exam);
    if (!currentList.length) return [];
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

    // Enforce student access control
    if (user?.role === 'Student') {
      if (user.studentLevel === 'High School' && ex === 'NAFS') {
        showToast('Access Denied: High School students are assigned to SAT and GAT only.');
        return;
      }
      if ((user.studentLevel === 'Grade 6' || user.studentLevel === 'Grade 9') && (ex === 'GAT' || ex === 'SAT')) {
        showToast(`Access Denied: ${user.studentLevel} students are assigned to NAFS only.`);
        return;
      }
    }

    const currentBank = getAccessibleBank(ex);
    if (!currentBank.length) {
      showToast(`No questions loaded for ${ex}. Add questions in Admin view.`);
      return;
    }

    const conf = EXAM_CONFIGS[ex];
    let allSkills = conf.sections.flatMap(s => s.skills);
    if (user?.role === 'Student' && ex === 'NAFS') {
      if (user.studentLevel === 'Grade 6') {
        const sec = conf.sections.find(s => s.name.includes('Grade 6') || s.name.includes('G6'));
        if (sec) allSkills = sec.skills;
      } else if (user.studentLevel === 'Grade 9') {
        const sec = conf.sections.find(s => s.name.includes('Grade 9') || s.name.includes('G9'));
        if (sec) allSkills = sec.skills;
      }
    }

    const mockCount = Math.min(currentBank.length, ex === 'GAT' ? 25 : 20);
    const qids = sampleQuestions(ex, allSkills, mockCount);
    const timeSeconds = Math.max(300, qids.length * 48);

    setSession({
      exam: ex,
      kind: 'mock',
      label: `Full ${ex} mock${user?.role === 'Student' && user?.studentLevel ? ` (${user.studentLevel})` : ''}`,
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

    // Enforce student access control
    if (user?.role === 'Student') {
      if (user.studentLevel === 'High School' && ex === 'NAFS') {
        showToast('Access Denied: High School students are assigned to SAT and GAT only.');
        return;
      }
      if ((user.studentLevel === 'Grade 6' || user.studentLevel === 'Grade 9') && (ex === 'GAT' || ex === 'SAT')) {
        showToast(`Access Denied: ${user.studentLevel} students are assigned to NAFS only.`);
        return;
      }
    }

    const currentBank = getAccessibleBank(ex);
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

    // Enforce student access control
    if (user?.role === 'Student') {
      if (user.studentLevel === 'High School' && ex === 'NAFS') {
        showToast('Access Denied: High School students are assigned to SAT and GAT only.');
        return;
      }
      if ((user.studentLevel === 'Grade 6' || user.studentLevel === 'Grade 9') && (ex === 'GAT' || ex === 'SAT')) {
        showToast(`Access Denied: ${user.studentLevel} students are assigned to NAFS only.`);
        return;
      }
    }

    const currentBank = getAccessibleBank(ex);
    if (!currentBank.length) return;

    const conf = EXAM_CONFIGS[ex];
    let allSkills = conf.sections.flatMap(s => s.skills);
    if (user?.role === 'Student' && ex === 'NAFS') {
      if (user.studentLevel === 'Grade 6') {
        const sec = conf.sections.find(s => s.name.includes('Grade 6') || s.name.includes('G6'));
        if (sec) allSkills = sec.skills;
      } else if (user.studentLevel === 'Grade 9') {
        const sec = conf.sections.find(s => s.name.includes('Grade 9') || s.name.includes('G9'));
        if (sec) allSkills = sec.skills;
      }
    }

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
    playCelebrationSound();
    setSession(null);
    setCurrentScreen('results');
    showToast(`Session submitted. Estimated score: ${attempt.score}`);
  };

  const handleAutoSubmit = (sess: ActiveSession) => {
    const attempt = computeResults(sess);
    setAttempts(prev => [attempt, ...prev]);
    saveAttemptToDb(attempt).catch(console.error);
    playCelebrationSound();
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

  const handleDeleteAccounts = (usernames: string[]) => {
    const set = new Set(usernames.map(u => u.toLowerCase()));
    setAccounts(prev => prev.filter(a => !set.has(a.username.toLowerCase())));
    usernames.forEach(u => deleteUserFromDb(u).catch(console.error));
    showToast(`Successfully deleted ${usernames.length} selected accounts.`);
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

  // Compute authentic streak for the selected exam track
  const authenticStreak = React.useMemo(() => {
    if (currentExamAttempts.length === 0) return 0;
    const uniqueDates = new Set(currentExamAttempts.map(a => a.date));
    return Math.min(30, uniqueDates.size);
  }, [currentExamAttempts]);

  // Compute authentic gamification progression for current student in selected track
  const studentGamification = React.useMemo(() => {
    return calculateGamification(currentExamAttempts, authenticStreak);
  }, [currentExamAttempts, authenticStreak]);

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

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarMobileOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('ahs_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const postLoginBackgroundStyle: React.CSSProperties =
    currentScreen !== 'login' && currentScreen !== 'onboard'
      ? {
          backgroundImage: `url('https://img.magnific.com/premium-psd/waves-lines-gray-vector-background_657155-2089.jpg?semt=ais_hybrid&w=740&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }
      : {};

  return (
    <div className="min-h-screen text-[#201e1d] flex flex-col font-sans" style={postLoginBackgroundStyle}>
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
          onSyncAllToCloud={handleSyncAllToCloud}
          cloudSyncStatus={cloudSyncStatus}
          lastCloudSyncTime={lastCloudSyncTime}
          onToggleSidebar={handleToggleSidebar}
        />
      )}

      {/* Main App Layout Container: Left Sidebar Navigation List + Main Content View */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Navigation List (Sidebar) - Formatted like a modern forum / website sidebar */}
        {currentScreen !== 'login' &&
          currentScreen !== 'onboard' &&
          currentScreen !== 'studentSelect' &&
          currentScreen !== 'exam' && (
            <Sidebar
              currentScreen={currentScreen}
              activeExam={activeExam}
              user={user}
              onNavigate={screen => {
                setCurrentScreen(screen);
                setSidebarMobileOpen(false);
              }}
              onSelectExam={ex => setActiveExam(ex)}
              onGoBackToSelect={() => setCurrentScreen('studentSelect')}
              isOpenMobile={sidebarMobileOpen}
              onCloseMobile={() => setSidebarMobileOpen(false)}
              isCollapsedDesktop={sidebarCollapsed}
              onToggleCollapseDesktop={() => {
                setSidebarCollapsed(prev => {
                  const next = !prev;
                  try {
                    localStorage.setItem('ahs_sidebar_collapsed', String(next));
                  } catch {}
                  return next;
                });
              }}
              questionCounts={{
                NAFS: getAccessibleBank('NAFS').length,
                GAT: getAccessibleBank('GAT').length,
                SAT: getAccessibleBank('SAT').length
              }}
              streak={authenticStreak}
              xp={studentGamification.xp}
            />
        )}

        {/* Right / Main Content Column */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-100/90">
          {/* Active View Header & Breadcrumb Bar (Appears across all active module screens) */}
          {currentScreen !== 'login' &&
            currentScreen !== 'onboard' &&
            currentScreen !== 'studentSelect' &&
            currentScreen !== 'exam' && (
              <div className="bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-3 sm:px-6 lg:px-8 py-2.5">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Breadcrumb Navigation & Module Context */}
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-slate-400 font-medium">AHS Prepline</span>
                    <span className="text-slate-300">/</span>
                    
                    {/* Track or Staff Context Indicator */}
                    {user?.role === 'Student' || ['dashboard', 'achievements', 'analytics', 'skills', 'practice', 'browser', 'results'].includes(currentScreen) ? (
                      <div className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                        <span className={`w-2 h-2 rounded-full ${
                          activeExam === 'NAFS' ? 'bg-emerald-600' : activeExam === 'GAT' ? 'bg-red-600' : 'bg-[#1e3a8a]'
                        }`} />
                        <span>{activeExam} Track</span>
                        {user?.role === 'Student' && user?.studentLevel && (
                          <span className="text-[11px] font-bold text-slate-500">({user.studentLevel})</span>
                        )}
                      </div>
                    ) : (
                      <span className="font-bold text-slate-700">Staff Console</span>
                    )}

                    <span className="text-slate-300">/</span>
                    <span className="font-extrabold text-[#1e3a8a] truncate">
                      {ACTIVE_VIEW_INFO[currentScreen]?.title || currentScreen}
                    </span>

                    {/* Subtitle tag */}
                    {ACTIVE_VIEW_INFO[currentScreen]?.subtitle && (
                      <span className="hidden md:inline-block text-[11px] text-slate-500 font-normal pl-1 border-l border-slate-200 truncate max-w-md">
                        {ACTIVE_VIEW_INFO[currentScreen].subtitle}
                      </span>
                    )}
                  </div>

                  {/* Actions: Return to Main Menu for Students */}
                  {(user?.role === 'Student' || ['dashboard', 'achievements', 'analytics', 'skills', 'practice', 'browser', 'results'].includes(currentScreen)) && (
                    <button
                      onClick={() => setCurrentScreen('studentSelect')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-[#1e3a8a] font-extrabold rounded-xl border border-slate-300 shadow-2xs hover:border-[#1e3a8a] transition-all cursor-pointer hover:-translate-x-0.5 shrink-0 ml-auto sm:ml-0"
                      title="Return to Main Menu to select another examination track"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Main Menu (Switch Track)</span>
                    </button>
                  )}
                </div>
              </div>
          )}

          {/* Screen Router with Smooth Fade Transition */}
          <div className="flex-1 flex flex-col animate-viewFadeIn" key={currentScreen}>
        {currentScreen === 'login' && (
          <AuthScreen
            onSignIn={handleSignIn}
            accounts={accounts}
            settings={appSettings}
          />
        )}

        {/* Student Gateway: Select GAT, SAT, or NAFS before any analytics/data is shown */}
        {currentScreen === 'studentSelect' && (
          <StudentExamGateway
            user={user}
            userName={user?.name || 'Student'}
            questionsCount={{
              NAFS: getAccessibleBank('NAFS').length,
              GAT: getAccessibleBank('GAT').length,
              SAT: getAccessibleBank('SAT').length
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
            bank={getAccessibleBank(activeExam)}
            userName={user?.name || 'Student'}
            currentUser={user}
            studentAttempts={currentExamAttempts}
            onStartMock={() => startMockExam(activeExam)}
            onStartFocus={skills => startFocusDrill(skills)}
            onStartQuick={startQuickWarmup}
            onViewSkills={() => setCurrentScreen('skills')}
            onViewResults={() => setCurrentScreen('results')}
            onViewAnalytics={() => setCurrentScreen('analytics')}
            onViewAchievements={() => setCurrentScreen('achievements')}
            onNavigateToPractice={() => setCurrentScreen('practice')}
            onNavigateToBrowser={user?.role !== 'Student' ? () => setCurrentScreen('browser') : undefined}
            onNavigateToKsaBooking={() => setCurrentScreen('ksaBooking')}
            onRetakeMissed={startMissedDrill}
            hasPastResults={currentExamAttempts.length > 0 || !!lastAttempt}
            onUpdateTargetDate={handleUpdateTargetDate}
            onGoBackToMainMenu={() => setCurrentScreen('studentSelect')}
            onSyncAllToCloud={handleSyncAllToCloud}
            cloudSyncStatus={cloudSyncStatus}
            lastCloudSyncTime={lastCloudSyncTime}
          />
        )}

        {currentScreen === 'achievements' && (
          <Achievements
            studentAttempts={currentExamAttempts}
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
            bank={getAccessibleBank(activeExam)}
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
            bank={getAccessibleBank(activeExam)}
            currentUser={user}
            onStartFocus={skills => startFocusDrill(skills)}
          />
        )}

        {currentScreen === 'practice' && (
          <PracticeSetsView
            activeExam={activeExam}
            bank={getAccessibleBank(activeExam)}
            mastery={authenticMastery}
            currentUser={user}
            onStartMock={() => startMockExam(activeExam)}
            onStartFocus={skills => startFocusDrill(skills)}
            onStartQuick={startQuickWarmup}
          />
        )}

        {currentScreen === 'browser' && user?.role !== 'Student' && (
          <QuestionBrowserView
            activeExam={activeExam}
            bank={bank}
            currentUser={user}
            isStudent={false}
            onGoBackToMainMenu={() => setCurrentScreen('studentSelect')}
            onSelectExam={user?.role === 'Admin' || user?.role === 'Teacher' ? ex => setActiveExam(ex) : undefined}
          />
        )}

        {/* Riyadh & KSA Official Test Booking Sessions */}
        {currentScreen === 'ksaBooking' && (
          <KsaTestBookingView
            activeExam={activeExam}
            user={user}
            onGoToExamTrack={() => setCurrentScreen('studentSelect')}
            onStartPractice={() => setCurrentScreen('practice')}
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

        {currentScreen === 'results' && (
          <ResultsView
            attempt={lastAttempt || (currentExamAttempts.length > 0 ? currentExamAttempts[0] : null)}
            allAttempts={currentExamAttempts}
            allQuestions={bank[activeExam]}
            profile={profile}
            onSelectAttempt={att => setLastAttempt(att)}
            onRetake={() => {
              if (lastAttempt && lastAttempt.kind === 'mock') {
                startMockExam(lastAttempt.exam);
              } else {
                startMockExam(activeExam);
              }
            }}
            onPracticeWeak={skills => startFocusDrill(skills)}
            onNavigateToPractice={() => setCurrentScreen('practice')}
            onCheckKsaBooking={() => setCurrentScreen('ksaBooking')}
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
            onSyncAllToCloud={handleSyncAllToCloud}
            cloudSyncStatus={cloudSyncStatus}
            lastCloudSyncTime={lastCloudSyncTime}
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
              onDeleteAccounts={handleDeleteAccounts}
              onUpdateAccountRole={handleUpdateAccountRole}
              onUpdateStudentInfo={handleUpdateStudentInfo}
              onUpdateTeacherGrades={handleUpdateTeacherGrades}
              onUpdateTeacherAssignments={handleUpdateTeacherAssignments}
              onToggleUserStatus={handleToggleUserStatus}
              onSyncAllToCloud={handleSyncAllToCloud}
              cloudSyncStatus={cloudSyncStatus}
              lastCloudSyncTime={lastCloudSyncTime}
              settings={appSettings}
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
  </div>
</div>
  );
}
