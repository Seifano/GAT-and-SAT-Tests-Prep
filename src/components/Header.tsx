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
  Trophy,
  ArrowLeft
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
  onGoBackToSelect?: () => void;
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
  onGoBackToSelect,
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
    { id: 'browser', label: 'Library' }
  ];

  const adminStaffNav = [
    { id: 'studentProgress', label: 'Student Progress' },
    { id: 'adminQuestions', label: 'Questions' },
    { id: 'adminImport', label: 'Import' },
    { id: 'adminAccounts', label: 'Accounts' },
    { id: 'adminBranding', label: 'Logo & Branding' },
    { id: 'browser', label: 'Library' },
    { id: 'dashboard', label: 'Student View ↗' }
  ];

  // If admin is browsing student screens, give full access to student tabs plus admin return
  const isViewingStudentSide = ['studentSelect', 'dashboard', 'achievements', 'analytics', 'skills', 'practice', 'results'].includes(currentScreen);
  const adminNav = isViewingStudentSide
    ? [
        { id: 'studentProgress', label: '← Admin Console' },
        ...studentNav
      ]
    : adminStaffNav;

  const navLinks = isAdmin ? adminNav : isTeacher ? teacherNav : studentNav;

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#f3f2f2]/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      {/* School Tri-Color Heritage Accent Stripe: Crimson Red · Navy Blue · Green */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-800 via-[#1e3a8a] to-emerald-700" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.75rem] py-2 gap-3 sm:gap-4">
          {/* Far Left Brand Wordmark & Enlarged Emblem (Never squeezed or hidden behind tabs) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => {
                if (isAdmin) {
                  handleNavClick(isViewingStudentSide ? 'studentProgress' : 'studentProgress');
                } else if (isTeacher) {
                  handleNavClick('studentProgress');
                } else {
                  handleNavClick(currentScreen === 'studentSelect' ? 'studentSelect' : 'dashboard');
                }
              }}
              className="flex items-center gap-2.5 sm:gap-3.5 text-left cursor-pointer group transition-transform duration-200 hover:scale-[1.01] shrink-0"
              title={settings?.appName || 'AHS Exams Prepline'}
            >
              <img
                src={settings?.logoUrl || AHS_LOGO_SRC}
                alt="AHS School Emblem Logo"
                className="h-12 sm:h-14 lg:h-16 w-auto max-w-[95px] sm:max-w-[125px] lg:max-w-[150px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-xs"
              />
              <div className="min-w-0">
                <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-[#201e1d] block leading-tight">
                  {settings?.appName || 'AHS Exams Prepline'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a]">
                    {isAdmin ? (isViewingStudentSide ? 'Admin (Student Mode)' : 'Admin Console') : isTeacher ? 'Teacher View' : 'Student View'}
                  </span>
                  {/* School Tri-Color Heritage Pill */}
                  <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white ring-1 ring-gray-200 text-gray-700 shadow-2xs shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-700" title="Crimson Red" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" title="Navy Blue" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="Green" />
                    <span className="text-[9px] font-extrabold text-gray-600">AHS</span>
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop 3D Navigation Tabs - Centered & Decoupled with Zero Overlap */}
          {currentScreen !== 'studentSelect' && (
            <div className="hidden xl:flex items-center justify-center flex-1 min-w-0 px-2">
              <nav className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] overflow-x-auto max-w-full">
                {navLinks.map(link => {
                  const isActive = currentScreen === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavClick(link.id)}
                      className={`text-[11px] font-black uppercase tracking-wider transition-all duration-150 ease-out cursor-pointer px-2.5 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-[#1e3a8a] shadow-[0_3px_0_0_#1e3a8a,0_3px_6px_-1px_rgba(30,58,138,0.2)] -translate-y-0.5 border border-slate-200/90'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                    >
                      {link.id === 'achievements' && (
                        <Trophy className={`w-3 h-3 ${isActive ? 'text-amber-500 fill-amber-400' : 'text-slate-500'}`} />
                      )}
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Right Controls: Go Back button, DB sync, Exam Switcher, Streak, Role & Account */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {/* Go Back to Main Menu button (for student view when an exam is loaded) */}
            {onGoBackToSelect && (user?.role === 'Student' || isViewingStudentSide) && currentScreen !== 'studentSelect' && (
              <button
                onClick={onGoBackToSelect}
                title="Return to Main Menu to switch to a different track (GAT, SAT, NAFS)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-800 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 shadow-xs hover:border-[#1e3a8a] hover:text-[#1e3a8a] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span>Main Menu</span>
              </button>
            )}

            {/* Live Firestore DB Indicator */}
            <div
              title="Connected to Cloud Firestore Database"
              className="hidden 2xl:inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg ring-1 ring-emerald-200 shadow-2xs cursor-default shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live DB</span>
            </div>

            {/* Track Indicator: Locked in Student View (Must return to Main Menu to switch) */}
            {currentScreen !== 'studentSelect' && (
              (user?.role === 'Student' || isViewingStudentSide) ? (
                <div
                  title={`Current track: ${activeExam}. To switch track, return to Main Menu.`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl border border-slate-300/80 shadow-2xs shrink-0"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Track:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black text-white shadow-2xs ${
                    activeExam === 'NAFS' ? 'bg-emerald-700' : activeExam === 'GAT' ? 'bg-red-700' : 'bg-[#1e3a8a]'
                  }`}>
                    {activeExam}
                  </span>
                </div>
              ) : (
                /* Admin/Teacher console track switcher */
                <div className="inline-flex items-center p-0.5 sm:p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 shadow-[inset_0_2px_3px_rgba(0,0,0,0.06)] shrink-0">
                  {(['NAFS', 'GAT', 'SAT'] as ExamType[]).map(exam => {
                    const isActive = activeExam === exam;
                    return (
                      <button
                        key={exam}
                        onClick={() => onSelectExam(exam)}
                        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] font-black rounded-lg transition-all duration-150 ease-out cursor-pointer ${
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
              )
            )}

            {/* Streak Counter for Students */}
            {!isAdmin && !isTeacher && currentScreen !== 'studentSelect' && (
              <div
                title="Active Study Streak"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-gray-800 px-2 py-1 bg-white rounded-lg ring-1 ring-gray-200 shadow-2xs hover:ring-amber-300 transition-all shrink-0"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{streak}d</span>
              </div>
            )}

            {/* Gamification Level & XP Badge for Students */}
            {!isAdmin && !isTeacher && currentScreen !== 'studentSelect' && (
              <div
                title={`Tier Level ${level || 1} Scholar · ${xp || 0} Total XP Earned`}
                className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg ring-1 ring-amber-200 text-[11px] font-bold text-amber-900 shadow-2xs cursor-default shrink-0"
              >
                <span className="w-3.5 h-3.5 bg-amber-400 text-slate-900 rounded flex items-center justify-center text-[9px] font-black">
                  L{level || 1}
                </span>
                <span className="tabular-nums">{xp || 0} XP</span>
              </div>
            )}

            {/* Role Display / Switcher */}
            {isAdmin ? (
              <button
                onClick={onSwitchRole}
                title="Switch between Admin Management and Student Experience"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-gray-900 bg-white hover:bg-gray-50 rounded-lg ring-1 ring-red-300 shadow-xs hover:ring-red-400 hover:scale-[1.02] active:scale-95 transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
                <span>Admin (Switch)</span>
              </button>
            ) : isTeacher ? (
              <div
                title="Teacher Account · Teacher View Only"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#1e3a8a] bg-blue-50/90 rounded-lg ring-1 ring-blue-200 shadow-2xs cursor-default shrink-0 whitespace-nowrap"
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span>Teacher View</span>
              </div>
            ) : (
              <div
                title="Student Account · Student View Only"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50/90 rounded-lg ring-1 ring-emerald-200 shadow-2xs cursor-default shrink-0 whitespace-nowrap"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                <span>Student View</span>
              </div>
            )}

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-gray-200 shrink-0">
                <div
                  title={`Signed in as @${user.username} (${user.role})`}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1e3a8a] text-white font-extrabold text-xs flex items-center justify-center shadow-xs ring-1 ring-blue-900/40 shrink-0"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onSignOut}
                  title="Sign out of account"
                  className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile / Tablet Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg text-slate-700 hover:text-black hover:bg-gray-200/60 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-200 space-y-2">
            {/* User Status Bar in Mobile Menu */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>@{user?.username || 'user'}</span>
                <span className="text-slate-400">·</span>
                <span className="text-[#1e3a8a]">{user?.role}</span>
              </div>
              {!isAdmin && !isTeacher && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-600 font-bold">{streak}d streak</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-amber-800 font-black">{xp || 0} XP</span>
                </div>
              )}
            </div>

            {/* Go Back button in Mobile Menu */}
            {onGoBackToSelect && (user?.role === 'Student' || isViewingStudentSide) && currentScreen !== 'studentSelect' && (
              <button
                onClick={() => {
                  onGoBackToSelect();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] border border-blue-200 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Main Menu (Change Exam Track)</span>
              </button>
            )}

            {/* Track Indicator in Mobile Menu */}
            {currentScreen !== 'studentSelect' && (
              (user?.role === 'Student' || isViewingStudentSide) ? (
                <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Active Track:</span>
                    <span className={`px-2 py-0.5 rounded-md font-black text-white ${
                      activeExam === 'NAFS' ? 'bg-emerald-700' : activeExam === 'GAT' ? 'bg-red-700' : 'bg-[#1e3a8a]'
                    }`}>
                      {activeExam}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">Locked to track</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-1.5 bg-slate-100 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Track:</span>
                  <div className="inline-flex items-center gap-1">
                    {(['NAFS', 'GAT', 'SAT'] as ExamType[]).map(exam => (
                      <button
                        key={exam}
                        onClick={() => {
                          onSelectExam(exam);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          activeExam === exam
                            ? 'bg-white text-[#1e3a8a] shadow-xs ring-1 ring-slate-300 font-black'
                            : 'text-slate-600 hover:text-gray-900'
                        }`}
                      >
                        {exam}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Admin Switcher for Mobile Drawer */}
            {isAdmin && (
              <button
                onClick={() => {
                  onSwitchRole();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-red-700" />
                <span>{isViewingStudentSide ? 'Return to Admin Management Console' : 'Switch to Student View Preview'}</span>
              </button>
            )}

            {/* Navigation Tabs (only if not on selection screen) */}
            {currentScreen !== 'studentSelect' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
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
        )}
      </div>
    </header>
  );
};
