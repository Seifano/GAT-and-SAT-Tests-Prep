import React, { useState, useEffect, useRef } from 'react';
import {
  LiveGameSession,
  GamePlayer,
  Question,
  UserAccount
} from '../types';
import {
  subscribeToGameSession,
  updatePlayerProgressInDb
} from '../firebase';
import { Language, t } from '../utils/i18n';
import {
  playCorrectSound,
  playIncorrectSound,
  playCelebrationSound
} from '../utils/soundEffects';
import { MASCOTS } from './JoinGameModal';
import {
  Gamepad2,
  Flame,
  Award,
  Crown,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Clock,
  Shield,
  Coins,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  LogOut
} from 'lucide-react';

interface LiveGamePlayViewProps {
  pin: string;
  initialPlayer: GamePlayer;
  user: UserAccount | null;
  onExit: () => void;
  language?: Language;
}

// Blooket Mystery Chest rewards
const CHEST_REWARDS = [
  { label: '+50 Gold', gold: 50, bonusScore: 50, icon: '🪙', color: 'from-amber-400 to-yellow-600' },
  { label: '+100 Gold!', gold: 100, bonusScore: 100, icon: '💰', color: 'from-yellow-400 to-amber-600' },
  { label: 'Diamond Bonus (+150)!', gold: 150, bonusScore: 200, icon: '💎', color: 'from-cyan-400 to-blue-600' },
  { label: 'Golden Shield (+80)', gold: 80, bonusScore: 80, icon: '🛡️', color: 'from-indigo-400 to-purple-600' },
  { label: 'Jackpot Chest (+250)!', gold: 250, bonusScore: 300, icon: '👑', color: 'from-amber-500 to-rose-600' }
];

export const LiveGamePlayView: React.FC<LiveGamePlayViewProps> = ({
  pin,
  initialPlayer,
  user,
  onExit,
  language = 'en'
}) => {
  const [session, setSession] = useState<LiveGameSession | null>(null);
  const [player, setPlayer] = useState<GamePlayer>(initialPlayer);
  const [currentQIndex, setCurrentQIndex] = useState(initialPlayer.currentQuestionIndex || 0);

  // Question interaction state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [chestOpenedIndex, setChestOpenedIndex] = useState<number | null>(null);
  const [revealedReward, setRevealedReward] = useState<typeof CHEST_REWARDS[0] | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Real-time Firestore subscription to the active game session
  useEffect(() => {
    const unsub = subscribeToGameSession(pin, updatedSession => {
      if (updatedSession) {
        setSession(updatedSession);
        // Sync player status from Firestore if updated externally
        if (updatedSession.players && updatedSession.players[player.id]) {
          const syncedPlayer = updatedSession.players[player.id];
          setPlayer(prev => ({
            ...prev,
            score: syncedPlayer.score,
            gold: syncedPlayer.gold
          }));
        }
      }
    });

    return () => unsub();
  }, [pin, player.id]);

  const questions: Question[] = session?.questions || [];
  const currentQuestion: Question | undefined = questions[currentQIndex];
  const mascot = MASCOTS.find(m => m.id === player.avatar) || MASCOTS[0];

  // Question Timer countdown if time limit is configured
  useEffect(() => {
    if (!session || session.status !== 'active' || hasAnswered) return;
    const limit = session.ruleSettings?.timeLimitSeconds || 0;
    if (limit <= 0) return;

    setTimeLeft(limit);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQIndex, session?.status, hasAnswered]);

  const handleTimeExpired = () => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setIsCorrect(false);
    playIncorrectSound();

    const updatedPlayer: GamePlayer = {
      ...player,
      streak: 0,
      answers: {
        ...player.answers,
        [currentQIndex]: -1
      }
    };
    setPlayer(updatedPlayer);
    updatePlayerProgressInDb(pin, updatedPlayer).catch(console.error);
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedOption(idx);
    setHasAnswered(true);

    const correct = idx === currentQuestion.answer;
    setIsCorrect(correct);

    if (correct) {
      playCorrectSound();
      const currentStreak = player.streak + 1;
      const highestStreak = Math.max(player.highestStreak || 0, currentStreak);
      const multiplier = session?.ruleSettings?.streakMultipliers
        ? currentStreak >= 5
          ? 2.5
          : currentStreak >= 3
          ? 1.8
          : currentStreak >= 2
          ? 1.4
          : 1
        : 1;

      const basePts = session?.ruleSettings?.basePoints || 100;
      const earnedScore = Math.round(basePts * multiplier);
      const earnedGold = Math.round(20 * multiplier);

      const updatedPlayer: GamePlayer = {
        ...player,
        score: player.score + earnedScore,
        gold: (player.gold || 0) + earnedGold,
        correctCount: player.correctCount + 1,
        streak: currentStreak,
        highestStreak,
        answers: {
          ...player.answers,
          [currentQIndex]: idx
        }
      };

      setPlayer(updatedPlayer);
      updatePlayerProgressInDb(pin, updatedPlayer).catch(console.error);

      // Trigger Blooket mystery chest reward if in gold_quest mode
      if (session?.mode === 'gold_quest') {
        setTimeout(() => {
          setShowChestModal(true);
          setChestOpenedIndex(null);
          setRevealedReward(null);
        }, 500);
      }
    } else {
      playIncorrectSound();
      const updatedPlayer: GamePlayer = {
        ...player,
        streak: 0,
        answers: {
          ...player.answers,
          [currentQIndex]: idx
        }
      };
      setPlayer(updatedPlayer);
      updatePlayerProgressInDb(pin, updatedPlayer).catch(console.error);
    }
  };

  const handlePickChest = (chestIdx: number) => {
    if (chestOpenedIndex !== null) return;
    setChestOpenedIndex(chestIdx);

    // Pick random reward
    const reward = CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)];
    setRevealedReward(reward);
    playCelebrationSound();

    const updatedPlayer: GamePlayer = {
      ...player,
      score: player.score + reward.bonusScore,
      gold: (player.gold || 0) + reward.gold
    };
    setPlayer(updatedPlayer);
    updatePlayerProgressInDb(pin, updatedPlayer).catch(console.error);
  };

  const handleNextQuestion = () => {
    setShowChestModal(false);
    setSelectedOption(null);
    setHasAnswered(false);
    setShowExplanation(false);

    const nextIndex = currentQIndex + 1;
    setCurrentQIndex(nextIndex);

    const isFinished = nextIndex >= questions.length;
    const updatedPlayer: GamePlayer = {
      ...player,
      currentQuestionIndex: nextIndex,
      finished: isFinished
    };
    setPlayer(updatedPlayer);
    updatePlayerProgressInDb(pin, updatedPlayer).catch(console.error);

    if (isFinished) {
      playCelebrationSound();
    }
  };

  // ----------------------------------------------------
  // RENDER: LOBBY STATE (Waiting for teacher to start)
  // ----------------------------------------------------
  if (!session || session.status === 'lobby') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-900 text-white rounded-3xl animate-viewFadeIn">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600/30 border border-indigo-400/40 shadow-inner mb-4">
            <span className="text-4xl animate-bounce">{mascot.emoji}</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            {language === 'ar' ? 'أنت داخل صالة الانتظار!' : "You're In the Arena!"}
          </h1>
          <p className="text-sm font-bold text-yellow-300 mt-1">
            {player.name} {player.isGuest && '(Guest)'}
          </p>

          <div className="my-6 p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400 block">
              {session?.title || 'Classroom Arena'}
            </span>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{language === 'ar' ? 'بانتظار بدء المعلم للمسابقة...' : 'Waiting for host teacher to start...'}</span>
            </div>
            <span className="text-[11px] text-slate-500 block pt-1">
              Game PIN: <span className="font-mono font-bold text-slate-300">{pin}</span>
            </span>
          </div>

          <div className="p-3 bg-indigo-950/50 rounded-xl border border-indigo-800/50 text-[11px] text-indigo-200">
            💡 {language === 'ar' ? 'نصيحة: الإجابات السريعة والمتتالية تمنحك مضاعفات نقاط وصناديق ذهب أعلى!' : 'Pro Tip: Fast & streak answers award score multipliers and mystery treasure chests!'}
          </div>

          <button
            type="button"
            onClick={onExit}
            className="mt-6 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مغادرة الغرفة' : 'Leave Game'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: FINISHED ALL QUESTIONS OR GAME OVER
  // ----------------------------------------------------
  if (currentQIndex >= questions.length || session.status === 'completed') {
    const accuracy = questions.length > 0 ? Math.round((player.correctCount / questions.length) * 100) : 0;
    const allPlayers = Object.values(session.players || {}).sort((a, b) => {
      if (session.mode === 'gold_quest') return (b.gold || 0) - (a.gold || 0);
      return b.score - a.score;
    });
    const myRank = allPlayers.findIndex(p => p.id === player.id) + 1;

    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 animate-viewFadeIn text-center">
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-indigo-700/60 relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-yellow-400/20 border border-yellow-400/30 text-3xl mb-3 shadow-inner">
            {mascot.emoji}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'أكملت كافة الأسئلة بنجاح!' : 'All Questions Completed!'}</span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">
            {language === 'ar' ? 'نتيجتك النهائية في المسابقة' : 'Your Arena Scorecard'}
          </h1>
          <p className="text-xs text-indigo-200 mt-1">
            {player.name} · {session.title}
          </p>

          {/* Current Rank Badge */}
          {myRank > 0 && (
            <div className="my-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <Crown className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-black text-white">
                {language === 'ar' ? `المركز #${myRank} من أصل ${allPlayers.length} مشارك` : `Rank #${myRank} of ${allPlayers.length} Scholars`}
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-6">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-black text-yellow-300 tabular-nums block">
                {player.score.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {t('score', language)}
              </span>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums block">
                🪙 {(player.gold || 0).toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {t('gold', language)}
              </span>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums block">
                {player.correctCount}/{questions.length}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {language === 'ar' ? 'صحيحة' : 'Correct'}
              </span>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-black text-cyan-300 tabular-nums block">
                {accuracy}%
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {language === 'ar' ? 'الدقة' : 'Accuracy'}
              </span>
            </div>
          </div>

          {/* Return button */}
          <button
            type="button"
            onClick={onExit}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
          >
            {language === 'ar' ? 'العودة للمنصة الرئيسية' : 'Return to Main Platform'}
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: ACTIVE QUESTION GAMEPLAY SCREEN
  // ----------------------------------------------------
  const progressPercent = Math.round(((currentQIndex) / questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-viewFadeIn select-none">
      {/* Top HUD: Score, Streak, Progress Bar & Mascot */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Player Badge */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mascot.emoji}</span>
            <div>
              <span className="text-xs font-black block text-white truncate max-w-[120px]">{player.name}</span>
              <span className="text-[10px] font-bold text-indigo-400 block">
                Q {currentQIndex + 1} of {questions.length}
              </span>
            </div>
          </div>

          {/* Timer bar if active */}
          {session.ruleSettings?.timeLimitSeconds > 0 && !hasAnswered && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-black text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}

          {/* Streak & Gold / Score */}
          <div className="flex items-center gap-3">
            {player.streak > 1 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black animate-pulse">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>x{player.streak}</span>
              </div>
            )}

            <div className="text-right">
              <span className="text-xs sm:text-sm font-black text-yellow-300 tabular-nums block">
                {session.mode === 'gold_quest' ? `🪙 ${(player.gold || 0).toLocaleString()} Gold` : `${player.score.toLocaleString()} pts`}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block">
                {player.score} pts
              </span>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Question Meta Badge */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black">
              {currentQuestion.section} · {currentQuestion.skill}
            </span>

            {hasAnswered && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{isCorrect ? (language === 'ar' ? 'إجابة صحيحة! +100' : 'Correct! +100 pts') : (language === 'ar' ? 'إجابة غير صحيحة' : 'Incorrect')}</span>
              </div>
            )}
          </div>

          {/* Reading passage if present */}
          {currentQuestion.passage && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed font-serif max-h-48 overflow-y-auto">
              {currentQuestion.passage}
            </div>
          )}

          {/* Prompt */}
          <h2 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
            {currentQuestion.prompt}
          </h2>

          {/* SVG Diagram if present */}
          {currentQuestion.figureSvg && (
            <div
              className="my-3 flex justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: currentQuestion.figureSvg }}
            />
          )}

          {/* Options Grid (Blooket-style colorful 4-option cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {currentQuestion.options.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const isSelected = selectedOption === idx;
              const isThisCorrect = idx === currentQuestion.answer;

              // Color styles
              let cardStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';
              if (hasAnswered) {
                if (isThisCorrect) {
                  cardStyle = 'bg-emerald-500 border-emerald-600 text-white shadow-lg ring-2 ring-emerald-300';
                } else if (isSelected) {
                  cardStyle = 'bg-rose-500 border-rose-600 text-white shadow-lg';
                } else {
                  cardStyle = 'bg-slate-50 opacity-40 border-slate-200 text-slate-500';
                }
              } else {
                // Fun Blooket color accent for each choice
                if (idx === 0) cardStyle = 'bg-rose-50/60 hover:bg-rose-100/80 border-rose-200 hover:border-rose-400 text-slate-900';
                if (idx === 1) cardStyle = 'bg-blue-50/60 hover:bg-blue-100/80 border-blue-200 hover:border-blue-400 text-slate-900';
                if (idx === 2) cardStyle = 'bg-amber-50/60 hover:bg-amber-100/80 border-amber-200 hover:border-amber-400 text-slate-900';
                if (idx === 3) cardStyle = 'bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-200 hover:border-emerald-400 text-slate-900';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={hasAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-center gap-3.5 group relative ${cardStyle}`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-transform ${
                    hasAnswered
                      ? isThisCorrect || isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-600'
                      : 'bg-white shadow-xs group-hover:scale-110'
                  }`}>
                    {letter}
                  </span>

                  <span className="text-xs sm:text-sm font-bold flex-1 leading-snug">
                    {opt}
                  </span>

                  {hasAnswered && isThisCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  )}
                  {hasAnswered && isSelected && !isThisCorrect && (
                    <XCircle className="w-5 h-5 text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Proceed Action */}
          {hasAnswered && (
            <div className="pt-4 border-t border-slate-100 space-y-4 animate-viewFadeIn">
              {/* Optional Step-by-Step Educational Explanation */}
              {session.ruleSettings?.showExplanations && currentQuestion.explain && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <button
                    type="button"
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="flex items-center justify-between w-full text-xs font-black text-indigo-700 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      <span>{language === 'ar' ? 'عرض توضيح وشرح الحل' : 'View Step-by-Step Solution'}</span>
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showExplanation ? 'rotate-90' : ''}`} />
                  </button>

                  {showExplanation && (
                    <p className="text-xs text-slate-700 mt-2.5 leading-relaxed border-t border-slate-200/80 pt-2 font-medium">
                      {currentQuestion.explain}
                    </p>
                  )}
                </div>
              )}

              {/* Next Question Button */}
              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>{language === 'ar' ? 'السؤال التالي ←' : 'Next Question →'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Blooket Mystery Chest Reward Modal (Gold Quest mode) */}
      {showChestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-viewFadeIn">
          <div className="max-w-md w-full bg-slate-900 border-2 border-yellow-500/40 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-black mb-2">
              <Crown className="w-3.5 h-3.5" />
              <span>{t('pickChest', language)}</span>
            </div>

            <h2 className="text-2xl font-black text-white">
              {language === 'ar' ? 'اختر صندوق الكنز الذهبي!' : 'Pick a Mystery Chest!'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 mb-6">
              {language === 'ar' ? 'إجابتك صحيحة! اختر واحداً من الصناديق لمضاعفة أرباحك' : 'Correct answer streak! Choose a treasure chest to claim your prize.'}
            </p>

            {/* 3 Mystery Chests */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 my-4">
              {[0, 1, 2].map(cIdx => {
                const isThisOpened = chestOpenedIndex === cIdx;
                const anyOpened = chestOpenedIndex !== null;

                return (
                  <button
                    key={cIdx}
                    type="button"
                    disabled={anyOpened}
                    onClick={() => handlePickChest(cIdx)}
                    className={`h-36 sm:h-40 rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${
                      isThisOpened
                        ? 'bg-gradient-to-b from-amber-500 to-yellow-600 border-yellow-300 shadow-2xl scale-105'
                        : anyOpened
                        ? 'bg-slate-800 border-slate-700 opacity-50'
                        : 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-400/40 hover:border-yellow-400 hover:scale-105 shadow-lg'
                    }`}
                  >
                    {isThisOpened && revealedReward ? (
                      <div className="animate-viewFadeIn text-center">
                        <span className="text-4xl block mb-1">{revealedReward.icon}</span>
                        <span className="text-xs font-black text-white leading-tight block">
                          {revealedReward.label}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-4xl sm:text-5xl animate-bounce mb-2">🎁</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                          Chest #{cIdx + 1}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Claim Reward Button */}
            {chestOpenedIndex !== null && (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
              >
                <span>{language === 'ar' ? 'استلام المكافأة والمتابعة ←' : 'Claim Reward & Continue →'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
