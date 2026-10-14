import React, { useState, useRef } from 'react';
import { UserAccount, UserRole, StudentLevel } from '../types';
import {
  Search,
  X,
  Check,
  ArrowRight,
  Cloud,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronDown,
  GraduationCap,
  Layers,
  Edit2,
  BookOpen,
  Target
} from 'lucide-react';

interface AdminAccountsViewProps {
  accounts: UserAccount[];
  currentUser: UserAccount | null;
  onCreateAccounts: (accounts: UserAccount[]) => void;
  onResetPassword: (username: string, newPass: string) => void;
  onDeleteAccount: (username: string) => void;
  onUpdateAccountRole?: (username: string, newRole: UserRole) => void;
  onUpdateStudentInfo?: (username: string, studentLevel: StudentLevel, studentClass?: string) => void;
  onSyncAllToCloud?: () => Promise<void> | void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'idle';
  lastCloudSyncTime?: string;
}

export const AdminAccountsView: React.FC<AdminAccountsViewProps> = ({
  accounts,
  currentUser,
  onCreateAccounts,
  onResetPassword,
  onDeleteAccount,
  onUpdateAccountRole,
  onUpdateStudentInfo,
  onSyncAllToCloud,
  cloudSyncStatus = 'idle',
  lastCloudSyncTime = 'Connected'
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [levelFilter, setLevelFilter] = useState<'All' | StudentLevel>('All');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Single form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [studentLevel, setStudentLevel] = useState<StudentLevel>('Grade 6');
  const [studentClass, setStudentClass] = useState<string>('6-A');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Bulk form
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaultLevel, setBulkDefaultLevel] = useState<StudentLevel>('Grade 6');
  const [bulkDefaultClass, setBulkDefaultClass] = useState<string>('6-A');
  const [bulkError, setBulkError] = useState('');

  // Issued credentials
  const [issuedList, setIssuedList] = useState<Array<{ name: string; username: string; pass: string; level?: string; class?: string }>>([]);
  const [showIssuedPass, setShowIssuedPass] = useState(false);
  const [copied, setCopied] = useState(false);

  // Confirm delete modal
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<UserAccount | null>(null);

  // Edit Student modal
  const [editingStudent, setEditingStudent] = useState<{
    username: string;
    name: string;
    level: StudentLevel;
    class: string;
  } | null>(null);

  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let p = '';
    for (let i = 0; i < 8; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return p;
  };

  const suggestUsername = (fullName: string) => {
    const parts = fullName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return 'student';
    if (parts.length === 1) return parts[0].slice(0, 10);
    return `${parts[0]}.${parts[parts.length - 1][0]}`;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username === suggestUsername(name)) {
      setUsername(suggestUsername(val));
    }
  };

  const handleSelectLevel = (lvl: StudentLevel) => {
    setStudentLevel(lvl);
    if (lvl === 'Grade 6' && (!studentClass || studentClass.startsWith('9-') || studentClass.startsWith('10-') || studentClass.startsWith('11-'))) {
      setStudentClass('6-A');
    } else if (lvl === 'Grade 9' && (!studentClass || studentClass.startsWith('6-') || studentClass.startsWith('10-') || studentClass.startsWith('11-'))) {
      setStudentClass('9-A');
    } else if (lvl === 'High School' && (!studentClass || studentClass.startsWith('6-') || studentClass.startsWith('9-'))) {
      setStudentClass('10-A');
    }
  };

  const handleCreateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Enter a student/user name.');
      return;
    }
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setFormError('Enter a username.');
      return;
    }
    if (accounts.some(a => a.username.toLowerCase() === cleanUser)) {
      setFormError(`Username @${cleanUser} is already in use.`);
      return;
    }

    const pass = password.trim() || generatePassword();
    const isStudentRole = role === 'Student';
    const finalClass = isStudentRole ? (studentClass.trim() || (studentLevel === 'Grade 6' ? '6-A' : studentLevel === 'Grade 9' ? '9-A' : '10-A')) : undefined;

    const newAcc: UserAccount = {
      name: name.trim(),
      username: cleanUser,
      email: email.trim() || undefined,
      role,
      studentLevel: isStudentRole ? studentLevel : undefined,
      studentClass: finalClass,
      password: pass,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    onCreateAccounts([newAcc]);
    setIssuedList([{
      name: newAcc.name,
      username: newAcc.username,
      pass,
      level: newAcc.studentLevel,
      class: newAcc.studentClass
    }]);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setFormError('');
  };

  const handleCreateBulk = () => {
    const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) {
      setBulkError('Paste at least one student name.');
      return;
    }

    const newAccounts: UserAccount[] = [];
    const issued: Array<{ name: string; username: string; pass: string; level?: string; class?: string }> = [];
    const existingUsers = new Set(accounts.map(a => a.username.toLowerCase()));

    lines.forEach(line => {
      const tokens = line.split(/[,\t;]/).map(t => t.trim());
      const studentName = tokens[0];
      if (!studentName) return;

      let studentUser = tokens[1] && !tokens[1].toLowerCase().includes('grade') && !tokens[1].toLowerCase().includes('high school') && !tokens[1].toLowerCase().includes('class')
        ? tokens[1].toLowerCase()
        : suggestUsername(studentName);

      let suffix = 2;
      while (existingUsers.has(studentUser.toLowerCase())) {
        studentUser = `${suggestUsername(studentName)}${suffix++}`;
      }
      existingUsers.add(studentUser.toLowerCase());

      let studentEmail: string | undefined = undefined;
      let lineLevel: StudentLevel = bulkDefaultLevel;
      let lineClass: string = bulkDefaultClass;

      tokens.slice(1).forEach(tok => {
        const lower = tok.toLowerCase();
        if (lower.includes('@')) {
          studentEmail = tok;
        } else if (lower.includes('grade 6') || lower === 'g6' || lower === 'grade6') {
          lineLevel = 'Grade 6';
        } else if (lower.includes('grade 9') || lower === 'g9' || lower === 'grade9') {
          lineLevel = 'Grade 9';
        } else if (lower.includes('high school') || lower === 'hs' || lower === 'highschool') {
          lineLevel = 'High School';
        } else if (
          /^[0-9]{1,2}-[a-zA-Z0-9]+$/i.test(tok) ||
          /^[a-zA-Z0-9]+-[0-9]{1,2}$/i.test(tok) ||
          lower.startsWith('class') ||
          lower.startsWith('sec')
        ) {
          lineClass = tok;
        }
      });

      const pass = generatePassword();
      const acc: UserAccount = {
        name: studentName,
        username: studentUser,
        email: studentEmail,
        role: 'Student',
        studentLevel: lineLevel,
        studentClass: lineClass,
        password: pass,
        created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      newAccounts.push(acc);
      issued.push({
        name: studentName,
        username: studentUser,
        pass,
        level: lineLevel,
        class: lineClass
      });
    });

    if (newAccounts.length === 0) {
      setBulkError('No valid student accounts could be parsed.');
      return;
    }

    onCreateAccounts(newAccounts);
    setIssuedList(issued);
    setBulkText('');
    setBulkError('');
  };

  const handleReset = (targetUser: UserAccount) => {
    const newPass = generatePassword();
    onResetPassword(targetUser.username, newPass);
    setIssuedList([{
      name: targetUser.name,
      username: targetUser.username,
      pass: newPass,
      level: targetUser.studentLevel,
      class: targetUser.studentClass
    }]);
  };

  const handleCopyIssued = () => {
    const text = issuedList
      .map(item => `${item.name} (${item.level || 'Student'}${item.class ? ` · ${item.class}` : ''}) — @${item.username} / ${item.pass}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csvHeader = 'Name,Username,Role,Grade Level,Class,Temporary Password\n';
    const csvRows = issuedList
      .map(item => `"${item.name}","${item.username}","Student","${item.level || ''}","${item.class || ''}","${item.pass}"`)
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prepline_student_credentials.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBackupJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(accounts, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `ahs_accounts_safety_vault_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const handleRestoreBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, UserAccount>();
          accounts.forEach(a => map.set(a.username.toLowerCase(), a));
          parsed.forEach((a: UserAccount) => {
            if (a.username) map.set(a.username.toLowerCase(), a);
          });
          const merged = Array.from(map.values());
          onCreateAccounts(merged);
          setRestoreMessage(`Successfully restored and merged ${parsed.length} accounts.`);
          setTimeout(() => setRestoreMessage(null), 5000);
        }
      } catch (err) {
        setRestoreMessage('Failed to restore vault backup: Invalid JSON format.');
        setTimeout(() => setRestoreMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Distinct classes across student accounts
  const availableClasses = Array.from(
    new Set(
      accounts
        .filter(a => a.role === 'Student' && a.studentClass)
        .map(a => a.studentClass as string)
    )
  ).sort();

  const filteredAccounts = accounts.filter(a => {
    const term = searchTerm.trim().toLowerCase();
    const matchTerm =
      !term ||
      (a.name + ' ' + a.username + ' ' + (a.email || '') + ' ' + (a.studentClass || '') + ' ' + (a.studentLevel || ''))
        .toLowerCase()
        .includes(term);

    const matchRole = roleFilter === 'All' || a.role === roleFilter;
    const matchLevel =
      levelFilter === 'All' ||
      (a.role === 'Student' && a.studentLevel === levelFilter);
    const matchClass =
      classFilter === 'All' ||
      (a.role === 'Student' && a.studentClass === classFilter);

    return matchTerm && matchRole && matchLevel && matchClass;
  });

  const studentCount = accounts.filter(a => a.role === 'Student').length;
  const grade6Count = accounts.filter(a => a.role === 'Student' && a.studentLevel === 'Grade 6').length;
  const grade9Count = accounts.filter(a => a.role === 'Student' && a.studentLevel === 'Grade 9').length;
  const hsCount = accounts.filter(a => a.role === 'Student' && a.studentLevel === 'High School').length;
  const adminCount = accounts.filter(a => a.role === 'Admin').length;
  const teacherCount = accounts.filter(a => a.role === 'Teacher').length;
  const bulkLinesCount = bulkText.split(/\r?\n/).filter(l => l.trim()).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="pb-4 border-b-2 border-[#201e1d]/30 min-w-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            Accounts &amp; Class Rosters Management
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            {studentCount} Student{studentCount === 1 ? '' : 's'} · {teacherCount} Teacher{teacherCount === 1 ? '' : 's'} · {adminCount} Admin{adminCount === 1 ? '' : 's'}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mt-2 leading-relaxed break-words">
            Manage authenticated accounts and enforce institutional grade access. Grade 6 &amp; 9 students access NAFS grade literacy; High School students access SAT &amp; GAT.
          </p>
        </div>

        {onSyncAllToCloud && (
          <button
            type="button"
            onClick={onSyncAllToCloud}
            disabled={cloudSyncStatus === 'syncing'}
            className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#162c68] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0 hover:-translate-y-0.5"
          >
            {cloudSyncStatus === 'syncing' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 text-sky-300" />
            )}
            <span>{cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Sync All Accounts to Cloud'}</span>
          </button>
        )}
      </div>

      {/* Grade Level Distribution Summary Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50/70 border border-emerald-300/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              G6
            </div>
            <div>
              <div className="text-xs font-black text-emerald-950 uppercase tracking-wider">Grade 6 Students</div>
              <div className="text-[11px] text-emerald-700 font-semibold">NAFS Grade 6 Access Only</div>
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-800 tabular-nums">{grade6Count}</span>
        </div>

        <div className="p-4 bg-teal-50/70 border border-teal-300/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black">
              G9
            </div>
            <div>
              <div className="text-xs font-black text-teal-950 uppercase tracking-wider">Grade 9 Students</div>
              <div className="text-[11px] text-teal-700 font-semibold">NAFS Grade 9 Access Only</div>
            </div>
          </div>
          <span className="text-2xl font-black text-teal-800 tabular-nums">{grade9Count}</span>
        </div>

        <div className="p-4 bg-blue-50/70 border border-blue-300/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center font-black">
              HS
            </div>
            <div>
              <div className="text-xs font-black text-blue-950 uppercase tracking-wider">High School Students</div>
              <div className="text-[11px] text-blue-700 font-semibold">SAT &amp; GAT Access Only</div>
            </div>
          </div>
          <span className="text-2xl font-black text-[#1e3a8a] tabular-nums">{hsCount}</span>
        </div>
      </div>

      {/* Cloud Database & Security Command Center (Collapsible Accordion) */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-md border border-blue-800 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowCommandCenter(!showCommandCenter)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-sky-300 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white tracking-tight">
                  Cloud Database Shield &amp; Roster Backup
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Dual-Vault Active
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {accounts.length} total credentials · Last Synced: {lastCloudSyncTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block text-xs font-bold text-sky-200">
              {showCommandCenter ? 'Hide Shield Controls' : 'Open Vault Controls'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-sky-300 transition-transform duration-200 ${
                showCommandCenter ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {showCommandCenter && (
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4 border-t border-white/10 pt-4">
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              User accounts and roster data are synchronized with Cloud Firestore and mirrored in an immutable safety vault.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {onSyncAllToCloud && (
                <button
                  type="button"
                  onClick={onSyncAllToCloud}
                  disabled={cloudSyncStatus === 'syncing'}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Sync to Cloud Now'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadBackupJson}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Safety Vault JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Vault JSON</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreBackupJson}
                className="hidden"
              />
            </div>

            {restoreMessage && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{restoreMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border-2 border-slate-300 p-5 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-black text-[#201e1d] uppercase tracking-wider">
                Create User Accounts
              </h2>
              <div className="inline-flex border border-[#201e1d]/30 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    mode === 'single' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
                  }`}
                >
                  Single Account
                </button>
                <button
                  type="button"
                  onClick={() => setMode('bulk')}
                  className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    mode === 'bulk' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
                  }`}
                >
                  Bulk Import
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#201e1d]">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Student', 'Teacher', 'Admin'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 text-xs font-black rounded-xl border transition-all cursor-pointer text-center ${
                      role === r
                        ? 'bg-[#1f3d7a] text-white border-[#1f3d7a] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* If Role is Student: Grade Level & Class Selection */}
            {role === 'Student' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-extrabold text-[#201e1d]">
                      Student Grade Level <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Access Restriction
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectLevel('Grade 6')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        studentLevel === 'Grade 6'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm ring-2 ring-emerald-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      <div className="font-black text-xs">Grade 6</div>
                      <div className={`text-[10px] ${studentLevel === 'Grade 6' ? 'text-emerald-100' : 'text-slate-500'}`}>
                        NAFS G6 Only
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectLevel('Grade 9')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        studentLevel === 'Grade 9'
                          ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-teal-500'
                      }`}
                    >
                      <div className="font-black text-xs">Grade 9</div>
                      <div className={`text-[10px] ${studentLevel === 'Grade 9' ? 'text-teal-100' : 'text-slate-500'}`}>
                        NAFS G9 Only
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectLevel('High School')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        studentLevel === 'High School'
                          ? 'bg-[#1e3a8a] text-white border-blue-900 shadow-sm ring-2 ring-blue-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-500'
                      }`}
                    >
                      <div className="font-black text-xs">High School</div>
                      <div className={`text-[10px] ${studentLevel === 'High School' ? 'text-blue-100' : 'text-slate-500'}`}>
                        SAT &amp; GAT Only
                      </div>
                    </button>
                  </div>
                </div>

                {/* Class Assignment */}
                <div>
                  <label className="block text-xs font-extrabold text-[#201e1d] mb-1">
                    Assign Student to Class <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={e => setStudentClass(e.target.value)}
                    placeholder="e.g. 6-A, 9-B, 11-A, 10-Science"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
                  />
                  {/* Quick Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-500 font-bold">Suggestions:</span>
                    {(studentLevel === 'Grade 6'
                      ? ['6-A', '6-B', '6-C', '6-D']
                      : studentLevel === 'Grade 9'
                      ? ['9-A', '9-B', '9-C', '9-D']
                      : ['10-A', '10-B', '11-A', '11-B', '12-A', '12-B']
                    ).map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setStudentClass(cls)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          studentClass === cls
                            ? 'bg-[#1f3d7a] text-white border-[#1f3d7a]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Access Rule Summary Box */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1">
                  <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Curriculum Access Enforcement:</span>
                  </div>
                  {studentLevel === 'Grade 6' && (
                    <div className="text-slate-600 leading-relaxed">
                      • <strong className="text-emerald-700">NAFS Grade 6:</strong> Authorized for Grade 6 reading literacy questions.<br />
                      • <strong className="text-red-600">Access Denied:</strong> SAT, GAT, and Grade 9 questions.
                    </div>
                  )}
                  {studentLevel === 'Grade 9' && (
                    <div className="text-slate-600 leading-relaxed">
                      • <strong className="text-teal-700">NAFS Grade 9:</strong> Authorized for Grade 9 reading literacy questions.<br />
                      • <strong className="text-red-600">Access Denied:</strong> SAT, GAT, and Grade 6 questions.
                    </div>
                  )}
                  {studentLevel === 'High School' && (
                    <div className="text-slate-600 leading-relaxed">
                      • <strong className="text-[#1e3a8a]">SAT &amp; GAT:</strong> Authorized for university admission prep.<br />
                      • <strong className="text-red-600">Access Denied:</strong> NAFS primary/middle assessments.
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === 'single' ? (
              <form onSubmit={handleCreateSingle} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#201e1d] mb-1">Full Student Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Sara Al-Qahtani"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-[#201e1d]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#201e1d] mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. sara.q"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-[#201e1d]"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">Leave blank to auto-suggest from name.</div>
                </div>

                <div>
                  <label className="block font-bold text-[#201e1d] mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. sara@school.edu"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-[#201e1d]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#201e1d] mb-1">Initial Password</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Leave blank to auto-generate"
                        className="w-full p-2.5 pr-8 bg-white border border-slate-300 rounded-lg font-mono text-xs text-[#201e1d]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-slate-500 hover:text-black cursor-pointer text-[10px] font-bold"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPassword(generatePassword())}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-[#201e1d] cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {formError && (
                  <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-900 font-bold">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between rounded-xl cursor-pointer shadow-md"
                >
                  <span>Create {role} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Default Grade Level & Class for Bulk Roster */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-extrabold text-[#201e1d] block">
                    Default Batch Settings (Applied to pasted names)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Grade Level</label>
                      <select
                        value={bulkDefaultLevel}
                        onChange={e => {
                          const lvl = e.target.value as StudentLevel;
                          setBulkDefaultLevel(lvl);
                          if (lvl === 'Grade 6') setBulkDefaultClass('6-A');
                          if (lvl === 'Grade 9') setBulkDefaultClass('9-A');
                          if (lvl === 'High School') setBulkDefaultClass('10-A');
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        <option value="Grade 6">Grade 6 (NAFS G6)</option>
                        <option value="Grade 9">Grade 9 (NAFS G9)</option>
                        <option value="High School">High School (SAT/GAT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Assigned Class</label>
                      <input
                        type="text"
                        value={bulkDefaultClass}
                        onChange={e => setBulkDefaultClass(e.target.value)}
                        placeholder="e.g. 6-A, 9-B"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#201e1d] mb-1">
                    Paste Student Roster (One per line)
                  </label>
                  <textarea
                    rows={6}
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder="Sara Al-Qahtani&#10;Omar Khalid, omar.k, Grade 9, 9-B&#10;Lina Haddad, lina.h, High School, 11-A"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-[#201e1d]"
                  />
                  <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Paste names directly from a spreadsheet. Tokens like Grade Level (Grade 6, Grade 9, High School) and Class (6-A, 9-B) will be auto-detected, or default to the batch settings above.
                  </div>
                </div>

                {bulkError && (
                  <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-900 font-bold">
                    {bulkError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCreateBulk}
                  className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between rounded-xl cursor-pointer shadow-md"
                >
                  <span>{bulkLinesCount ? `Create ${bulkLinesCount} Student Accounts` : 'Create Accounts'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Issued Handout Card */}
          {issuedList.length > 0 && (
            <div className="border-2 border-[#1f3d7a] p-4 bg-white rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-extrabold text-xs text-[#201e1d]">Sign-in Credentials Handout</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowIssuedPass(!showIssuedPass)}
                    className="text-xs text-[#1f3d7a] hover:underline cursor-pointer font-bold"
                  >
                    {showIssuedPass ? 'Hide passwords' : 'Show passwords'}
                  </button>
                  <button
                    onClick={() => setIssuedList([])}
                    className="text-xs text-slate-600 hover:text-black cursor-pointer font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-600">
                Student name, grade level, assigned class, username, and temporary password.
              </div>

              <div className="bg-[#f3f2f2] p-2.5 rounded-lg font-mono text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-[#201e1d]">
                {issuedList.map(item => (
                  `${item.name} (${item.level || 'Student'}${item.class ? ` · ${item.class}` : ''}) — @${item.username} / ${showIssuedPass ? item.pass : '••••••••'}`
                )).join('\n')}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyIssued}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-[#201e1d] cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy List'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-[#201e1d] cursor-pointer"
                >
                  Download CSV Handout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: User Roster & Class Management (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border-2 border-slate-300 p-5 rounded-2xl shadow-2xs space-y-4">
            {/* Header, Search & Filters */}
            <div className="space-y-3 border-b-2 border-slate-200 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#201e1d]">
                    Roster ({filteredAccounts.length} of {accounts.length})
                  </h3>
                  {/* Role filter buttons */}
                  <div className="inline-flex border border-slate-300 rounded-lg p-0.5 bg-slate-100 text-[10px] font-bold">
                    {(['All', 'Student', 'Teacher', 'Admin'] as const).map(rf => (
                      <button
                        key={rf}
                        type="button"
                        onClick={() => setRoleFilter(rf)}
                        className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                          roleFilter === rf ? 'bg-white text-[#1f3d7a] shadow-2xs font-black' : 'text-slate-600 hover:text-black'
                        }`}
                      >
                        {rf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search name, class, username..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
                  />
                </div>
              </div>

              {/* Secondary Student Filters: Grade Level & Class Filter */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500">Filter by Grade:</span>
                {(['All', 'Grade 6', 'Grade 9', 'High School'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      levelFilter === lvl
                        ? 'bg-[#1f3d7a] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}

                {availableClasses.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] font-bold text-slate-500">Class:</span>
                    <select
                      value={classFilter}
                      onChange={e => setClassFilter(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800"
                    >
                      <option value="All">All Classes</option>
                      {availableClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Accounts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold">
                    <th className="py-2.5 px-2">Student / Name</th>
                    <th className="py-2.5 px-2">Role</th>
                    <th className="py-2.5 px-2">Grade Level &amp; Access</th>
                    <th className="py-2.5 px-2">Class</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No accounts match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map(acc => {
                      const isCurrent = currentUser?.username === acc.username;
                      const isStudent = acc.role === 'Student';

                      return (
                        <tr key={acc.username} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-2">
                            <div className="font-bold text-[#201e1d]">{acc.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">@{acc.username}</div>
                            {acc.email && <div className="text-[10px] text-slate-400">{acc.email}</div>}
                          </td>

                          <td className="py-3 px-2">
                            {isCurrent ? (
                              <span className="font-bold text-[11px] text-[#1f3d7a] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {acc.role} (You)
                              </span>
                            ) : (
                              <select
                                value={acc.role}
                                onChange={e => onUpdateAccountRole?.(acc.username, e.target.value as UserRole)}
                                className="bg-white border border-slate-300 rounded text-[11px] font-bold text-[#1f3d7a] px-1.5 py-0.5 cursor-pointer focus:outline-none focus:border-[#1f3d7a]"
                                title="Change account role"
                              >
                                <option value="Student">Student</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Admin">Admin</option>
                              </select>
                            )}
                          </td>

                          <td className="py-3 px-2">
                            {isStudent ? (
                              <div className="space-y-1">
                                {acc.studentLevel === 'Grade 6' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <BookOpen className="w-3 h-3" />
                                    <span>Grade 6 (NAFS)</span>
                                  </span>
                                ) : acc.studentLevel === 'Grade 9' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-teal-100 text-teal-800 border border-teal-300">
                                    <BookOpen className="w-3 h-3" />
                                    <span>Grade 9 (NAFS)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                                    <Target className="w-3 h-3" />
                                    <span>High School (SAT/GAT)</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Full Access</span>
                            )}
                          </td>

                          <td className="py-3 px-2">
                            {isStudent ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[11px] font-black text-slate-800">
                                {acc.studentClass || 'Unassigned'}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isStudent && (
                                <button
                                  type="button"
                                  onClick={() => setEditingStudent({
                                    username: acc.username,
                                    name: acc.name,
                                    level: acc.studentLevel || 'Grade 6',
                                    class: acc.studentClass || '6-A'
                                  })}
                                  className="text-xs font-bold text-[#1f3d7a] hover:underline flex items-center gap-1 cursor-pointer"
                                  title="Change grade level or assigned class"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit Class</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleReset(acc)}
                                className="text-xs font-bold text-slate-600 hover:text-black hover:underline cursor-pointer"
                              >
                                Reset Pass
                              </button>

                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteTarget(acc)}
                                  className="text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer ml-1"
                                  title="Delete account"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Student Grade & Class Assignment Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1f3d7a] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Edit Student Grade &amp; Class
                </h3>
                <p className="text-xs text-slate-500">
                  {editingStudent.name} (@{editingStudent.username})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Grade Level (Determines Exam Access)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Grade 6', 'Grade 9', 'High School'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEditingStudent({ ...editingStudent, level: lvl })}
                      className={`py-2 px-2 rounded-xl border text-center font-black text-xs transition-all cursor-pointer ${
                        editingStudent.level === lvl
                          ? 'bg-[#1f3d7a] text-white border-[#1f3d7a] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {editingStudent.level === 'High School'
                    ? 'Granted SAT & GAT access. Access denied to NAFS.'
                    : `Granted NAFS (${editingStudent.level}) access. Access denied to SAT & GAT.`}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Assigned Class / Section
                </label>
                <input
                  type="text"
                  value={editingStudent.class}
                  onChange={e => setEditingStudent({ ...editingStudent, class: e.target.value })}
                  placeholder="e.g. 6-A, 6-B, 9-A, 11-A"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-bold">Quick set:</span>
                  {(editingStudent.level === 'Grade 6'
                    ? ['6-A', '6-B', '6-C']
                    : editingStudent.level === 'Grade 9'
                    ? ['9-A', '9-B', '9-C']
                    : ['10-A', '11-A', '12-A']
                  ).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingStudent({ ...editingStudent, class: c })}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 hover:bg-slate-200"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStudentInfo?.(
                    editingStudent.username,
                    editingStudent.level,
                    editingStudent.class
                  );
                  setEditingStudent(null);
                }}
                className="px-5 py-2 bg-[#1f3d7a] hover:bg-[#162c68] text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Safety Modal */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 text-red-700 border-2 border-red-200 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Confirm Account Removal
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">@{confirmDeleteTarget.username} ({confirmDeleteTarget.name})</strong>?
              This will permanently revoke access and remove the user from Cloud Firestore and the safety vault.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTarget(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel &amp; Keep
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAccount(confirmDeleteTarget.username);
                  setConfirmDeleteTarget(null);
                }}
                className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
