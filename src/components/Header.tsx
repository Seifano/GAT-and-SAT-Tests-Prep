import React from 'react';
import { ExamType, UserAccount } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import {
  Flame,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Menu,
  Cloud,
  RefreshCw,
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
  onSyncAllToCloud?: () => Promise<void> | void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'idle';
  lastCloudSyncTime?: string;
  onToggleSidebar?: () => void;
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
  level,
  onSyncAllToCloud,
  cloudSyncStatus = 'idle',
  lastCloudSyncTime = 'Connected',
  onToggleSidebar
}) => {
  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const isExamScreen = currentScreen === 'exam';

  if (isExamScreen) {
    return null;
  }

  const isViewingStudentSide = ['studentSelect', 'dashboard', 'achievements', 'analytics', 'skills', 'practice', 'results'].includes(currentScreen);

  return (
    <header className="sticky top-0 z-40 bg-[#f3f2f2]/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      {/* School Tri-Color Heritage Accent Stripe: Crimson Red · Navy Blue · Green */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-800 via-[#1e3a8a] to-emerald-700" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.75rem] sm:min-h-[5.25rem] py-2 gap-3 sm:gap-6">
          {/* Left: Sidebar Toggle Button + School Logo & Name */}
          <div className="flex items-center shrink-0 z-10 gap-2 sm:gap-3">
            {/* Sidebar toggle button (opens/toggles the left navigation list) */}
            {onToggleSidebar && currentScreen !== 'studentSelect' && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 -ml-1 text-slate-700 hover:text-[#1e3a8a] hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                title="Toggle Left Navigation Menu"
                aria-label="Toggle navigation list"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => {
                if (isAdmin) {
                  onNavigate(isViewingStudentSide ? 'studentProgress' : 'studentProgress');
                } else if (isTeacher) {
                  onNavigate('studentProgress');
                } else {
                  onNavigate(currentScreen === 'studentSelect' ? 'studentSelect' : 'dashboard');
                }
              }}
              className="flex items-center gap-3 sm:gap-4 text-left cursor-pointer group transition-transform duration-200 hover:scale-[1.01] shrink-0"
              title={settings?.appName || 'AHS Exams Prepline'}
            >
              <img
                src={settings?.logoUrl || AHS_LOGO_SRC}
                alt="AHS School Emblem Logo"
                className="h-14 sm:h-16 lg:h-18 w-auto max-w-[110px] sm:max-w-[145px] lg:max-w-[170px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
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

          {/* Center: COMPLETELY FREE OF TABS (Navigation is consolidated in the Left-Side list) */}
          <div className="flex-1" />

          {/* Right Controls: Actions, Track indicator, Cloud Sync, Streak, Profile & Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {/* Go Back to Main Menu button (for student view when an exam is loaded) */}
            {onGoBackToSelect && (user?.role === 'Student' || isViewingStudentSide) && currentScreen !== 'studentSelect' && (
              <button
                onClick={onGoBackToSelect}
                title="Return to Main Menu to switch to a different track (GAT, SAT, NAFS)"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-800 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 shadow-xs hover:border-[#1e3a8a] hover:text-[#1e3a8a] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span>Main Menu</span>
              </button>
            )}

            {/* Admin Cloud Sync Action Button */}
            {isAdmin && onSyncAllToCloud && (
              <button
                onClick={onSyncAllToCloud}
                disabled={cloudSyncStatus === 'syncing'}
                title="Save all changes (accounts, questions, settings) to Cloud Firestore database"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0 ${
                  cloudSyncStatus === 'syncing'
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-[#1e3a8a] hover:bg-[#162c68] text-white border-[#1e3a8a]'
                }`}
              >
                {cloudSyncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Save to Cloud'}
                </span>
                <span className="sm:hidden">Sync</span>
              </button>
            )}

            {/* Live Firestore DB Indicator (Staff only) */}
            {(isAdmin || isTeacher) && (
              <div
                title={`Cloud Protection: Connected & Synchronized (${lastCloudSyncTime})`}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg ring-1 ring-emerald-200 shadow-2xs cursor-default shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cloud Protected</span>
              </div>
            )}

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
                    {user?.role === 'Student' && user?.studentLevel ? ` (${user.studentLevel})` : ''}
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
                title={`Student Account · ${user?.studentLevel || 'Student'}${user?.studentClass ? ` (Class ${user.studentClass})` : ''}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50/90 rounded-lg ring-1 ring-emerald-200 shadow-2xs cursor-default shrink-0 whitespace-nowrap"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                <span>{user?.studentLevel || 'Student'}</span>
                {user?.studentClass && (
                  <span className="px-1.5 py-0.2 bg-white rounded text-[10px] font-black text-slate-700 border border-slate-200">
                    {user.studentClass}
                  </span>
                )}
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
          </div>
        </div>
      </div>
    </header>
  );
};
