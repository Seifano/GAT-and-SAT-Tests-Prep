import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  ExamType,
  Question,
  UserAccount,
  LiveGameSession,
  GameMode,
  GamePlayer,
  DifficultyLevel
} from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import {
  createGameSessionInDb,
  subscribeToGameSession,
  updateGameSessionInDb
} from '../firebase';
import { Language, t } from '../utils/i18n';
import { playCelebrationSound, isSoundEnabled, toggleSound } from '../utils/soundEffects';
import { getQuestionDifficulty, getDifficultyBadgeColor, getDifficultyLabel } from '../utils/difficulty';
import { MASCOTS } from './JoinGameModal';
import {
  Gamepad2,
  Users,
  QrCode,
  Play,
  Pause,
  Award,
  Crown,
  Sparkles,
  Zap,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Maximize2,
  Volume2,
  VolumeX,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Coins
} from 'lucide-react';

interface TeacherHostGameViewProps {
  teacher: UserAccount;
  bank: Record<ExamType, Question[]>;
  onClose: () => void;
  language?: Language;
}

export const TeacherHostGameView: React.FC<TeacherHostGameViewProps> = ({
  teacher,
  bank,
  onClose,
  language = 'en'
}) => {
  // Setup State
  const [exam, setExam] = useState<ExamType>('GAT');
  const [gameTitle, setGameTitle] = useState(`${teacher.name.split(' ')[0]}'s Live Arena`);
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [mode, setMode] = useState<GameMode>('point_heist');
  const [timeLimit, setTimeLimit] = useState<number>(0); // 0 = self paced
  const [allowGuests, setAllowGuests] = useState<boolean>(true);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [streakMultipliers, setStreakMultipliers] = useState<boolean>(true);

  // Active Hosted Session State
  const [activeSession, setActiveSession] = useState<LiveGameSession | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Question pool calculation
  const pool = bank[exam] || [];
  const filteredQuestions = pool.filter(q => {
    if (selectedSection !== 'All' && q.section !== selectedSection) return false;
    if (selectedSkill !== 'All' && q.skill !== selectedSkill) return false;
    if (selectedDifficulty !== 'All' && getQuestionDifficulty(q) !== selectedDifficulty) return false;
    return true;
  });

  const availableSections = Array.from(new Set(pool.map(q => q.section))).filter(Boolean);
  const availableSkills = Array.from(
    new Set(
      pool
        .filter(q => selectedSection === 'All' || q.section === selectedSection)
        .map(q => q.skill)
    )
  ).filter(Boolean);

  // Subscribe to live Firestore session changes when session is active
  useEffect(() => {
    if (!activeSession?.pin) return;

    const unsub = subscribeToGameSession(activeSession.pin, updated => {
      if (updated) {
        setActiveSession(updated);
        if (updated.status === 'completed' && activeSession.status !== 'completed') {
          playCelebrationSound();
        }
      }
    });

    return () => unsub();
  }, [activeSession?.pin]);

  // Generate QR Code whenever a session is created
  useEffect(() => {
    if (!activeSession?.pin) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const joinUrl = `${origin}/?joinPin=${activeSession.pin}`;

    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(console.error);
  }, [activeSession?.pin]);

  // Host Launch Handler
  const handleLaunchGame = async () => {
    // Generate unique 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // Sample questions
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (selected.length === 0) {
      alert(language === 'ar' ? 'لا توجد أسئلة متاحة في هذا التصنيف' : 'No questions available in selected category');
      return;
    }

    const newSession: LiveGameSession = {
      pin,
      hostTeacherUsername: teacher.username,
      hostTeacherName: teacher.name,
      title: gameTitle.trim() || `${exam} Live Arena`,
      exam,
      sectionFilter: selectedSection,
      skillFilter: selectedSkill,
      difficultyFilter: selectedDifficulty,
      mode,
      ruleSettings: {
        timeLimitSeconds: timeLimit,
        allowGuests,
        showExplanations,
        basePoints: 100,
        streakMultipliers,
        powerChestRewards: mode === 'gold_quest' || mode === 'point_heist',
        stealPointsEnabled: mode === 'point_heist',
        maxPlayers: 25
      },
      questionIds: selected.map(q => q.id),
      questions: selected,
      status: 'lobby',
      createdAt: Date.now(),
      players: {}
    };

    setActiveSession(newSession);
    await createGameSessionInDb(newSession);
  };

  const handleStartGame = async () => {
    if (!activeSession) return;
    await updateGameSessionInDb(activeSession.pin, {
      status: 'active',
      startedAt: Date.now()
    });
    setActiveSession(prev => (prev ? { ...prev, status: 'active', startedAt: Date.now() } : null));
  };

  const handleTogglePause = async () => {
    if (!activeSession) return;
    const newStatus = activeSession.status === 'paused' ? 'active' : 'paused';
    await updateGameSessionInDb(activeSession.pin, { status: newStatus });
    setActiveSession(prev => (prev ? { ...prev, status: newStatus } : null));
  };

  const handleEndGame = async () => {
    if (!activeSession) return;
    await updateGameSessionInDb(activeSession.pin, {
      status: 'completed',
      completedAt: Date.now()
    });
    setActiveSession(prev => (prev ? { ...prev, status: 'completed', completedAt: Date.now() } : null));
    playCelebrationSound();
  };

  const handleAwardClassBonus = async () => {
    if (!activeSession) return;
    const updatedPlayers = { ...activeSession.players };
    Object.keys(updatedPlayers).forEach(pId => {
      updatedPlayers[pId].gold = (updatedPlayers[pId].gold || 0) + 100;
      updatedPlayers[pId].score = (updatedPlayers[pId].score || 0) + 150;
    });

    await updateGameSessionInDb(activeSession.pin, { players: updatedPlayers });
    setActiveSession(prev => (prev ? { ...prev, players: updatedPlayers } : null));
    playCelebrationSound();
  };

  const handleCopyLink = () => {
    if (!activeSession) return;
    const joinUrl = `${window.location.origin}/?joinPin=${activeSession.pin}`;
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPin = () => {
    if (!activeSession) return;
    navigator.clipboard.writeText(activeSession.pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Players Leaderboard Calculation
  const playersList: GamePlayer[] = Object.values(activeSession?.players || {}).sort((a, b) => {
    // Sort by score or gold depending on mode
    if (activeSession?.mode === 'gold_quest') {
      return (b.gold || 0) - (a.gold || 0) || b.score - a.score;
    }
    return b.score - a.score || (b.correctCount || 0) - (a.correctCount || 0);
  });

  const top3 = playersList.slice(0, 3);

  // ----------------------------------------------------
  // RENDER: 1. SETUP & GAME RULES CONFIGURATION
  // ----------------------------------------------------
  if (!activeSession) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-viewFadeIn">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-yellow-300 mb-3 border border-white/20">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'ساحة المسابقات التفاعلية المباشرة (Blooket Style)' : 'Blooket-Style Live Multiplayer Arena'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {language === 'ar' ? 'استضافة مسابقة صفية مباشرة' : 'Host a Live Classroom Game'}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 font-medium max-w-xl mt-1.5">
                {language === 'ar'
                  ? 'اختر مهارات بنك الأسئلة وقواعد اللعبة، واعرض رمز الاستجابة السريعة (QR) على شاشة العرض لينضم الطلاب فوراً بحساباتهم أو كضيوف!'
                  : 'Select questions from the school question bank, set the rules, and project the QR code for students to join in real-time on any device!'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer self-start md:self-auto"
            >
              {language === 'ar' ? '← العودة للوحة المعلم' : '← Back to Console'}
            </button>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Game Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Track & Title */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                  1
                </span>
                <h2 className="text-sm font-black text-slate-800">
                  {language === 'ar' ? 'مسار الاختبار وعنوان المسابقة' : 'Exam Track & Session Title'}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {language === 'ar' ? 'المسار المستهدف' : 'Target Exam Track'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['GAT', 'SAT', 'NAFS'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setExam(t);
                          setSelectedSection('All');
                          setSelectedSkill('All');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          exam === t
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {language === 'ar' ? 'عنوان المسابقة للصف' : 'Game / Class Title'}
                  </label>
                  <input
                    type="text"
                    value={gameTitle}
                    onChange={e => setGameTitle(e.target.value)}
                    placeholder="e.g. Period 3 GAT Quantitative Sprint"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Question Pool & Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                    2
                  </span>
                  <h2 className="text-sm font-black text-slate-800">
                    {language === 'ar' ? 'تخصيص مهارات بنك الأسئلة' : 'Question Bank Pool & Topics'}
                  </h2>
                </div>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {filteredQuestions.length} {language === 'ar' ? 'سؤال متاح' : 'Questions in pool'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === 'ar' ? 'القسم / المجال' : 'Section / Domain'}
                  </label>
                  <select
                    value={selectedSection}
                    onChange={e => {
                      setSelectedSection(e.target.value);
                      setSelectedSkill('All');
                    }}
                    className="select-modern text-xs font-bold w-full"
                  >
                    <option value="All">{language === 'ar' ? 'كافة الأقسام' : 'All Sections'}</option>
                    {availableSections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === 'ar' ? 'المهارة المحددة' : 'Specific Skill'}
                  </label>
                  <select
                    value={selectedSkill}
                    onChange={e => setSelectedSkill(e.target.value)}
                    className="select-modern text-xs font-bold w-full"
                  >
                    <option value="All">{language === 'ar' ? 'كافة المهارات' : 'All Skills'}</option>
                    {availableSkills.map(sk => (
                      <option key={sk} value={sk}>{sk}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty Tier'}
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value as DifficultyLevel | 'All')}
                    className="select-modern text-xs font-bold w-full"
                  >
                    <option value="All">{language === 'ar' ? 'جميع المستويات (مختلط)' : 'All Difficulties (Mixed)'}</option>
                    <option value="Easy">{language === 'ar' ? 'سهل (Easy - أخضر)' : 'Easy Mode (Green)'}</option>
                    <option value="Medium">{language === 'ar' ? 'متوسط (Medium - أزرق)' : 'Medium Mode (Navy)'}</option>
                    <option value="Hard">{language === 'ar' ? 'صعب (Hard - أحمر)' : 'Hard Mode (Crimson)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === 'ar' ? 'عدد الأسئلة' : 'Questions Count'}
                  </label>
                  <select
                    value={questionCount}
                    onChange={e => setQuestionCount(Number(e.target.value))}
                    className="select-modern text-xs font-bold w-full"
                  >
                    {[5, 10, 15, 20, 25].map(n => (
                      <option key={n} value={n}>{n} {language === 'ar' ? 'أسئلة' : 'Questions'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Difficulty Quick Pills with School Colors */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">
                  {language === 'ar' ? 'فلترة الصعوبة السريعة:' : 'Quick Difficulty Filter:'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('All')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    selectedDifficulty === 'All'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'ar' ? 'الكل' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('Easy')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                    selectedDifficulty === 'Easy'
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{language === 'ar' ? 'سهل' : 'Easy Mode'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('Medium')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                    selectedDifficulty === 'Medium'
                      ? 'bg-blue-900 text-white shadow-xs ring-2 ring-blue-700/30'
                      : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>{language === 'ar' ? 'متوسط' : 'Medium Mode'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('Hard')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                    selectedDifficulty === 'Hard'
                      ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-600/30'
                      : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{language === 'ar' ? 'صعب' : 'Hard Mode'}</span>
                </button>
              </div>
            </div>

            {/* Step 3: Game Mode Selection (Blooket-inspired) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                  3
                </span>
                <h2 className="text-sm font-black text-slate-800">
                  {language === 'ar' ? 'نمط المسابقة واللعب' : 'Game Mode (Blooket Style)'}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Mode 1: Point Heist (Blooket-Style Steal Points) */}
                <button
                  type="button"
                  onClick={() => setMode('point_heist')}
                  className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer relative overflow-hidden ${
                    mode === 'point_heist'
                      ? 'border-purple-600 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100/60 shadow-md ring-2 ring-purple-500/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl animate-bounce">💎</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Blooket Steal Mode</span>
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'سرقة النقاط (Point Heist)' : 'Point Heist (Steal Mode)'}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">Fun ⚡</span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    {language === 'ar'
                      ? 'إجابة صحيحة تفتح صناديق لسرقة النقاط من زملائك، جمع الدروع الواقية ومضاعفة الرصيد!'
                      : 'Correct answers reveal mystery chests to steal points from classmates or shield yourself!'}
                  </p>
                </button>

                {/* Mode 2: Gold Quest */}
                <button
                  type="button"
                  onClick={() => setMode('gold_quest')}
                  className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                    mode === 'gold_quest'
                      ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">👑</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md">
                      Blooket Classic
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-slate-900">
                    {language === 'ar' ? 'كويست الذهب (Gold Quest)' : 'Gold Quest'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {language === 'ar'
                      ? 'صناديق مفاجآت غامضة بعد كل إجابة صحيحة لمضاعفة الذهب والدروع!'
                      : 'Mystery gold chests pop up after correct answers with multipliers & shields!'}
                  </p>
                </button>

                {/* Mode 3: Speed Sprint */}
                <button
                  type="button"
                  onClick={() => setMode('speed_sprint')}
                  className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                    mode === 'speed_sprint'
                      ? 'border-indigo-500 bg-indigo-50/70 shadow-md ring-2 ring-indigo-400/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">⚡</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-200/60 px-2 py-0.5 rounded-md">
                      Speed Sprint
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-slate-900">
                    {language === 'ar' ? 'سباق السرعة (Speed Sprint)' : 'Speed Sprint'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {language === 'ar'
                      ? 'سرعة الإجابة تمنح نقاطاً إضافية مع مكافآت السلسلة المتواصلة!'
                      : 'Faster responses earn dynamic score multipliers and streak bonuses.'}
                  </p>
                </button>

                {/* Mode 4: Paced Mastery */}
                <button
                  type="button"
                  onClick={() => setMode('mastery_paced')}
                  className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                    mode === 'mastery_paced'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                      Paced Mastery
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-slate-900">
                    {language === 'ar' ? 'إتقان الخطوة بخطوة' : 'Paced Mastery'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {language === 'ar'
                      ? 'حل هادئ ومريح بالسرعة الخاصة مع عرض شروحات الحل التفصيلية فوراً.'
                      : 'Self-paced practice with in-depth step-by-step reasoning after every question.'}
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Rules & Launch Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                  4
                </span>
                <h2 className="text-sm font-black text-slate-800">
                  {language === 'ar' ? 'قواعد وضوابط المسابقة' : 'Game Rules & Constraints'}
                </h2>
              </div>

              {/* Timer per question */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'مؤقت السؤال' : 'Timer per Question'}
                </label>
                <select
                  value={timeLimit}
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  className="select-modern text-xs font-bold w-full"
                >
                  <option value={0}>{language === 'ar' ? 'غير محدد (كل طالب بسرعته)' : 'Self-Paced (Untimed)'}</option>
                  <option value={20}>{language === 'ar' ? '20 ثانية / سؤال' : '20 Seconds per Q'}</option>
                  <option value={30}>{language === 'ar' ? '30 ثانية / سؤال' : '30 Seconds per Q'}</option>
                  <option value={45}>{language === 'ar' ? '45 ثانية / سؤال' : '45 Seconds per Q'}</option>
                  <option value={60}>{language === 'ar' ? '60 ثانية / سؤال' : '60 Seconds per Q'}</option>
                </select>
              </div>

              {/* Guest access */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {language === 'ar' ? 'السماح للضيوف' : 'Allow Guest Students'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {language === 'ar' ? 'الانضمام الفوري بلقب دون تسجيل' : 'Quick join with nickname'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowGuests}
                  onChange={e => setAllowGuests(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Step explanations */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {language === 'ar' ? 'عرض الشروحات' : 'Show Answer Explanations'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {language === 'ar' ? 'توضيح الحل بعد كل سؤال' : 'Educational step-by-step insight'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showExplanations}
                  onChange={e => setShowExplanations(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Streak multipliers */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {language === 'ar' ? 'مضاعف السلسلة المتواصلة' : 'Streak Multipliers (x2, x3)'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {language === 'ar' ? 'مكافأة الإجابات الصحيحة المتتالية' : 'Reward consecutive accuracy'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={streakMultipliers}
                  onChange={e => setStreakMultipliers(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Launch CTA Button */}
              <button
                type="button"
                onClick={handleLaunchGame}
                disabled={filteredQuestions.length === 0}
                className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group mt-2"
              >
                <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{language === 'ar' ? 'إنشاء رمز المسابقة وفتح صالة الانتظار 🚀' : 'Generate PIN & Launch Lobby 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: 2. LIVE LOBBY (WAITING FOR PLAYERS & QR CODE)
  // ----------------------------------------------------
  if (activeSession.status === 'lobby') {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const joinUrl = `${origin}/?joinPin=${activeSession.pin}`;

    return (
      <div className="min-h-[85vh] flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-slate-900 text-white rounded-3xl shadow-2xl relative overflow-hidden animate-viewFadeIn">
        {/* Top Bar Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-yellow-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight">{activeSession.title}</h1>
              <span className="text-xs text-slate-400 font-bold">
                {activeSession.exam} Track · {activeSession.questions.length} Questions · Mode: {activeSession.mode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundActive(toggleSound())}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={soundActive ? 'Mute sound' : 'Unmute sound'}
            >
              {soundActive ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Toggle Fullscreen Projector"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Cancel Game */}
            <button
              type="button"
              onClick={() => setActiveSession(null)}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>

        {/* Center: Gigantic PIN & QR Code Display for Classroom Smartboards */}
        <div className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left / Center PIN Box */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-start space-y-4">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-indigo-400">
              {language === 'ar' ? 'ادخل على المنصة واكتب رمز المسابقة' : 'Join at Prepline with Game PIN:'}
            </span>

            {/* Huge PIN */}
            <div className="inline-flex items-center gap-3 bg-slate-800/90 border-2 border-indigo-500/50 px-6 sm:px-8 py-3.5 rounded-3xl shadow-2xl">
              <span className="text-4xl sm:text-6xl font-black font-mono tracking-[0.25em] text-white">
                {activeSession.pin.slice(0, 3)} {activeSession.pin.slice(3)}
              </span>
              <button
                type="button"
                onClick={handleCopyPin}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md"
                title="Copy Game PIN"
              >
                {copiedPin ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Join Instructions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? (language === 'ar' ? 'تم نسخ الرابط!' : 'Copied Link!') : (language === 'ar' ? 'نسخ رابط الدخول المباشر' : 'Copy Direct Join Link')}</span>
              </button>

              <span className="text-xs text-slate-400 font-medium">
                {language === 'ar' ? 'أو امسح رمز الاستجابة السريعة (QR) بكاميرا الجوال أو الآيباد' : 'Or scan QR with any tablet or phone camera'}
              </span>
            </div>
          </div>

          {/* Right QR Code Box */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-indigo-500/40 flex flex-col items-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`Join Game PIN ${activeSession.pin}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12 animate-pulse" />
                </div>
              )}
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider mt-2">
                Scan to Join Live Game
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Joined Players Roster & Start Button */}
        <div className="border-t border-slate-800 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">
                    {playersList.length} / 25 {language === 'ar' ? 'طالباً في صالة الانتظار' : 'Scholars in Lobby'}
                  </span>
                  {playersList.length >= 25 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      {language === 'ar' ? 'مكتمل (25/25)' : 'LOBBY FULL (25/25)'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      {25 - playersList.length} {language === 'ar' ? 'مقعد متاح' : 'spots left'}
                    </span>
                  )}
                </div>
                <div className="w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-300 ${
                      playersList.length >= 25
                        ? 'bg-rose-500'
                        : playersList.length >= 20
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (playersList.length / 25) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartGame}
              disabled={playersList.length === 0}
              className="py-3.5 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{language === 'ar' ? 'بدء المسابقة الآن! (Start)' : 'Start Game Now!'}</span>
            </button>
          </div>

          {/* Player Badges Grid */}
          <div className="min-h-24 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex flex-wrap gap-2.5 items-center">
            {playersList.length === 0 ? (
              <div className="text-center w-full text-xs text-slate-500 font-medium py-3">
                {language === 'ar'
                  ? 'بانتظار انضمام الطلاب... اطلب منهم مسح رمز الـ QR أو إدخال الرمز'
                  : 'Waiting for scholars to join... Direct them to scan the QR code or enter the PIN.'}
              </div>
            ) : (
              playersList.map(player => {
                const mascot = MASCOTS.find(m => m.id === player.avatar) || MASCOTS[0];
                return (
                  <div
                    key={player.id}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-white shadow-sm animate-viewFadeIn"
                  >
                    <span className="text-lg">{mascot.emoji}</span>
                    <span className="truncate max-w-[120px]">{player.name}</span>
                    {player.isGuest && (
                      <span className="text-[10px] text-amber-400 font-semibold">(Guest)</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: 3. ACTIVE LIVE GAMEPLAY & LEADERBOARD
  // ----------------------------------------------------
  if (activeSession.status === 'active' || activeSession.status === 'paused') {
    const isPaused = activeSession.status === 'paused';

    return (
      <div className="space-y-6 animate-viewFadeIn">
        {/* Host Control Bar */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-yellow-300">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                <h1 className="text-lg font-black">{activeSession.title}</h1>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  PIN: {activeSession.pin}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {playersList.length} Scholars Active · Mode: {activeSession.mode === 'gold_quest' ? 'Gold Quest 👑' : activeSession.mode}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pause / Resume */}
            <button
              type="button"
              onClick={handleTogglePause}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              <span>{isPaused ? (language === 'ar' ? 'استئناف المسابقة' : 'Resume Game') : (language === 'ar' ? 'إيقاف مؤقت' : 'Pause Game')}</span>
            </button>

            {/* Award Class Gold Bonus */}
            {activeSession.mode === 'gold_quest' && (
              <button
                type="button"
                onClick={handleAwardClassBonus}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>+100 Class Gold</span>
              </button>
            )}

            {/* Fullscreen */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Projector Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* End Game Button */}
            <button
              type="button"
              onClick={handleEndGame}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>{language === 'ar' ? 'إنهاء المسابقة وعرض المنصة 🏆' : 'End & Reveal Podium 🏆'}</span>
            </button>
          </div>
        </div>

        {/* Live Podium Stand (Top 3) */}
        {top3.length > 0 && (
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/60">
            <div className="text-center mb-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">
                {language === 'ar' ? 'المتصدرون حالياً' : 'Live Arena Leaders'}
              </span>
              <h2 className="text-xl font-black mt-0.5">
                {language === 'ar' ? 'منصة الصدارة المباشرة' : 'Current Podium Standing'}
              </h2>
            </div>

            <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-xl mx-auto pt-4">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-3xl mb-1">
                    {MASCOTS.find(m => m.id === top3[1].avatar)?.emoji || '🐪'}
                  </span>
                  <span className="text-xs font-black text-slate-200 truncate max-w-full mb-1">
                    {top3[1].name}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 mb-2">
                    {activeSession.mode === 'gold_quest' ? `${top3[1].gold || 0} Gold` : `${top3[1].score} pts`}
                  </span>
                  <div className="w-full h-24 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-2xl flex items-center justify-center font-black text-2xl shadow-inner border-t-2 border-slate-300">
                    🥈 2
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="flex-1 flex flex-col items-center -mt-6">
                  <div className="relative">
                    <Crown className="w-6 h-6 text-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                    <span className="text-4xl mb-1 block">
                      {MASCOTS.find(m => m.id === top3[0].avatar)?.emoji || '🦅'}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-yellow-300 truncate max-w-full mb-1">
                    {top3[0].name}
                  </span>
                  <span className="text-xs font-black text-yellow-400 mb-2">
                    {activeSession.mode === 'gold_quest' ? `${top3[0].gold || 0} Gold` : `${top3[0].score} pts`}
                  </span>
                  <div className="w-full h-32 bg-gradient-to-t from-amber-600 to-yellow-500 rounded-t-2xl flex items-center justify-center font-black text-3xl shadow-lg border-t-2 border-yellow-200 text-amber-950">
                    🥇 1
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-3xl mb-1">
                    {MASCOTS.find(m => m.id === top3[2].avatar)?.emoji || '🌴'}
                  </span>
                  <span className="text-xs font-black text-slate-200 truncate max-w-full mb-1">
                    {top3[2].name}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 mb-2">
                    {activeSession.mode === 'gold_quest' ? `${top3[2].gold || 0} Gold` : `${top3[2].score} pts`}
                  </span>
                  <div className="w-full h-18 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-2xl flex items-center justify-center font-black text-xl shadow-inner border-t-2 border-amber-600">
                    🥉 3
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Arena Action Feed / Steal Ticker (Blooket Style) */}
        {activeSession.recentEvents && activeSession.recentEvents.length > 0 && (
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-3.5 shadow-xl flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 text-purple-300 text-xs font-black shrink-0 border border-purple-400/40 animate-pulse">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{language === 'ar' ? 'أحداث المعركة المباشرة' : 'Live Action Feed'}</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5 text-xs text-slate-200 font-medium">
              {activeSession.recentEvents.slice(0, 8).map(ev => (
                <div
                  key={ev.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 shrink-0 animate-viewFadeIn shadow-sm"
                >
                  <span className="text-sm">
                    {ev.type === 'steal'
                      ? '⚡'
                      : ev.type === 'shield_block'
                      ? '🛡️'
                      : ev.type === 'jackpot'
                      ? '👑'
                      : '🎁'}
                  </span>
                  <span className="font-bold text-white">
                    {language === 'ar' && ev.textAr ? ev.textAr : ev.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Class Real-time Leaderboard Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">
                {language === 'ar' ? 'سجل تقدم الطلاب المباشر' : 'Live Class Leaderboard & Accuracy'}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {playersList.filter(p => p.finished).length} / {playersList.length} {language === 'ar' ? 'أنهوا المسابقة' : 'Finished'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 font-black">#</th>
                  <th className="py-3 px-4 font-black">Player</th>
                  <th className="py-3 px-4 font-black text-right">Score</th>
                  {activeSession.mode === 'gold_quest' && (
                    <th className="py-3 px-4 font-black text-right">Gold</th>
                  )}
                  {activeSession.mode === 'point_heist' && (
                    <>
                      <th className="py-3 px-4 font-black text-center">Shields</th>
                      <th className="py-3 px-4 font-black text-center">Steals</th>
                    </>
                  )}
                  <th className="py-3 px-4 font-black text-center">Progress</th>
                  <th className="py-3 px-4 font-black text-center">Accuracy</th>
                  <th className="py-3 px-4 font-black text-right">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {playersList.map((player, idx) => {
                  const mascot = MASCOTS.find(m => m.id === player.avatar) || MASCOTS[0];
                  const totalQ = activeSession.questions.length;
                  const currentQ = Math.min(totalQ, player.currentQuestionIndex || 0);
                  const progressPct = totalQ > 0 ? Math.round((currentQ / totalQ) * 100) : 0;
                  const accPct = currentQ > 0 ? Math.round(((player.correctCount || 0) / currentQ) * 100) : 0;

                  return (
                    <tr key={player.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-600">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mascot.emoji}</span>
                          <span className="truncate max-w-[160px]">{player.name}</span>
                          {player.isGuest && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                              Guest
                            </span>
                          )}
                          {player.finished && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">
                              Done ✓
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-black text-indigo-700 text-right tabular-nums text-sm">
                        {player.score.toLocaleString()}
                      </td>
                      {activeSession.mode === 'gold_quest' && (
                        <td className="py-3 px-4 font-black text-amber-600 text-right tabular-nums text-sm">
                          🪙 {(player.gold || 0).toLocaleString()}
                        </td>
                      )}
                      {activeSession.mode === 'point_heist' && (
                        <>
                          <td className="py-3 px-4 text-center font-bold">
                            {(player.shields || 0) > 0 ? (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs">
                                🛡️ x{player.shields}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-purple-700">
                            {(player.stealsCount || 0) > 0 ? (
                              <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 font-black text-xs">
                                ⚡ {player.stealsCount}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                            {currentQ}/{totalQ}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          accPct >= 80 ? 'bg-emerald-100 text-emerald-800' : accPct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {accPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-right text-rose-600 tabular-nums">
                        {player.streak > 1 ? `🔥 ${player.streak}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: 4. GAME OVER & FINAL PODIUM CELEBRATION
  // ----------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-8 animate-viewFadeIn text-center">
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-indigo-700/50">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 font-black text-xs mb-4">
          <Crown className="w-4 h-4" />
          <span>{language === 'ar' ? 'انتهت المسابقة الصفية بنجاح!' : 'Game Over · Final Champions!'}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-2">
          {language === 'ar' ? 'منصة التتويج والأبطال 🏆' : 'The Victory Podium 🏆'}
        </h1>
        <p className="text-sm text-indigo-200 max-w-md mx-auto">
          {activeSession.title} · {playersList.length} {language === 'ar' ? 'مشارك في المسابقة' : 'Total Participants'}
        </p>

        {/* Podium Display */}
        <div className="flex items-end justify-center gap-4 sm:gap-8 max-w-xl mx-auto pt-10 pb-4">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-4xl mb-2">
                {MASCOTS.find(m => m.id === top3[1].avatar)?.emoji || '🐪'}
              </span>
              <span className="text-xs font-black text-slate-200 truncate max-w-full">
                {top3[1].name}
              </span>
              <span className="text-xs font-black text-yellow-400 mb-2">
                {activeSession.mode === 'gold_quest' ? `${top3[1].gold || 0} Gold` : `${top3[1].score} pts`}
              </span>
              <div className="w-full h-28 bg-gradient-to-t from-slate-600 to-slate-400 rounded-t-2xl flex items-center justify-center font-black text-3xl shadow-xl border-t-2 border-slate-200 text-white">
                🥈
              </div>
            </div>
          )}

          {/* 1st Place Champion */}
          {top3[0] && (
            <div className="flex-1 flex flex-col items-center -mt-8">
              <div className="relative">
                <Crown className="w-8 h-8 text-yellow-300 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
                <span className="text-5xl mb-2 block">
                  {MASCOTS.find(m => m.id === top3[0].avatar)?.emoji || '🦅'}
                </span>
              </div>
              <span className="text-sm font-black text-yellow-300 truncate max-w-full">
                {top3[0].name}
              </span>
              <span className="text-xs font-black text-yellow-400 mb-2">
                {activeSession.mode === 'gold_quest' ? `${top3[0].gold || 0} Gold` : `${top3[0].score} pts`}
              </span>
              <div className="w-full h-36 bg-gradient-to-t from-amber-600 to-yellow-500 rounded-t-2xl flex items-center justify-center font-black text-4xl shadow-2xl border-t-2 border-yellow-200 text-amber-950">
                🥇
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-4xl mb-2">
                {MASCOTS.find(m => m.id === top3[2].avatar)?.emoji || '🌴'}
              </span>
              <span className="text-xs font-black text-slate-200 truncate max-w-full">
                {top3[2].name}
              </span>
              <span className="text-xs font-black text-yellow-400 mb-2">
                {activeSession.mode === 'gold_quest' ? `${top3[2].gold || 0} Gold` : `${top3[2].score} pts`}
              </span>
              <div className="w-full h-20 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-2xl flex items-center justify-center font-black text-2xl shadow-xl border-t-2 border-amber-600 text-white">
                🥉
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSession(null)}
            className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{language === 'ar' ? 'استضافة مسابقة جديدة' : 'Host Another Game'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            {language === 'ar' ? 'العودة للوحة المعلم' : 'Return to Teacher Console'}
          </button>
        </div>
      </div>
    </div>
  );
};
