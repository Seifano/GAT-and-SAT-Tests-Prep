import React, { useState } from 'react';
import { ExamType, UserAccount } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import {
  Flame,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Menu,
  X,
  TrendingUp,
  Database,
  BarChart2,
  Trophy
} from 'lucide-react';

interface HeaderProps {
  currentScreen: string;
  activeExam: ExamType;
  user: UserAccount | null;
  streak: number;
  onNavigate: (screen: string) => void;
  onSelectExam: (exam: ExamType) => void;
  onSignOut: () => void;
  onSwitchRole: () => void;
  settings?: import('../types').AppSettings;
  xp?: number;
  level?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  activeExam,
  user,
  streak,
  onNavigate,
  onSelectExam,
  onSignOut,
  onSwitchRole,
  settings,
  xp,
  level
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const isStaff = isAdmin || isTeacher;
  const isExamScreen = currentScreen === 'exam';

  if (isExamScreen) {
    return null;
  }

  const studentNav = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'skills', label: 'Skill Matrix' },
    { id: 'practice', label: 'Practice Sets' },
    { id: 'browser', label: 'Item Bank' },
    { id: 'results', label: 'Reports' }
  ];

  const teacherNav = [
    { id: 'studentProgress', label: 'Student Progress' },
    { id: 'adminQuestions', label: 'Questions' },
    { id: 'adminImport', label: 'Import' },
    { id: 'browser', label: 'Library' },
    { id: 'dashboard', label: 'Student View' }
  ];

  const adminNav = [
    { id: 'studentProgress', label: 'Student Progress' },
    { id: 'adminQuestions', label: 'Questions' },
    { id: 'adminImport', label: 'Import' },
    { id: 'adminAccounts', label: 'Accounts' },
    { id: 'adminBranding', label: 'Logo & Branding' },
    { id: 'browser', label: 'Library' },
    { id: 'dashboard', label: 'Student View' }
  ];

  const navLinks = isAdmin ? adminNav : isTeacher ? teacherNav : studentNav;

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#f3f2f2]/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      {/* School Tri-Color Heritage Accent Stripe: Crimson Red · Navy Blue · Green */}
      <div className="h-1 w-full bg-gradient-to-r from-red-800 via-[#1e3a8a] to-emerald-700" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Wordmark & Emblem */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavClick(isAdmin ? 'adminQuestions' : 'dashboard')}
              className="flex items-center gap-3 text-left cursor-pointer group transition-transform duration-200 hover:scale-[1.01]"
            >
              <img
                src={settings?.logoUrl || AHS_LOGO_SRC}
                alt="Logo"
                className="h-10 w-auto max-w-[110px] object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <div>
                <span className="text-lg font-black tracking-tight text-[#201e1d] block leading-none">
                  {settings?.appName || 'AHS Exams Prepline'}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a]">
                    {isAdmin ? 'Admin Console' : isTeacher ? 'Teacher Portal' : 'High-Stakes Prep'}
                  </span>
                  {/* School Tri-Color Heritage Pill */}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white ring-1 ring-gray-200 text-gray-700 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-700" title="Crimson Red" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" title="Navy Blue" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="Green" />
                    <span className="text-[9px] font-extrabold text-gray-600">AHS</span>
                  </span>
                </div>
              </div>
            </button>

            {/* Desktop 3D Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1.5 ml-3 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
              {navLinks.map(link => {
                const isActive = currentScreen === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`text-xs font-black uppercase tracking-wider transition-all duration-200 ease-out cursor-pointer px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-[#1e3a8a] shadow-[0_3px_0_0_#1e3a8a,0_4px_8px_-1px_rgba(30,58,138,0.22)] -translate-y-0.5 border-t border-x border-white ring-1 ring-slate-900/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                    }`}
                  >
                    {link.id === 'achievements' && (
                      <Trophy className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500 fill-amber-400' : 'text-slate-500'}`} />
                    )}
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] shadow-[0_0_4px_rgba(30,58,138,0.6)]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: DB sync, Exam Switcher, Streak, Role & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Firestore DB Indicator - Modern Subtle Ring & Soft Scale */}
            <div
              title="Connected to Cloud Firestore Database"
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg ring-1 ring-emerald-200 shadow-2xs hover:ring-emerald-300 hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-in-out cursor-default"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
              <span>Live DB</span>
            </div>

            {/* Exam Toggle - Modern 3D Segmented Control */}
            <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 shadow-[inset_0_2px_3px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out">
              {(['GAT', 'SAT'] as ExamType[]).map(exam => {
                const isActive = activeExam === exam;
                return (
                  <button
                    key={exam}
                    onClick={() => onSelectExam(exam)}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all duration-200 ease-out cursor-pointer ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-[0_2px_0_0_#94a3b8,0_2px_4px_rgba(0,0,0,0.08)] -translate-y-0.5'
                        : 'text-slate-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {exam}
                  </button>
                );
              })}
            </div>

            {/* Streak Counter for Students */}
            {!isAdmin && (
              <div
                title="Active Study Streak"
                className="flex items-center gap-1.5 text-xs font-bold text-gray-800 px-2.5 py-1.5 bg-white rounded-lg ring-1 ring-gray-200 shadow-2xs hover:ring-amber-300 transition-all duration-200 ease-in-out"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{streak}d</span>
              </div>
            )}

            {/* Gamification Level & XP Badge for Students */}
            {!isAdmin && !isTeacher && (
              <div
                title={`Tier Level ${level || 1} Scholar · ${xp || 0} Total XP Earned`}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 rounded-lg ring-1 ring-amber-200 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100/70 transition-all duration-200 ease-in-out cursor-default"
              >
                <span className="w-4 h-4 bg-amber-400 text-slate-900 rounded-md flex items-center justify-center text-[10px] font-black">
                  L{level || 1}
                </span>
                <span className="tabular-nums">{xp || 0} XP</span>
              </div>
            )}

            {/* Role Switcher - Modern Subtle Ring & Soft Scale */}
            <button
              onClick={onSwitchRole}
              title={isAdmin ? 'Switch between Admin and Student View' : isTeacher ? 'Switch between Teacher and Student View' : 'Switch role view'}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-800 bg-white hover:bg-gray-50 rounded-lg ring-1 ring-gray-200 shadow-xs hover:ring-gray-300 hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-in-out cursor-pointer"
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
                  <span>Admin</span>
                </>
              ) : isTeacher ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  <span>Teacher</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Student</span>
                </>
              )}
            </button>

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div
                  title={`Signed in as @${user.username}`}
                  className="w-8 h-8 rounded-lg bg-[#1e3a8a] text-white font-extrabold text-xs flex items-center justify-center shadow-xs ring-1 ring-blue-900/40"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onSignOut}
                  title="Sign out of account"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-black hover:bg-gray-100 active:scale-95 transition-all duration-200 ease-in-out cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:text-black hover:bg-gray-100 active:scale-95 transition-all duration-200 ease-in-out cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer with 3D tactile buttons */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 space-y-1.5">
            {navLinks.map(link => {
              const isActive = currentScreen === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1e3a8a] shadow-[0_3px_0_0_#1e3a8a,0_3px_6px_rgba(30,58,138,0.15)] -translate-y-0.5 border border-slate-200'
                      : 'text-slate-700 bg-white/70 hover:bg-white border border-slate-200/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {link.id === 'achievements' && (
                      <Trophy className={`w-4 h-4 ${isActive ? 'text-amber-500 fill-amber-400' : 'text-slate-500'}`} />
                    )}
                    <span>{link.label}</span>
                  </div>
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#1e3a8a]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
