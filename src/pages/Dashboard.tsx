import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  FolderKanban,
  Award,
  Timer,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { MODULE_COLORS, PROGRESS_MODULES } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animated number counter                                           */
/* ------------------------------------------------------------------ */

function AnimatedNumber({
  value,
  duration = 1000,
  suffix = '',
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!isInView) return;

    const startTime = performance.now();
    const startValue = prevValue.current;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startValue + (value - startValue) * eased);
      setDisplay(currentVal);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        prevValue.current = value;
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating particles for hero                                       */
/* ------------------------------------------------------------------ */

const PARTICLES = [
  { size: 6, left: '10%', top: '20%', dur: '7s', delay: '0s' },
  { size: 4, left: '25%', top: '60%', dur: '9s', delay: '1s' },
  { size: 8, left: '45%', top: '15%', dur: '11s', delay: '0.5s' },
  { size: 5, left: '65%', top: '70%', dur: '8s', delay: '2s' },
  { size: 3, left: '80%', top: '30%', dur: '10s', delay: '1.5s' },
  { size: 7, left: '90%', top: '55%', dur: '6s', delay: '0.8s' },
  { size: 4, left: '15%', top: '80%', dur: '12s', delay: '3s' },
  { size: 6, left: '55%', top: '45%', dur: '9s', delay: '2.5s' },
  { size: 3, left: '35%', top: '35%', dur: '10s', delay: '1.2s' },
  { size: 5, left: '75%', top: '85%', dur: '8s', delay: '0.3s' },
];

function HeroParticles() {
  return (
    <>
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            ['--dur' as string]: p.dur,
            ['--delay' as string]: p.delay,
          }}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card type                                                    */
/* ------------------------------------------------------------------ */

interface StatCardDef {
  label: string;
  icon: LucideIcon;
  getValue: () => number;
  suffix?: string;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

export function Dashboard() {
  const {
    lectures,
    projects,
    totalStudyHours,
    currentStreak,
    getCompletedCount,
    getRemainingCount,
    getCompletionPercentage,
    getCompletedProjectCount,
    getModuleStats,
  } = useData();

  const moduleStats = getModuleStats();

  const statCards: StatCardDef[] = [
    {
      label: 'Total Lectures',
      icon: BookOpen,
      getValue: () => lectures.length,
      color: '#3b82f6',
    },
    {
      label: 'Completed Lectures',
      icon: CheckCircle2,
      getValue: getCompletedCount,
      color: '#22c55e',
    },
    {
      label: 'Remaining Lectures',
      icon: Clock,
      getValue: getRemainingCount,
      color: '#f59e0b',
    },
    {
      label: 'Course Completion',
      icon: TrendingUp,
      getValue: getCompletionPercentage,
      suffix: '%',
      color: '#8b5cf6',
    },
    {
      label: 'Total Projects',
      icon: FolderKanban,
      getValue: () => projects.length,
      color: '#06b6d4',
    },
    {
      label: 'Completed Projects',
      icon: Award,
      getValue: getCompletedProjectCount,
      color: '#ec4899',
    },
    {
      label: 'Study Hours',
      icon: Timer,
      getValue: () => totalStudyHours,
      color: '#14b8a6',
    },
    {
      label: 'Current Streak',
      icon: Flame,
      getValue: () => currentStreak,
      suffix: ' days',
      color: '#ef4444',
    },
  ];

  /* ---- animation variants ---- */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  // ---

  const moduleContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const moduleRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const },
    },
  };

  return (
    <div className="min-h-screen space-y-10 p-6 md:p-8 max-w-7xl mx-auto pb-16">
      {/* ============================================================ */}
      {/*  Hero Section                                                */}
      {/* ============================================================ */}
      <section className="gradient-bg hero-particles rounded-2xl px-6 py-14 text-center sm:px-10 sm:py-20">
        <HeroParticles />
        <motion.h1
          className="gradient-text text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl relative z-[1]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          Web Development Journey
        </motion.h1>

        <motion.p
          className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg relative z-[1]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          Complete the Web Development Bootcamp while building
          every project and becoming a full-stack developer.
        </motion.p>
      </section>

      {/* ============================================================ */}
      {/*  Stats Cards                                                 */}
      {/* ============================================================ */}
      <section>
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const value = stat.getValue();

            return (
              <motion.div key={stat.label} variants={cardVariants}>
                <Card className="glass-card glow border-0 hover-lift">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon
                      className="size-5 shrink-0"
                      style={{ color: stat.color }}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight">
                      <AnimatedNumber
                        value={value}
                        suffix={stat.suffix ?? ''}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/*  Module Progress                                             */}
      {/* ============================================================ */}
      <section>
        <motion.h2
          className="mb-6 text-2xl font-bold tracking-tight"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Module Progress
        </motion.h2>

        <motion.div
          className="flex flex-col gap-4"
          variants={moduleContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {PROGRESS_MODULES.map((moduleName) => {
            const stats = moduleStats.find((s) => s.module === moduleName);
            if (!stats) return null;

            const color = MODULE_COLORS[moduleName];

            return (
              <motion.div key={moduleName} variants={moduleRowVariants}>
                <Card className="glass-card border-0">
                  <CardContent className="flex flex-col gap-3 py-4">
                    {/* Module header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium">
                          {moduleName}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {stats.completed} / {stats.total} completed
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${stats.percentage}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.8,
                          delay: 0.15,
                          ease: 'easeOut',
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
