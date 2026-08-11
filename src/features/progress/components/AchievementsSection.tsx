// ============================================================================
// AchievementsSection (A4) — siatka osiągnięć wyliczanych z rzeczywistych
// danych: pierwszy posiłek, streak 7 dni, 1L wody w dniu, 10 posiłków,
// cel kaloryczny 5×. Zablokowane = szare; odblokowane = kolorowe + spring
// + toast w momencie odblokowania.
// ============================================================================

import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets,
  Flame,
  ListChecks,
  Target,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useMealsStore, dateKey } from '../../../store/useMealsStore';
import { useProgressStore } from '../../../store/useProgressStore';
import { useUserStore } from '../../../store/useUserStore';
import { useToastStore } from '../../../store/useToastStore';
import { SectionHeader } from './SectionHeader';
import { spring } from '../../../utils/motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Klasy Tailwind koloru dla odblokowanej karty (statyczne — wykrywalne). */
  accent: string;
  unlocked: boolean;
}

/** Liczy dni z rzędu z posiłkami (kończąc na dziś lub wczoraj). */
function countStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  const cursor = new Date();
  if (!set.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Wylicza osiągnięcia na podstawie sklepów (posiłki, woda, cel kcal). */
function useAchievements(): Achievement[] {
  const mealsByDay = useMealsStore((s) => s.mealsByDay);
  const waterByDay = useProgressStore((s) => s.waterByDay);
  const goal = useUserStore((s) => s.profile.dailyCaloriesGoal);

  return useMemo(() => {
    const mealDates = Object.keys(mealsByDay).filter((d) => (mealsByDay[d]?.length ?? 0) > 0);
    const totalMeals = mealDates.reduce((acc, d) => acc + (mealsByDay[d]?.length ?? 0), 0);
    // Dni, w których suma kcal trafiła w ±15% celu kalorycznego.
    const nearGoalDays = Object.values(mealsByDay).filter((ms) => {
      const cal = ms.reduce((a, m) => a + m.calories, 0);
      return cal >= goal * 0.85 && cal <= goal * 1.15;
    }).length;
    const waterDay = Object.values(waterByDay).some((ml) => ml >= 1000);

    return [
      {
        id: 'first-meal',
        title: 'Pierwszy posiłek',
        description: 'Zaloguj pierwszy posiłek',
        icon: UtensilsCrossed,
        accent: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        unlocked: totalMeals >= 1,
      },
      {
        id: 'streak-7',
        title: '7 dni z rzędu',
        description: 'Posiłki przez 7 dni pod rząd',
        icon: Flame,
        accent: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
        unlocked: countStreak(mealDates) >= 7,
      },
      {
        id: 'water-1l',
        title: '1 litr wody',
        description: 'Wypij 1L wody w ciągu dnia',
        icon: Droplets,
        accent: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
        unlocked: waterDay,
      },
      {
        id: 'meals-10',
        title: '10 posiłków',
        description: 'Zaloguj łącznie 10 posiłków',
        icon: ListChecks,
        accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        unlocked: totalMeals >= 10,
      },
      {
        id: 'goal-5x',
        title: 'Cel kaloryczny 5×',
        description: 'Traf cel kaloryczny 5 dni',
        icon: Target,
        accent: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
        unlocked: nearGoalDays >= 5,
      },
    ];
  }, [mealsByDay, waterByDay, goal]);
}

export function AchievementsSection(): JSX.Element {
  const achievements = useAchievements();
  const show = useToastStore((s) => s.show);
  const seen = useRef<Set<string> | null>(null);

  // Toast tylko przy faktycznym odblokowaniu (pierwszy render: bez hałasu).
  useEffect(() => {
    const previous = seen.current;
    const unlockedIds = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));
    if (previous !== null) {
      unlockedIds.forEach((id) => {
        if (!previous.has(id)) {
          const title = achievements.find((a) => a.id === id)?.title ?? id;
          show(`Osiągnięcie: ${title} 🏆`, 'success');
        }
      });
    }
    seen.current = unlockedIds;
  }, [achievements, show]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <section>
      <SectionHeader icon={Trophy} title="Osiągnięcia" hint={`${unlockedCount}/${achievements.length}`} />
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((a) => <AchievementCard key={a.id} achievement={a} />)}
      </div>
    </section>
  );
}

/** Karta osiągnięcia — szara (zablokowane) lub kolorowa z animacją odblokowania. */
function AchievementCard({ achievement: a }: { achievement: Achievement }): JSX.Element {
  const Icon = a.icon;
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0.5 }}
      animate={a.unlocked ? { scale: 1, opacity: 1 } : { scale: 0.94, opacity: 0.55 }}
      transition={spring()}
      className={`rounded-2xl border p-3 ${
        a.unlocked
          ? `${a.accent} border-transparent shadow-sm`
          : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500'
      }`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.unlocked ? 'bg-white/70 dark:bg-white/10' : 'bg-slate-200/70 dark:bg-slate-700/60'}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="mt-2 text-xs font-bold leading-tight">{a.title}</p>
      <p className="mt-0.5 text-[10px] leading-snug opacity-80">{a.description}</p>
    </motion.div>
  );
}
