import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Lecture, Project, StudySession, ModuleStats, Module, LectureStatus, ProjectStatus } from '@/lib/types';
import { PROGRESS_MODULES } from '@/lib/types';
import { SEED_LECTURES, SEED_PROJECTS } from '@/lib/seed-data';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const STORAGE_KEYS = {
  lectures: 'wdj-lectures',
  projects: 'wdj-projects',
  studySessions: 'wdj-study-sessions',
  streak: 'wdj-streak',
  longestStreak: 'wdj-longest-streak',
  lastStudyDate: 'wdj-last-study-date',
  totalStudyHours: 'wdj-total-study-hours',
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    /* ignore parse errors */
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function initializeLectures(): Lecture[] {
  const stored = loadFromStorage<Lecture[] | null>(STORAGE_KEYS.lectures, null);
  if (stored && stored.length > 0) return stored;

  return SEED_LECTURES.map((seed) => ({
    ...seed,
    status: 'not-started' as LectureStatus,
    completionDate: null,
    notes: '',
    revisionNeeded: false,
    tags: [],
  }));
}

function initializeProjects(): Project[] {
  const stored = loadFromStorage<Project[] | null>(STORAGE_KEYS.projects, null);
  if (stored && stored.length > 0) return stored;

  return SEED_PROJECTS.map((seed) => ({
    ...seed,
    status: 'not-started' as ProjectStatus,
    completionDate: null,
    notes: '',
    githubLink: '',
    demoLink: '',
  }));
}

interface DataContextType {
  lectures: Lecture[];
  projects: Project[];
  studySessions: StudySession[];
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalStudyHours: number;

  updateLecture: (id: string, updates: Partial<Lecture>) => void;
  bulkUpdateLectures: (ids: string[], updates: Partial<Lecture>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addStudySession: (hours: number, lecturesCompleted: number) => void;
  getModuleStats: () => ModuleStats[];
  getCompletedCount: () => number;
  getRemainingCount: () => number;
  getCompletionPercentage: () => number;
  getCompletedProjectCount: () => number;
  getRevisionQueue: () => Lecture[];
  exportData: () => string;
  importData: (json: string) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [lectures, setLectures] = useState<Lecture[]>(initializeLectures);
  const [projects, setProjects] = useState<Project[]>(initializeProjects);
  const [studySessions, setStudySessions] = useState<StudySession[]>(() =>
    loadFromStorage(STORAGE_KEYS.studySessions, [])
  );
  const [currentStreak, setCurrentStreak] = useState<number>(() =>
    loadFromStorage(STORAGE_KEYS.streak, 0)
  );
  const [longestStreak, setLongestStreak] = useState<number>(() =>
    loadFromStorage(STORAGE_KEYS.longestStreak, 0)
  );
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(() =>
    loadFromStorage(STORAGE_KEYS.lastStudyDate, null)
  );
  const [totalStudyHours, setTotalStudyHours] = useState<number>(() =>
    loadFromStorage(STORAGE_KEYS.totalStudyHours, 0)
  );

  // Persist to localStorage on changes
  useEffect(() => { saveToStorage(STORAGE_KEYS.lectures, lectures); }, [lectures]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.projects, projects); }, [projects]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.studySessions, studySessions); }, [studySessions]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.streak, currentStreak); }, [currentStreak]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.longestStreak, longestStreak); }, [longestStreak]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.lastStudyDate, lastStudyDate); }, [lastStudyDate]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.totalStudyHours, totalStudyHours); }, [totalStudyHours]);

  const updateStreak = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (lastStudyDate === today) return;

    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    let newStreak: number;

    if (lastStudyDate === yesterday) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }

    setCurrentStreak(newStreak);
    setLastStudyDate(today);
    if (newStreak > longestStreak) {
      setLongestStreak(newStreak);
    }
  }, [lastStudyDate, currentStreak, longestStreak]);

  const updateLecture = useCallback((id: string, updates: Partial<Lecture>) => {
    setLectures((prev) =>
      prev.map((lec) => {
        if (lec.id !== id) return lec;
        const updated = { ...lec, ...updates };
        if (updates.status === 'completed' && !updated.completionDate) {
          updated.completionDate = format(new Date(), 'yyyy-MM-dd');
        }
        return updated;
      })
    );
    if (updates.status === 'completed' || updates.status === 'in-progress') {
      updateStreak();
    }
  }, [updateStreak]);

  const bulkUpdateLectures = useCallback((ids: string[], updates: Partial<Lecture>) => {
    setLectures((prev) =>
      prev.map((lec) => {
        if (!ids.includes(lec.id)) return lec;
        const updated = { ...lec, ...updates };
        if (updates.status === 'completed' && !updated.completionDate) {
          updated.completionDate = format(new Date(), 'yyyy-MM-dd');
        }
        return updated;
      })
    );
    if (updates.status === 'completed' || updates.status === 'in-progress') {
      updateStreak();
    }
  }, [updateStreak]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== id) return proj;
        const updated = { ...proj, ...updates };
        if (updates.status === 'completed' && !updated.completionDate) {
          updated.completionDate = format(new Date(), 'yyyy-MM-dd');
        }
        return updated;
      })
    );
    if (updates.status === 'completed' || updates.status === 'building') {
      updateStreak();
    }
  }, [updateStreak]);

  const addStudySession = useCallback((hours: number, lecturesCompleted: number) => {
    const session: StudySession = {
      id: uuidv4(),
      date: format(new Date(), 'yyyy-MM-dd'),
      hours,
      lecturesCompleted,
    };
    setStudySessions((prev) => [...prev, session]);
    setTotalStudyHours((prev) => prev + hours);
    updateStreak();
  }, [updateStreak]);

  const getModuleStats = useCallback((): ModuleStats[] => {
    return PROGRESS_MODULES.map((mod: Module) => {
      const moduleLectures = lectures.filter((l) => l.module === mod);
      const completed = moduleLectures.filter((l) => l.status === 'completed').length;
      const inProgress = moduleLectures.filter((l) => l.status === 'in-progress').length;
      const total = moduleLectures.length;
      return {
        module: mod,
        total,
        completed,
        inProgress,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [lectures]);

  const getCompletedCount = useCallback(() => {
    return lectures.filter((l) => l.status === 'completed').length;
  }, [lectures]);

  const getRemainingCount = useCallback(() => {
    return lectures.filter((l) => l.status !== 'completed').length;
  }, [lectures]);

  const getCompletionPercentage = useCallback(() => {
    const total = lectures.length;
    if (total === 0) return 0;
    return Math.round((getCompletedCount() / total) * 100);
  }, [lectures, getCompletedCount]);

  const getCompletedProjectCount = useCallback(() => {
    return projects.filter((p) => p.status === 'completed').length;
  }, [projects]);

  const getRevisionQueue = useCallback(() => {
    return lectures.filter((l) => l.revisionNeeded);
  }, [lectures]);

  const exportData = useCallback(() => {
    return JSON.stringify({
      lectures,
      projects,
      studySessions,
      currentStreak,
      longestStreak,
      lastStudyDate,
      totalStudyHours,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }, [lectures, projects, studySessions, currentStreak, longestStreak, lastStudyDate, totalStudyHours]);

  const importData = useCallback((json: string) => {
    const data = JSON.parse(json);
    if (data.lectures) setLectures(data.lectures);
    if (data.projects) setProjects(data.projects);
    if (data.studySessions) setStudySessions(data.studySessions);
    if (data.currentStreak !== undefined) setCurrentStreak(data.currentStreak);
    if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak);
    if (data.lastStudyDate !== undefined) setLastStudyDate(data.lastStudyDate);
    if (data.totalStudyHours !== undefined) setTotalStudyHours(data.totalStudyHours);
  }, []);

  const resetData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setLectures(initializeLectures());
    setProjects(initializeProjects());
    setStudySessions([]);
    setCurrentStreak(0);
    setLongestStreak(0);
    setLastStudyDate(null);
    setTotalStudyHours(0);
  }, []);

  const value: DataContextType = {
    lectures,
    projects,
    studySessions,
    currentStreak,
    longestStreak,
    lastStudyDate,
    totalStudyHours,
    updateLecture,
    bulkUpdateLectures,
    updateProject,
    addStudySession,
    getModuleStats,
    getCompletedCount,
    getRemainingCount,
    getCompletionPercentage,
    getCompletedProjectCount,
    getRevisionQueue,
    exportData,
    importData,
    resetData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
