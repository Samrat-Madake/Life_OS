import { useMemo, useState } from "react";
import { useStore } from "../store";
import { fmtINR, todayISO, uid } from "../utils";
import { Empty } from "../components/CommonUI";
import { Donut } from "./OverviewView";
import { SavingsRateCard, BurnRateBanner, CashFlowTrendChart } from "../components/FinanceAnalytics";

const EXPENSE_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Travel",
  "Rent",
  "Education",
  "Gave to Family",
  "Other"
];

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Business",
  "Bonus",
  "Rental Income",
  "Gifts & Grants",
  "Refunds",
  "Other"
];

const CATEGORY_ICONS: Record<string, string> = {
  // Expenses
  Groceries: "🛒",
  Dining: "🍽️",
  "Food & Dining": "🍽️",
  Transport: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Health: "💊",
  Utilities: "⚡",
  Travel: "✈️",
  Rent: "🏠",
  Education: "📚",
  "Gave to Family": "👨‍👩‍👧",
  "Other Expense": "📦",
  // Incomes
  Salary: "💼",
  Freelance: "💻",
  Investment: "📈",
  Business: "🏢",
  Bonus: "🎁",
  "Rental Income": "🏘️",
  "Gifts & Grants": "🎉",
  Refunds: "🔄",
  "Other Income": "💰",
  Other: "💳"
};

const PAYMENT_METHODS = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Net Banking"
] as const;

const PAYMENT_ICONS: Record<string, string> = {
  UPI: "📱",
  "Credit Card": "💳",
  "Debit Card": "🏦",
  Cash: "💵",
  "Net Banking": "🌐"
};

function getCategoryIcon(category: string, type: "income" | "expense"): string {
  return CATEGORY_ICONS[category] || (type === "income" ? "💰" : "🏷️");
}

function TxnForm({ initial, defaultMonth, onClose, onSave }: { initial: any | null; defaultMonth?: string; onClose: () => void; onSave: (p: any) => void }) {
  const [type, setType] = useState<"income" | "expense">(initial?.type || "expense");
  const [amount, setAmount] = useState(initial ? String((initial.amountPaise / 100).toFixed(2)) : "");
  const [category, setCategory] = useState(
    initial?.category || (initial?.type === "income" ? "Salary" : "Groceries")
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(initial?.paymentMethod || "UPI");
  const [description, setDescription] = useState(initial?.description || "");
  const [date, setDate] = useState(() => {
    if (initial?.date) return initial.date;
    const currentM = todayISO().slice(0, 7);
    if (defaultMonth && defaultMonth !== currentM) {
      return `${defaultMonth}-01`;
    }
    return todayISO();
  });
  const [err, setErr] = useState<string | null>(null);

  const activeCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (nextType: "income" | "expense") => {
    setType(nextType);
    if (nextType === "income") {
      if (!INCOME_CATEGORIES.includes(category)) {
        setCategory(INCOME_CATEGORIES[0]);
      }
    } else {
      if (!EXPENSE_CATEGORIES.includes(category)) {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div className="card" style={{ width: "min(520px,100%)", padding: 16, animation: "pop .18s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial ? "Edit transaction" : "New transaction"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className={`btn ${type === "expense" ? "btn-primary" : ""}`} onClick={() => handleTypeChange("expense")}>Expense</button>
            <button type="button" className={`btn ${type === "income" ? "btn-primary" : ""}`} onClick={() => handleTypeChange("income")}>Income</button>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Amount (INR) *
            <input className="input" inputMode="decimal" placeholder="e.g., 1250.50" value={amount} onChange={e => setAmount(e.target.value)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Category
              <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                {activeCategories.map(c => (
                  <option key={c} value={c}>
                    {getCategoryIcon(c, type)} {c}
                  </option>
                ))}
                {!activeCategories.includes(category) && category && (
                  <option value={category}>
                    {getCategoryIcon(category, type)} {category}
                  </option>
                )}
              </select>
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Payment Mode
              <select className="select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm}>
                    {PAYMENT_ICONS[pm]} {pm}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Date
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Description *
              <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What was this for?" />
            </label>
          </div>
          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const n = Number(amount);
                if (!Number.isFinite(n) || n <= 0) { setErr("Enter a valid amount > 0"); return; }
                if (n > 10000000) { setErr("Amount too large"); return; }
                const paise = Math.round(n * 100);
                if (!description.trim()) { setErr("Description required"); return; }
                onSave({ type, amountPaise: paise, category, description: description.trim(), date, paymentMethod });
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionModal({
  initial,
  onClose,
  onSave
}: {
  initial: any | null;
  onClose: () => void;
  onSave: (sub: any) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [amount, setAmount] = useState(initial ? String((initial.amountPaise / 100).toFixed(0)) : "");
  const [category, setCategory] = useState(initial?.category || "Entertainment");
  const [dueDay, setDueDay] = useState(initial?.dueDay ? String(initial.dueDay) : "5");
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod || "UPI");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(initial?.billingCycle || "monthly");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div className="card" style={{ width: "min(440px,100%)", padding: 18, animation: "pop .18s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial ? "Edit Recurring Commitment" : "Add Subscription / Recurring Bill"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Service / Bill Name *
            <input className="input" placeholder="e.g. Netflix, Spotify, Gym, Rent, Internet, SIP" value={name} onChange={e => setName(e.target.value)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Amount (INR) *
              <input className="input" inputMode="decimal" placeholder="e.g. 649" value={amount} onChange={e => setAmount(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Due Day of Month (1-31) *
              <input className="input" type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Category
              <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {getCategoryIcon(c, "expense")} {c}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Payment Mode
              <select className="select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm}>
                    {PAYMENT_ICONS[pm]} {pm}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Billing Cycle
            <select className="select" value={billingCycle} onChange={e => setBillingCycle(e.target.value as any)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly (Annual)</option>
            </select>
          </label>
          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!name.trim()) { setErr("Name is required"); return; }
                const n = Number(amount);
                if (!Number.isFinite(n) || n <= 0) { setErr("Enter valid amount > 0"); return; }
                const day = Number(dueDay);
                if (!Number.isInteger(day) || day < 1 || day > 31) { setErr("Day must be between 1 and 31"); return; }
                onSave({
                  name: name.trim(),
                  amountPaise: Math.round(n * 100),
                  category,
                  dueDay: day,
                  billingCycle,
                  paymentMethod,
                  isActive: initial?.isActive ?? true
                });
              }}
            >
              Save Commitment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetModal({ initial, onClose, onSave }: { initial: any | null; onClose: () => void; onSave: (category: string, limitPaise: number) => void }) {
  const [category, setCategory] = useState(initial?.category || EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState(initial ? String((initial.limitPaise / 100).toFixed(0)) : "10000");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div className="card" style={{ width: "min(420px,100%)", padding: 16, animation: "pop .18s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial ? "Edit budget" : "Set monthly budget"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Expense Category
            <select className="select" value={category} onChange={e => setCategory(e.target.value)} disabled={!!initial}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Monthly Limit (INR) *
            <input className="input" inputMode="decimal" placeholder="e.g., 10000" value={amount} onChange={e => setAmount(e.target.value)} />
          </label>
          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const n = Number(amount);
                if (!Number.isFinite(n) || n <= 0) { setErr("Enter a valid amount > 0"); return; }
                if (n > 10000000) { setErr("Amount too large"); return; }
                onSave(category, Math.round(n * 100));
              }}
            >
              Save Budget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinanceView({ q }: { q: string }) {
  const {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    upsertBudget,
    deleteBudget,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscription
  } = useStore();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [timeScope, setTimeScope] = useState<"month" | "all">("month");
  const [activeSideTab, setActiveSideTab] = useState<"budgets" | "subscriptions">("budgets");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const combinedQ = (q + " " + query).trim().toLowerCase();

  const currentRealMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const goToPrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    const yStr = prev.getFullYear();
    const mStr = String(prev.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${yStr}-${mStr}`);
  };

  const goToNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const next = new Date(y, m, 1);
    const yStr = next.getFullYear();
    const mStr = String(next.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${yStr}-${mStr}`);
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(currentRealMonth);
  };

  const monthTx = useMemo(() => {
    return state.transactions.filter(t => t.date.slice(0, 7) === selectedMonth);
  }, [state.transactions, selectedMonth]);

  const filtered = useMemo(() => {
    let arr = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (timeScope === "month") {
      arr = arr.filter(t => t.date.slice(0, 7) === selectedMonth);
    }
    if (typeFilter !== "all") arr = arr.filter(t => t.type === typeFilter);
    if (catFilter !== "all") arr = arr.filter(t => t.category === catFilter);
    if (paymentFilter !== "all") arr = arr.filter(t => (t.paymentMethod || "UPI") === paymentFilter);
    if (combinedQ) {
      arr = arr.filter(t =>
        (t.description + " " + t.category + " " + (t.paymentMethod || "")).toLowerCase().includes(combinedQ)
      );
    }
    return arr;
  }, [state.transactions, timeScope, selectedMonth, typeFilter, catFilter, paymentFilter, combinedQ]);

  const exportToCSV = () => {
    const dataToExport = filtered;
    if (dataToExport.length === 0) {
      alert("No transactions match the current view to export.");
      return;
    }
    const headers = ["ID", "Date", "Type", "Category", "Payment Method", "Description", "Amount (INR)"];
    const rows = dataToExport.map(t => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.type}"`,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      `"${(t.paymentMethod || "UPI").replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      (t.amountPaise / 100).toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(","), ...rows.map(r => r.join(","))].join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    const scopeLabel = timeScope === "month" ? selectedMonth : "All_Time";
    link.setAttribute("download", `LifeOS_Transactions_${scopeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const income = monthTx.filter(t => t.type === "income").reduce((a, t) => a + t.amountPaise, 0);
  const expense = monthTx.filter(t => t.type === "expense").reduce((a, t) => a + t.amountPaise, 0);
  const remaining = income - expense;

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthTx.filter(t => t.type === "expense").forEach(t => {
      const mode = t.paymentMethod || "UPI";
      map.set(mode, (map.get(mode) || 0) + t.amountPaise);
    });
    return [...map.entries()]
      .map(([mode, amount]) => ({
        mode,
        amount,
        pct: expense > 0 ? Math.round((amount / expense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTx, expense]);

  const availableFilterCategories = useMemo(() => {
    let list: string[] = [];
    if (typeFilter === "expense") {
      const customExpense = state.transactions.filter(t => t.type === "expense").map(t => t.category);
      list = [...new Set([...EXPENSE_CATEGORIES, ...customExpense])];
    } else if (typeFilter === "income") {
      const customIncome = state.transactions.filter(t => t.type === "income").map(t => t.category);
      list = [...new Set([...INCOME_CATEGORIES, ...customIncome])];
    } else {
      list = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...state.transactions.map(t => t.category)])];
    }
    return list.sort((a, b) => a.localeCompare(b));
  }, [typeFilter, state.transactions]);

  const handleTypeFilterChange = (newType: "all" | "income" | "expense") => {
    setTypeFilter(newType);
    if (catFilter !== "all") {
      let valid: string[] = [];
      if (newType === "expense") valid = EXPENSE_CATEGORIES;
      else if (newType === "income") valid = INCOME_CATEGORIES;
      if (newType !== "all" && !valid.includes(catFilter)) {
        setCatFilter("all");
      }
    }
  };

  const expByCat = useMemo(() => {
    const m = new Map<string, number>();
    monthTx.filter(t => t.type === "expense").forEach(t => m.set(t.category, (m.get(t.category) || 0) + t.amountPaise));
    return [...m.entries()].map(([label, value]) => ({ label, value }));
  }, [monthTx]);

  const budgetRows = state.budgets.map(b => {
    const spent = monthTx.filter(t => t.type === "expense" && t.category === b.category).reduce((a, t) => a + t.amountPaise, 0);
    const pct = b.limitPaise ? Math.round(spent / b.limitPaise * 100) : 0;
    return { ...b, spent, pct, over: spent > b.limitPaise };
  });

  const subscriptions = state.subscriptions || [];
  const activeSubs = subscriptions.filter(s => s.isActive);
  const totalMonthlyRecurringPaise = activeSubs.reduce((acc, s) => {
    return acc + (s.billingCycle === "yearly" ? Math.round(s.amountPaise / 12) : s.amountPaise);
  }, 0);

  const todayDay = new Date().getDate();

  const nextUpcomingBill = useMemo(() => {
    if (activeSubs.length === 0) return null;
    const unpaidSubs = activeSubs.filter(s => {
      return !monthTx.some(t =>
        (t.subscriptionId && t.subscriptionId === s.id) ||
        (t.description === `${s.name} (Subscription)` && t.type === "expense")
      );
    });
    const pool = unpaidSubs.length > 0 ? unpaidSubs : activeSubs;
    const futureBills = [...pool].filter(s => s.dueDay >= todayDay).sort((a, b) => a.dueDay - b.dueDay);
    if (futureBills.length > 0) {
      const bill = futureBills[0];
      const diff = bill.dueDay - todayDay;
      return { bill, diff, label: diff === 0 ? "Due Today" : `Due in ${diff} day${diff > 1 ? "s" : ""}` };
    }
    const nextMonthBills = [...pool].sort((a, b) => a.dueDay - b.dueDay);
    const bill = nextMonthBills[0];
    return { bill, diff: bill.dueDay, label: `Due on ${bill.dueDay}th next month` };
  }, [activeSubs, todayDay, monthTx]);

  const handleTogglePaid = (sub: any, existingTxs: any[]) => {
    if (existingTxs.length > 0) {
      // Toggle to unpaid: remove the transaction(s)
      existingTxs.forEach(t => deleteTransaction(t.id));
    } else {
      // Toggle to paid: create the transaction
      const txnDate = selectedMonth === currentRealMonth
        ? todayISO()
        : `${selectedMonth}-${String(Math.min(28, sub.dueDay)).padStart(2, "0")}`;
      addTransaction({
        id: uid(),
        type: "expense",
        amountPaise: sub.amountPaise,
        category: sub.category,
        description: `${sub.name} (Subscription)`,
        date: txnDate,
        paymentMethod: sub.paymentMethod || "UPI",
        subscriptionId: sub.id
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Month Navigator Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "10px 16px",
          background: "var(--bg-elev)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={goToPrevMonth}
            title="Previous month"
            style={{ fontWeight: 800, padding: "6px 12px" }}
          >
            « Prev
          </button>
          
          {/* Interactive Month Picker */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                padding: "6px 14px",
                borderRadius: 10,
                background: "var(--bg-elev2)",
                border: "1px solid var(--border)",
                userSelect: "none"
              }}
              title="Click to jump to any month"
            >
              <span style={{ fontSize: 16 }}>🗓️</span>
              <span style={{ fontWeight: 900, fontSize: 15 }}>{monthLabel}</span>
              <span className="badge mono" style={{ fontSize: 11, background: "var(--bg-elev)", padding: "2px 6px" }}>
                {selectedMonth}
              </span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => e.target.value && setSelectedMonth(e.target.value)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer"
                }}
              />
            </label>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={goToNextMonth}
            title="Next month"
            style={{ fontWeight: 800, padding: "6px 12px" }}
          >
            Next »
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {selectedMonth !== currentRealMonth && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={goToCurrentMonth}
              style={{ color: "var(--accent)", fontWeight: 700, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <span>•</span> Current Month
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm"
            onClick={exportToCSV}
            title="Download filtered transactions as CSV file"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
          >
            <span>📥</span> Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="finance-hero-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Income ({monthLabel})</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{fmtINR(income)}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{selectedMonth} • {monthTx.filter(t => t.type === "income").length} deposits</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Expenses ({monthLabel})</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{fmtINR(expense)}</div>
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: Math.min(100, income ? Math.round(expense / income * 100) : 0) + "%", background: expense > income ? "var(--danger)" : "var(--warn)" }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            {income ? `${Math.round((expense / income) * 100)}% of income spent` : "No income recorded"}
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Net Cash Flow</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, color: remaining < 0 ? "var(--danger)" : "var(--success)" }}>{fmtINR(remaining)}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            {remaining < 0 ? "🚨 Net Deficit" : "🟢 Positive Surplus"}
          </div>
        </div>
        <SavingsRateCard income={income} expense={expense} monthLabel={monthLabel} />
      </div>

      {/* Operational 2-Column Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 12 }}>
        {/* Left: Transactions */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h3 style={{ fontWeight: 900 }}>Transactions</h3>
              <div style={{ display: "inline-flex", background: "var(--bg-elev2)", padding: 2, borderRadius: 8, border: "1px solid var(--border)" }}>
                <button
                  type="button"
                  className={`btn btn-sm ${timeScope === "month" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "3px 10px", fontSize: 11, height: "auto" }}
                  onClick={() => setTimeScope("month")}
                >
                  🗓️ {monthLabel.split(" ")[0]} ({monthTx.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${timeScope === "all" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "3px 10px", fontSize: 11, height: "auto" }}
                  onClick={() => setTimeScope("all")}
                >
                  🌐 All Time ({state.transactions.length})
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}>＋ Add transaction</button>
          </div>

          {/* Filters Row */}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <input className="input" placeholder="Search description, category, or payment mode…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
            <select className="select" value={typeFilter} onChange={e => handleTypeFilterChange(e.target.value as any)} style={{ width: 115 }}>
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select className="select" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 145 }}>
              <option value="all">🏷️ All categories</option>
              {availableFilterCategories.map(c => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c] || "🏷️"} {c}
                </option>
              ))}
            </select>
            <select className="select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ width: 140 }}>
              <option value="all">💳 All payment modes</option>
              {PAYMENT_METHODS.map(pm => (
                <option key={pm} value={pm}>
                  {PAYMENT_ICONS[pm]} {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Payment breakdown filter chips */}
          {paymentBreakdown.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Payment breakdown:</span>
              {paymentBreakdown.map(p => (
                <button
                  key={p.mode}
                  type="button"
                  className="badge"
                  onClick={() => setPaymentFilter(paymentFilter === p.mode ? "all" : p.mode)}
                  style={{
                    cursor: "pointer",
                    border: paymentFilter === p.mode ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: paymentFilter === p.mode ? "var(--accent)" : "var(--bg-elev2)",
                    color: paymentFilter === p.mode ? "#fff" : "var(--text)",
                    fontSize: 11,
                    padding: "3px 8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                  title={`Filter by ${p.mode}`}
                >
                  <span>{PAYMENT_ICONS[p.mode] || "💳"}</span>
                  <span>{p.mode}: {fmtINR(p.amount)} ({p.pct}%)</span>
                </button>
              ))}
            </div>
          )}

          {/* Transactions Feed */}
          <div style={{ marginTop: 10, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ maxHeight: 420, overflow: "auto" }}>
              {filtered.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: t.type === "income" ? "#22c55e18" : "#ef444418",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 18,
                      border: `1px solid ${t.type === "income" ? "#22c55e30" : "#ef444430"}`,
                      flexShrink: 0
                    }}
                    title={`${t.type.toUpperCase()}: ${t.category}`}
                  >
                    {getCategoryIcon(t.category, t.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                      <span>{t.category}</span>
                      <span>•</span>
                      <span>{t.date}</span>
                      <span>•</span>
                      <span className="mono" style={{ fontWeight: 700, color: "var(--text)" }}>{fmtINR(t.amountPaise)}</span>
                      <span className="badge" style={{ fontSize: 10, padding: "1px 6px", background: "var(--bg-elev2)" }}>
                        {PAYMENT_ICONS[t.paymentMethod || "UPI"] || "💳"} {t.paymentMethod || "UPI"}
                      </span>
                    </div>
                  </div>
                  <span className="badge" style={{ background: t.type === "income" ? "#22c55e18" : "var(--bg-elev2)", color: t.type === "income" ? "var(--success)" : "var(--text)" }}>
                    {t.type === "income" ? "↑ income" : "↓ expense"}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(t); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => { if (confirm("Delete transaction?")) deleteTransaction(t.id); }}>Delete</button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ padding: 14 }}><Empty text="No transactions match." /></div>}
            </div>
          </div>
        </div>

        {/* Right: Spending Breakdown & Tabbed Budgets / Subscriptions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Spending breakdown</h3>
            <Donut data={expByCat} />
          </div>

          {/* Tabbed Budgets & Subscriptions Card */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeSideTab === "budgets" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setActiveSideTab("budgets")}
                  style={{ fontSize: 12, fontWeight: 800, padding: "5px 12px" }}
                >
                  🎯 Budgets ({budgetRows.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeSideTab === "subscriptions" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setActiveSideTab("subscriptions")}
                  style={{ fontSize: 12, fontWeight: 800, padding: "5px 12px" }}
                >
                  🔄 Subscriptions ({subscriptions.length})
                </button>
              </div>

              {activeSideTab === "budgets" ? (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingBudget(null); setShowBudgetModal(true); }}>
                  ＋ Set budget
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingSub(null); setShowSubModal(true); }}>
                  ＋ Add recurring
                </button>
              )}
            </div>

            {activeSideTab === "budgets" ? (
              /* Budgets view */
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {budgetRows.map(b => (
                  <div key={b.category} style={{ padding: 10, borderRadius: 10, background: "var(--bg-elev2)", border: "1px solid " + (b.over ? "#ef444450" : "var(--border)") }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 800 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{getCategoryIcon(b.category, "expense")}</span>
                        <span>{b.category}</span>
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: b.over ? "var(--danger)" : "var(--text-muted)" }}>{fmtINR(b.spent)} / {fmtINR(b.limitPaise)}</span>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => { setEditingBudget(b); setShowBudgetModal(true); }} title="Edit budget">✏️</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "2px 6px", fontSize: 11, color: "var(--danger)" }} onClick={() => { if (confirm(`Delete budget for ${b.category}?`)) deleteBudget(b.category); }} title="Delete budget">✕</button>
                      </div>
                    </div>
                    <div className="progress-track" style={{ marginTop: 6 }}>
                      <div className="progress-fill" style={{ width: Math.min(100, b.pct) + "%", background: b.over ? "var(--danger)" : b.pct > 80 ? "var(--warn)" : "var(--accent)" }} />
                    </div>
                    <div style={{ fontSize: 11, color: b.over ? "var(--danger)" : "var(--text-muted)", marginTop: 4, fontWeight: 700 }}>
                      {b.pct}% {b.over ? "• Over budget" : ""}
                    </div>
                  </div>
                ))}
                {budgetRows.length === 0 && (
                  <div style={{ padding: 10 }}>
                    <Empty text="No budgets set yet." actionLabel="＋ Set budget" onAction={() => { setEditingBudget(null); setShowBudgetModal(true); }} />
                  </div>
                )}
              </div>
            ) : (
              /* Subscriptions view */
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {/* Recurring commitment summary */}
                <div style={{ padding: "10px 12px", background: "var(--bg-elev2)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Monthly Commitment
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, marginTop: 2, color: "var(--accent)" }}>
                      {fmtINR(totalMonthlyRecurringPaise)} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>/ mo</span>
                    </div>
                  </div>
                  {nextUpcomingBill && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Next Due
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2, color: nextUpcomingBill.diff <= 3 ? "var(--warn)" : "var(--text)" }}>
                        {nextUpcomingBill.bill.name} • {nextUpcomingBill.label}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subscriptions list */}
                <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {subscriptions.map(s => {
                    const existingTxs = monthTx.filter(t =>
                      (t.subscriptionId && t.subscriptionId === s.id) ||
                      (t.description === `${s.name} (Subscription)` && t.type === "expense")
                    );
                    const isPaid = existingTxs.length > 0;
                    const isDueSoon = !isPaid && s.dueDay >= todayDay && s.dueDay <= todayDay + 5;
                    const isPassed = !isPaid && s.dueDay < todayDay;
                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: "var(--bg-elev2)",
                          border: `1px solid ${isPaid ? "rgba(34, 197, 94, 0.35)" : isDueSoon ? "rgba(245, 158, 11, 0.4)" : "var(--border)"}`,
                          opacity: s.isActive ? 1 : 0.6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          transition: "border 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{getCategoryIcon(s.category, "expense")}</span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13 }}>{s.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                <span>{s.category}</span>
                                <span>•</span>
                                <span>{PAYMENT_ICONS[s.paymentMethod || "UPI"] || "💳"} {s.paymentMethod || "UPI"}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 900, fontSize: 14 }}>{fmtINR(s.amountPaise)}</div>
                            <span
                              className="badge"
                              style={{
                                fontSize: 10,
                                background: isPaid ? "#22c55e20" : isDueSoon ? "#f59e0b20" : isPassed ? "var(--bg-elev)" : "#22c55e18",
                                color: isPaid ? "var(--success)" : isDueSoon ? "var(--warn)" : isPassed ? "var(--text-muted)" : "var(--success)",
                                border: isPaid ? "1px solid rgba(34, 197, 94, 0.35)" : "none",
                                fontWeight: isPaid ? 800 : 600
                              }}
                            >
                              {isPaid
                                ? "✅ Paid this month"
                                : isDueSoon
                                ? `⚠️ Due in ${s.dueDay - todayDay}d`
                                : isPassed
                                ? `Passed (Due ${s.dueDay}th)`
                                : `Due on ${s.dueDay}th`}
                            </span>
                          </div>
                        </div>

                        {/* Actions bar for each subscription */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 6, marginTop: 2 }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${isPaid ? "btn-ghost" : "btn-primary"}`}
                            onClick={() => handleTogglePaid(s, existingTxs)}
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              background: isPaid ? "rgba(34, 197, 94, 0.14)" : undefined,
                              color: isPaid ? "var(--success)" : undefined,
                              border: isPaid ? "1px solid rgba(34, 197, 94, 0.45)" : undefined,
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            title={isPaid ? "Click to unmark as paid (restores deducted money)" : "Click to mark paid (deducts money as expense)"}
                          >
                            {isPaid ? "✅ Paid (Undo)" : "⚡ Mark Paid"}
                          </button>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => toggleSubscription(s.id)}
                              style={{ fontSize: 11, padding: "2px 6px" }}
                              title={s.isActive ? "Pause subscription" : "Resume subscription"}
                            >
                              {s.isActive ? "⏸️" : "▶️"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => { setEditingSub(s); setShowSubModal(true); }}
                              style={{ fontSize: 11, padding: "2px 6px" }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => { if (confirm(`Delete ${s.name}?`)) deleteSubscription(s.id); }}
                              style={{ fontSize: 11, padding: "2px 6px", color: "var(--danger)" }}
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {subscriptions.length === 0 && (
                    <div style={{ padding: 10 }}>
                      <Empty text="No recurring subscriptions tracked yet." actionLabel="＋ Add subscription" onAction={() => { setEditingSub(null); setShowSubModal(true); }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Burn Rate & End-of-Month Projection */}
      <BurnRateBanner
        expense={expense}
        income={income}
        selectedMonth={selectedMonth}
        currentRealMonth={currentRealMonth}
      />

      {/* 6-Month Cash Flow Trend */}
      <CashFlowTrendChart
        transactions={state.transactions}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {showForm && (
        <TxnForm
          initial={editing}
          defaultMonth={selectedMonth}
          onClose={() => setShowForm(false)}
          onSave={(patch) => {
            if (editing) updateTransaction(editing.id, patch as any);
            else addTransaction({ id: uid(), ...patch as any });
            setShowForm(false);
          }}
        />
      )}

      {showBudgetModal && (
        <BudgetModal
          initial={editingBudget}
          onClose={() => setShowBudgetModal(false)}
          onSave={(category, limitPaise) => {
            upsertBudget(category, limitPaise);
            setShowBudgetModal(false);
          }}
        />
      )}

      {showSubModal && (
        <SubscriptionModal
          initial={editingSub}
          onClose={() => setShowSubModal(false)}
          onSave={(subData) => {
            if (editingSub) {
              updateSubscription(editingSub.id, subData);
            } else {
              addSubscription({ id: uid(), ...subData });
            }
            setShowSubModal(false);
          }}
        />
      )}

      <style>{`
        @media(max-width:1050px){ 
          .finance-hero-metrics { grid-template-columns: 1fr 1fr !important; } 
          div[style*="1.1fr .9fr"]{ grid-template-columns: 1fr !important; } 
        }
        @media(max-width:600px){ 
          .finance-hero-metrics { grid-template-columns: 1fr !important; } 
        }
      `}</style>
    </div>
  );
}
