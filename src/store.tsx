import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AppState, Transaction, Task, CalendarEvent, FocusSession, Goal, AuthUser } from "./models";
import { buildSeed, buildEmptyState } from "./seed";
import { api as apiClient, setToken } from "./api";

const KEY = "lifeos:v1";
const THEME_KEY = "lifeos:theme";

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return buildSeed();
    const parsed = JSON.parse(raw);
    const seed = buildSeed();
    return {
      ...seed,
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : seed.tasks,
      habits: Array.isArray(parsed.habits) ? parsed.habits : seed.habits,
      habitLogs: Array.isArray(parsed.habitLogs) ? parsed.habitLogs : seed.habitLogs,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : seed.transactions,
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : seed.budgets,
      events: Array.isArray(parsed.events) ? parsed.events : seed.events,
      goals: Array.isArray(parsed.goals) ? parsed.goals : seed.goals,
      focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : seed.focusSessions,
    };
  } catch {
    return buildSeed();
  }
}

type Store = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  reset: () => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;

  // Auth & Cloud Sync
  user: AuthUser | null;
  isSyncing: boolean;
  syncError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;

  // Actions
  addTask: (t: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addEvent: (e: CalendarEvent) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleHabit: (habitId: string, date: string) => void;
  addHabit: (h: any) => void;
  updateHabit: (id: string, patch: any) => void;
  deleteHabit: (id: string) => void;
  addGoal: (g: Goal) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addFocusSession: (s: FocusSession) => void;
  upsertFocusSession: (s: FocusSession) => void;
};

const Ctx = createContext<Store>(null as any);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem(THEME_KEY) as any) || "dark");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const persistRef = useRef<number | null>(null);
  const cloudSyncRef = useRef<number | null>(null);
  const isHydratedRef = useRef<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Local storage debounced sync
  useEffect(() => {
    if (persistRef.current) window.clearTimeout(persistRef.current);
    persistRef.current = window.setTimeout(() => localStorage.setItem(KEY, JSON.stringify(state)), 200);
  }, [state]);

  // Cloud sync debounced when authenticated and hydrated
  useEffect(() => {
    if (!user || !isHydratedRef.current) return;
    if (cloudSyncRef.current) window.clearTimeout(cloudSyncRef.current);
    cloudSyncRef.current = window.setTimeout(async () => {
      setIsSyncing(true);
      try {
        const ok = await apiClient.syncCloudState(state);
        if (ok) {
          setSyncError(null);
        } else {
          setSyncError("Sync failed (server offline or not reachable)");
        }
      } catch (err: any) {
        setSyncError(err?.message || "Sync error");
      } finally {
        setIsSyncing(false);
      }
    }, 600);
  }, [state, user]);

  // Restore authenticated user on mount & pull cloud state
  useEffect(() => {
    async function initAuth() {
      const res = await apiClient.getMe();
      if (res && res.user) {
        setUser(res.user);
        const cloudState = await apiClient.fetchCloudState();
        if (cloudState && Array.isArray(cloudState.tasks)) {
          setState(cloudState);
          localStorage.setItem(KEY, JSON.stringify(cloudState));
        }
      }
      isHydratedRef.current = true;
    }
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiClient.login(email, pass);
    setToken(res.token);
    setUser(res.user);
    isHydratedRef.current = false;
    const cloudState = await apiClient.fetchCloudState();
    if (cloudState && Array.isArray(cloudState.tasks)) {
      setState(cloudState);
      localStorage.setItem(KEY, JSON.stringify(cloudState));
    }
    isHydratedRef.current = true;
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await apiClient.register(name, email, pass);
    setToken(res.token);
    setUser(res.user);
    // Reset all data to clean fresh slate for new registered user
    const emptyState = buildEmptyState();
    setState(emptyState);
    localStorage.setItem(KEY, JSON.stringify(emptyState));
    isHydratedRef.current = true;
    // Push empty state to cloud immediately
    await apiClient.syncCloudState(emptyState);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    isHydratedRef.current = false;
  };

  const apiValue = useMemo<Store>(() => ({
    state,
    setState,
    theme,
    setTheme,
    user,
    isSyncing,
    syncError,
    login,
    register,
    logout,
    reset() {
      const s = buildSeed();
      setState(s);
      localStorage.setItem(KEY, JSON.stringify(s));
    },
    addTask(t) { setState(s => ({ ...s, tasks: [t, ...s.tasks] })); },
    updateTask(id, patch) { setState(s => ({ ...s, tasks: s.tasks.map(x => x.id === id ? { ...x, ...patch } : x) })); },
    deleteTask(id) {
      setState(s => {
        const t = s.tasks.find(x => x.id === id);
        let goals = s.goals;
        if (t && t.status === "done" && t.goalId) {
          goals = s.goals.map(g => {
            if (g.id !== t.goalId || g.targetValue == null) return g;
            return { ...g, currentValue: Math.max(0, (g.currentValue || 0) - 1) };
          });
        }
        return { ...s, tasks: s.tasks.filter(x => x.id !== id), goals };
      });
    },
    toggleTask(id) {
      setState(s => {
        const t = s.tasks.find(x => x.id === id);
        if (!t) return s;
        const now = new Date().toISOString();
        const becomingDone = t.status !== "done";
        const next = becomingDone ? { ...t, status: "done" as const, completedAt: now } : { ...t, status: "todo" as const, completedAt: null };
        let goals = s.goals;
        if (t.goalId) {
          goals = s.goals.map(g => {
            if (g.id !== t.goalId || g.targetValue == null) return g;
            const cur = Math.max(0, g.currentValue || 0);
            const nextVal = becomingDone ? Math.min(cur + 1, g.targetValue) : Math.max(0, cur - 1);
            return { ...g, currentValue: nextVal };
          });
        }
        return { ...s, tasks: s.tasks.map(x => x.id === id ? next : x), goals };
      });
    },
    toggleSubtask(taskId, subtaskId) {
      setState(s => {
        const t = s.tasks.find(x => x.id === taskId);
        if (!t || !t.subtasks) return s;
        const updatedSubtasks = t.subtasks.map(sub => sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub);
        const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(sub => sub.completed);
        const nextStatus = allDone ? ("done" as const) : t.status === "done" ? ("doing" as const) : t.status;
        const now = new Date().toISOString();
        const completedAt = allDone ? (t.completedAt || now) : null;
        return {
          ...s,
          tasks: s.tasks.map(x => x.id === taskId ? { ...x, subtasks: updatedSubtasks, status: nextStatus, completedAt } : x)
        };
      });
    },
    addTransaction(t) { setState(s => ({ ...s, transactions: [t, ...s.transactions] })); },
    updateTransaction(id, patch) { setState(s => ({ ...s, transactions: s.transactions.map(x => x.id === id ? { ...x, ...patch } : x) })); },
    deleteTransaction(id) { setState(s => ({ ...s, transactions: s.transactions.filter(x => x.id !== id) })); },
    addEvent(e) {
      setState(s => {
        let tasks = s.tasks;
        if (e.taskId) {
          tasks = s.tasks.map(x => x.id === e.taskId ? { ...x, scheduledAt: `${e.date}T${e.start}` } : x);
        }
        return { ...s, events: [...s.events, e], tasks };
      });
    },
    updateEvent(id, patch) {
      setState(s => {
        const prev = s.events.find(x => x.id === id);
        let tasks = s.tasks;
        if (prev?.taskId && (patch.date !== undefined || patch.start !== undefined || patch.end !== undefined)) {
          const date = patch.date !== undefined ? patch.date : prev.date;
          const start = patch.start !== undefined ? patch.start : prev.start;
          tasks = s.tasks.map(x => x.id === prev.taskId ? { ...x, scheduledAt: `${date}T${start}` } : x);
        }
        return { ...s, events: s.events.map(x => x.id === id ? { ...x, ...patch } : x), tasks };
      });
    },
    deleteEvent(id) {
      setState(s => {
        const e = s.events.find(x => x.id === id);
        let tasks = s.tasks;
        if (e?.taskId) {
          tasks = s.tasks.map(x => x.id === e.taskId ? { ...x, scheduledAt: null } : x);
        }
        return { ...s, events: s.events.filter(x => x.id !== id), tasks };
      });
    },
    toggleHabit(habitId, date) {
      setState(s => {
        const exists = s.habitLogs.find(l => l.habitId === habitId && l.date === date);
        if (exists) return { ...s, habitLogs: s.habitLogs.filter(l => !(l.habitId === habitId && l.date === date)) };
        return { ...s, habitLogs: [...s.habitLogs, { habitId, date }] };
      });
    },
    addHabit(h) { setState(s => ({ ...s, habits: [h, ...s.habits] })); },
    updateHabit(id, patch) { setState(s => ({ ...s, habits: s.habits.map(x => x.id === id ? { ...x, ...patch } : x) })); },
    deleteHabit(id) { setState(s => ({ ...s, habits: s.habits.filter(x => x.id !== id), habitLogs: s.habitLogs.filter(l => l.habitId !== id) })); },
    addGoal(g) { setState(s => ({ ...s, goals: [g, ...s.goals] })); },
    updateGoal(id, patch) { setState(s => ({ ...s, goals: s.goals.map(x => x.id === id ? { ...x, ...patch } : x) })); },
    deleteGoal(id) { setState(s => ({ ...s, goals: s.goals.filter(x => x.id !== id) })); },
    toggleMilestone(goalId, milestoneId) {
      setState(s => ({
        ...s,
        goals: s.goals.map(g => g.id !== goalId ? g : {
          ...g,
          milestones: g.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m)
        })
      }));
    },
    addFocusSession(sesh) { setState(s => ({ ...s, focusSessions: [sesh, ...s.focusSessions] })); },
    upsertFocusSession(sesh) { setState(s => ({ ...s, focusSessions: [sesh, ...s.focusSessions.filter(x => x.id !== sesh.id)] })); }
  }), [state, theme, user, isSyncing]);

  return <Ctx.Provider value={apiValue}>{children}</Ctx.Provider>;
}

export function useStore() {
  return useContext(Ctx);
}
