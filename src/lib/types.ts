export type LectureStatus = 'not-started' | 'in-progress' | 'completed' | 'revision';
export type ProjectStatus = 'not-started' | 'building' | 'completed' | 'revision';
export type Priority = 'low' | 'medium' | 'high';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const MODULE_LIST = [
  'Introduction',
  'HTML',
  'CSS',
  'Flexbox',
  'Grid',
  'Bootstrap',
  'Web Design',
  'JavaScript',
  'DOM',
  'jQuery',
  'Simon Game',
  'Command Line',
  'Node.js',
  'Express',
  'EJS',
  'Git',
  'APIs',
  'SQL',
  'PostgreSQL',
  'Authentication',
  'React',
  'Web3',
  'AMA',
  'Bonus',
] as const;

export type Module = (typeof MODULE_LIST)[number];

/** Modules that show progress bars on the dashboard */
export const PROGRESS_MODULES: Module[] = [...MODULE_LIST];

export interface Lecture {
  id: string;
  name: string;
  module: Module;
  /** Duration in seconds */
  duration: number;
  status: LectureStatus;
  completionDate: string | null;
  notes: string;
  revisionNeeded: boolean;
  isProject: boolean;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  module: Module;
  status: ProjectStatus;
  difficulty: Difficulty;
  githubLink: string;
  demoLink: string;
  notes: string;
  completionDate: string | null;
}

export interface StudySession {
  id: string;
  date: string;
  hours: number;
  lecturesCompleted: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type: 'lectures_completed' | 'projects_completed' | 'streak' | 'module_completed' | 'all_completed';
  target: number;
  module?: Module;
}

export interface UserProgress {
  lectures: Lecture[];
  projects: Project[];
  achievements: Achievement[];
  studySessions: StudySession[];
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalStudyHours: number;
}

export interface ModuleStats {
  module: Module;
  total: number;
  completed: number;
  inProgress: number;
  percentage: number;
}

export const MODULE_COLORS: Record<Module, string> = {
  Introduction: '#94a3b8',
  HTML: '#f97316',
  CSS: '#3b82f6',
  Flexbox: '#8b5cf6',
  Grid: '#ec4899',
  Bootstrap: '#7c3aed',
  'Web Design': '#14b8a6',
  JavaScript: '#eab308',
  DOM: '#f59e0b',
  jQuery: '#0ea5e9',
  'Simon Game': '#10b981',
  'Command Line': '#6b7280',
  'Node.js': '#22c55e',
  Express: '#6366f1',
  EJS: '#a855f7',
  Git: '#ef4444',
  APIs: '#06b6d4',
  SQL: '#2563eb',
  PostgreSQL: '#336791',
  Authentication: '#dc2626',
  React: '#61dafb',
  Web3: '#f472b6',
  AMA: '#78716c',
  Bonus: '#fbbf24',
};

export const MODULE_ICONS: Record<Module, string> = {
  Introduction: 'BookOpen',
  HTML: 'Code',
  CSS: 'Paintbrush',
  Flexbox: 'LayoutDashboard',
  Grid: 'Grid3x3',
  Bootstrap: 'Box',
  'Web Design': 'Palette',
  JavaScript: 'Braces',
  DOM: 'FileCode',
  jQuery: 'Zap',
  'Simon Game': 'Gamepad2',
  'Command Line': 'Terminal',
  'Node.js': 'Server',
  Express: 'Route',
  EJS: 'FileText',
  Git: 'GitBranch',
  APIs: 'Plug',
  SQL: 'Database',
  PostgreSQL: 'Database',
  Authentication: 'Shield',
  React: 'Atom',
  Web3: 'Globe',
  AMA: 'MessageCircle',
  Bonus: 'Gift',
};
