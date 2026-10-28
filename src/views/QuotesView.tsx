import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { QuoteCardStyle, QuoteItem } from "../models";
import { QuoteCard, QUOTE_STYLES } from "../components/QuoteCard";

const CATEGORIES = [
  "All",
  "Mindset",
  "Wisdom",
  "Discipline",
  "Motivation",
  "Inspiration",
  "Philosophy",
  "Focus",
  "Life"
];

export function QuotesView({ q = "", onToast }: { q?: string; onToast: (m: string) => void }) {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [spotlightIdx, setSpotlightIdx] = useState<number>(0);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [deleteSearch, setDeleteSearch] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Modal form states
  const [formText, setFormText] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formCategory, setFormCategory] = useState("Mindset");
  const [formStyle, setFormStyle] = useState<QuoteCardStyle>("terracotta-badge");

  // Load quotes from backend
  const loadQuotes = async () => {
    setLoading(true);
    try {
      const data = await api.getQuotes();
      setQuotes(data);
      if (data.length > 0) {
        setSpotlightIdx(Math.floor(Math.random() * data.length));
      }
    } catch {
      onToast("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  // Filtered quotes based on search and category
  const filtered = useMemo(() => {
    const combinedSearch = (q + " " + search).trim().toLowerCase();
    return quotes.filter(item => {
      const matchCat = selectedCat === "All" || item.category?.toLowerCase() === selectedCat.toLowerCase();
      const matchSearch =
        !combinedSearch ||
        item.text.toLowerCase().includes(combinedSearch) ||
        (item.author && item.author.toLowerCase().includes(combinedSearch));
      return matchCat && matchSearch;
    });
  }, [quotes, selectedCat, search, q]);

  // Quotes filtered for the delete modal list
  const deleteListFiltered = useMemo(() => {
    if (!deleteSearch.trim()) return quotes;
    const term = deleteSearch.trim().toLowerCase();
    return quotes.filter(
      item =>
        item.text.toLowerCase().includes(term) ||
        (item.author && item.author.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term))
    );
  }, [quotes, deleteSearch]);

  // Spotlight Quote
  const spotlightQuote = quotes.length > 0 ? quotes[spotlightIdx % quotes.length] : null;

  const handleShuffle = () => {
    if (quotes.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * quotes.length);
    if (nextIdx === spotlightIdx) nextIdx = (nextIdx + 1) % quotes.length;
    setSpotlightIdx(nextIdx);
    onToast("🎲 New spotlight quote loaded");
  };

  // Submit new quote
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) {
      onToast("Please enter quote text");
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createQuote({
        text: formText.trim(),
        author: formAuthor.trim() || "Anonymous",
        category: formCategory,
        cardStyle: formStyle
      });
      setQuotes(prev => [created, ...prev]);
      onToast("Quote published to the wall!");
      setFormText("");
      setFormAuthor("");
      setShowModal(false);
    } catch (err: any) {
      onToast(err?.message || "Failed to post quote");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete quote from backend + frontend
  const handleExecuteDelete = async (idToDelete?: string) => {
    const targetId = idToDelete || selectedDeleteId;
    if (!targetId) {
      onToast("Please select a quote to delete");
      return;
    }

    setDeleting(true);
    try {
      await api.deleteQuote(targetId);
      setQuotes(prev => prev.filter(q => q._id !== targetId));
      if (selectedDeleteId === targetId) {
        setSelectedDeleteId(null);
      }
      onToast("Quote deleted from database!");
      setShowDeleteModal(false);
    } catch (err: any) {
      onToast(err?.message || "Failed to delete quote");
    } finally {
      setDeleting(false);
    }
  };

  const selectedQuoteForDeletion = quotes.find(q => q._id === selectedDeleteId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
      {/* Top Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          background: "linear-gradient(135deg, rgba(124, 108, 255, 0.08), rgba(94, 234, 212, 0.05))",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "24px 28px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #e76f51, #f4a261)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 18,
                fontWeight: 900
              }}
            >
              ❞
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Inspiration & Quotes Wall
            </h1>
          </div>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14, maxWidth: 600 }}>
            Timeless philosophy, focus principles, and mindset reminders. Any user can write, style, and manage quotes.
          </p>
        </div>

        {/* Action Buttons Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-ghost"
              onClick={handleShuffle}
              title="Random spotlight quote"
              style={{ fontWeight: 700 }}
            >
              🎲 Inspire Me
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              style={{ fontWeight: 700, gap: 8, padding: "10px 18px" }}
            >
              <span>＋</span> Write Quote
            </button>
          </div>

          {/* Button directly below + Write Quote */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSelectedDeleteId(null);
              setDeleteSearch("");
              setShowDeleteModal(true);
            }}
            style={{
              color: "var(--danger)",
              fontWeight: 700,
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.06)",
              gap: 6
            }}
          >
             Delete Quote
          </button>
        </div>
      </div>

      {/* Spotlight Quote Hero (Featured) */}
      {spotlightQuote && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent)" }}>
                ✦ Daily Spotlight
              </span>
              <span className="badge" style={{ fontSize: 10, background: "var(--bg-elev2)" }}>
                {spotlightQuote.category}
              </span>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleShuffle}
              style={{ fontSize: 12 }}
            >
              Shuffle ↻
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
            <QuoteCard
              quote={spotlightQuote}
              onCopy={() => onToast("Quote copied to clipboard!")}
              onDelete={id => handleExecuteDelete(id)}
            />
          </div>
        </div>
      )}

      {/* Control Bar: Category Filter Pills & Search */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          {/* Category Pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {CATEGORIES.map(cat => {
              const active = selectedCat === cat;
              const count = cat === "All" ? quotes.length : quotes.filter(q => q.category?.toLowerCase() === cat.toLowerCase()).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 999,
                    border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
                    background: active ? "var(--accent)" : "var(--bg-elev)",
                    color: active ? "#fff" : "var(--text-muted)",
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      fontSize: 11,
                      opacity: 0.8,
                      background: active ? "rgba(255,255,255,0.25)" : "var(--bg-elev2)",
                      padding: "1px 6px",
                      borderRadius: 10
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div style={{ minWidth: 220, position: "relative" }}>
            <input
              type="text"
              className="input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search quotes or authors…"
              style={{ paddingLeft: 32, fontSize: 13 }}
            />
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
                fontSize: 13
              }}
            >
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* Quotes Masonry Board */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 24, marginBottom: 8, animation: "pop 0.6s infinite alternate" }}>❞</div>
          <div>Loading quotes wall…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius)",
            padding: "50px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12
          }}
        >
          <div style={{ fontSize: 36 }}>❞</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>No quotes found</div>
          <div style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 380 }}>
            {search || selectedCat !== "All"
              ? "No quotes match the current filters. Try resetting search or select a different category."
              : "No quotes have been posted yet. Be the first to share an inspiring quote!"}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {(search || selectedCat !== "All") && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSelectedCat("All");
                  setSearch("");
                }}
              >
                Clear Filters
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Write a Quote
            </button>
          </div>
        </div>
      ) : (
        <div className="quotes-masonry-grid">
          {filtered.map(item => (
            <div key={item._id} style={{ breakInside: "avoid", marginBottom: 20 }}>
              <QuoteCard
                quote={item}
                onCopy={() => onToast("Quote copied to clipboard!")}
                onDelete={id => handleExecuteDelete(id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal: Write New Quote with Live Preview */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 16,
            overflowY: "auto"
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              maxWidth: 820,
              width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              animation: "pop 0.2s ease-out",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Create New Quote Card</h3>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Pick a card style from the design reference and preview in real-time.
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowModal(false)}
                style={{ fontSize: 16, padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Two Columns (Form + Live Preview) */}
            <div
              style={{
                padding: 24,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 24,
                alignItems: "start"
              }}
            >
              {/* Left Column: Form Fields */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Quote Text <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <textarea
                    className="textarea"
                    value={formText}
                    onChange={e => setFormText(e.target.value)}
                    placeholder="Enter the quote text here…"
                    rows={4}
                    required
                    style={{ fontSize: 14 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      Author / Source
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formAuthor}
                      onChange={e => setFormAuthor(e.target.value)}
                      placeholder="e.g. Marcus Aurelius"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      Category
                    </label>
                    <select
                      className="select"
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                    >
                      {CATEGORIES.filter(c => c !== "All").map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Style Selector Grid */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                    Card Style Template (11 Designs)
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: 8,
                      maxHeight: 200,
                      overflowY: "auto",
                      padding: "4px"
                    }}
                  >
                    {QUOTE_STYLES.map(s => {
                      const isSelected = formStyle === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormStyle(s.id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "2px solid " + (isSelected ? "var(--accent)" : "var(--border)"),
                            background: isSelected ? "var(--bg-elev2)" : "var(--bg-elev)",
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            transition: "all 0.15s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                background: s.previewBg,
                                border: s.previewBorder ? `1px solid ${s.previewBorder}` : "none",
                                flexShrink: 0
                              }}
                            />
                            <span style={{ fontSize: 11.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {s.name}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ fontWeight: 700, padding: "9px 20px" }}
                  >
                    {submitting ? "Publishing…" : "Publish Quote"}
                  </button>
                </div>
              </form>

              {/* Right Column: Real-time Live Preview */}
              <div
                style={{
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 280
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-faint)", marginBottom: 16 }}>
                  Live Card Preview
                </div>
                <div style={{ width: "100%", maxWidth: 340 }}>
                  <QuoteCard
                    quote={{
                      text: formText.trim() || "Your inspiring quote text will appear here as you type.",
                      author: formAuthor.trim() || "Author Name",
                      category: formCategory,
                      cardStyle: formStyle
                    }}
                    compact
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Quote List & Selector */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 16,
            overflowY: "auto"
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              maxWidth: 640,
              width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              animation: "pop 0.2s ease-out",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--danger)" }}>
                  🗑️ Delete Quote
                </h3>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Select a quote from the existing collection to delete from both the frontend & database.
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDeleteModal(false)}
                style={{ fontSize: 16, padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
              {/* Quick Filter Input */}
              <input
                type="text"
                className="input"
                value={deleteSearch}
                onChange={e => setDeleteSearch(e.target.value)}
                placeholder="Search quotes to delete by text, author, or category…"
                style={{ fontSize: 13 }}
              />

              {/* Quotes Scrollable List */}
              <div
                style={{
                  maxHeight: 280,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingRight: 4
                }}
              >
                {deleteListFiltered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)", fontSize: 13 }}>
                    No quotes found matching your search.
                  </div>
                ) : (
                  deleteListFiltered.map(item => {
                    const isSelected = selectedDeleteId === item._id;
                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedDeleteId(item._id)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1.5px solid " + (isSelected ? "var(--danger)" : "var(--border)"),
                          background: isSelected ? "rgba(239, 68, 68, 0.08)" : "var(--bg-elev)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          transition: "all 0.15s ease"
                        }}
                      >
                        {/* Radio Indicator */}
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid " + (isSelected ? "var(--danger)" : "var(--border-strong)"),
                            background: isSelected ? "var(--danger)" : "transparent",
                            marginTop: 2,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center"
                          }}
                        >
                          {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                        </div>

                        {/* Quote Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: 13.5,
                              fontWeight: 500,
                              lineHeight: 1.45,
                              color: "var(--text)"
                            }}
                          >
                            "{item.text}"
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11.5 }}>
                            <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>
                              — {item.author || "Anonymous"}
                            </span>
                            <span className="badge" style={{ fontSize: 10, background: "var(--bg-elev2)" }}>
                              {item.category}
                            </span>
                            <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                              {item.cardStyle}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Warning Box */}
              {selectedQuoteForDeletion && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    fontSize: 12.5,
                    color: "var(--text)"
                  }}
                >
                  <div style={{ fontWeight: 800, color: "var(--danger)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>⚠</span> Ready to delete:
                  </div>
                  <div style={{ fontStyle: "italic", marginBottom: 4 }}>
                    "{selectedQuoteForDeletion.text}"
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    This action will permanently delete this quote from MongoDB and the wall.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                background: "var(--bg-elev)"
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleExecuteDelete()}
                disabled={!selectedDeleteId || deleting}
                style={{
                  background: "var(--danger)",
                  borderColor: "var(--danger)",
                  fontWeight: 700,
                  opacity: !selectedDeleteId || deleting ? 0.5 : 1
                }}
              >
                {deleting ? "Deleting from Database…" : "Delete Quote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default QuotesView;
