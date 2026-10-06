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
import { UserAccount, Question, AppSettings, TestAttempt, ExamType } from './types';
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
      // Seed default accounts into database if empty
      await seedDefaultUsers();
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
        password: data.password,
        created: data.created || 'Oct 5'
      });
    });

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

    return accounts;
  } catch (err) {
    console.error('Failed to load users from database, using cached fallback:', err);
    return INITIAL_ACCOUNTS;
  }
}

export async function saveUserToDb(account: UserAccount): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', account.username.toLowerCase().trim());
    await setDoc(userDocRef, {
      name: account.name,
      username: account.username,
      email: account.email || '',
      role: account.role,
      password: account.password,
      created: account.created || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }, { merge: true });
    console.log(`User @${account.username} saved to Firestore database.`);
  } catch (err) {
    console.error(`Error saving user @${account.username} to Firestore:`, err);
    throw err;
  }
}

export async function saveUsersBatchToDb(newAccounts: UserAccount[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    newAccounts.forEach(account => {
      const userDocRef = doc(db, 'users', account.username.toLowerCase().trim());
      batch.set(userDocRef, {
        name: account.name,
        username: account.username,
        email: account.email || '',
        role: account.role,
        password: account.password,
        created: account.created || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }, { merge: true });
    });
    await batch.commit();
    console.log(`Batch of ${newAccounts.length} users saved to Firestore database.`);
  } catch (err) {
    console.error('Error saving users batch to Firestore:', err);
    // Fallback: save individually
    for (const acc of newAccounts) {
      await saveUserToDb(acc);
    }
  }
}

export async function deleteUserFromDb(username: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', username.toLowerCase().trim());
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
      const userDocRef = doc(db, 'users', acc.username.toLowerCase().trim());
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
  defaultSAT: Question[]
): Promise<Record<ExamType, Question[]>> {
  try {
    const colRef = collection(db, 'questions');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Seed initial questions into database in background
      seedQuestions(defaultGAT, defaultSAT).catch(console.error);
      return { GAT: defaultGAT, SAT: defaultSAT };
    }
    const result: Record<ExamType, Question[]> = { GAT: [], SAT: [] };
    snapshot.forEach(docSnap => {
      const q = docSnap.data() as Question;
      if (q.exam === 'GAT' || q.exam === 'SAT') {
        result[q.exam].push(q);
      }
    });

    // If either bank is empty, populate with defaults
    if (result.GAT.length === 0) result.GAT = defaultGAT;
    if (result.SAT.length === 0) result.SAT = defaultSAT;

    return result;
  } catch (err) {
    console.error('Failed to fetch questions from Firestore, using local defaults:', err);
    return { GAT: defaultGAT, SAT: defaultSAT };
  }
}

export async function saveQuestionToDb(q: Question): Promise<void> {
  try {
    const docRef = doc(db, 'questions', q.id);
    await setDoc(docRef, q, { merge: true });
  } catch (err) {
    console.error(`Error saving question ${q.id} to Firestore:`, err);
  }
}

export async function saveQuestionsBatchToDb(questions: Question[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    questions.forEach(q => {
      const docRef = doc(db, 'questions', q.id);
      batch.set(docRef, q, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving questions to Firestore:', err);
  }
}

export async function deleteQuestionFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'questions', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting question ${id} from Firestore:`, err);
  }
}

async function seedQuestions(gat: Question[], sat: Question[]): Promise<void> {
  try {
    const all = [...gat, ...sat];
    // Write in chunks of 100 to stay within Firestore batch limits
    for (let i = 0; i < all.length; i += 100) {
      const chunk = all.slice(i, i + 100);
      const batch = writeBatch(db);
      chunk.forEach(q => {
        const docRef = doc(db, 'questions', q.id);
        batch.set(docRef, q);
      });
      await batch.commit();
    }
    console.log(`Seeded ${all.length} questions into Firestore.`);
  } catch (err) {
    console.error('Failed to seed questions to Firestore:', err);
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
