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
  BarChart2
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
  settings
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
    <header className="sticky top-0 z-40 bg-[#f3f2f2] border-b-2 border-[#201e1d]/30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Wordmark & Emblem */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavClick(isAdmin ? 'adminQuestions' : 'dashboard')}
              className="flex items-center gap-3 text-left cursor-pointer group"
            >
              <img
                src={settings?.logoUrl || AHS_LOGO_SRC}
                alt="Logo"
                className="h-10 w-auto max-w-[110px] object-contain transition-transform group-hover:scale-105"
              />
              <div>
                <span className="text-lg font-black tracking-tight text-[#201e1d] block leading-none">
                  {settings?.appName || 'AHS Exams Prepline'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f3d7a] block mt-0.5">
                  {isAdmin ? 'Admin Console' : isTeacher ? 'Teacher Portal' : 'High-Stakes Prep'}
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-4 ml-3">
              {navLinks.map(link => {
                const isActive = currentScreen === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`text-xs font-black uppercase tracking-wider transition-colors cursor-pointer py-1.5 border-b-2 ${
                      isActive
                        ? 'text-[#1f3d7a] border-[#1f3d7a]'
                        : 'text-slate-600 border-transparent hover:text-[#201e1d]'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: DB sync, Exam Switcher, Streak, Role & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Firestore DB Indicator */}
            <div
              title="Connected to Cloud Firestore Database"
              className="hidden xl:inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 text-[10px] font-bold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Live DB</span>
            </div>

            {/* Exam Toggle */}
            <div className="inline-flex border border-[#201e1d]/30 bg-transparent">
              {(['GAT', 'SAT'] as ExamType[]).map(exam => (
                <button
                  key={exam}
                  onClick={() => onSelectExam(exam)}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-black transition-all cursor-pointer ${
                    activeExam === exam
                      ? 'bg-[#1f3d7a] text-white'
                      : 'text-[#201e1d] hover:bg-slate-200/60'
                  }`}
                >
                  {exam}
                </button>
              ))}
            </div>

            {/* Streak Counter for Students */}
            {!isAdmin && (
              <div
                title="Active Study Streak"
                className="flex items-center gap-1 text-xs font-black text-[#201e1d] px-2.5 py-1 bg-white border border-slate-300"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{streak}d</span>
              </div>
            )}

            {/* Role Switcher */}
            <button
              onClick={onSwitchRole}
              title={isAdmin ? 'Switch between Admin and Student View' : isTeacher ? 'Switch between Teacher and Student View' : 'Switch role view'}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#201e1d] bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1f3d7a]" />
                  <span>Admin</span>
                </>
              ) : isTeacher ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                  <span>Teacher</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span>Student</span>
                </>
              )}
            </button>

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-300">
                <div
                  title={`Signed in as @${user.username}`}
                  className="w-7 h-7 bg-[#1f3d7a] text-white font-extrabold text-xs flex items-center justify-center border border-slate-800"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onSignOut}
                  title="Sign out of account"
                  className="p-1 text-slate-500 hover:text-black hover:bg-slate-200/70 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-black hover:bg-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-300 space-y-1">
            {navLinks.map(link => {
              const isActive = currentScreen === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`block w-full text-left px-3 py-2 text-xs font-black uppercase tracking-wider ${
                    isActive ? 'bg-[#1f3d7a] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
