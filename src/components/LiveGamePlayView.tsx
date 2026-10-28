import React, { useState, useEffect, useRef } from 'react';
import {
  LiveGameSession,
  GamePlayer,
  Question,
  UserAccount,
  GameLiveEvent
} from '../types';
import {
  subscribeToGameSession,
  updatePlayerProgressInDb,
  executeStealPointsInDb,
  broadcastGameEventInDb
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
  LogOut,
  Zap,
  Swords,
  ShieldAlert
} from 'lucide-react';

interface LiveGamePlayViewProps {
  pin: string;
  initialPlayer: GamePlayer;
  user: UserAccount | null;
  onExit: () => void;
  language?: Language;
}

export interface ChestRewardItem {
  type: 'steal' | 'shield' | 'bonus' | 'jackpot';
  label: string;
  labelAr: string;
  bonusScore: number;
  gold: number;
  icon: string;
  color: string;
}

// Blooket Mystery Chest rewards
const CLASSIC_CHEST_REWARDS: ChestRewardItem[] = [
  { type: 'bonus', label: '+50 Gold', labelAr: '+50 ذهب', gold: 50, bonusScore: 50, icon: '🪙', color: 'from-amber-400 to-yellow-600' },
  { type: 'bonus', label: '+100 Gold!', labelAr: '+100 ذهب!', gold: 100, bonusScore: 100, icon: '💰', color: 'from-yellow-400 to-amber-600' },
  { type: 'bonus', label: 'Diamond Bonus (+150)!', labelAr: 'مكافأة الماس (+150)!', gold: 150, bonusScore: 200, icon: '💎', color: 'from-cyan-400 to-blue-600' },
  { type: 'shield', label: 'Energy Shield (+80)', labelAr: 'درع طاقة (+80)', gold: 80, bonusScore: 80, icon: '🛡️', color: 'from-indigo-400 to-purple-600' },
  { type: 'jackpot', label: 'Jackpot Chest (+250)!', labelAr: 'كنز الجائزة الكبرى (+250)!', gold: 250, bonusScore: 300, icon: '👑', color: 'from-amber-500 to-rose-600' }
];

// Point Heist Steal Mode Chest Rewards (Blooket Style)
const HEIST_CHEST_REWARDS: ChestRewardItem[] = [
  { type: 'steal', label: 'Steal Points 🏴‍☠️!', labelAr: 'سرقة نقاط من منافس 🏴‍☠️!', bonusScore: 0, gold: 0, icon: '⚡', color: 'from-purple-600 to-indigo-800' },
  { type: 'shield', label: 'Energy Shield 🛡️!', labelAr: 'درع حماية ضد السرقة 🛡️!', bonusScore: 50, gold: 50, icon: '🛡️', color: 'from-blue-500 to-indigo-700' },
  { type: 'steal', label: 'Point Heist 💎 (Steal 15%)!', labelAr: 'سطو على النقاط 💎 (15%)!', bonusScore: 0, gold: 0, icon: '🏴‍☠️', color: 'from-rose-500 to-purple-700' },
  { type: 'jackpot', label: 'Jackpot Chest (+250)!', labelAr: 'كنز مفاجئ (+250 نقطة)!', bonusScore: 250, gold: 150, icon: '👑', color: 'from-amber-400 to-yellow-600' },
  { type: 'bonus', label: 'Golden Loot (+120)', labelAr: 'غنائم ذهبية (+120)!', bonusScore: 120, gold: 100, icon: '💰', color: 'from-yellow-400 to-amber-600' },
  { type: 'shield', label: 'Reflective Shield 🛡️!', labelAr: 'درع دفاعي متين 🛡️!', bonusScore: 60, gold: 50, icon: '🛡️', color: 'from-teal-500 to-emerald-700' }
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
  const [revealedReward, setRevealedReward] = useState<ChestRewardItem | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Point Stealing Modal & Status
  const [showStealPicker, setShowStealPicker] = useState(false);
  const [stealResult, setStealResult] = useState<{ message: string; messageAr: string; success: boolean } | null>(null);
  const [isExecutingSteal, setIsExecutingSteal] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState<{ text: string; icon: string } | null>(null);
  const lastProcessedEventId = useRef<string | null>(null);

  // Real-time Firestore subscription to the active game session
  useEffect(() => {
    const unsub = subscribeToGameSession(pin, updatedSession => {
      if (updatedSession) {
        setSession(updatedSession);
        // Sync player status from Firestore if updated externally (points stolen or shields consumed)
        if (updatedSession.players && updatedSession.players[player.id]) {
          const syncedPlayer = updatedSession.players[player.id];
          setPlayer(prev => ({
            ...prev,
            score: syncedPlayer.score,
            gold: syncedPlayer.gold,
            shields: syncedPlayer.shields,
            stealsCount: syncedPlayer.stealsCount,
            pointsStolen: syncedPlayer.pointsStolen
          }));
        }

        // Real-time notification if another student stole from this player or if shield deflected it
        if (updatedSession.recentEvents && updatedSession.recentEvents.length > 0) {
          const latestEvent = updatedSession.recentEvents[0];
          if (latestEvent.id !== lastProcessedEventId.current) {
            lastProcessedEventId.current = latestEvent.id;
            if (latestEvent.targetId === player.id) {
              if (latestEvent.type === 'steal') {
                playIncorrectSound();
                setIncomingAlert({
                  text: language === 'ar'
                    ? `⚠️ ${latestEvent.actorName} سرق منك ${latestEvent.amount} نقطة! أجب سريعاً لتعويضها!`
                    : `⚠️ ${latestEvent.actorName} stole ${latestEvent.amount} points from you! Keep answering to get revenge!`,
                  icon: '⚡'
                });
                setTimeout(() => setIncomingAlert(null), 5500);
              } else if (latestEvent.type === 'shield_block') {
                playCelebrationSound();
                setIncomingAlert({
                  text: language === 'ar'
                    ? `🛡️ درع الحماية الخاص بك صد محاولة سرقة نقاط من ${latestEvent.actorName}!`
                    : `🛡️ Your Energy Shield deflected a point steal from ${latestEvent.actorName}!`,
                  icon: '🛡️'
                });
                setTimeout(() => setIncomingAlert(null), 5500);
              }
            }
          }
        }
      }
    });

    return () => unsub();
  }, [pin, player.id, language]);

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

      // Trigger Blooket mystery chest reward if in gold_quest or point_heist mode
      const isChestMode =
        session?.mode === 'gold_quest' ||
        session?.mode === 'point_heist' ||
        session?.ruleSettings?.powerChestRewards;

      if (isChestMode) {
        setTimeout(() => {
          setShowChestModal(true);
          setChestOpenedIndex(null);
          setRevealedReward(null);
          setShowStealPicker(false);
          setStealResult(null);
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

    const isHeist = session?.mode === 'point_heist' || session?.ruleSettings?.stealPointsEnabled;
    const pool = isHeist ? HEIST_CHEST_REWARDS : CLASSIC_CHEST_REWARDS;
    const reward = pool[Math.floor(Math.random() * pool.length)];
    setRevealedReward(reward);
    playCelebrationSound();

    if (reward.type === 'steal') {
      // Prompt student to pick an opponent to steal points from!
      setShowStealPicker(true);
    } else if (reward.type === 'shield') {
      // Award Energy Shield to defend against future incoming point thefts!
      const updatedPlayer: GamePlayer = {
        ...player,
        shields: (player.shields || 0) + 1,
        score: player.score + reward.bonusScore,
        gold: (player.gold || 0) + reward.gold
      };
      setPlayer(updatedPlayer);
      updatePlayerProgressInDb(pin, updatedPlayer).catch(console.error);

      // Broadcast shield event
      const event: GameLiveEvent = {
        id: `shield_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        type: 'chest',
        actorId: player.id,
        actorName: player.name,
        actorAvatar: player.avatar,
        text: `🛡️ ${player.name} obtained an Energy Shield!`,
        textAr: `🛡️ حصل ${player.name} على درع حماية!`
      };
      broadcastGameEventInDb(pin, event).catch(console.error);
    } else {
      // Direct bonus score or jackpot
      const updatedPlayer: GamePlayer = {
        ...player,
        score: player.score + reward.bonusScore,
        gold: (player.gold || 0) + reward.gold
      };
      setPlayer(updatedPlayer);
      updatePlayerProgressInDb(pin, updatedPlayer).catch(console.error);

      if (reward.type === 'jackpot') {
        const event: GameLiveEvent = {
          id: `jackpot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          type: 'jackpot',
          actorId: player.id,
          actorName: player.name,
          actorAvatar: player.avatar,
          amount: reward.bonusScore,
          text: `👑 ${player.name} discovered a Jackpot Chest (+${reward.bonusScore})!`,
          textAr: `👑 عثر ${player.name} على صندوق الجائزة الكبرى (+${reward.bonusScore})!`
        };
        broadcastGameEventInDb(pin, event).catch(console.error);
      }
    }
  };

  // Balanced Point Steal Execution against an opponent
  const handleExecuteSteal = async (target: GamePlayer) => {
    if (isExecutingSteal || !session) return;
    setIsExecutingSteal(true);

    const isTargetShielded = (target.shields || 0) > 0;
    // Balanced steal calculation: 15% of opponent's score, bounded between 50 and 250 points max
    const calculatedSteal = Math.min(250, Math.max(50, Math.round((target.score || 100) * 0.15)));
    const stealAmount = isTargetShielded ? 0 : calculatedSteal;

    const event: GameLiveEvent = {
      id: `steal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type: isTargetShielded ? 'shield_block' : 'steal',
      actorId: player.id,
      actorName: player.name,
      actorAvatar: player.avatar,
      targetId: target.id,
      targetName: target.name,
      targetAvatar: target.avatar,
      amount: stealAmount,
      text: isTargetShielded
        ? `🛡️ ${target.name}'s Energy Shield deflected a point steal from ${player.name}!`
        : `⚡ ${player.name} stole ${stealAmount} points from ${target.name}!`,
      textAr: isTargetShielded
        ? `🛡️ صد درع ${target.name} محاولة سرقة نقاط من ${player.name}!`
        : `⚡ سرق ${player.name} ${stealAmount} نقطة من ${target.name}!`
    };

    if (isTargetShielded) {
      playIncorrectSound();
      setStealResult({
        success: false,
        message: `🛡️ DEFLECTED! ${target.name} had an Energy Shield active. No points stolen!`,
        messageAr: `🛡️ تم صد الهجوم! كان لدى ${target.name} درع حماية نشط، تم حماية نقاطه بنجاح.`
      });
    } else {
      playCelebrationSound();
      setStealResult({
        success: true,
        message: `⚡ HEIST SUCCESSFUL! You stole +${stealAmount} points from ${target.name}!`,
        messageAr: `⚡ تم السطو بنجاح! سرقت +${stealAmount} نقطة من ${target.name}!`
      });
    }

    await executeStealPointsInDb(pin, player, target, stealAmount, isTargetShielded, event);
    setIsExecutingSteal(false);
  };

  // Solo testing loot cache fallback if playing alone
  const handleSoloLoot = () => {
    const soloBonus = 150;
    const updatedPlayer: GamePlayer = {
      ...player,
      score: player.score + soloBonus,
      gold: (player.gold || 0) + 100
    };
    setPlayer(updatedPlayer);
    updatePlayerProgressInDb(pin, updatedPlayer).catch(console.error);
    setStealResult({
      success: true,
      message: `Solo Arena Loot: +${soloBonus} bonus points added to your score!`,
      messageAr: `غنائم الساحة الفردية: تم إضافة +${soloBonus} نقطة إلى رصيدك!`
    });
  };

  const handleNextQuestion = () => {
    setShowChestModal(false);
    setShowStealPicker(false);
    setStealResult(null);
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
      {/* Real-time Incoming Attack / Shield Deflection Alert Banner */}
      {incomingAlert && (
        <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-2 border-purple-500/80 rounded-2xl text-white text-xs font-black shadow-2xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{incomingAlert.icon}</span>
            <span className="text-sm font-extrabold text-white leading-tight">
              {incomingAlert.text}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIncomingAlert(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

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

          {/* Shields, Streak & Gold / Score */}
          <div className="flex items-center gap-2.5">
            {/* Active Shields Counter */}
            {(player.shields || 0) > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-black shadow-inner animate-pulse">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>x{player.shields}</span>
              </div>
            )}

            {/* Steals Performed Counter */}
            {(player.stealsCount || 0) > 0 && (
              <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>{player.stealsCount} steals</span>
              </div>
            )}

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

      {/* Blooket Mystery Chest & Point Heist Steal Modal */}
      {showChestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-viewFadeIn">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-yellow-500/40 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-black mb-2">
              <Crown className="w-3.5 h-3.5" />
              <span>{t('pickChest', language)}</span>
            </div>

            {/* Steal Mode Interactive Target Picker */}
            {revealedReward?.type === 'steal' && !stealResult ? (
              <div className="space-y-4 animate-viewFadeIn">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-3xl shadow-inner mx-auto mb-1">
                  ⚡
                </div>
                <h2 className="text-2xl font-black text-white">
                  {language === 'ar' ? 'اختر منافساً لسرقة النقاط! 🏴‍☠️' : 'Point Heist: Pick a Target! 🏴‍☠️'}
                </h2>
                <p className="text-xs text-slate-300">
                  {language === 'ar'
                    ? 'اختر أحد زملائك في الغرفة لسرقة 15% من نقاطه! احذر من الدروع الواقية 🛡️'
                    : 'Choose a classmate in the arena to steal 15% of their points! Watch out for Energy Shields!'}
                </p>

                {/* Opponents List */}
                <div className="space-y-2 max-h-56 overflow-y-auto my-3 pr-1">
                  {Object.values(session?.players || {})
                    .filter(p => p.id !== player.id)
                    .map(opp => {
                      const oppMascot = MASCOTS.find(m => m.id === opp.avatar) || MASCOTS[0];
                      const isShielded = (opp.shields || 0) > 0;

                      return (
                        <button
                          key={opp.id}
                          type="button"
                          disabled={isExecutingSteal}
                          onClick={() => handleExecuteSteal(opp)}
                          className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-400/60 flex items-center justify-between transition-all cursor-pointer group active:scale-98 shadow-sm text-start"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl group-hover:scale-110 transition-transform">
                              {oppMascot.emoji}
                            </span>
                            <div>
                              <span className="text-xs font-black text-white block">
                                {opp.name} {opp.isGuest && '(Guest)'}
                              </span>
                              <span className="text-[11px] font-bold text-amber-300">
                                {opp.score.toLocaleString()} pts
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isShielded ? (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[10px] font-black flex items-center gap-1">
                                <Shield className="w-3 h-3 text-blue-400" />
                                <span>{language === 'ar' ? 'محمي بدرع' : 'Shielded'}</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-xl bg-purple-600 group-hover:bg-purple-500 text-white text-xs font-black shadow-xs flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-300" />
                                <span>{language === 'ar' ? 'سرقة 15%' : 'Steal 15%'}</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}

                  {Object.values(session?.players || {}).filter(p => p.id !== player.id).length === 0 && (
                    <div className="py-6 px-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-center space-y-3">
                      <p className="text-xs text-slate-300 font-bold">
                        {language === 'ar' ? 'لا يوجد منافسين آخرين في الغرفة حالياً' : 'No other opponents in the room right now'}
                      </p>
                      <button
                        type="button"
                        onClick={handleSoloLoot}
                        className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
                      >
                        {language === 'ar' ? 'استلام غنائم الساحة (+150 نقطة) 🎁' : 'Claim Solo Loot Cache (+150 pts) 🎁'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : stealResult ? (
              /* Steal Result Announcement */
              <div className="space-y-4 animate-viewFadeIn py-2">
                <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-lg ${
                  stealResult.success ? 'bg-emerald-500/20 border border-emerald-400/30' : 'bg-blue-500/20 border border-blue-400/30'
                }`}>
                  {stealResult.success ? '⚡' : '🛡️'}
                </div>

                <h2 className="text-xl font-black text-white">
                  {stealResult.success
                    ? (language === 'ar' ? 'تمت العملية بنجاح! 🎉' : 'Heist Successful! 🎉')
                    : (language === 'ar' ? 'تم صد الهجوم! 🛡️' : 'Deflected by Shield! 🛡️')}
                </h2>

                <p className="text-xs text-slate-200 leading-relaxed font-bold bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700">
                  {language === 'ar' ? stealResult.messageAr : stealResult.message}
                </p>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{language === 'ar' ? 'المتابعة للسؤال التالي ←' : 'Continue to Next Question →'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Standard 3 Chests Picker */
              <>
                <h2 className="text-2xl font-black text-white">
                  {session?.mode === 'point_heist'
                    ? (language === 'ar' ? 'صناديق السطو والدروع الغامضة!' : 'Pick a Point Heist Chest!')
                    : (language === 'ar' ? 'اختر صندوق الكنز الذهبي!' : 'Pick a Mystery Chest!')}
                </h2>
                <p className="text-xs text-slate-300 mt-1 mb-6">
                  {session?.mode === 'point_heist'
                    ? (language === 'ar' ? 'إجابتك صحيحة! قد تحصل على سرقة نقاط، درع حماية، أو كنز نقاط!' : 'Correct! You can uncover a Point Steal, Energy Shield, or Gold Cache!')
                    : (language === 'ar' ? 'إجابتك صحيحة! اختر واحداً من الصناديق لمضاعفة أرباحك' : 'Correct answer streak! Choose a treasure chest to claim your prize.')}
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
                            ? 'bg-gradient-to-b from-purple-600 via-indigo-600 to-slate-900 border-purple-400 shadow-2xl scale-105'
                            : anyOpened
                            ? 'bg-slate-800 border-slate-700 opacity-50'
                            : 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-400/40 hover:border-yellow-400 hover:scale-105 shadow-lg'
                        }`}
                      >
                        {isThisOpened && revealedReward ? (
                          <div className="animate-viewFadeIn text-center">
                            <span className="text-4xl block mb-1">{revealedReward.icon}</span>
                            <span className="text-xs font-black text-white leading-tight block">
                              {language === 'ar' ? revealedReward.labelAr : revealedReward.label}
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

                {/* Claim Non-Steal Reward Button */}
                {chestOpenedIndex !== null && revealedReward?.type !== 'steal' && (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                  >
                    <span>{language === 'ar' ? 'استلام المكافأة والمتابعة ←' : 'Claim Reward & Continue →'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
