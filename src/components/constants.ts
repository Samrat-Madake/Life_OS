export const priorityColor: Record<string, string> = {
  low: "#9a9ab0",
  medium: "#7c6cff",
  high: "#f59e0b",
  urgent: "#ef4444"
};

export const statusLabel: Record<string, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done"
};

export type View = "overview" | "tasks" | "habits" | "finance" | "focus" | "calendar" | "goals";

export const nav: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◍" },
  { id: "tasks", label: "Tasks", icon: "✓" },
  { id: "habits", label: "Habits", icon: "◐" },
  { id: "finance", label: "Finance", icon: "₹" },
  { id: "focus", label: "Focus", icon: "◎" },
  { id: "calendar", label: "Calendar", icon: "▦" },
  { id: "goals", label: "Goals", icon: "⬢" },
];
