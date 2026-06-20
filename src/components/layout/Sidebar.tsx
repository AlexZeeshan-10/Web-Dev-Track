import { NavLink } from 'react-router';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import { SheetClose } from '@/components/ui/sheet';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/lectures', icon: BookOpen, label: 'Lectures' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export function Sidebar() {
  const { getCompletionPercentage } = useData();
  const pct = getCompletionPercentage();

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-foreground">Web Dev Tracker</span>
          <span className="text-xs text-muted-foreground">{pct}% complete</span>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="mx-4 mb-6">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <SheetClose asChild key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary nav-glow'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : ''}`} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute left-0 h-8 w-1 rounded-r-full bg-primary"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </SheetClose>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex h-full flex-col bg-background py-4">
      {navContent}
    </div>
  );
}
