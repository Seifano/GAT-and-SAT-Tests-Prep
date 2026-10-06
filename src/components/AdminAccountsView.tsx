import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Search, X, Check, ArrowRight } from 'lucide-react';

interface AdminAccountsViewProps {
  accounts: UserAccount[];
  currentUser: UserAccount | null;
  onCreateAccounts: (accounts: UserAccount[]) => void;
  onResetPassword: (username: string, newPass: string) => void;
  onDeleteAccount: (username: string) => void;
}

export const AdminAccountsView: React.FC<AdminAccountsViewProps> = ({
  accounts,
  currentUser,
  onCreateAccounts,
  onResetPassword,
  onDeleteAccount
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [searchTerm, setSearchTerm] = useState('');

  // Single form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Student' | 'Admin'>('Student');
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

  // Confirm delete
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

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

  const filteredAccounts = accounts.filter(a => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (a.name + ' ' + a.username + ' ' + (a.email || '')).toLowerCase().includes(term);
  });

  const studentCount = accounts.filter(a => a.role === 'Student').length;
  const adminCount = accounts.filter(a => a.role === 'Admin').length;
  const bulkLinesCount = bulkText.split(/\r?\n/).filter(l => l.trim()).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="pb-4 border-b-2 border-[#201e1d]/30">
        <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
          Accounts
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201e1d] tracking-tight">
          {studentCount} student{studentCount === 1 ? '' : 's'} · {adminCount} admin{adminCount === 1 ? '' : 's'}
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mt-2 leading-relaxed">
          Students can't sign themselves up. Create their accounts here, then hand out the username and temporary password.
        </p>
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
              {(['Student', 'Admin'] as const).map(r => (
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
            <h3 className="text-base font-extrabold text-[#201e1d]">Roster ({accounts.length})</h3>

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
                  const isConfirming = confirmDeleteUser === acc.username;

                  return (
                    <tr key={acc.username} className="hover:bg-slate-100/50">
                      <td className="py-3 px-2 font-bold text-[#201e1d]">{acc.name}</td>
                      <td className="py-3 px-2 text-slate-600 font-mono">@{acc.username}</td>
                      <td className="py-3 px-2 text-slate-500">{acc.email || '—'}</td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-[11px] text-[#1f3d7a]">
                          {acc.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-500">{acc.created || '—'}</td>
                      <td className="py-3 px-2 text-right">
                        {isConfirming ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                onDeleteAccount(acc.username);
                                setConfirmDeleteUser(null);
                              }}
                              className="px-2 py-1 bg-[#e15b47] text-white text-xs font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => setConfirmDeleteUser(null)}
                              className="px-2 py-1 bg-slate-200 text-[#201e1d] text-xs font-bold cursor-pointer"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleReset(acc)}
                              className="text-xs font-bold text-[#1f3d7a] hover:underline cursor-pointer"
                            >
                              Reset password
                            </button>
                            {!isCurrent && (
                              <button
                                onClick={() => setConfirmDeleteUser(acc.username)}
                                className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                            {isCurrent && (
                              <span className="text-[11px] text-slate-400">You</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
