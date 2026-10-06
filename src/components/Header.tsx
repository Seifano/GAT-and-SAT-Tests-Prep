import React, { useState } from 'react';
import { ExamType, UserAccount } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import { Flame, LogOut, ShieldCheck, GraduationCap, Menu, X } from 'lucide-react';

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
  const isExamScreen = currentScreen === 'exam';

  if (isExamScreen) {
    return null;
  }

  const studentNav = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'practice', label: 'Practice Sets' },
    { id: 'skills', label: 'Skills & Analytics' },
    { id: 'browser', label: 'Browse Questions' },
    { id: 'results', label: 'Results' }
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'adminQuestions', label: 'Manage Questions' },
    { id: 'adminImport', label: 'Import File' },
    { id: 'adminAccounts', label: 'User Accounts' },
    { id: 'adminBranding', label: 'Logo & Branding' },
    { id: 'browser', label: 'Study Library' }
  ];

  const navLinks = isAdmin ? adminNav : studentNav;

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#f3f2f2] border-b-2 border-[#201e1d]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Wordmark & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavClick(isAdmin ? 'adminQuestions' : 'dashboard')}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <img
                src={settings?.logoUrl || AHS_LOGO_SRC}
                alt="Logo"
                className="h-9 w-auto max-w-[100px] object-contain"
              />
              <div>
                <span className="text-lg font-black tracking-tight text-[#201e1d] block leading-none">
                  {settings?.appName || 'AHS Exams Prepline'}
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f3d7a] block mt-0.5">
                    Instructor Portal
                  </span>
                )}
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 ml-4">
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

          {/* Right Controls: Exam Switcher, Streak, Role & Account */}
          <div className="flex items-center gap-2.5 sm:gap-3">
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
                title="Practice Streak"
                className="flex items-center gap-1 text-xs font-black text-[#201e1d] px-2 py-1 bg-white border border-slate-300"
              >
                <Flame className="w-3.5 h-3.5 text-[#1f3d7a] fill-[#1f3d7a]" />
                <span>{streak}d</span>
              </div>
            )}

            {/* Role Switcher */}
            <button
              onClick={onSwitchRole}
              title={isAdmin ? 'Switch to Student View' : 'Switch to Teacher/Admin Hub'}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#201e1d] bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
            >
              {isAdmin ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span>Student</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1f3d7a]" />
                  <span>Admin</span>
                </>
              )}
            </button>

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-300">
                <div
                  title={`Signed in as ${user.name} (@${user.username})`}
                  className="w-8 h-8 rounded-full border border-slate-400 bg-white text-xs font-bold text-[#201e1d] flex items-center justify-center"
                >
                  {user.name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-1.5 text-slate-600 hover:text-black hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-black cursor-pointer"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[#201e1d]/20 space-y-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider block ${
                  currentScreen === link.id
                    ? 'bg-[#1f3d7a] text-white'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-300 flex items-center justify-between px-3 text-xs">
              <button
                onClick={() => {
                  onSwitchRole();
                  setMobileMenuOpen(false);
                }}
                className="font-bold text-[#1f3d7a] underline py-1"
              >
                {isAdmin ? 'Switch to Student View' : 'Switch to Instructor View'}
              </button>
              <button
                onClick={onSignOut}
                className="font-bold text-red-700 py-1"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
