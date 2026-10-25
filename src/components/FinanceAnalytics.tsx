import { useMemo, useState } from "react";
import type { Transaction } from "../models";
import { fmtINR } from "../utils";

export function fmtINRCompact(paise: number): string {
  const rs = Math.abs(paise / 100);
  const sign = paise < 0 ? "-" : "";
  if (rs >= 10000000) return `${sign}₹${(rs / 10000000).toFixed(1)}Cr`;
  if (rs >= 100000) return `${sign}₹${(rs / 100000).toFixed(1)}L`;
  if (rs >= 1000) return `${sign}₹${(rs / 1000).toFixed(1)}k`;
  return `${sign}₹${Math.round(rs)}`;
}

export function SavingsRateCard({
  income,
  expense,
  monthLabel
}: {
  income: number;
  expense: number;
  monthLabel: string;
}) {
  const hasIncome = income > 0;
  const savingsRate = hasIncome ? Math.round(((income - expense) / income) * 100) : null;
  const savedPaise = income - expense;

  let badgeText = "No income logged";
  let badgeColor = "var(--text-muted)";
  let badgeBg = "rgba(255,255,255,0.06)";
  let icon = "ℹ️";

  if (hasIncome && savingsRate !== null) {
    if (savingsRate >= 20) {
      badgeText = "Healthy (≥20%)";
      badgeColor = "var(--success)";
      badgeBg = "#22c55e18";
      icon = "🌟";
    } else if (savingsRate >= 0) {
      badgeText = "Tight (<20%)";
      badgeColor = "var(--warn)";
      badgeBg = "#f59e0b18";
      icon = "⚠️";
    } else {
      badgeText = "Deficit";
      badgeColor = "var(--danger)";
      badgeBg = "#ef444418";
      icon = "🚨";
    }
  }

  return (
    <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Savings Rate
          </div>
          <span
            className="badge"
            style={{
              background: badgeBg,
              color: badgeColor,
              fontSize: 11,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span>{icon}</span> {badgeText}
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, color: badgeColor }}>
          {savingsRate !== null ? `${savingsRate > 0 ? "+" : ""}${savingsRate}%` : "—"}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="progress-track" style={{ height: 6 }}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.max(0, Math.min(100, savingsRate ?? 0))}%`,
              background: badgeColor
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
          <span>{hasIncome ? (savedPaise >= 0 ? `Saved ${fmtINR(savedPaise)}` : `Deficit ${fmtINR(Math.abs(savedPaise))}`) : "No deposits"}</span>
          <span style={{ fontSize: 11 }}>{monthLabel}</span>
        </div>
      </div>
    </div>
  );
}

export function BurnRateBanner({
  expense,
  income,
  selectedMonth,
  currentRealMonth
}: {
  expense: number;
  income: number;
  selectedMonth: string;
  currentRealMonth: string;
}) {
  const [selYear, selMonth] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(selYear, selMonth, 0).getDate();

  const isCurrentMonth = selectedMonth === currentRealMonth;
  const isPastMonth = selectedMonth < currentRealMonth;
  const isFutureMonth = selectedMonth > currentRealMonth;

  let daysElapsed = daysInMonth;
  let daysRemaining = 0;

  if (isCurrentMonth) {
    const todayDate = new Date().getDate();
    daysElapsed = Math.min(daysInMonth, Math.max(1, todayDate));
    daysRemaining = Math.max(0, daysInMonth - daysElapsed);
  } else if (isFutureMonth) {
    daysElapsed = 0;
    daysRemaining = daysInMonth;
  }

  // Daily burn in paise
  const dailyBurnPaise = daysElapsed > 0 ? Math.round(expense / daysElapsed) : 0;
  // Month-end projected expense
  const projectedExpensePaise = isCurrentMonth
    ? dailyBurnPaise * daysInMonth
    : expense;

  const projectedDelta = income - projectedExpensePaise;
  const isDeficitProjected = income > 0 && projectedDelta < 0;

  return (
    <div
      className="card burn-rate-banner"
      style={{
        padding: "14px 18px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        display: "grid",
        gridTemplateColumns: "1.2fr 1.2fr 1fr",
        gap: 16,
        alignItems: "center"
      }}
    >
      {/* Daily Burn */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#f59e0b18",
            border: "1px solid #f59e0b30",
            display: "grid",
            placeItems: "center",
            fontSize: 20,
            flexShrink: 0
          }}
        >
          🔥
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Daily Burn Rate
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>
            {fmtINR(dailyBurnPaise)} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>/ day</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {isCurrentMonth ? (
              <span>Based on {daysElapsed} days elapsed • <strong>{daysRemaining} days left</strong></span>
            ) : isPastMonth ? (
              <span>Completed month ({daysInMonth} days avg)</span>
            ) : (
              <span>Upcoming month (not started)</span>
            )}
          </div>
        </div>
      </div>

      {/* Month-End Projection */}
      <div className="banner-col-mid" style={{ display: "flex", alignItems: "flex-start", gap: 12, borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isDeficitProjected ? "#ef444418" : "#7c6cff18",
            border: `1px solid ${isDeficitProjected ? "#ef444430" : "#7c6cff30"}`,
            display: "grid",
            placeItems: "center",
            fontSize: 20,
            flexShrink: 0
          }}
        >
          🔭
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Month-End Projected Spend
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2, color: isDeficitProjected ? "var(--danger)" : "var(--text)" }}>
            {fmtINR(projectedExpensePaise)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {income > 0 ? (
              isDeficitProjected ? (
                <span style={{ color: "var(--danger)", fontWeight: 700 }}>
                  🚨 Projected deficit: -{fmtINR(Math.abs(projectedDelta))}
                </span>
              ) : (
                <span style={{ color: "var(--success)", fontWeight: 700 }}>
                  🟢 Projected savings: +{fmtINR(projectedDelta)}
                </span>
              )
            ) : (
              <span>Estimated finish based on burn rate</span>
            )}
          </div>
        </div>
      </div>

      {/* Burn Gauge / Visual Pace */}
      <div className="banner-col-right" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
          Monthly Pace
        </div>
        {isCurrentMonth ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              <span>Spent {fmtINR(expense)}</span>
              <span style={{ color: "var(--text-muted)" }}>Target {income ? fmtINR(income) : "—"}</span>
            </div>
            <div className="progress-track" style={{ height: 8, borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, income ? (expense / income) * 100 : (daysElapsed / daysInMonth) * 100)}%`,
                  background: expense > income && income > 0 ? "var(--danger)" : "linear-gradient(90deg, var(--accent), var(--warn))"
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              {daysElapsed} of {daysInMonth} days ({Math.round((daysElapsed / daysInMonth) * 100)}% elapsed)
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, minHeight: 38 }}>
            <span>{isPastMonth ? "✅ Closed month archive" : "⏳ Planned month"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CashFlowTrendChart({
  transactions,
  selectedMonth,
  onSelectMonth
}: {
  transactions: Transaction[];
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute 6 months ending on selectedMonth
  const data = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthKey = `${year}-${String(monthNum).padStart(2, "0")}`;
      const shortName = d.toLocaleDateString("en-US", { month: "short" });
      const fullLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      const txs = transactions.filter(t => t.date.slice(0, 7) === monthKey);
      const inc = txs.filter(t => t.type === "income").reduce((a, t) => a + t.amountPaise, 0);
      const exp = txs.filter(t => t.type === "expense").reduce((a, t) => a + t.amountPaise, 0);

      months.push({
        monthKey,
        shortName,
        fullLabel,
        income: inc,
        expense: exp,
        net: inc - exp,
        count: txs.length,
        isSelected: monthKey === selectedMonth
      });
    }
    return months;
  }, [transactions, selectedMonth]);

  // Overall 6-month metrics
  const totalInc = data.reduce((a, b) => a + b.income, 0);
  const totalExp = data.reduce((a, b) => a + b.expense, 0);
  const avgInc = Math.round(totalInc / 6);
  const avgExp = Math.round(totalExp / 6);

  // Max value to scale SVG bars (minimum 10,000 INR so bars don't divide by 0)
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000000);

  // SVG dimensions
  const svgWidth = 620;
  const svgHeight = 190;
  const chartTop = 20;
  const chartBottom = 150;
  const chartHeight = chartBottom - chartTop;
  const slotWidth = (svgWidth - 60) / 6;
  const barWidth = 14;

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : data.find(d => d.isSelected) || data[data.length - 1];

  return (
    <div className="card" style={{ padding: "16px 18px", borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <h3 style={{ fontWeight: 900, fontSize: 15 }}>6-Month Cash Flow Trend</h3>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Income vs. Expenses history • Click any column to inspect that month
          </div>
        </div>

        {/* Legend & Averages */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#22c55e" }} />
            <span>Income (avg {fmtINRCompact(avgInc)})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#ef4444" }} />
            <span>Expense (avg {fmtINRCompact(avgExp)})</span>
          </div>
        </div>
      </div>

      {/* Active / Hovered Month Inspection Pill */}
      {activeItem && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "var(--bg-elev2)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800 }}>🗓️ {activeItem.fullLabel}</span>
            {activeItem.isSelected && (
              <span className="badge" style={{ background: "var(--accent)", color: "#fff", fontSize: 10 }}>
                Viewing Now
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span>
              Income: <strong style={{ color: "var(--success)" }}>{fmtINR(activeItem.income)}</strong>
            </span>
            <span>
              Expense: <strong style={{ color: "var(--danger)" }}>{fmtINR(activeItem.expense)}</strong>
            </span>
            <span>
              Net:{" "}
              <strong style={{ color: activeItem.net >= 0 ? "var(--success)" : "var(--danger)" }}>
                {activeItem.net >= 0 ? "+" : ""}{fmtINR(activeItem.net)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* SVG Dual-Bar Chart */}
      <div style={{ width: "100%", marginTop: 10, overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: "100%", height: "auto", minWidth: 480, display: "block" }}
        >
          <defs>
            <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = chartBottom - pct * chartHeight;
            const val = Math.round(maxVal * pct);
            return (
              <g key={idx}>
                <line
                  x1={45}
                  y1={y}
                  x2={svgWidth - 15}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray={pct === 0 ? "none" : "3 3"}
                  strokeOpacity={0.6}
                />
                <text
                  x={40}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill="var(--text-muted)"
                  fontWeight={600}
                >
                  {fmtINRCompact(val)}
                </text>
              </g>
            );
          })}

          {/* Month Columns */}
          {data.map((d, i) => {
            const slotX = 50 + i * slotWidth;
            const incH = Math.max(3, (d.income / maxVal) * chartHeight);
            const expH = Math.max(3, (d.expense / maxVal) * chartHeight);
            const incY = chartBottom - incH;
            const expY = chartBottom - expH;
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={d.monthKey}
                onClick={() => onSelectMonth(d.monthKey)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Column highlight backdrop */}
                <rect
                  x={slotX + 4}
                  y={chartTop}
                  width={slotWidth - 8}
                  height={chartHeight + 25}
                  rx={8}
                  fill={
                    d.isSelected
                      ? "rgba(124, 108, 255, 0.12)"
                      : isHovered
                      ? "rgba(255, 255, 255, 0.04)"
                      : "transparent"
                  }
                  stroke={d.isSelected ? "var(--accent)" : "transparent"}
                  strokeWidth={d.isSelected ? 1.5 : 0}
                />

                {/* Income Bar */}
                <rect
                  x={slotX + slotWidth / 2 - barWidth - 2}
                  y={incY}
                  width={barWidth}
                  height={incH}
                  rx={4}
                  fill="url(#incomeBarGrad)"
                  opacity={isHovered || d.isSelected ? 1 : 0.85}
                  style={{ transition: "all 0.15s ease" }}
                />

                {/* Expense Bar */}
                <rect
                  x={slotX + slotWidth / 2 + 2}
                  y={expY}
                  width={barWidth}
                  height={expH}
                  rx={4}
                  fill="url(#expenseBarGrad)"
                  opacity={isHovered || d.isSelected ? 1 : 0.85}
                  style={{ transition: "all 0.15s ease" }}
                />

                {/* Month Name */}
                <text
                  x={slotX + slotWidth / 2}
                  y={chartBottom + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={d.isSelected ? 900 : 700}
                  fill={d.isSelected ? "var(--accent)" : isHovered ? "var(--text)" : "var(--text-muted)"}
                >
                  {d.shortName}
                </text>

                {/* Active indicator dot */}
                {d.isSelected && (
                  <circle
                    cx={slotX + slotWidth / 2}
                    y={chartBottom + 25}
                    r={2.5}
                    fill="var(--accent)"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <style>{`
        @media(max-width: 900px) {
          .burn-rate-banner {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .banner-col-mid, .banner-col-right {
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid var(--border);
            padding-top: 12px;
          }
        }
      `}</style>
    </div>
  );
}
