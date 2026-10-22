import { useMemo, useState } from "react";
import { useStore } from "../store";
import { fmtINR, todayISO, uid } from "../utils";
import { Empty } from "../components/CommonUI";
import { Donut } from "./OverviewView";

function TxnForm({ initial, onClose, onSave }: { initial: any | null; onClose: () => void; onSave: (p: any) => void }) {
  const [type, setType] = useState<"income" | "expense">(initial?.type || "expense");
  const [amount, setAmount] = useState(initial ? String((initial.amountPaise / 100).toFixed(2)) : "");
  const [category, setCategory] = useState(initial?.category || "Groceries");
  const [description, setDescription] = useState(initial?.description || "");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [err, setErr] = useState<string | null>(null);
  const categories = ["Groceries", "Dining", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Travel", "Rent", "Salary", "Freelance", "Investment", "Other"];

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div className="card" style={{ width: "min(520px,100%)", padding: 16, animation: "pop .18s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial ? "Edit transaction" : "New transaction"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`btn ${type === "expense" ? "btn-primary" : ""}`} onClick={() => setType("expense")}>Expense</button>
            <button className={`btn ${type === "income" ? "btn-primary" : ""}`} onClick={() => setType("income")}>Income</button>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Amount (INR) *
            <input className="input" inputMode="decimal" placeholder="e.g., 1250.50" value={amount} onChange={e => setAmount(e.target.value)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Category
              <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Date
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Description
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What was this for?" />
          </label>
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
                onSave({ type, amountPaise: paise, category, description: description.trim(), date });
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

export function FinanceView({ q }: { q: string }) {
  const { state, addTransaction, updateTransaction, deleteTransaction } = useStore();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const combinedQ = (q + " " + query).trim().toLowerCase();

  const filtered = useMemo(() => {
    let arr = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (typeFilter !== "all") arr = arr.filter(t => t.type === typeFilter);
    if (catFilter !== "all") arr = arr.filter(t => t.category === catFilter);
    if (combinedQ) arr = arr.filter(t => (t.description + " " + t.category).toLowerCase().includes(combinedQ));
    return arr;
  }, [state.transactions, typeFilter, catFilter, combinedQ]);

  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthTx = state.transactions.filter(t => t.date.slice(0, 7) === month);
  const income = monthTx.filter(t => t.type === "income").reduce((a, t) => a + t.amountPaise, 0);
  const expense = monthTx.filter(t => t.type === "expense").reduce((a, t) => a + t.amountPaise, 0);
  const remaining = income - expense;
  const cats = [...new Set(state.transactions.map(t => t.category))];

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Income (month)</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{fmtINR(income)}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{month}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Expenses (month)</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{fmtINR(expense)}</div>
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: Math.min(100, income ? Math.round(expense / income * 100) : 0) + "%", background: expense > income ? "var(--danger)" : "var(--warn)" }} />
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Remaining</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, color: remaining < 0 ? "var(--danger)" : "var(--success)" }}>{fmtINR(remaining)}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{remaining < 0 ? "Over budget" : "On track"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <h3 style={{ fontWeight: 900 }}>Transactions</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}>＋ Add transaction</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <input className="input" placeholder="Search description or category…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
            <select className="select" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} style={{ width: 130 }}>
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select className="select" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 140 }}>
              <option value="all">All categories</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 10, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ maxHeight: 420, overflow: "auto" }}>
              {filtered.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: t.type === "income" ? "#22c55e18" : "#ef444418", color: t.type === "income" ? "var(--success)" : "var(--danger)", display: "grid", placeItems: "center", fontWeight: 900 }}>
                    {t.type === "income" ? "↑" : "↓"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.category} • {t.date} • <span className="mono">{fmtINR(t.amountPaise)}</span></div>
                  </div>
                  <span className="badge" style={{ background: t.type === "income" ? "#22c55e18" : "var(--bg-elev2)", color: t.type === "income" ? "var(--success)" : "var(--text)" }}>{t.type}</span>
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

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Spending breakdown</h3>
            <Donut data={expByCat} />
          </div>
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Budgets — {month}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {budgetRows.map(b => (
                <div key={b.category} style={{ padding: 10, borderRadius: 10, background: "var(--bg-elev2)", border: "1px solid " + (b.over ? "#ef444450" : "var(--border)") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800 }}>
                    <span>{b.category}</span>
                    <span style={{ color: b.over ? "var(--danger)" : "var(--text-muted)" }}>{fmtINR(b.spent)} / {fmtINR(b.limitPaise)}</span>
                  </div>
                  <div className="progress-track" style={{ marginTop: 6 }}>
                    <div className="progress-fill" style={{ width: Math.min(100, b.pct) + "%", background: b.over ? "var(--danger)" : b.pct > 80 ? "var(--warn)" : "var(--accent)" }} />
                  </div>
                  <div style={{ fontSize: 11, color: b.over ? "var(--danger)" : "var(--text-muted)", marginTop: 4, fontWeight: 700 }}>
                    {b.pct}% {b.over ? "• Over budget" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <TxnForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSave={(patch) => {
            if (editing) updateTransaction(editing.id, patch as any);
            else addTransaction({ id: uid(), ...patch as any });
            setShowForm(false);
          }}
        />
      )}

      <style>{`@media(max-width:1000px){ div[style*="repeat(3,1fr)"]{ grid-template-columns:1fr !important; } div[style*="1.1fr .9fr"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
