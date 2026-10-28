import React, { useState } from 'react';
import { ExamType, UserAccount } from '../types';
import {
  LayoutGrid,
  Zap,
  Award,
  BookOpen,
  Compass,
  Users,
  Database,
  UploadCloud,
  ShieldCheck,
  Settings,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Flame,
  Sparkles,
  Gamepad2
} from 'lucide-react';
import { Language, t } from '../utils/i18n';

interface SidebarProps {
  currentScreen: string;
  activeExam: ExamType;
  user: UserAccount | null;
  onNavigate: (screen: string) => void;
  onSelectExam?: (exam: ExamType) => void;
  onGoBackToSelect?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop?: boolean;
  onToggleCollapseDesktop?: () => void;
  questionCounts?: Record<ExamType, number>;
  streak?: number;
  xp?: number;
  language?: Language;
  onOpenJoinModal?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  desc?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color?: string;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  activeExam,
  user,
  onNavigate,
  onSelectExam,
  onGoBackToSelect,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop = false,
  onToggleCollapseDesktop,
  questionCounts,
  streak,
  xp,
  language = 'en',
  onOpenJoinModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isRtl = language === 'ar';
  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const isStaff = isAdmin || isTeacher;
  const isViewingStudentSide = [
    'studentSelect',
    'dashboard',
    'achievements',
    'analytics',
    'skills',
    'practice',
    'results',
    'ksaBooking'
  ].includes(currentScreen);

  // Student navigation hierarchy
  const studentCategories: NavCategory[] = [
    {
      title: t('practiceStudy', language),
      items: [
        {
          id: 'dashboard',
          label: t('home', language),
          desc: language === 'ar' ? 'اختبارات محاكية، تدريب وسجل التقدم' : 'Mock exams, warmup & progress',
          icon: LayoutGrid,
          color: 'text-indigo-600'
        },
        {
          id: 'joinGameModal',
          label: t('joinGame', language),
          desc: language === 'ar' ? 'الانضمام لمسابقة المعلم برمز PIN' : 'Join live arena with PIN',
          icon: Gamepad2,
          badge: 'Live',
          color: 'text-purple-600'
        },
        {
          id: 'practice',
          label: t('practiceDrills', language),
          desc: language === 'ar' ? 'تدريبات على المهارات وحل الأسئلة' : 'Topic drills & question solving',
          icon: Zap,
          color: 'text-amber-500'
        },
        {
          id: 'results',
          label: t('resultsHistory', language),
          desc: language === 'ar' ? 'درجات الاختبارات والشروحات التفصيلية' : 'Scores & answer explanations',
          icon: BookOpen,
          color: 'text-blue-500'
        },
        {
          id: 'achievements',
          label: t('badgesXp', language),
          desc: language === 'ar' ? `${streak || 0} يوم استمرار · مستويات وأوسمة` : `${streak || 0}d streak · Level rewards`,
          icon: Award,
          color: 'text-amber-600'
        },
        {
          id: 'ksaBooking',
          label: t('ksaDates', language),
          desc: language === 'ar' ? 'جلسات ومواعيد اختبارات الرياض' : 'Riyadh & Al-Khobar sessions',
          icon: Calendar,
          color: 'text-emerald-600'
        }
      ]
    },
    {
      title: t('examPathway', language),
      items: [
        {
          id: 'studentSelect',
          label: user?.studentLevel === 'High School'
            ? t('switchTrack', language)
            : (language === 'ar' ? 'مساري الحالي (نافس)' : 'My Track (NAFS)'),
          desc: user?.studentLevel === 'High School'
            ? (language === 'ar' ? 'التبديل بين اختبار القدرات والسات' : 'Change between SAT and GAT')
            : (language === 'ar' ? `المسار: ${user?.studentLevel || 'الصف السادس'}` : `Assigned: ${user?.studentLevel || 'Grade 6'}`),
          icon: Compass,
          badge: user?.studentLevel === 'High School' ? activeExam : (user?.studentLevel || 'NAFS'),
          color: 'text-sky-500'
        }
      ]
    }
  ];

  // Staff (Teacher & Admin) navigation hierarchy
  const staffCategories: NavCategory[] = [
    {
      title: t('academicProgress', language),
      items: [
        {
          id: 'studentProgress',
          label: t('studentProgress', language),
          desc: language === 'ar' ? 'تحليلات نتائج الطلاب والتشخيص' : 'Roster analytics & diagnostics',
          icon: Users,
          color: 'text-indigo-600'
        },
        {
          id: 'hostGame',
          label: t('hostGame', language),
          desc: language === 'ar' ? 'استضافة مسابقة صفية تفاعلية بأسئلة وبطاقات QR' : 'Host live Blooket game & QR',
          icon: Gamepad2,
          badge: 'Live',
          color: 'text-purple-600'
        },
        {
          id: 'ksaBooking',
          label: t('ksaDates', language),
          desc: language === 'ar' ? 'جلسات ومواعيد اختبارات الرياض' : 'Riyadh & Al-Khobar sessions',
          icon: Calendar,
          color: 'text-emerald-600'
        },
        {
          id: 'dashboard',
          label: t('practiceMode', language),
          desc: language === 'ar' ? 'استكشف بيئة تدريب واختبار الطلاب' : 'Experience student drills & tests',
          icon: LayoutGrid,
          color: 'text-blue-600'
        }
      ]
    },
    ...(isAdmin ? [{
      title: t('questionBankImport', language),
      items: [
        {
          id: 'adminQuestions',
          label: t('questionBank', language),
          desc: language === 'ar' ? 'إنشاء ومراجعة وإدارة الأسئلة' : 'Create, audit & manage test items',
          icon: Database,
          color: 'text-cyan-600'
        },
        {
          id: 'adminImport',
          label: t('aiImporter', language),
          desc: language === 'ar' ? 'استخراج وتحويل الأسئلة بالذكاء الاصطناعي' : 'Extract questions with AI & docs',
          icon: UploadCloud,
          color: 'text-violet-600'
        },
        {
          id: 'browser',
          label: t('questionLibrary', language),
          desc: language === 'ar' ? 'مستعرض الأسئلة المعتمدة' : 'Verified item browser',
          icon: BookOpen,
          color: 'text-blue-500'
        }
      ]
    }] : []),
    ...(isAdmin ? [{
      title: t('administration', language),
      items: [
        {
          id: 'adminAccounts',
          label: t('userAccounts', language),
          desc: language === 'ar' ? 'خزينة حسابات الطلاب والمعلمين' : 'Student & teacher vault',
          icon: ShieldCheck,
          color: 'text-rose-600'
        },
        {
          id: 'adminBranding',
          label: t('schoolBranding', language),
          desc: language === 'ar' ? 'شعار المدرسة وهوية المنصة' : 'Custom emblem & theme',
          icon: Settings,
          color: 'text-slate-600'
        }
      ]
    }] : []),
    {
      title: t('examPathway', language),
      items: [
        {
          id: 'studentSelect',
          label: t('switchTrack', language),
          desc: language === 'ar' ? 'التبديل بين القدرات والسات ونافس' : 'Change between SAT, GAT, NAFS',
          icon: Compass,
          badge: activeExam,
          color: 'text-sky-500'
        }
      ]
    }
  ];

  const currentCategories = isStaff && !isViewingStudentSide ? staffCategories : studentCategories;

  const filteredCategories = currentCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        (item.desc && item.desc.toLowerCase().includes(q))
      );
    })
  })).filter(cat => cat.items.length > 0);

  const handleItemClick = (id: string) => {
    if (id === 'joinGameModal' && onOpenJoinModal) {
      onOpenJoinModal();
    } else if (id === 'studentSelect' && onGoBackToSelect) {
      onGoBackToSelect();
    } else {
      onNavigate(id);
    }
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Sidebar Header / Context Card */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/60">
        {!isCollapsedDesktop ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {t('navigation', language)}
              </span>
              {/* Active Track indicator badge */}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-800 shadow-2xs">
                <span className={`w-2 h-2 rounded-full ${
                  activeExam === 'SAT' ? 'bg-indigo-600' : activeExam === 'GAT' ? 'bg-rose-600' : 'bg-emerald-600'
                }`} />
                <span>{activeExam} {t('track', language)}</span>
              </div>
            </div>

            {/* Quick search input */}
            {currentCategories.reduce((acc, cat) => acc + cat.items.length, 0) > 4 && (
              <div className="relative">
                <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${isRtl ? 'right-2.5' : 'left-2.5'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={t('filterTabs', language)}
                  className={`w-full py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs ${
                    isRtl ? 'pr-7 pl-6' : 'pl-7 pr-6'
                  }`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={`absolute top-2 text-slate-400 hover:text-slate-600 cursor-pointer ${isRtl ? 'left-2' : 'right-2'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <span
              className={`w-3 h-3 rounded-full ${
                activeExam === 'SAT' ? 'bg-indigo-600' : activeExam === 'GAT' ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
              title={`${activeExam} Track`}
            />
          </div>
        )}
      </div>

      {/* Vertical Navigation Items List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {language === 'ar' ? `لم يتم العثور على نتائج لـ "${searchTerm}"` : `No tabs found for "${searchTerm}"`}
          </div>
        ) : (
          filteredCategories.map(cat => (
            <div key={cat.title} className="space-y-1">
              {!isCollapsedDesktop && (
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {cat.title}
                </div>
              )}
              <div className="space-y-1">
                {cat.items.map(item => {
                  const isActive = currentScreen === item.id;
                  const Icon = item.icon;

                  if (isCollapsedDesktop) {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item.id)}
                        title={`${item.label}${item.desc ? ` - ${item.desc}` : ''}`}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {isActive && (
                          <span className={`absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-md ${isRtl ? 'right-0 -mr-2' : 'left-0 -ml-2'}`} />
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full text-start px-3 py-2 rounded-xl flex items-center gap-3 transition-all duration-150 cursor-pointer group ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium'
                      }`}
                    >
                      <div className={`p-1 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-indigo-600 shadow-2xs'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs truncate block leading-snug">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black shrink-0 ${
                              isActive
                                ? 'bg-white/25 text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.desc && (
                          <span className={`text-[10px] block truncate leading-tight mt-0.5 ${
                            isActive ? 'text-indigo-100' : 'text-slate-400 group-hover:text-slate-500'
                          }`}>
                            {item.desc}
                          </span>
                        )}
                      </div>

                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ms-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer: Switch Track button & Desktop Collapse toggle */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 space-y-2">
        {!isCollapsedDesktop && onGoBackToSelect && currentScreen !== 'studentSelect' && (
          <button
            type="button"
            onClick={onGoBackToSelect}
            className="w-full px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl border border-indigo-200/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Return to Main Menu to select another exam track"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span>{t('switchTrack', language)}</span>
          </button>
        )}

        {/* Desktop Collapse / Expand Toggle Button */}
        {onToggleCollapseDesktop && (
          <div className="hidden lg:flex items-center justify-between pt-1">
            {!isCollapsedDesktop && (
              <span className="text-[10px] font-bold text-slate-400">
                {language === 'ar' ? 'عرض القائمة' : 'Sidebar View'}
              </span>
            )}
            <button
              type="button"
              onClick={onToggleCollapseDesktop}
              className={`p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors cursor-pointer ${
                isCollapsedDesktop ? 'mx-auto' : ''
              }`}
              title={isCollapsedDesktop ? (language === 'ar' ? 'توسيع القائمة' : 'Expand sidebar') : (language === 'ar' ? 'طي القائمة' : 'Collapse sidebar')}
            >
              {isCollapsedDesktop ? (
                <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <span>{language === 'ar' ? 'طي' : 'Collapse'}</span>
                  <ChevronLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-slate-200/90 bg-white transition-all duration-200 ease-in-out z-20 ${
          isCollapsedDesktop ? 'w-18' : 'w-64 xl:w-72'
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="sticky top-[4.75rem] sm:top-[5.25rem] h-[calc(100vh-4.75rem)] sm:h-[calc(100vh-5.25rem)] overflow-hidden">
          {navContent}
        </div>
      </aside>

      {/* Mobile / Tablet Off-Canvas Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 max-w-[85vw] w-72 bg-white shadow-2xl flex flex-col z-10 animate-viewFadeIn">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                Navigation Menu
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Close navigation sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {navContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
