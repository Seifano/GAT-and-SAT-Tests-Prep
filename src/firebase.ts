import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserAccount, Question, AppSettings, TestAttempt, ExamType, UserProfile } from './types';
import { INITIAL_ACCOUNTS, DEFAULT_APP_SETTINGS } from './data/mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Verify database connectivity per AI Studio Firebase guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Connected to Cloud Firestore database successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline cache mode.');
    } else {
      console.log('Firestore initialized.');
    }
    return false;
  }
}

// ----------------------------------------------------
// USER ACCOUNTS DATABASE OPERATIONS
// ----------------------------------------------------

export async function fetchUsersFromDb(): Promise<UserAccount[]> {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Check if backup vault has accounts before falling back to initial mock
      const vaultAccounts = await fetchAccountsVaultFromDb();
      if (vaultAccounts && vaultAccounts.length > 0) {
        // Restore from cloud vault
        await saveUsersBatchToDb(vaultAccounts);
        return vaultAccounts;
      }

      // Seed default accounts into database if empty
      await seedDefaultUsers();
      await backupAccountsVaultToDb(INITIAL_ACCOUNTS);
      return INITIAL_ACCOUNTS;
    }
    const accounts: UserAccount[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as UserAccount;
      let userRole = data.role;

      // Enforce: Abdullah Ali and Houssem Hammami are Teacher accounts (not Admin)
      const isAbdullah =
        data.username.toLowerCase() === 'abdullah.a' ||
        data.username.toLowerCase() === 'abdullah' ||
        data.name.toLowerCase().includes('abdullah ali');
      const isHoussem =
        data.username.toLowerCase() === 'houssem.h' ||
        data.username.toLowerCase() === 'houssem' ||
        data.name.toLowerCase().includes('houssem hammami');

      if (isAbdullah || isHoussem) {
        userRole = 'Teacher';
        if (data.role !== 'Teacher') {
          // Sync correction directly to Firestore
          saveUserToDb({ ...data, role: 'Teacher' }).catch(console.error);
        }
      }

      accounts.push({
        name: data.name,
        username: data.username,
        email: data.email,
        role: userRole,
        studentLevel: data.studentLevel || (userRole === 'Student' ? (data.name?.toLowerCase().includes('sara') ? 'Grade 6' : data.name?.toLowerCase().includes('omar') ? 'Grade 9' : 'High School') : undefined),
        studentClass: data.studentClass || (userRole === 'Student' ? (data.name?.toLowerCase().includes('sara') ? '6-A' : data.name?.toLowerCase().includes('omar') ? '9-B' : '11-A') : undefined),
        password: data.password,
        created: data.created || 'Oct 5'
      });
    });

    // Check backup vault to see if any accounts are missing from individual docs
    try {
      const vaultAccounts = await fetchAccountsVaultFromDb();
      const existingUsernames = new Set(accounts.map(a => a.username.toLowerCase().trim()));
      const missingFromVault = vaultAccounts.filter(va => !existingUsernames.has(va.username.toLowerCase().trim()));
      if (missingFromVault.length > 0) {
        accounts.push(...missingFromVault);
        saveUsersBatchToDb(missingFromVault).catch(console.error);
      }
    } catch (e) {
      // ignore
    }

    // Ensure Admin account is always present in database
    const hasAdmin = accounts.some(a => a.username.toLowerCase() === 'admin');
    if (!hasAdmin) {
      const adminAcc: UserAccount = INITIAL_ACCOUNTS[0];
      await saveUserToDb(adminAcc);
      accounts.unshift(adminAcc);
    }

    // Ensure Abdullah Ali Teacher account is present
    const hasAbdullah = accounts.some(
      a => a.username.toLowerCase() === 'abdullah.a' || a.name.toLowerCase().includes('abdullah ali')
    );
    if (!hasAbdullah) {
      const abdullahAcc = INITIAL_ACCOUNTS.find(a => a.name.includes('Abdullah Ali'));
      if (abdullahAcc) {
        await saveUserToDb(abdullahAcc);
        accounts.push(abdullahAcc);
      }
    }

    // Ensure Houssem Hammami Teacher account is present
    const hasHoussem = accounts.some(
      a => a.username.toLowerCase() === 'houssem.h' || a.name.toLowerCase().includes('houssem hammami')
    );
    if (!hasHoussem) {
      const houssemAcc = INITIAL_ACCOUNTS.find(a => a.name.includes('Houssem Hammami'));
      if (houssemAcc) {
        await saveUserToDb(houssemAcc);
        accounts.push(houssemAcc);
      }
    }

    // Update safety backup vault with latest state
    backupAccountsVaultToDb(accounts).catch(console.error);

    return accounts;
  } catch (err) {
    console.error('Failed to load users from database, using cached fallback:', err);
    return INITIAL_ACCOUNTS;
  }
}

export async function backupAccountsVaultToDb(accounts: UserAccount[]): Promise<void> {
  try {
    const vaultRef = doc(db, 'backups', 'accounts_vault');
    await setDoc(vaultRef, {
      accounts,
      updatedAt: new Date().toISOString(),
      count: accounts.length
    }, { merge: true });
  } catch (err) {
    console.warn('Could not write accounts vault backup to Firestore:', err);
  }
}

export async function fetchAccountsVaultFromDb(): Promise<UserAccount[]> {
  try {
    const vaultRef = doc(db, 'backups', 'accounts_vault');
    const snap = await getDoc(vaultRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.accounts) && data.accounts.length > 0) {
        return data.accounts as UserAccount[];
      }
    }
  } catch (err) {
    // ignore
  }
  return [];
}

export async function saveUserToDb(account: UserAccount): Promise<void> {
  try {
    const docId = account.username.toLowerCase().trim().replace(/\//g, '_');
    const userDocRef = doc(db, 'users', docId);
    const payload: Record<string, any> = {
      name: account.name,
      username: account.username,
      email: account.email || '',
      role: account.role,
      password: account.password,
      created: account.created || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    if (account.studentLevel) payload.studentLevel = account.studentLevel;
    if (account.studentClass) payload.studentClass = account.studentClass;
    await setDoc(userDocRef, payload, { merge: true });
    console.log(`User @${account.username} saved to Firestore database.`);
  } catch (err) {
    console.error(`Error saving user @${account.username} to Firestore:`, err);
    throw err;
  }
}

export async function saveUsersBatchToDb(newAccounts: UserAccount[]): Promise<void> {
  if (!newAccounts.length) return;
  try {
    const batch = writeBatch(db);
    newAccounts.forEach(account => {
      const docId = account.username.toLowerCase().trim().replace(/\//g, '_');
      const userDocRef = doc(db, 'users', docId);
      const payload: Record<string, any> = {
        name: account.name,
        username: account.username,
        email: account.email || '',
        role: account.role,
        password: account.password,
        created: account.created || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
      if (account.studentLevel) payload.studentLevel = account.studentLevel;
      if (account.studentClass) payload.studentClass = account.studentClass;
      batch.set(userDocRef, payload, { merge: true });
    });
    await batch.commit();
    console.log(`Batch of ${newAccounts.length} users saved to Firestore database.`);
  } catch (err) {
    console.error('Error saving users batch to Firestore, falling back to individual writes:', err);
    // Fallback: save individually
    for (const acc of newAccounts) {
      await saveUserToDb(acc).catch(console.error);
    }
  }
}

export async function deleteUserFromDb(username: string): Promise<void> {
  try {
    const docId = username.toLowerCase().trim().replace(/\//g, '_');
    const userDocRef = doc(db, 'users', docId);
    await deleteDoc(userDocRef);
    console.log(`User @${username} removed from Firestore database.`);
  } catch (err) {
    console.error(`Error deleting user @${username} from Firestore:`, err);
    throw err;
  }
}

export async function seedDefaultUsers(): Promise<void> {
  try {
    for (const acc of INITIAL_ACCOUNTS) {
      const docId = acc.username.toLowerCase().trim().replace(/\//g, '_');
      const userDocRef = doc(db, 'users', docId);
      await setDoc(userDocRef, {
        name: acc.name,
        username: acc.username,
        email: acc.email || '',
        role: acc.role,
        password: acc.password,
        created: acc.created
      }, { merge: true });
    }
    console.log('Seeded initial accounts into Firestore database.');
  } catch (err) {
    console.error('Error seeding initial accounts to Firestore:', err);
  }
}

// ----------------------------------------------------
// APPLICATION SETTINGS & BRANDING DATABASE OPERATIONS
// ----------------------------------------------------

export async function fetchAppSettingsFromDb(): Promise<AppSettings> {
  try {
    const settingsDocRef = doc(db, 'settings', 'app');
    const snap = await getDoc(settingsDocRef);
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
    // Seed default settings into database
    await saveAppSettingsToDb(DEFAULT_APP_SETTINGS);
    return DEFAULT_APP_SETTINGS;
  } catch (err) {
    console.error('Failed to load app settings from database:', err);
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettingsToDb(settings: AppSettings): Promise<void> {
  try {
    const settingsDocRef = doc(db, 'settings', 'app');
    await setDoc(settingsDocRef, settings, { merge: true });
    console.log('Branding and login page settings saved to Firestore database.');
  } catch (err) {
    console.error('Error saving app settings to Firestore:', err);
  }
}

// ----------------------------------------------------
// QUESTION BANK DATABASE OPERATIONS
// ----------------------------------------------------

export async function fetchQuestionsFromDb(
  defaultGAT: Question[],
  defaultSAT: Question[],
  defaultNAFS: Question[] = []
): Promise<Record<ExamType, Question[]>> {
  try {
    const colRef = collection(db, 'questions');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Seed initial questions into database in background
      seedQuestions(defaultGAT, defaultSAT, defaultNAFS).catch(console.error);
      return { NAFS: defaultNAFS, GAT: defaultGAT, SAT: defaultSAT };
    }
    const result: Record<ExamType, Question[]> = { NAFS: [], GAT: [], SAT: [] };
    const dbQuestionIds = new Set<string>();

    snapshot.forEach(docSnap => {
      const q = docSnap.data() as Question;
      if (q.exam === 'NAFS' || q.exam === 'GAT' || q.exam === 'SAT') {
        result[q.exam].push(q);
        dbQuestionIds.add(q.id);
      }
    });

    // Ensure all default questions are present in database
    const missingDefaults: Question[] = [];
    defaultNAFS.forEach(q => {
      if (!dbQuestionIds.has(q.id)) {
        result.NAFS.push(q);
        missingDefaults.push(q);
      }
    });
    defaultGAT.forEach(q => {
      if (!dbQuestionIds.has(q.id)) {
        result.GAT.push(q);
        missingDefaults.push(q);
      }
    });
    defaultSAT.forEach(q => {
      if (!dbQuestionIds.has(q.id)) {
        result.SAT.push(q);
        missingDefaults.push(q);
      }
    });

    if (missingDefaults.length > 0) {
      saveQuestionsBatchToDb(missingDefaults).catch(console.error);
      console.log(`Synced ${missingDefaults.length} initial questions to Firestore database.`);
    }

    if (result.NAFS.length === 0) result.NAFS = defaultNAFS;
    if (result.GAT.length === 0) result.GAT = defaultGAT;
    if (result.SAT.length === 0) result.SAT = defaultSAT;

    return result;
  } catch (err) {
    console.error('Failed to fetch questions from Firestore, using local defaults:', err);
    return { NAFS: defaultNAFS, GAT: defaultGAT, SAT: defaultSAT };
  }
}

export function sanitizeQuestionForDb(q: Question): Record<string, any> {
  const rawId = String(q.id || `q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`);
  const safeId = rawId.replace(/\//g, '_');
  const cleaned: Record<string, any> = {
    id: safeId,
    exam: (q.exam === 'NAFS' || q.exam === 'SAT') ? q.exam : 'GAT',
    section: String(q.section || 'General'),
    skill: String(q.skill || 'General'),
    prompt: String(q.prompt || ''),
    options: Array.isArray(q.options) && q.options.length >= 2
      ? q.options.map(o => String(o ?? ''))
      : ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: typeof q.answer === 'number' && !isNaN(q.answer) ? Math.max(0, Math.min(3, Math.floor(q.answer))) : 0,
    explain: String(q.explain || '')
  };
  if (q.src && typeof q.src === 'string' && q.src.trim().length > 0) {
    cleaned.src = q.src.trim();
  }
  if (q.passage && typeof q.passage === 'string' && q.passage.trim().length > 0) {
    cleaned.passage = q.passage.trim();
  }
  return cleaned;
}

export async function saveQuestionToDb(q: Question): Promise<boolean> {
  try {
    const cleaned = sanitizeQuestionForDb(q);
    const docRef = doc(db, 'questions', cleaned.id);
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.error(`Error saving question ${q.id} to Firestore:`, err);
    return false;
  }
}

export async function saveQuestionsBatchToDb(questions: Question[]): Promise<boolean> {
  if (!questions.length) return true;
  try {
    for (let i = 0; i < questions.length; i += 100) {
      const chunk = questions.slice(i, i + 100);
      const batch = writeBatch(db);
      chunk.forEach(q => {
        const cleaned = sanitizeQuestionForDb(q);
        const docRef = doc(db, 'questions', cleaned.id);
        batch.set(docRef, cleaned, { merge: true });
      });
      await batch.commit();
    }
    console.log(`Saved batch of ${questions.length} questions to Firestore database.`);
    return true;
  } catch (err) {
    console.error('Error batch saving questions to Firestore, attempting individual writes:', err);
    let successCount = 0;
    for (const q of questions) {
      const ok = await saveQuestionToDb(q);
      if (ok) successCount++;
    }
    return successCount > 0;
  }
}

export async function deleteQuestionFromDb(id: string): Promise<void> {
  try {
    const safeId = String(id).replace(/\//g, '_');
    const docRef = doc(db, 'questions', safeId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting question ${id} from Firestore:`, err);
  }
}

async function seedQuestions(gat: Question[], sat: Question[], nafs: Question[] = []): Promise<void> {
  try {
    const all = [...gat, ...sat, ...nafs];
    // Write in chunks of 100 to stay within Firestore batch limits
    for (let i = 0; i < all.length; i += 100) {
      const chunk = all.slice(i, i + 100);
      const batch = writeBatch(db);
      chunk.forEach(q => {
        const cleaned = sanitizeQuestionForDb(q);
        const docRef = doc(db, 'questions', cleaned.id);
        batch.set(docRef, cleaned);
      });
      await batch.commit();
    }
    console.log(`Seeded ${all.length} questions into Firestore.`);
  } catch (err) {
    console.error('Failed to seed questions to Firestore:', err);
  }
}

// ----------------------------------------------------
// FULL CLOUD SYNCHRONIZATION & SECURITY VAULT
// ----------------------------------------------------

export async function saveAllChangesToCloud(
  accounts: UserAccount[],
  bank: Record<ExamType, Question[]>,
  settings: AppSettings
): Promise<{ success: boolean; accountsCount: number; questionsCount: number; timestamp: string; error?: string }> {
  let questionsCount = 0;
  try {
    // 1. Batch save all accounts and update backup vault
    await saveUsersBatchToDb(accounts);
    await backupAccountsVaultToDb(accounts);

    // 2. Batch save questions from all tracks
    const allQuestions = [...(bank.NAFS || []), ...(bank.GAT || []), ...(bank.SAT || [])];
    questionsCount = allQuestions.length;
    await saveQuestionsBatchToDb(allQuestions);

    // 3. Save app settings
    await saveAppSettingsToDb(settings);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(`All changes (${accounts.length} accounts, ${questionsCount} questions) saved to cloud successfully.`);

    return {
      success: true,
      accountsCount: accounts.length,
      questionsCount,
      timestamp
    };
  } catch (err: any) {
    console.error('Error during full cloud sync:', err);
    return {
      success: false,
      accountsCount: accounts.length,
      questionsCount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      error: err?.message || 'Unknown network error'
    };
  }
}

// ----------------------------------------------------
// ATTEMPTS DATABASE OPERATIONS
// ----------------------------------------------------

export async function saveAttemptToDb(attempt: TestAttempt): Promise<void> {
  try {
    const docRef = doc(db, 'attempts', attempt.id);
    await setDoc(docRef, {
      ...attempt,
      username: attempt.username || 'unknown'
    }, { merge: true });
    console.log(`Saved attempt ${attempt.id} for user ${attempt.username} to Firestore.`);
  } catch (err) {
    console.error('Error saving attempt to Firestore:', err);
  }
}

export async function fetchAllAttemptsFromDb(): Promise<TestAttempt[]> {
  try {
    const colRef = collection(db, 'attempts');
    const snapshot = await getDocs(colRef);
    const attempts: TestAttempt[] = [];
    snapshot.forEach(docSnap => {
      attempts.push(docSnap.data() as TestAttempt);
    });
    return attempts;
  } catch (err) {
    console.error('Failed to fetch attempts from Firestore:', err);
    return [];
  }
}

export async function fetchUserAttemptsFromDb(username: string): Promise<TestAttempt[]> {
  try {
    const all = await fetchAllAttemptsFromDb();
    const clean = username.toLowerCase().trim();
    return all.filter(a => (a.username || '').toLowerCase().trim() === clean);
  } catch (err) {
    console.error(`Failed to fetch attempts for user ${username}:`, err);
    return [];
  }
}

// ----------------------------------------------------
// USER PROFILES & STUDY TARGETS DATABASE OPERATIONS
// ----------------------------------------------------

export async function saveUserProfileToDb(username: string, profile: UserProfile): Promise<void> {
  try {
    const docRef = doc(db, 'profiles', username.toLowerCase().trim());
    await setDoc(docRef, profile, { merge: true });
    console.log(`Saved study profile and exam dates for @${username} to Firestore.`);
  } catch (err) {
    console.error(`Error saving user profile to Firestore:`, err);
  }
}

export async function fetchUserProfileFromDb(username: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'profiles', username.toLowerCase().trim());
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching profile from Firestore:`, err);
    return null;
  }
}
