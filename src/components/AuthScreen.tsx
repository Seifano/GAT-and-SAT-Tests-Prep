import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, AppSettings } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import { ArrowRight, LogIn, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
      setError('Please enter your username or email.');
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
        setError('Incorrect username or password. Please verify your credentials or contact the school administrator.');
      }
    } catch (err) {
      setError('Sign-in failed. Please check your credentials or contact administrator.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#111c38] text-slate-100 font-sans selection:bg-[#1f3d7a] selection:text-white">
      {/* Left Branding / Atmosphere Panel */}
      <div className="relative md:w-1/2 lg:w-7/12 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden border-b md:border-b-0 md:border-r border-slate-700/60">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="AHS Logo"
              className="h-12 w-auto object-contain drop-shadow-md"
            />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {loginTitle}
            </span>
          </div>

          <div className="max-w-xl space-y-4 pt-4 sm:pt-8">
            <span className="inline-block text-xs font-black tracking-widest uppercase text-sky-400 bg-sky-950/70 px-3 py-1 border border-sky-600/50">
              Official Assessment Portal
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {loginHeadline}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              {loginDescription}
            </p>
          </div>
        </div>

        {/* Footnote stats / features */}
        <div className="relative z-10 pt-8 sm:pt-12 grid grid-cols-3 gap-4 border-t border-slate-700/60 max-w-lg">
          {footnotes.map((fn, i) => (
            <div key={i}>
              <span className="text-slate-400 block text-xs font-semibold">{fn.title}</span>
              <span className="font-extrabold text-white text-sm">{fn.subtitle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel: Secure Sign In */}
      <div className="md:w-1/2 lg:w-5/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#f3f2f2]">
        <div className="w-full max-w-md mx-auto space-y-6">
          
          {/* Header */}
          <div className="border-b-2 border-[#201e1d]/30 pb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1e3a8a] mb-1">
              <LogIn className="w-4 h-4" />
              <span>Portal Access</span>
            </div>
            <h2 className="text-2xl font-black text-[#201e1d] tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Enter your school-issued credentials to access your exam tracks and practice sessions.
            </p>
          </div>

          {/* Institutional Policy Notice: Admin-Only Account Creation */}
          <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 font-black text-[#1e3a8a]">
              <ShieldAlert className="w-4 h-4 text-[#1e3a8a] shrink-0" />
              <span>Institutional Policy: Administrator Provisioned</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Student and teacher accounts are created, approved, and managed directly by the School Administrator. Direct email self-registration is disabled.
            </p>
          </div>

          {/* SIGN IN FORM */}
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="e.g. sara.q, abdullah.a, Admin"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-[#201e1d] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
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
                  className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-sm text-[#201e1d] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
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
              <div className="p-3 bg-red-100 border border-red-300 text-red-900 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 px-4 bg-[#1e3a8a] hover:bg-[#162c68] text-white text-sm font-extrabold rounded-xl shadow-xs flex items-center justify-between cursor-pointer disabled:opacity-50 transition-colors"
            >
              <span>{busy ? 'Verifying Credentials…' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure Institutional Access Notice */}
          <div className="pt-4 border-t border-slate-200 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Encrypted Institutional Authentication</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              Passwords are fully protected and never revealed publicly. Please contact your school grade supervisor or IT administrator if you require your login card or password reset.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
