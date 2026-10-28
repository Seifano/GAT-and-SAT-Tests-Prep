import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, AppSettings } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import { ArrowRight, LogIn, Eye, EyeOff, ShieldCheck, CheckCircle2, Lock, School } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: (username: string, password: string) => Promise<boolean>;
  accounts: UserAccount[];
  settings?: AppSettings;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  accounts,
  settings
}) => {
  // Sign In state
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Resolved branding settings
  const logo = settings?.logoUrl || AHS_LOGO_SRC;
  const loginTitle = settings?.appName || "Adhwa'a Al-Hedaya International Schools";
  const loginHeadline = settings?.loginHeadline || 'Excellence in Digital SAT, GAT (Qudurat), and NAFS.';
  const loginDescription =
    settings?.loginDescription ||
    "Official institutional examination assessment and preparation portal for scholars of Adhwa'a Al-Hedaya International Schools (مدارس أضواء الهداية العالمية) in Riyadh, Saudi Arabia.";
  const footnotes = settings?.loginFootnotes || [
    { title: 'Digital SAT', subtitle: 'Math & Reading/Writing' },
    { title: 'GAT (Qudurat)', subtitle: 'Verbal & Quantitative' },
    { title: 'NAFS Assessment', subtitle: 'Grade 6 & Grade 9' }
  ];

  // Constellation network animation on left panel
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
        if (p.x < 0) p.x = rect.width;
        if (p.x > rect.width) p.x = 0;
        if (p.y < 0) p.y = rect.height;
        if (p.y > rect.height) p.y = 0;
      });

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.35;
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      const now = t * 0.002;
      nodes.forEach(p => {
        const pulse = 0.5 + 0.5 * Math.sin(now + p.ph);
        const radius = 1.6 + 1.2 * pulse;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + 0.45 * pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim()) {
      setError('Please enter your school username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const ok = await onSignIn(login.trim(), password);
      if (!ok) {
        setError('Incorrect username or password. Please verify your credentials or contact the school administration.');
      }
    } catch (err) {
      setError('Sign-in failed. Please verify credentials or contact administration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Left Branding / Atmosphere Panel */}
      <div className="relative md:w-1/2 lg:w-7/12 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden border-b md:border-b-0 md:border-r border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3.5">
            <img
              src={logo}
              alt="Adhwa'a Al-Hedaya Logo"
              className="h-14 sm:h-16 w-auto object-contain drop-shadow-md"
            />
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white block">
                {loginTitle}
              </span>
              <span className="text-xs font-bold text-sky-400 tracking-wide font-sans block mt-0.5" dir="rtl">
                مدارس أضواء الهداية العالمية · الرياض
              </span>
            </div>
          </div>

          <div className="max-w-xl space-y-4 pt-4 sm:pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-sky-300 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-500/40 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Official Testing Portal
              </span>
              <span className="text-[11px] font-bold text-slate-400 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                Riyadh Campus
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {loginHeadline}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              {loginDescription}
            </p>
          </div>
        </div>

        {/* Footnote tracks banner */}
        <div className="relative z-10 pt-8 sm:pt-12 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg">
          {footnotes.map((fn, i) => (
            <div key={i}>
              <span className="text-slate-400 block text-xs font-semibold">{fn.title}</span>
              <span className="font-extrabold text-white text-sm">{fn.subtitle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel: Pure Institutional Dignified Login */}
      <div className="md:w-1/2 lg:w-5/12 p-6 sm:p-10 lg:p-14 flex flex-col justify-center bg-slate-50">
        <div className="w-full max-w-md mx-auto space-y-6">
          
          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-sm border border-slate-200/90 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700">
                  <LogIn className="w-4 h-4" />
                  <span>Portal Sign In</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  <School className="w-3 h-3 text-indigo-600" />
                  <span>AHIS Portal</span>
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Academic Access Portal
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter your school-assigned credentials to access your testing syllabus, mock exams, and analytics.
              </p>
            </div>

            {/* Institutional Security Notice */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-2 font-black text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>Authorized Scholar &amp; Faculty Access</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Accounts are provisioned directly by Adhwa'a Al-Hedaya Administration. For account inquiries or credentials recovery, please contact your grade supervisor.
              </p>
            </div>

            {/* Clean Sign In Form */}
            <form onSubmit={handleSignInSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  School Username or Email
                </label>
                <input
                  type="text"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="Enter your assigned username"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all shadow-2xs"
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Case-sensitive</span>
                </div>
                <div className="relative">
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all shadow-2xs"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                    title={showSignInPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full py-3.5 px-4 text-white text-sm font-black rounded-2xl shadow-sm flex items-center justify-between cursor-pointer disabled:opacity-50 transition-all hover:shadow-md"
              >
                <span>{busy ? 'Authenticating Credentials…' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Institutional Seal */}
            <div className="pt-2 text-center border-t border-slate-100 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Adhwa'a Al-Hedaya Institutional Security</span>
              </div>
              <p className="text-[10px] text-slate-400">
                مدارس أضواء الهداية العالمية · Riyadh, Kingdom of Saudi Arabia
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
