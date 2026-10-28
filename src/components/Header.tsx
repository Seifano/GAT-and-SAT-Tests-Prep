import React, { useState, useRef, useEffect } from 'react';
import { ExamType, UserAccount, AppSettings } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import { Language, t } from '../utils/i18n';
import {
  Flame,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Menu,
  Cloud,
  RefreshCw,
  ArrowLeft,
  Globe,
  ChevronDown,
  Check,
  Gamepad2,
  Sparkles
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
  settings?: AppSettings;
  xp?: number;
  level?: number;
  onSyncAllToCloud?: () => Promise<void> | void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'idle';
  lastCloudSyncTime?: string;
  onToggleSidebar?: () => void;
  language?: Language;
  onToggleLanguage?: (lang: Language) => void;
  onOpenJoinModal?: () => void;
  onHostGame?: () => void;
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
  onToggleSidebar,
  language = 'en',
  onToggleLanguage,
  onOpenJoinModal,
  onHostGame
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const isExamScreen = currentScreen === 'exam';

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    if (langMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [langMenuOpen]);

  if (isExamScreen) {
    return null;
  }

  const isViewingStudentSide = [
    'studentSelect',
    'dashboard',
    'achievements',
    'analytics',
    'skills',
    'practice',
    'results'
  ].includes(currentScreen);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-colors">
      {/* School Heritage Tri-Color Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-indigo-600 to-emerald-500 shadow-xs" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.75rem] sm:min-h-[5.25rem] py-2 gap-3 sm:gap-6">
          {/* Left: Sidebar Toggle + School Logo & Title */}
          <div className="flex items-center shrink-0 z-10 gap-2 sm:gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 -ml-1 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/80 active:scale-95 rounded-xl transition-all cursor-pointer"
                title="Toggle navigation sidebar"
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
              title={settings?.appName || "Adhwa'a Al-Hedaya International Schools"}
            >
              <div className="relative">
                <img
                  src={settings?.logoUrl || AHS_LOGO_SRC}
                  alt="Adhwa'a Al-Hedaya Logo"
                  className="h-12 sm:h-14 lg:h-16 w-auto max-w-[110px] sm:max-w-[145px] lg:max-w-[165px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-slate-900 block leading-tight truncate max-w-xs sm:max-w-md lg:max-w-none">
                    {language === 'ar' ? "مدارس أضواء الهداية العالمية" : (settings?.appName || "Adhwa'a Al-Hedaya International Schools")}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 hidden sm:inline" dir={language === 'ar' ? 'ltr' : 'rtl'}>
                    {language === 'ar' ? "Adhwa'a Al-Hedaya International Schools" : "مدارس أضواء الهداية العالمية"}
                  </span>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    {isAdmin ? (isViewingStudentSide ? 'Admin (Student Mode)' : t('adminConsole', language)) : isTeacher ? t('teacherConsole', language) : t('scholarPortal', language)}
                  </span>
                  <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black text-slate-700">AHIS</span>
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="flex-1" />

          {/* Right Controls: Actions, Language Switcher, Track Switcher, Streak, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            
            {/* Language Switcher Dropdown */}
            {/* Language Switcher Dropdown in Polished Shiny Navy Blue */}
            {onToggleLanguage && (
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-[#0d1b3e] to-[#172554] hover:from-blue-900 hover:to-indigo-900 border border-blue-400/40 hover:border-blue-300 rounded-xl text-xs font-black text-white transition-all cursor-pointer shadow-[0_2px_8px_rgba(13,27,62,0.35)] active:scale-95"
                  title="Switch Platform Language / تبديل لغة المنصة"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden xs:inline">{language === 'ar' ? 'العربية 🇸🇦' : 'English 🇺🇸'}</span>
                  <span className="xs:hidden">{language === 'ar' ? 'عربي' : 'EN'}</span>
                  <ChevronDown className={`w-3 h-3 text-blue-300 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 dropdown-panel-navy p-1.5 z-50 animate-viewFadeIn space-y-1 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        onToggleLanguage('en');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        language === 'en'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-xs'
                          : 'text-blue-100 hover:bg-blue-900/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>English</span>
                      </div>
                      {language === 'en' && <Check className="w-3.5 h-3.5 text-blue-200" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleLanguage('ar');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        language === 'ar'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-xs'
                          : 'text-blue-100 hover:bg-blue-900/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🇸🇦</span>
                        <span dir="rtl">العربية</span>
                      </div>
                      {language === 'ar' && <Check className="w-3.5 h-3.5 text-blue-200" />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Go Back to Main Menu button */}
            {onGoBackToSelect && (user?.role === 'Student' || isViewingStudentSide) && currentScreen !== 'studentSelect' && (
              <button
                onClick={onGoBackToSelect}
                title="Return to Main Menu to switch to a different track (SAT, GAT, NAFS)"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('switchTrack', language)}</span>
              </button>
            )}

            {/* Live Blooket-Style Game Arena Actions */}
            {onOpenJoinModal && (
              <button
                type="button"
                onClick={onOpenJoinModal}
                title="Join a live classroom game with 6-digit PIN or QR code"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
                <span>{t('joinGame', language)}</span>
              </button>
            )}

            {(isAdmin || isTeacher) && onHostGame && (
              <button
                type="button"
                onClick={onHostGame}
                title="Host a Blooket-style live classroom game with question bank pool"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('hostGame', language)}</span>
              </button>
            )}

            {/* Admin Cloud Sync Action Button */}
            {isAdmin && onSyncAllToCloud && (
              <button
                onClick={onSyncAllToCloud}
                disabled={cloudSyncStatus === 'syncing'}
                title="Save all changes to Cloud Firestore"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
                  cloudSyncStatus === 'syncing'
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                }`}
              >
                {cloudSyncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {cloudSyncStatus === 'syncing' ? t('syncing', language) : t('saveCloud', language)}
                </span>
                <span className="sm:hidden">Sync</span>
              </button>
            )}

            {/* Live Firestore DB Indicator (Staff only) */}
            {(isAdmin || isTeacher) && (
              <div
                title={`Cloud Protection: Connected & Synchronized (${lastCloudSyncTime})`}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 shadow-2xs cursor-default shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t('cloudSynced', language)}</span>
              </div>
            )}

            {/* Track Indicator / Switcher */}
            {currentScreen !== 'studentSelect' && (
              (user?.role === 'Student' || isViewingStudentSide) ? (
                <div
                  title={`Current track: ${activeExam}. To switch track, return to Main Menu.`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50/80 rounded-xl border border-slate-200/90 shadow-2xs shrink-0"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('track', language)}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-xs ${
                      activeExam === 'SAT'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        : activeExam === 'GAT'
                        ? 'bg-gradient-to-r from-rose-600 to-red-600'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                    }`}
                  >
                    {activeExam}
                    {user?.role === 'Student' && user?.studentLevel ? ` · ${user.studentLevel}` : ''}
                  </span>
                </div>
              ) : (
                /* Admin/Teacher track switcher */
                <div className="inline-flex items-center p-0.5 sm:p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] shrink-0">
                  {(() => {
                    const tracksToRender: ExamType[] = isTeacher
                      ? (user?.assignedPathways && user.assignedPathways.length > 0
                          ? (user.assignedPathways as ExamType[])
                          : (user?.assignedGrades?.includes('High School') ? ['GAT', 'SAT'] : ['NAFS']))
                      : (['NAFS', 'GAT', 'SAT'] as ExamType[]);

                    return tracksToRender.map(exam => {
                      const isActive = activeExam === exam;
                      return (
                        <button
                          key={exam}
                          onClick={() => onSelectExam(exam)}
                          className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                            isActive
                              ? exam === 'SAT'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : exam === 'GAT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {exam}
                        </button>
                      );
                    });
                  })()}
                </div>
              )
            )}

            {/* Streak Counter for Students */}
            {!isAdmin && !isTeacher && currentScreen !== 'studentSelect' && (
              <div
                title="Active Study Streak"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 px-2.5 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl shadow-2xs hover:border-amber-300 transition-all shrink-0"
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span className="tabular-nums font-black">{streak}d</span>
              </div>
            )}

            {/* Gamification Level & XP Badge */}
            {!isAdmin && !isTeacher && currentScreen !== 'studentSelect' && (
              <div
                title={`Tier Level ${level || 1} Scholar · ${xp || 0} Total XP Earned`}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200/70 rounded-xl text-xs font-bold text-indigo-900 shadow-2xs cursor-default shrink-0"
              >
                <span className="w-4 h-4 bg-indigo-600 text-white rounded-md flex items-center justify-center text-[10px] font-black">
                  {level || 1}
                </span>
                <span className="tabular-nums font-bold text-indigo-700">{xp || 0} XP</span>
              </div>
            )}

            {/* Role indicator / Admin Switcher */}
            {isAdmin ? (
              <button
                onClick={onSwitchRole}
                title="Switch between Admin Console and Student Experience"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100/80 rounded-xl border border-rose-200 shadow-2xs hover:border-rose-300 transition-all duration-150 cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Admin View</span>
              </button>
            ) : isTeacher ? (
              <div
                title="Teacher Account · Verified Staff"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 rounded-xl border border-indigo-200 shadow-2xs cursor-default shrink-0"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Teacher</span>
              </div>
            ) : (
              <div
                title={`Student Account · ${user?.studentLevel || 'Student'}${user?.studentClass ? ` (Class ${user.studentClass})` : ''}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 shadow-2xs cursor-default shrink-0"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>{user?.studentLevel || 'Student'}</span>
                {user?.studentClass && (
                  <span className="px-1.5 py-0.5 bg-white rounded-md text-[10px] font-black text-slate-700 border border-slate-200">
                    {user.studentClass}
                  </span>
                )}
              </div>
            )}

            {/* User Profile Avatar & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
                <div
                  title={`Signed in as @${user.username} (${user.role})`}
                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs border border-white/60 shrink-0"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onSignOut}
                  title={t('signOut', language)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
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
