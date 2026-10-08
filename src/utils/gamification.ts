import { TestAttempt, AchievementBadge, StudentGamification } from '../types';

export function calculateGamification(
  studentAttempts: TestAttempt[],
  streak: number
): StudentGamification {
  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;
  let hasHighScore = false;
  let hasHighAccuracyDrill = false;
  let hasStrongQuant = false;
  let hasStrongVerbal = false;
  let hasMockCompleted = false;
  let hasQuickWarmup = false;
  let hasEarlyBird = false;
  let hasNightOwl = false;

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const currentHour = new Date().getHours();
  let questionsToday = 0;

  studentAttempts.forEach(att => {
    totalQuestionsAnswered += att.total || 0;
    totalCorrect += att.correct || 0;

    if (att.date === todayStr) {
      questionsToday += att.total || 0;
      // If completed today and current hour is in morning or night
      if (currentHour >= 5 && currentHour < 11) hasEarlyBird = true;
      if (currentHour >= 20 || currentHour < 4) hasNightOwl = true;
    }

    // Check attempt explicit hour or timestamp
    let attemptHour: number | null = null;
    if (typeof att.hour === 'number') {
      attemptHour = att.hour;
    } else if (att.timestamp) {
      attemptHour = new Date(att.timestamp).getHours();
    }

    if (attemptHour !== null) {
      if (attemptHour >= 5 && attemptHour < 11) hasEarlyBird = true;
      if (attemptHour >= 20 || attemptHour < 4) hasNightOwl = true;
    }

    if (att.kind === 'mock') hasMockCompleted = true;
    if (att.kind === 'quick') hasQuickWarmup = true;

    if (att.total > 0 && (att.correct / att.total) >= 0.8) {
      hasHighAccuracyDrill = true;
    }

    if (att.exam === 'GAT' && att.score >= 85) hasHighScore = true;
    if (att.exam === 'SAT' && att.score >= 1350) hasHighScore = true;

    (att.bySkill || []).forEach(bs => {
      const pct = bs.total > 0 ? (bs.correct / bs.total) : 0;
      if (pct >= 0.8) {
        if (bs.section.toLowerCase().includes('quant') || bs.section.toLowerCase().includes('math')) {
          hasStrongQuant = true;
        }
        if (bs.section.toLowerCase().includes('verbal') || bs.section.toLowerCase().includes('reading')) {
          hasStrongVerbal = true;
        }
      }
    });
  });

  const accuracy = totalQuestionsAnswered > 0
    ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
    : 0;

  // Full suite of 10+ badges grounded in authentic student metrics
  const badges: AchievementBadge[] = [
    {
      id: 'early_bird',
      title: 'Early Bird',
      desc: 'Complete a study drill or mock exam in the morning (5:00 AM – 11:00 AM)',
      icon: 'Sun',
      category: 'habit',
      tier: 'Gold',
      rarity: 'rare',
      xpReward: 150,
      unlocked: hasEarlyBird,
      progress: hasEarlyBird ? 1 : 0,
      maxProgress: 1,
      requirementText: 'Practice before 11:00 AM'
    },
    {
      id: 'consistency_king',
      title: 'Consistency King',
      desc: 'Maintain an unbroken study velocity streak of 3+ consecutive days',
      icon: 'Flame',
      category: 'streak',
      tier: 'Diamond',
      rarity: 'legendary',
      xpReward: 250,
      unlocked: streak >= 3,
      progress: Math.min(3, streak),
      maxProgress: 3,
      requirementText: 'Maintain a 3-day active streak'
    },
    {
      id: 'first_blood',
      title: 'First Milestone',
      desc: 'Complete your 1st verified diagnostic mock or practice session',
      icon: 'Target',
      category: 'milestone',
      tier: 'Bronze',
      rarity: 'common',
      xpReward: 100,
      unlocked: studentAttempts.length >= 1,
      progress: Math.min(1, studentAttempts.length),
      maxProgress: 1,
      requirementText: 'Complete 1 test attempt'
    },
    {
      id: 'sharp_shooter',
      title: 'Sharp Shooter',
      desc: 'Achieve 80%+ accuracy in any timed practice set or focus drill',
      icon: 'Zap',
      category: 'accuracy',
      tier: 'Gold',
      rarity: 'rare',
      xpReward: 175,
      unlocked: hasHighAccuracyDrill,
      progress: hasHighAccuracyDrill ? 1 : 0,
      maxProgress: 1,
      requirementText: 'Score 80%+ accuracy in a session'
    },
    {
      id: 'night_owl',
      title: 'Night Owl',
      desc: 'Complete an intensive study sprint after 8:00 PM',
      icon: 'Moon',
      category: 'habit',
      tier: 'Silver',
      rarity: 'rare',
      xpReward: 125,
      unlocked: hasNightOwl,
      progress: hasNightOwl ? 1 : 0,
      maxProgress: 1,
      requirementText: 'Practice after 8:00 PM'
    },
    {
      id: 'marathon_runner',
      title: 'Marathon Runner',
      desc: 'Complete a full-length timed diagnostic mock exam simulation',
      icon: 'Compass',
      category: 'milestone',
      tier: 'Gold',
      rarity: 'epic',
      xpReward: 200,
      unlocked: hasMockCompleted,
      progress: hasMockCompleted ? 1 : 0,
      maxProgress: 1,
      requirementText: 'Finish 1 full-length mock'
    },
    {
      id: 'quant_master',
      title: 'Quant Specialist',
      desc: 'Score 80%+ mastery in a Quantitative or Math section',
      icon: 'Calculator',
      category: 'mastery',
      tier: 'Silver',
      rarity: 'rare',
      xpReward: 150,
      unlocked: hasStrongQuant,
      progress: hasStrongQuant ? 1 : 0,
      maxProgress: 1,
      requirementText: 'Score 80%+ in Math / Quant'
    },
    {
      id: 'verbal_master',
      title: 'Verbal Virtuoso',
      desc: 'Score 80%+ mastery in a Verbal or Reading & Writing section',
      icon: 'BookOpen',
      category: 'mastery',
      tier: 'Silver',
      rarity: 'rare',
      xpReward: 150,
      unlocked: hasStrongVerbal,
      progress: hasStrongVerbal ? 1 : 0,
      maxProgress: 1,
      requirementText: 'Score 80%+ in Verbal / Reading'
    },
    {
      id: 'century_club',
      title: 'Century Club',
      desc: 'Answer 50+ authentic questions across drills and tests',
      icon: 'Award',
      category: 'milestone',
      tier: 'Gold',
      rarity: 'epic',
      xpReward: 250,
      unlocked: totalQuestionsAnswered >= 50,
      progress: Math.min(50, totalQuestionsAnswered),
      maxProgress: 50,
      requirementText: 'Solve 50 verified questions'
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      desc: 'Complete a rapid 5-question warmup sprint',
      icon: 'Sparkles',
      category: 'habit',
      tier: 'Bronze',
      rarity: 'common',
      xpReward: 75,
      unlocked: hasQuickWarmup,
      progress: hasQuickWarmup ? 1 : 0,
      maxProgress: 1,
      requirementText: 'Complete 1 warmup sprint'
    },
    {
      id: 'tier1_elite',
      title: 'Tier-1 Elite',
      desc: 'Reach competitive benchmark score (85+ GAT or 1350+ SAT)',
      icon: 'Crown',
      category: 'mastery',
      tier: 'Diamond',
      rarity: 'legendary',
      xpReward: 300,
      unlocked: hasHighScore,
      progress: hasHighScore ? 1 : 0,
      maxProgress: 1,
      requirementText: 'Score 85+ GAT or 1350+ SAT'
    }
  ];

  // Calculate badge bonus XP
  const badgeBonusXp = badges.reduce((acc, b) => (b.unlocked ? acc + (b.xpReward || 100) : acc), 0);

  // Base XP: earned through actual practice, correct answers, and full mocks
  const basePracticeXp = totalQuestionsAnswered * 15 + totalCorrect * 20 + studentAttempts.filter(a => a.kind === 'mock').length * 120;
  const xp = basePracticeXp + badgeBonusXp;

  // Level thresholds
  const levelTiers = [
    { level: 1, title: 'Novice Recruit', minXp: 0, nextXp: 250 },
    { level: 2, title: 'Aptitude Apprentice', minXp: 250, nextXp: 750 },
    { level: 3, title: 'Precision Strategist', minXp: 750, nextXp: 1600 },
    { level: 4, title: 'Tier-1 Contender', minXp: 1600, nextXp: 3000 },
    { level: 5, title: 'Grandmaster Scholar', minXp: 3000, nextXp: 6000 }
  ];

  let currentTier = levelTiers[0];
  for (let i = levelTiers.length - 1; i >= 0; i--) {
    if (xp >= levelTiers[i].minXp) {
      currentTier = levelTiers[i];
      break;
    }
  }

  return {
    xp,
    level: currentTier.level,
    levelTitle: currentTier.title,
    nextLevelXp: currentTier.nextXp,
    currentLevelBaseXp: currentTier.minXp,
    totalQuestionsAnswered,
    totalCorrect,
    accuracy,
    badges,
    streak,
    dailyGoalProgress: Math.min(10, questionsToday),
    dailyGoalTarget: 10,
    badgeBonusXp
  };
}
