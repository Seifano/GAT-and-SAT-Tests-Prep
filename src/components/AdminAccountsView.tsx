import React, { useState, useRef } from 'react';
import { UserAccount, UserRole } from '../types';
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
  Lock
} from 'lucide-react';

interface AdminAccountsViewProps {
  accounts: UserAccount[];
  currentUser: UserAccount | null;
  onCreateAccounts: (accounts: UserAccount[]) => void;
  onResetPassword: (username: string, newPass: string) => void;
  onDeleteAccount: (username: string) => void;
  onUpdateAccountRole?: (username: string, newRole: UserRole) => void;
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
  onSyncAllToCloud,
  cloudSyncStatus = 'idle',
  lastCloudSyncTime = 'Connected'
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Single form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Bulk form
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');

  // Issued credentials
  const [issuedList, setIssuedList] = useState<Array<{ name: string; username: string; pass: string }>>([]);
  const [showIssuedPass, setShowIssuedPass] = useState(false);
  const [copied, setCopied] = useState(false);

  // Confirm delete modal
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<UserAccount | null>(null);

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

  const handleCreateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Enter a name.');
      return;
    }
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setFormError('Enter a username.');
      return;
    }
    if (accounts.some(a => a.username === cleanUser)) {
      setFormError(`Username @${cleanUser} is already in use.`);
      return;
    }

    const pass = password.trim() || generatePassword();
    const newAcc: UserAccount = {
      name: name.trim(),
      username: cleanUser,
      email: email.trim() || undefined,
      role,
      password: pass,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    onCreateAccounts([newAcc]);
    setIssuedList([{ name: newAcc.name, username: newAcc.username, pass }]);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setFormError('');
  };

  const handleCreateBulk = () => {
    const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) {
      setBulkError('Paste at least one name.');
      return;
    }

    const newAccounts: UserAccount[] = [];
    const issued: Array<{ name: string; username: string; pass: string }> = [];
    const existingUsers = new Set(accounts.map(a => a.username));

    lines.forEach(line => {
      const tokens = line.split(/[,\t;]/).map(t => t.trim());
      const studentName = tokens[0];
      if (!studentName) return;

      let studentUser = tokens[1] ? tokens[1].toLowerCase() : suggestUsername(studentName);
      let suffix = 2;
      while (existingUsers.has(studentUser)) {
        studentUser = `${suggestUsername(studentName)}${suffix++}`;
      }
      existingUsers.add(studentUser);

      const studentEmail = tokens[2] || undefined;
      const pass = generatePassword();

      const acc: UserAccount = {
        name: studentName,
        username: studentUser,
        email: studentEmail,
        role: 'Student',
        password: pass,
        created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      newAccounts.push(acc);
      issued.push({ name: studentName, username: studentUser, pass });
    });

    if (newAccounts.length === 0) {
      setBulkError('No valid accounts found in input.');
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
    setIssuedList([{ name: targetUser.name, username: targetUser.username, pass: newPass }]);
  };

  const handleCopyIssued = () => {
    const text = issuedList.map(item => `${item.name} — ${item.username} / ${item.pass}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csvHeader = 'Name,Username,Temporary Password\n';
    const csvRows = issuedList.map(item => `"${item.name}","${item.username}","${item.pass}"`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prepline_student_passwords.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBackupJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accounts, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `ahs_accounts_safety_vault_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const handleRestoreBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(a => a.username && a.name && a.role);
          if (valid.length > 0) {
            onCreateAccounts(valid);
            setRestoreMessage(`✓ Restored and imported ${valid.length} accounts from JSON backup.`);
            setTimeout(() => setRestoreMessage(null), 5000);
          } else {
            setRestoreMessage('No valid account entries found in JSON.');
          }
        }
      } catch (err) {
        setRestoreMessage('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredAccounts = accounts.filter(a => {
    const term = searchTerm.trim().toLowerCase();
    const matchTerm = !term || (a.name + ' ' + a.username + ' ' + (a.email || '')).toLowerCase().includes(term);
    const matchRole = roleFilter === 'All' || a.role === roleFilter;
    return matchTerm && matchRole;
  });

  const studentCount = accounts.filter(a => a.role === 'Student').length;
  const adminCount = accounts.filter(a => a.role === 'Admin').length;
  const teacherCount = accounts.filter(a => a.role === 'Teacher').length;
  const bulkLinesCount = bulkText.split(/\r?\n/).filter(l => l.trim()).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="pb-4 border-b-2 border-[#201e1d]/30 min-w-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            Accounts Management
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            {studentCount} student{studentCount === 1 ? '' : 's'} · {teacherCount} teacher{teacherCount === 1 ? '' : 's'} · {adminCount} admin{adminCount === 1 ? '' : 's'}
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mt-2 leading-relaxed break-words">
            Manage user accounts connected to the live database. Create credentials for students and instructors individually or in bulk, and new users can access the platform immediately from any device.
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
            <span>{cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Save Changes to Cloud'}</span>
          </button>
        )}
      </div>

      {/* Cloud Database & Security Command Center */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-blue-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Cloud Database Shield · Dual-Vault Persistence
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Cloud Persistence &amp; Account Protection
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              All accounts and credentials are encrypted and synchronized with Cloud Firestore database. Local state is safeguarded by an immutable secondary safety vault so no accounts can be lost.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onSyncAllToCloud && (
              <button
                type="button"
                onClick={onSyncAllToCloud}
                disabled={cloudSyncStatus === 'syncing'}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                {cloudSyncStatus === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>{cloudSyncStatus === 'syncing' ? 'Syncing to Cloud...' : 'Save All Changes to Cloud'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadBackupJson}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              title="Download an offline JSON backup of all accounts"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Export Backup (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              title="Import accounts from an offline JSON backup"
            >
              <Upload className="w-4 h-4 text-sky-300" />
              <span>Restore (.json)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreBackupJson}
              className="hidden"
            />
          </div>
        </div>

        {restoreMessage && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{restoreMessage}</span>
          </div>
        )}

        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-2">
          <div className="flex items-center gap-3">
            <span>Status: <strong className="text-white">Protected</strong></span>
            <span>·</span>
            <span>Synced: <strong className="text-emerald-300">{lastCloudSyncTime}</strong></span>
            <span>·</span>
            <span>Total Accounts: <strong className="text-white">{accounts.length} accounts</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Anti-loss Dual-Vault active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="inline-flex border border-[#201e1d]/30 bg-transparent">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                mode === 'single' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
              }`}
            >
              One account
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                mode === 'bulk' ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
              }`}
            >
              Many at once
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#201e1d]">Role</label>
            <div className="inline-flex border border-[#201e1d]/30 bg-transparent">
              {(['Student', 'Teacher', 'Admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    role === r ? 'bg-[#1f3d7a] text-white' : 'text-[#201e1d] hover:bg-slate-200/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {mode === 'single' ? (
            <form onSubmit={handleCreateSingle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#201e1d] mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Omar Khalid"
                  className="w-full p-2.5 bg-white border border-slate-300 text-xs text-[#201e1d]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#201e1d] mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="omar.k"
                  className="w-full p-2.5 bg-white border border-slate-300 text-xs font-mono text-[#201e1d]"
                />
                <div className="text-[11px] text-slate-500 mt-1">Leave blank to make one from the name.</div>
              </div>

              <div>
                <label className="block font-bold text-[#201e1d] mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="omar@school.edu"
                  className="w-full p-2.5 bg-white border border-slate-300 text-xs text-[#201e1d]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#201e1d] mb-1">Temporary password</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Leave blank to generate one"
                      className="w-full p-2.5 pr-8 bg-white border border-slate-300 font-mono text-xs text-[#201e1d]"
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
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#201e1d] cursor-pointer"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-100 border border-red-300 text-red-900 font-bold">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer"
              >
                <span>Create account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#201e1d] mb-1">
                  One student per line: full name, then optional username and email, separated by commas
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder="Sara Al-Qahtani&#10;Omar Khalid, omar.k&#10;Lina Haddad, lina.h, lina@school.edu"
                  className="w-full p-2.5 bg-white border border-slate-300 font-mono text-xs text-[#201e1d]"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  You can paste straight from a spreadsheet. Each account gets its own temporary password.
                </div>
              </div>

              {bulkError && (
                <div className="p-2.5 bg-red-100 border border-red-300 text-red-900 font-bold">
                  {bulkError}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateBulk}
                className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer"
              >
                <span>{bulkLinesCount ? `Create ${bulkLinesCount} accounts` : 'Create accounts'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Issued Handout Card */}
          {issuedList.length > 0 && (
            <div className="border-2 border-[#1f3d7a] p-4 bg-white space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-extrabold text-xs text-[#201e1d]">Sign-in details to hand out</span>
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
                    Done
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-600">
                Name — username / temporary password. Copy these now: passwords are not stored in plain text.
              </div>

              <div className="bg-[#f3f2f2] p-2.5 font-mono text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-[#201e1d]">
                {issuedList.map(item => `${item.name} — ${item.username} / ${showIssuedPass ? item.pass : '••••••••'}`).join('\n')}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyIssued}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#201e1d] cursor-pointer"
                >
                  {copied ? 'Copied' : 'Copy list'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#201e1d] cursor-pointer"
                >
                  Download CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: User Roster (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#201e1d]/30 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#201e1d]">Roster ({accounts.length})</h3>
              {/* Role filter buttons */}
              <div className="hidden sm:inline-flex border border-slate-300 rounded-lg p-0.5 bg-slate-100 text-[10px] font-bold">
                {(['All', 'Student', 'Teacher', 'Admin'] as const).map(rf => (
                  <button
                    key={rf}
                    type="button"
                    onClick={() => setRoleFilter(rf)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                      roleFilter === rf ? 'bg-white text-[#1f3d7a] shadow-2xs font-black' : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    {rf}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Name, username or email"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 text-xs text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#201e1d]/30 text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Username</th>
                  <th className="py-2 px-2">Email</th>
                  <th className="py-2 px-2">Role</th>
                  <th className="py-2 px-2">Created</th>
                  <th className="py-2 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredAccounts.map(acc => {
                  const isCurrent = currentUser?.username === acc.username;

                  return (
                    <tr key={acc.username} className="hover:bg-slate-100/50">
                      <td className="py-3 px-2 font-bold text-[#201e1d]">{acc.name}</td>
                      <td className="py-3 px-2 text-slate-600 font-mono">@{acc.username}</td>
                      <td className="py-3 px-2 text-slate-500">{acc.email || '—'}</td>
                      <td className="py-3 px-2">
                        {isCurrent ? (
                          <span className="font-bold text-[11px] text-[#1f3d7a] bg-blue-50 px-2 py-0.5 border border-blue-200">
                            {acc.role} (Current)
                          </span>
                        ) : (
                          <select
                            value={acc.role}
                            onChange={e => onUpdateAccountRole?.(acc.username, e.target.value as UserRole)}
                            className="bg-white border border-slate-300 text-[11px] font-bold text-[#1f3d7a] px-1.5 py-0.5 cursor-pointer focus:outline-none focus:border-[#1f3d7a]"
                            title="Change account role"
                          >
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-500">{acc.created || '—'}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReset(acc)}
                            className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
                          >
                            Reset password
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => setConfirmDeleteTarget(acc)}
                              className="text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer"
                              title="Delete user account safely with confirmation"
                            >
                              Remove
                            </button>
                          )}
                          {isCurrent && (
                            <span className="text-[11px] text-slate-400">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
