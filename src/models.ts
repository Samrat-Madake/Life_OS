export type Priority = "low"|"medium"|"high"|"urgent";
export type TaskStatus = "todo"|"doing"|"done";
export type TaskCategory = "Work"|"Personal"|"Health"|"Finance"|"Learning"|"Home";

export type SubTask = {
  id: string
  title: string
  completed: boolean
};

export type Task = {
  id:string
  title:string
  description?:string
  status: TaskStatus
  priority: Priority
  category: TaskCategory
  dueDate: string | null // ISO date yyyy-mm-dd
  scheduledAt?: string | null // ISO datetime
  goalId?: string | null
  milestoneId?: string | null
  subtasks?: SubTask[]
  createdAt:string
  completedAt?:string | null
};

export type HabitFrequency = "daily"|"weekdays"|"weekly"|"custom";
export type Habit = {
  id:string
  name:string
  category:string
  frequency:HabitFrequency
  targetPerWeek:number
  icon:string
  color:string
  createdAt:string
};

export type HabitLog = { habitId:string; date:string }; // date yyyy-mm-dd

export type TxnType = "income"|"expense";

export type PaymentMethod = "UPI" | "Credit Card" | "Debit Card" | "Cash" | "Net Banking";

export type Transaction = {
  id:string
  type: TxnType
  amountPaise:number // integer minor unit
  category:string
  description:string
  date:string // yyyy-mm-dd
  paymentMethod?: PaymentMethod | string
  subscriptionId?: string
};

export type Subscription = {
  id: string
  name: string
  amountPaise: number
  category: string
  dueDay: number // 1 - 31
  billingCycle: "monthly" | "yearly"
  paymentMethod?: PaymentMethod | string
  isActive: boolean
  lastPaidMonth?: string // e.g. "2026-10"
};

export type Budget = { category:string; limitPaise:number };

export type CalendarEvent = {
  id:string
  title:string
  date:string // yyyy-mm-dd
  start:string // HH:MM
  end:string // HH:MM
  color:string
  description?:string
  taskId?:string | null
};

export type FocusSession = {
  id:string
  startedAt:string
  durationMinutes:number
  completed:boolean
  taskId?:string | null
  taskTitle?:string | null
};

export type Milestone = {
  id:string
  title:string
  completed:boolean
  dueDate?:string | null
};

export type Goal = {
  id:string
  title:string
  description:string
  deadline:string // yyyy-mm-dd
  milestones:Milestone[]
  targetValue?:number | null
  currentValue?:number | null
  unit?:string | null
  color:string
  createdAt:string
};

export type AppState = {
  tasks:Task[]
  habits:Habit[]
  habitLogs:HabitLog[]
  transactions:Transaction[]
  budgets:Budget[]
  subscriptions?:Subscription[]
  events:CalendarEvent[]
  goals:Goal[]
  focusSessions:FocusSession[]
  currency:string // INR
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  encryptionSalt?: string;
  preferences?: {
    theme?: "dark" | "light";
    currency?: string;
  };
};

export type ActivityItem = { id:string; time:string; label:string; sub?:string; kind:"task"|"habit"|"focus"|"finance"|"calendar"|"goal" };

export type QuoteCardStyle =
  | "terracotta-badge"
  | "dotted-circle"
  | "mint-banner"
  | "lavender-bubble"
  | "dark-circle"
  | "peach-card"
  | "dotted-border"
  | "pill-frame"
  | "ribbon-tag"
  | "notched-banner"
  | "minimal-ring";

export type QuoteItem = {
  _id: string;
  text: string;
  author: string;
  category: string;
  cardStyle: QuoteCardStyle;
  createdAt: string;
  updatedAt?: string;
};
