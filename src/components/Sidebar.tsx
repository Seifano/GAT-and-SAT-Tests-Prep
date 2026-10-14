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
  ArrowLeft
} from 'lucide-react';

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
}

interface NavItem {
  id: string;
  label: string;
  desc?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
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
  xp
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const isStaff = isAdmin || isTeacher;
  const isViewingStudentSide = ['studentSelect', 'dashboard', 'achievements', 'analytics', 'skills', 'practice', 'results'].includes(currentScreen);

  // Student navigation hierarchy: ultra-clean, straightforward, zero confusion
  const studentCategories: NavCategory[] = [
    {
      title: 'Practice & Study',
      items: [
        { id: 'dashboard', label: 'Home & Practice', desc: 'Mock exams, warmup & progress', icon: LayoutGrid },
        { id: 'practice', label: 'Practice by Topic', desc: 'Drills for specific skills', icon: Zap },
        { id: 'browser', label: 'Question Bank', desc: 'Grade-matched verified questions', icon: BookOpen, badge: questionCounts && questionCounts[activeExam] ? `${questionCounts[activeExam]}` : undefined },
        { id: 'results', label: 'My Test History', desc: 'Past scores & review answers', icon: Award }
      ]
    },
    {
      title: 'Exam Track',
      items: [
        {
          id: 'studentSelect',
          label: user?.studentLevel === 'High School' ? 'Switch Exam (GAT / SAT)' : 'My Track (NAFS)',
          desc: user?.studentLevel === 'High School'
            ? 'Change between GAT and SAT'
            : `Assigned: ${user?.studentLevel || 'Grade 6'}`,
          icon: Compass,
          badge: user?.studentLevel === 'High School' ? activeExam : (user?.studentLevel || 'NAFS')
        }
      ]
    }
  ];

  // Staff (Teacher & Admin) navigation hierarchy
  const staffCategories: NavCategory[] = [
    {
      title: 'Academic Progress',
      items: [
        { id: 'studentProgress', label: 'Student Progress', desc: 'Roster analytics & diagnostics', icon: Users },
        { id: 'dashboard', label: 'Student View Preview', desc: 'Active student experience', icon: LayoutGrid }
      ]
    },
    {
      title: 'Question Bank',
      items: [
        { id: 'adminQuestions', label: 'Question Bank', desc: 'Create, audit & manage test items', icon: Database },
        { id: 'adminImport', label: 'Word & PDF Importer', desc: 'Bulk import questions', icon: UploadCloud },
        { id: 'browser', label: 'Question Library', desc: 'Verified item browser', icon: BookOpen }
      ]
    },
    ...(isAdmin ? [{
      title: 'Administration',
      items: [
        { id: 'adminAccounts', label: 'User Accounts', desc: 'Student & teacher vault', icon: ShieldCheck },
        { id: 'adminBranding', label: 'School Branding', desc: 'Custom emblem & theme', icon: Settings }
      ]
    }] : []),
    {
      title: 'Exam Pathway',
      items: [
        {
          id: 'studentSelect',
          label: 'Switch Exam Track',
          desc: 'Change between GAT, SAT, NAFS',
          icon: Compass,
          badge: activeExam
        }
      ]
    }
  ];

  const currentCategories = isStaff && !isViewingStudentSide ? staffCategories : studentCategories;

  // Filter items by search query if any
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
    if (id === 'studentSelect' && onGoBackToSelect) {
      onGoBackToSelect();
    } else {
      onNavigate(id);
    }
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Sidebar Header / Context Card */}
      <div className="p-3.5 border-b border-slate-200/90 bg-slate-50/70">
        {!isCollapsedDesktop ? (
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Navigation List
              </span>
              {/* Active Track indicator */}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-extrabold text-slate-700 shadow-2xs">
                <span className={`w-2 h-2 rounded-full ${
                  activeExam === 'NAFS' ? 'bg-emerald-600' : activeExam === 'GAT' ? 'bg-red-600' : 'bg-[#1e3a8a]'
                }`} />
                <span>{activeExam} Track</span>
              </div>
            </div>

            {/* Quick search input within the sidebar (only shown if many tabs) */}
            {currentCategories.reduce((acc, cat) => acc + cat.items.length, 0) > 5 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter tabs..."
                  className="w-full pl-7 pr-6 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <span className={`w-2.5 h-2.5 rounded-full ${
              activeExam === 'NAFS' ? 'bg-emerald-600' : activeExam === 'GAT' ? 'bg-red-600' : 'bg-[#1e3a8a]'
            }`} title={`${activeExam} Track`} />
          </div>
        )}
      </div>

      {/* Vertical Navigation Items List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No tabs found for "{searchTerm}"
          </div>
        ) : (
          filteredCategories.map(cat => (
            <div key={cat.title} className="space-y-1">
              {!isCollapsedDesktop && (
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {cat.title}
                </div>
              )}
              <div className="space-y-0.5">
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
                            ? 'bg-[#1e3a8a] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#1e3a8a] rounded-r-md -ml-2" />
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#1e3a8a] text-white font-extrabold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950 font-medium'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#1e3a8a]'
                      }`} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs truncate block leading-snug">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.desc && (
                          <span className={`text-[10px] block truncate leading-tight mt-0.5 ${
                            isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-500'
                          }`}>
                            {item.desc}
                          </span>
                        )}
                      </div>

                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-auto" />
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
      <div className="p-3 border-t border-slate-200/90 bg-slate-50/70 space-y-2">
        {!isCollapsedDesktop && onGoBackToSelect && currentScreen !== 'studentSelect' && (
          <button
            type="button"
            onClick={onGoBackToSelect}
            className="w-full px-3 py-2 text-xs font-bold text-[#1e3a8a] bg-blue-50/90 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Return to Main Menu to select another exam track"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Main Menu (Switch Track)</span>
          </button>
        )}

        {/* Desktop Collapse / Expand Toggle Button */}
        {onToggleCollapseDesktop && (
          <div className="hidden lg:flex items-center justify-between pt-1">
            {!isCollapsedDesktop && (
              <span className="text-[10px] font-bold text-slate-400">
                Sidebar View
              </span>
            )}
            <button
              type="button"
              onClick={onToggleCollapseDesktop}
              className={`p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors cursor-pointer ${
                isCollapsedDesktop ? 'mx-auto' : ''
              }`}
              title={isCollapsedDesktop ? 'Expand sidebar list' : 'Collapse sidebar list'}
            >
              {isCollapsedDesktop ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <span>Collapse</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
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
      {/* Desktop Persistent Sidebar on the Left Side */}
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

      {/* Mobile / Tablet Off-Canvas Drawer on the Left Side */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop scrim */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Sliding Drawer Container */}
          <div className="fixed inset-y-0 left-0 max-w-[85vw] w-72 bg-white shadow-2xl flex flex-col z-10 animate-slideRight">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-[#f3f2f2]">
              <span className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                All Tabs &amp; Modules
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
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
