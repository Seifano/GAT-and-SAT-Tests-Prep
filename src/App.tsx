import React, { useState, useEffect } from 'react';
import {
  ExamType,
  UserAccount,
  UserProfile,
  Question,
  TestAttempt,
  ActiveSession,
  AppSettings
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
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardView } from './components/DashboardView';
import { SkillsView } from './components/SkillsView';
import { PracticeSetsView } from './components/PracticeSetsView';
import { QuestionBrowserView } from './components/QuestionBrowserView';
import { ExamView } from './components/ExamView';
import { ResultsView } from './components/ResultsView';
import { AdminQuestionsView } from './components/AdminQuestionsView';
import { AdminImportView } from './components/AdminImportView';
import { AdminAccountsView } from './components/AdminAccountsView';
import { AdminBrandingView } from './components/AdminBrandingView';
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
  saveAttemptToDb
} from './firebase';

const STORAGE_KEY = 'ahs_prepline_v5';

export default function App() {
  const [bank, setBank] = useState<Record<ExamType, Question[]>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_bank`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
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
        return parsed;
      }
    } catch (e) {}
    return INITIAL_ACCOUNTS;
  });

  // User starts as null to display the login page by default
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [activeExam, setActiveExam] = useState<ExamType>('GAT');

  // Screen defaults to 'login' when user is null
  const [currentScreen, setCurrentScreen] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem(`${STORAGE_KEY}_user`);
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return u.role === 'Admin' ? 'adminQuestions' : 'dashboard';
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

  const [mastery, setMastery] = useState<Record<ExamType, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_mastery`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MASTERY;
  });

  const [history, setHistory] = useState<Record<ExamType, Array<{ score: number; date: string; kind: string }>>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_history`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_HISTORY;
  });

  const [streak, setStreak] = useState<number>(6);
  const [weekDone, setWeekDone] = useState<boolean[]>([true, true, true, true, true, true, false]);
  const [lastAttempt, setLastAttempt] = useState<TestAttempt | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [seen, setSeen] = useState<Record<ExamType, Record<string, boolean>>>({
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
      localStorage.setItem(`${STORAGE_KEY}_mastery`, JSON.stringify(mastery));
      localStorage.setItem(`${STORAGE_KEY}_history`, JSON.stringify(history));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(appSettings));
    } catch (e) {}
  }, [bank, accounts, user, profile, mastery, history, appSettings]);

  // Initial load & connection to Cloud Firestore database
  useEffect(() => {
    testFirestoreConnection();

    // Fetch live user accounts from Firestore
    fetchUsersFromDb().then(dbAccounts => {
      if (dbAccounts && dbAccounts.length) {
        setAccounts(dbAccounts);
      }
    });

    // Fetch live app branding & settings from Firestore
    fetchAppSettingsFromDb().then(dbSettings => {
      if (dbSettings) {
        setAppSettings(dbSettings);
      }
    });

    // Fetch live questions from Firestore
    fetchQuestionsFromDb(initialGATQuestions, initialSATQuestions).then(dbBank => {
      if (dbBank && (dbBank.GAT.length || dbBank.SAT.length)) {
        setBank(dbBank);
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
      setUser(found);
      if (found.role === 'Admin') {
        setCurrentScreen('adminQuestions');
      } else {
        setCurrentScreen('dashboard');
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

    if (newAccount.role === 'Admin') {
      setCurrentScreen('adminQuestions');
    } else {
      setCurrentScreen('dashboard');
    }

    showToast(`Account created and saved to database! Welcome, ${newAccount.name.split(' ')[0]}.`);
    return true;
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentScreen('login');
    showToast('Signed out.');
  };

  const handleSwitchRole = () => {
    if (user?.role === 'Admin') {
      const student = accounts.find(a => a.role === 'Student') || INITIAL_ACCOUNTS[1];
      setUser(student);
      setCurrentScreen('dashboard');
      showToast(`Switched to Student view (${student.name})`);
    } else {
      const admin = accounts.find(a => a.role === 'Admin') || INITIAL_ACCOUNTS[0];
      setUser(admin);
      setCurrentScreen('adminQuestions');
      showToast(`Switched to Instructor view (${admin.name})`);
    }
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
    } else {
      score = Math.round((400 + 1200 * accuracy) / 10) * 10;
    }

    return {
      id: `att-${Date.now().toString(36)}`,
      exam: sess.exam,
      kind: sess.kind,
      label: sess.label,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

    const currentMastery = { ...mastery[session.exam] };
    attempt.bySkill.forEach(bs => {
      const sessionPct = Math.round((bs.correct / bs.total) * 100);
      const prior = currentMastery[bs.skill] ?? 50;
      currentMastery[bs.skill] = Math.round(prior * 0.7 + sessionPct * 0.3);
    });

    const newHist = { ...history };
    newHist[session.exam] = [
      ...newHist[session.exam],
      { score: attempt.score, date: attempt.date, kind: attempt.label }
    ];

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

    setMastery(prev => ({ ...prev, [session.exam]: currentMastery }));
    setHistory(newHist);
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
    saveAttemptToDb(attempt).catch(console.error);
    setLastAttempt(attempt);
    setSession(null);
    setCurrentScreen('results');
    showToast(`Time ended. Auto-submitted: Score ${attempt.score}`);
  };

  const handleAddQuestion = (q: Question) => {
    setBank(prev => ({
      ...prev,
      [q.exam]: [q, ...prev[q.exam]]
    }));
    saveQuestionToDb(q).catch(console.error);
    showToast(`Added question to ${q.skill}.`);
  };

  const handleUpdateQuestion = (q: Question) => {
    setBank(prev => ({
      ...prev,
      [q.exam]: prev[q.exam].map(item => (item.id === q.id ? q : item))
    }));
    saveQuestionToDb(q).catch(console.error);
    showToast(`Updated question in ${q.skill}.`);
  };

  const handleDeleteQuestion = (exam: ExamType, id: string) => {
    setBank(prev => ({
      ...prev,
      [exam]: prev[exam].filter(item => item.id !== id)
    }));
    deleteQuestionFromDb(id).catch(console.error);
    showToast('Question deleted.');
  };

  const handleImportDrafts = (questions: Question[]) => {
    if (!questions.length) return;
    const byExam: Record<ExamType, Question[]> = { GAT: [], SAT: [] };
    questions.forEach(q => byExam[q.exam].push(q));

    setBank(prev => ({
      GAT: [...byExam.GAT, ...prev.GAT],
      SAT: [...byExam.SAT, ...prev.SAT]
    }));

    saveQuestionsBatchToDb(questions).catch(console.error);
    setCurrentScreen('adminQuestions');
    showToast(`Imported and saved ${questions.length} questions to database.`);
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
          streak={streak}
          onNavigate={screen => setCurrentScreen(screen)}
          onSelectExam={ex => setActiveExam(ex)}
          onSignOut={handleSignOut}
          onSwitchRole={handleSwitchRole}
          settings={appSettings}
        />
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

        {currentScreen === 'onboard' && (
          <OnboardingModal
            initialProfile={profile}
            onComplete={newProfile => {
              setProfile(newProfile);
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
            mastery={mastery[activeExam]}
            history={history[activeExam]}
            streak={streak}
            weekDone={weekDone}
            bank={bank[activeExam]}
            userName={user?.name || 'Student'}
            onStartMock={() => startMockExam(activeExam)}
            onStartFocus={skills => startFocusDrill(skills)}
            onStartQuick={startQuickWarmup}
            onViewSkills={() => setCurrentScreen('skills')}
            onViewResults={() => setCurrentScreen('results')}
            hasPastResults={!!lastAttempt}
          />
        )}

        {currentScreen === 'skills' && (
          <SkillsView
            activeExam={activeExam}
            profile={profile}
            mastery={mastery[activeExam]}
            history={history[activeExam]}
            bank={bank[activeExam]}
            onStartFocus={skills => startFocusDrill(skills)}
          />
        )}

        {currentScreen === 'practice' && (
          <PracticeSetsView
            activeExam={activeExam}
            bank={bank[activeExam]}
            mastery={mastery[activeExam]}
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
              setCurrentScreen('dashboard');
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
            onReturnDashboard={() => setCurrentScreen('dashboard')}
          />
        )}

        {/* Admin Views */}
        {currentScreen === 'adminQuestions' && (
          <AdminQuestionsView
            bank={bank}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        )}

        {currentScreen === 'adminImport' && (
          <AdminImportView
            onImportDrafts={handleImportDrafts}
            onCancel={() => setCurrentScreen('adminQuestions')}
          />
        )}

        {currentScreen === 'adminAccounts' && (
          <AdminAccountsView
            accounts={accounts}
            currentUser={user}
            onCreateAccounts={handleCreateAccounts}
            onResetPassword={handleResetPassword}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

        {currentScreen === 'adminBranding' && (
          <AdminBrandingView
            settings={appSettings}
            onSaveSettings={async newSettings => {
              setAppSettings(newSettings);
              await saveAppSettingsToDb(newSettings);
              showToast('Branding and login page settings saved to database!');
            }}
          />
        )}
      </div>
    </div>
  );
}
