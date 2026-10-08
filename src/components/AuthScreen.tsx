import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, ExamType, AppSettings } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import { ArrowRight, UserPlus, LogIn, Check, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: (username: string, password: string) => Promise<boolean>;
  onCreateAccount: (account: UserAccount, targetExams: ExamType[]) => Promise<boolean>;
  accounts: UserAccount[];
  settings?: AppSettings;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  onCreateAccount,
  accounts,
  settings
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [name, setName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [selectedExams, setSelectedExams] = useState<ExamType[]>(['NAFS', 'GAT', 'SAT']);
  const [newRole, setNewRole] = useState<'Student' | 'Teacher' | 'Admin'>('Student');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Resolved branding settings
  const logo = settings?.logoUrl || AHS_LOGO_SRC;
  const loginTitle = settings?.loginTitle || 'AHS Exams Prepline';
  const loginHeadline = settings?.loginHeadline || 'GAT and SAT practice, in one place.';
  const loginDescription =
    settings?.loginDescription ||
    'Timed mock exams, an authentic question bank built from recent test reports, and targeted feedback on the skills that move your score.';
  const footnotes = settings?.loginFootnotes || [
    { title: 'GAT', subtitle: 'Verbal · Quant' },
    { title: 'SAT', subtitle: 'R&W · Math' },
    { title: 'Feedback', subtitle: 'By skill' }
  ];

  // Constellation network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let nodes: Array<{ x: number; y: number; vx: number; vy: number; ph: number }> = [];

    const initNodes = (w: number, h: number) => {
      const count = Math.max(24, Math.min(80, Math.round((w * h) / 8000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        ph: Math.random() * 6.28
      }));
    };

    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const c = canvasRef.current;
      if (!c) return;

      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const W = Math.round(rect.width * dpr);
      const H = Math.round(rect.height * dpr);
      if (!W || !H) return;

      if (c.width !== W || c.height !== H) {
        c.width = W;
        c.height = H;
        initNodes(rect.width, rect.height);
      }

      const ctx = c.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const maxDist = 140;

      nodes.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > rect.width) p.vx *= -1;
        if (p.y < 0 || p.y > rect.height) p.vy *= -1;
      });

      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            const pulse = 0.5 + 0.5 * Math.sin(t / 1400 + nodes[i].ph);
            const alpha = (1 - dist / maxDist) * (0.15 + 0.3 * pulse);
            ctx.strokeStyle = `rgba(160, 190, 255, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(p => {
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 900 + p.ph));
        ctx.shadowBlur = 14 * pulse;
        ctx.shadowColor = 'rgba(150, 185, 255, 0.95)';
        ctx.fillStyle = `rgba(210, 225, 255, ${pulse.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + 1.4 * pulse, 0, 6.283);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const suggestUsername = (fullName: string) => {
    const parts = fullName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].slice(0, 10);
    return `${parts[0]}.${parts[parts.length - 1][0]}`;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!newUsername || newUsername === suggestUsername(name)) {
      setNewUsername(suggestUsername(val));
    }
  };

  const toggleExam = (exam: ExamType) => {
    setSelectedExams(prev =>
      prev.includes(exam)
        ? prev.length > 1
          ? prev.filter(e => e !== exam)
          : prev
        : [...prev, exam]
    );
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim()) {
      setError('Please enter your username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setBusy(true);
    const ok = await onSignIn(login.trim(), password);
    setBusy(false);
    if (!ok) {
      setError('Username or password is incorrect. Please check your credentials and try again.');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const cleanUser = newUsername.trim().toLowerCase();
    if (!cleanUser) {
      setError('Please enter a username.');
      return;
    }
    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (accounts.some(a => a.username.toLowerCase() === cleanUser)) {
      setError(`Username @${cleanUser} is already taken. Please choose another.`);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError('');
    setBusy(true);

    const newAccount: UserAccount = {
      name: name.trim(),
      username: cleanUser,
      email: email.trim() || undefined,
      role: newRole,
      password: newPassword,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    const success = await onCreateAccount(newAccount, selectedExams);
    setBusy(false);
    if (!success) {
      setError('Could not create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f3f2f2]">
      {/* Left Brand Showcase Panel */}
      <div className="relative overflow-hidden md:w-1/2 lg:w-7/12 min-h-[420px] md:min-h-screen bg-gradient-to-br from-[#0a1730] via-[#1f3d7a] to-[#3d63ad] text-[#f3f2f2] p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
        <div
          className="absolute -left-36 -bottom-48 w-[560px] h-[560px] pointer-events-none rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(110,150,255,.6), rgba(60,100,200,.18) 55%, rgba(30,60,140,0) 100%)',
            animation: 'ahsGlow 7s ease-in-out 0s infinite'
          }}
        />
        <div
          className="absolute -right-36 -top-36 w-[460px] h-[460px] pointer-events-none rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(110,150,255,.6), rgba(60,100,200,.18) 55%, rgba(30,60,140,0) 100%)',
            animation: 'ahsGlow 7s ease-in-out -3.5s infinite'
          }}
        />

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Header with Dynamic Custom Logo & Title */}
        <div className="relative z-10 flex items-center gap-4 text-xl font-extrabold tracking-tight">
          <img
            src={logo}
            alt="School Logo"
            className="h-16 w-auto max-w-[140px] object-contain filter drop-shadow-md"
          />
          <span className="text-white text-2xl font-black tracking-tight">{loginTitle}</span>
        </div>

        {/* Hero Title & Pitch */}
        <div className="relative z-10 my-10 max-w-xl space-y-4">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-blue-300 border border-blue-400/30 px-3 py-1 bg-blue-900/30">
            Official Exam Prep
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white text-balance">
            {loginHeadline}
          </h1>
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-lg font-normal">
            {loginDescription}
          </p>
        </div>

        {/* Footer Highlights */}
        <div className="relative z-10 grid grid-cols-3 border-t-2 border-white/60 pt-4 gap-4 text-xs sm:text-sm text-slate-200">
          {footnotes.map((fn, i) => (
            <div key={i}>
              <span className="text-slate-400 block text-xs">{fn.title}</span>
              <span className="font-extrabold text-white text-sm">{fn.subtitle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel: Sign In or Create Account */}
      <div className="md:w-1/2 lg:w-5/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#f3f2f2]">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b-2 border-[#201e1d]/30 gap-6 pb-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError('');
              }}
              className={`text-lg font-black pb-2 border-b-2 -mb-2.5 transition-colors cursor-pointer flex items-center gap-2 ${
                authMode === 'signin'
                  ? 'text-[#1f3d7a] border-[#1f3d7a]'
                  : 'text-slate-500 border-transparent hover:text-[#201e1d]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError('');
              }}
              className={`text-lg font-black pb-2 border-b-2 -mb-2.5 transition-colors cursor-pointer flex items-center gap-2 ${
                authMode === 'signup'
                  ? 'text-[#1f3d7a] border-[#1f3d7a]'
                  : 'text-slate-500 border-transparent hover:text-[#201e1d]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create account</span>
            </button>
          </div>

          {/* SIGN IN FORM (With masked inputs and eye toggle) */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full px-3.5 py-2.5 bg-[#eae9e9] border border-slate-300 rounded-none text-sm text-[#201e1d] focus:outline-none focus:border-[#1f3d7a] focus:ring-1 focus:ring-[#1f3d7a]"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#eae9e9] border border-slate-300 rounded-none text-sm text-[#201e1d] focus:outline-none focus:border-[#1f3d7a] focus:ring-1 focus:ring-[#1f3d7a]"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-800"
                    title={showSignInPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-900 text-xs font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full py-3 px-4 text-white text-sm font-extrabold flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <span>{busy ? 'Signing in…' : 'Sign in'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* CREATE ACCOUNT FORM (With masked inputs and eye toggle) */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Faisal Al-Harbi"
                  className="w-full px-3 py-2 bg-[#eae9e9] border border-slate-300 text-sm text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="faisal.h"
                    className="w-full px-3 py-2 bg-[#eae9e9] border border-slate-300 text-sm font-mono text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as 'Student' | 'Teacher' | 'Admin')}
                    className="w-full px-3 py-2 bg-[#eae9e9] border border-slate-300 text-sm font-bold text-[#201e1d]"
                  >
                    <option value="Student">Student (Student View)</option>
                    <option value="Teacher">Teacher (Teacher View)</option>
                    <option value="Admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="faisal@school.edu"
                  className="w-full px-3 py-2 bg-[#eae9e9] border border-slate-300 text-sm text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 pr-8 bg-[#eae9e9] border border-slate-300 text-sm text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-2 top-2.5 text-slate-500"
                    >
                      {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 bg-[#eae9e9] border border-slate-300 text-sm text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
                  />
                </div>
              </div>

              {/* Target Exams Toggle */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Which exams are you preparing for?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NAFS', 'GAT', 'SAT'] as ExamType[]).map(e => {
                    const sel = selectedExams.includes(e);
                    return (
                      <button
                        key={e}
                        type="button"
                        onClick={() => toggleExam(e)}
                        className={`py-2 px-2 sm:px-3 border-2 font-black text-xs flex items-center justify-between cursor-pointer ${
                          sel
                            ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white'
                            : 'border-slate-300 bg-white text-[#201e1d]'
                        }`}
                      >
                        <span>{e}</span>
                        {sel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-900 font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full py-3 px-4 text-white text-xs font-black flex items-center justify-between cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{busy ? 'Creating account…' : 'Create account & get started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-300 text-xs text-slate-600 leading-relaxed">
            {authMode === 'signin' ? (
              <span>
                Need a new student account? Click{' '}
                <strong
                  className="cursor-pointer text-[#1f3d7a] underline"
                  onClick={() => setAuthMode('signup')}
                >
                  Create account
                </strong>{' '}
                above to register in seconds.
              </span>
            ) : (
              <span>
                Already have credentials? Click{' '}
                <strong
                  className="cursor-pointer text-[#1f3d7a] underline"
                  onClick={() => setAuthMode('signin')}
                >
                  Sign in
                </strong>{' '}
                above to access your tests.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
