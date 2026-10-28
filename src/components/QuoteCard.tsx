import React, { useState } from "react";
import type { QuoteCardStyle, QuoteItem } from "../models";

export const QUOTE_STYLES: Array<{
  id: QuoteCardStyle;
  name: string;
  tag: string;
  previewBg: string;
  previewBorder?: string;
}> = [
  { id: "terracotta-badge", name: "Terracotta Shadow", tag: "Warm & Bold", previewBg: "#e76f51" },
  { id: "dotted-circle", name: "Dotted Circle", tag: "Editorial Ring", previewBg: "#bdaec2" },
  { id: "mint-banner", name: "Mint Banner", tag: "Fresh Inset", previewBg: "#4ecdc4" },
  { id: "lavender-bubble", name: "Lavender Bubble", tag: "Speech Bubble", previewBg: "#aba2b8" },
  { id: "dark-circle", name: "Espresso Disc", tag: "Minimalist Dark", previewBg: "#2d2424" },
  { id: "peach-card", name: "Peach Editorial", tag: "Tall Classic", previewBg: "#f2beaa" },
  { id: "dotted-border", name: "Dotted Rule", tag: "Flanked Quotes", previewBg: "#f8f9fa", previewBorder: "#2b2229" },
  { id: "pill-frame", name: "Lavender Pill", tag: "Notched Frame", previewBg: "#b5adc1" },
  { id: "ribbon-tag", name: "Teal Ribbon", tag: "Folded Badge", previewBg: "#38b2ac" },
  { id: "notched-banner", name: "Notched Terracotta", tag: "Geometric Notch", previewBg: "#df684c" },
  { id: "minimal-ring", name: "Minimal Ring", tag: "Floating Accent", previewBg: "#f8cfbe" }
];

interface QuoteCardProps {
  quote: Pick<QuoteItem, "text" | "author" | "category" | "cardStyle"> & { _id?: string; createdAt?: string };
  onCopy?: (text: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onCopy, onDelete, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const style = quote.cardStyle || "terracotta-badge";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(`"${quote.text}" — ${quote.author || "Anonymous"}`);
    setCopied(true);
    if (onCopy) onCopy(quote.text);
    setTimeout(() => setCopied(false), 2000);
  };

  // Common action buttons overlay (Copy & Delete)
  const ActionOverlay = () => (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
        opacity: compact ? 0 : 0.7,
        transition: "opacity 0.2s",
        zIndex: 5
      }}
      className="quote-card-actions"
    >
      <button
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy quote"}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          color: "#fff",
          border: "none",
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          cursor: "pointer",
          transition: "transform 0.15s, background 0.15s"
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {copied ? "✓" : "📋"}
      </button>
      {onDelete && quote._id && (
        <button
          onClick={e => {
            e.stopPropagation();
            if (confirm("Delete this quote?")) onDelete(quote._id!);
          }}
          title="Delete quote"
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            color: "#ff7b7b",
            border: "none",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            cursor: "pointer"
          }}
        >
          ✕
        </button>
      )}
    </div>
  );

  // 1. Terracotta Rounded Card with offset backing shadow
  if (style === "terracotta-badge") {
    return (
      <div
        style={{
          position: "relative",
          margin: compact ? 0 : "12px 6px 16px",
          width: "100%",
          maxWidth: compact ? "100%" : 380
        }}
      >
        <ActionOverlay />
        {/* Dark drop shadow block */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 22,
            background: "#2d1c15",
            transform: "translate(6px, 8px)",
            zIndex: 1
          }}
        />
        {/* Foreground card */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            background: "#df6449",
            borderRadius: 22,
            padding: compact ? "16px 20px" : "24px 24px 20px",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: compact ? 150 : 200,
            boxShadow: "0 4px 15px rgba(223, 100, 73, 0.25)"
          }}
        >
          {/* Top-left double quotation */}
          <div style={{ display: "flex", gap: 3, marginBottom: 8, color: "#2d1c15" }}>
            <span style={{ fontSize: 32, lineHeight: "24px", fontWeight: 900, fontFamily: "serif" }}>“</span>
            <span style={{ fontSize: 32, lineHeight: "24px", fontWeight: 900, fontFamily: "serif" }}>“</span>
          </div>

          <p
            style={{
              fontSize: compact ? 13 : 15,
              lineHeight: 1.5,
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
              color: "#fff",
              margin: 0
            }}
          >
            {quote.text}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 16
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>— {quote.author || "Anonymous"}</div>
              {quote.category && (
                <div style={{ fontSize: 10, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
                  {quote.category}
                </div>
              )}
            </div>
            {/* Bottom-right double quotation */}
            <div style={{ display: "flex", gap: 3, color: "#2d1c15" }}>
              <span style={{ fontSize: 32, lineHeight: "24px", fontWeight: 900, fontFamily: "serif" }}>”</span>
              <span style={{ fontSize: 32, lineHeight: "24px", fontWeight: 900, fontFamily: "serif" }}>”</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Dotted Circular Quote
  if (style === "dotted-circle") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: compact ? "100%" : 340,
          aspectRatio: "1/1",
          margin: compact ? 0 : "12px auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <ActionOverlay />
        {/* Outer dotted ring */}
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            border: "2.5px dotted #382c35",
            pointerEvents: "none"
          }}
        />
        {/* Top-left quotation badge */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 28,
            fontSize: 34,
            fontWeight: 900,
            fontFamily: "serif",
            color: "#382c35",
            lineHeight: 1
          }}
        >
          “
        </div>
        {/* Bottom-right quotation badge */}
        <div
          style={{
            position: "absolute",
            bottom: 6,
            right: 32,
            fontSize: 34,
            fontWeight: 900,
            fontFamily: "serif",
            color: "#382c35",
            lineHeight: 1
          }}
        >
          ”
        </div>

        {/* Inner circle badge */}
        <div
          style={{
            width: "82%",
            height: "82%",
            borderRadius: "50%",
            background: "#b8a8bb",
            padding: compact ? "18px" : "26px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#281e26",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "Georgia, serif",
              letterSpacing: "3px",
              marginBottom: 8,
              textTransform: "uppercase"
            }}
          >
            QUOTES
          </div>
          <p
            style={{
              fontSize: compact ? 12 : 13.5,
              lineHeight: 1.45,
              fontWeight: 500,
              margin: "0 0 8px",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {quote.text}
          </p>
          <div style={{ fontSize: 11, fontWeight: 700, fontStyle: "italic", opacity: 0.9 }}>
            — {quote.author || "Anonymous"}
          </div>
        </div>
      </div>
    );
  }

  // 3. Mint / Teal Rectangular Banner with white double border
  if (style === "mint-banner") {
    return (
      <div
        style={{
          position: "relative",
          margin: compact ? 0 : "12px 6px 16px",
          width: "100%",
          maxWidth: compact ? "100%" : 420
        }}
      >
        <ActionOverlay />
        <div
          style={{
            background: "#4ecdc4",
            borderRadius: 18,
            padding: compact ? "16px 18px" : "22px 24px",
            color: "#1e3935",
            boxShadow: "0 6px 24px rgba(78, 205, 196, 0.25)",
            position: "relative"
          }}
        >
          {/* Inset white border container */}
          <div
            style={{
              border: "2px solid rgba(255, 255, 255, 0.85)",
              borderRadius: 12,
              padding: compact ? "12px 14px" : "18px 20px",
              position: "relative"
            }}
          >
            {/* Top-left quote tab */}
            <div
              style={{
                position: "absolute",
                top: -16,
                left: 14,
                background: "#2a736a",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 22,
                fontWeight: 900,
                fontFamily: "serif",
                lineHeight: 1
              }}
            >
              “
            </div>

            <p
              style={{
                fontSize: compact ? 13 : 15,
                lineHeight: 1.5,
                fontWeight: 600,
                color: "#163a35",
                margin: "4px 0 10px"
              }}
            >
              {quote.text}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#163a35" }}>
                — {quote.author || "Anonymous"}
              </span>
              {/* Bottom-right quote tab */}
              <div
                style={{
                  background: "#2a736a",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 22,
                  fontWeight: 900,
                  fontFamily: "serif",
                  lineHeight: 1
                }}
              >
                ”
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Lavender Speech Bubble with bottom pointer arrow
  if (style === "lavender-bubble") {
    return (
      <div
        style={{
          position: "relative",
          margin: compact ? 0 : "12px 6px 24px",
          width: "100%",
          maxWidth: compact ? "100%" : 360
        }}
      >
        <ActionOverlay />
        <div
          style={{
            position: "relative",
            background: "#aba2b8",
            borderRadius: 22,
            padding: compact ? "18px 20px" : "26px 24px",
            color: "#271e31",
            textAlign: "center",
            boxShadow: "0 6px 22px rgba(171, 162, 184, 0.3)"
          }}
        >
          {/* Top quotation accent with divider lines */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 10
            }}
          >
            <div style={{ flex: 1, height: 1.5, background: "rgba(255,255,255,0.6)" }} />
            <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1, fontFamily: "serif" }}>
              “
            </span>
            <div style={{ flex: 1, height: 1.5, background: "rgba(255,255,255,0.6)" }} />
          </div>

          <p
            style={{
              fontSize: compact ? 13 : 14.5,
              lineHeight: 1.55,
              fontWeight: 500,
              color: "#24192e",
              margin: "0 0 12px"
            }}
          >
            {quote.text}
          </p>

          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
            — {quote.author || "Anonymous"}
          </div>

          {/* Bottom quotation accent with divider lines */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12
            }}
          >
            <div style={{ flex: 1, height: 1.5, background: "rgba(255,255,255,0.6)" }} />
            <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1, fontFamily: "serif" }}>
              ”
            </span>
            <div style={{ flex: 1, height: 1.5, background: "rgba(255,255,255,0.6)" }} />
          </div>

          {/* Speech bubble pointer arrow */}
          <div
            style={{
              position: "absolute",
              bottom: -14,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "14px solid #d4cae2ff"
            }}
          />
        </div>
      </div>
    );
  }

  // 5. Espresso Dark Circle
  if (style === "dark-circle") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: compact ? "100%" : 320,
          aspectRatio: "1/1",
          margin: compact ? 0 : "12px auto",
          borderRadius: "50%",
          background: "#2b2123",
          padding: compact ? 20 : 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "center",
          color: "#ffffff",
          boxShadow: "0 10px 28px rgba(0,0,0,0.35)"
        }}
      >
        <ActionOverlay />
        <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1, fontFamily: "serif" }}>
          “
        </div>
        <div>
          <p
            style={{
              fontSize: compact ? 12.5 : 14,
              lineHeight: 1.5,
              fontWeight: 500,
              color: "#f1f1f1",
              margin: "0 0 8px"
            }}
          >
            {quote.text}
          </p>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e76f51" }}>
            — {quote.author || "Anonymous"}
          </div>
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1, fontFamily: "serif" }}>
          ”
        </div>
      </div>
    );
  }

  // 6. Peach Editorial Card with top header strip
  if (style === "peach-card") {
    return (
      <div
        style={{
          position: "relative",
          margin: compact ? 0 : "14px 6px 16px",
          width: "100%",
          maxWidth: compact ? "100%" : 360
        }}
      >
        <ActionOverlay />
        {/* Top-left quote tab */}
        <div
          style={{
            position: "absolute",
            top: -12,
            left: -4,
            background: "#2a1e1b",
            color: "#ffffff",
            padding: "4px 10px",
            borderRadius: "8px 0 0 8px",
            fontSize: 22,
            fontWeight: 900,
            fontFamily: "serif",
            zIndex: 3
          }}
        >
          “
        </div>

        <div
          style={{
            background: "#f3c7b5",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(243, 199, 181, 0.3)",
            color: "#35221b"
          }}
        >
          {/* Top header strip */}
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1.5px solid rgba(53, 34, 27, 0.15)",
              textAlign: "center"
            }}
          >
            <span
              style={{
                fontFamily: "Georgia, serif",
                letterSpacing: 3,
                fontWeight: 700,
                fontSize: 14,
                color: "#2a1e1b"
              }}
            >
              QUOTES
            </span>
          </div>

          <div style={{ padding: compact ? "16px 18px" : "22px 24px" }}>
            <p
              style={{
                fontSize: compact ? 13 : 14.5,
                lineHeight: 1.6,
                fontWeight: 500,
                margin: "0 0 16px",
                color: "#2d1d17"
              }}
            >
              {quote.text}
            </p>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#2a1e1b" }}>
              — {quote.author || "Anonymous"}
            </div>
          </div>
        </div>

        {/* Bottom-right quote tab */}
        <div
          style={{
            position: "absolute",
            bottom: -10,
            right: -4,
            background: "#2a1e1b",
            color: "#ffffff",
            padding: "4px 10px",
            borderRadius: "0 8px 8px 0",
            fontSize: 22,
            fontWeight: 900,
            fontFamily: "serif",
            zIndex: 3
          }}
        >
          ”
        </div>
      </div>
    );
  }

  // 7. Dotted Border Banner with orange flanked quotation marks
  if (style === "dotted-border") {
    return (
      <div
        style={{
          position: "relative",
          margin: compact ? 0 : "12px 6px 16px",
          width: "100%",
          maxWidth: compact ? "100%" : 420,
          background: "var(--bg-elev)",
          borderTop: "3.5px dotted #e76f51",
          borderBottom: "3.5px dotted #e76f51",
          padding: compact ? "16px 14px" : "24px 20px"
        }}
      >
        <ActionOverlay />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: "#e76f51", fontFamily: "serif", lineHeight: 0.8 }}>
            “
          </span>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: compact ? 13 : 15,
                lineHeight: 1.55,
                fontWeight: 500,
                color: "var(--text)",
                margin: "0 0 8px"
              }}
            >
              {quote.text}
            </p>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
              — {quote.author || "Anonymous"}
            </div>
          </div>
          <span style={{ fontSize: 44, fontWeight: 900, color: "#e76f51", fontFamily: "serif", lineHeight: 0.8 }}>
            ”
          </span>
        </div>
      </div>
    );
  }

  // 8. Lavender Pill Card with notched border quotes
  if (style === "pill-frame") {
    return (
      <div
        style={{
          position: "relative",
          margin: compact ? 0 : "14px 6px 16px",
          width: "100%",
          maxWidth: compact ? "100%" : 380,
          background: "#b5adc1",
          borderRadius: 24,
          padding: compact ? "18px 20px" : "26px 26px",
          color: "#281e32",
          boxShadow: "0 6px 20px rgba(181, 173, 193, 0.28)"
        }}
      >
        <ActionOverlay />
        {/* Inner white outline with top/bottom quotation tabs */}
        <div
          style={{
            position: "relative",
            border: "2px solid rgba(255,255,255,0.75)",
            borderRadius: 16,
            padding: compact ? "14px" : "18px 20px",
            textAlign: "center"
          }}
        >
          {/* Top quote marker */}
          <div
            style={{
              position: "absolute",
              top: -16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#b5adc1",
              padding: "0 8px",
              color: "#fff",
              fontSize: 24,
              fontWeight: 900,
              fontFamily: "serif"
            }}
          >
            “
          </div>

          <p
            style={{
              fontSize: compact ? 13 : 14.5,
              lineHeight: 1.55,
              fontWeight: 500,
              color: "#281e32",
              margin: "6px 0 10px"
            }}
          >
            {quote.text}
          </p>

          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#fff" }}>
            — {quote.author || "Anonymous"}
          </div>

          {/* Bottom quote marker */}
          <div
            style={{
              position: "absolute",
              bottom: -16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#b5adc1",
              padding: "0 8px",
              color: "#fff",
              fontSize: 24,
              fontWeight: 900,
              fontFamily: "serif"
            }}
          >
            ”
          </div>
        </div>
      </div>
    );
  }

  // 9. Teal Ribbon Fold Banner
  if (style === "ribbon-tag") {
    return (
      <div
        style={{
          position: "relative",
          margin: compact ? 0 : "12px 6px 20px",
          width: "100%",
          maxWidth: compact ? "100%" : 400
        }}
      >
        <ActionOverlay />
        <div
          style={{
            position: "relative",
            background: "#48bda8",
            borderRadius: "14px 14px 0 14px",
            padding: compact ? "16px 20px" : "22px 24px",
            color: "#133732",
            boxShadow: "0 6px 20px rgba(72, 189, 168, 0.25)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: "serif" }}>“</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.45)", margin: "0 12px" }} />
          </div>

          <p
            style={{
              fontSize: compact ? 13 : 15,
              lineHeight: 1.5,
              fontWeight: 600,
              color: "#0f2f2a",
              margin: "0 0 12px"
            }}
          >
            {quote.text}
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
              — {quote.author || "Anonymous"}
            </span>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: "serif" }}>”</span>
          </div>

          {/* 3D folded corner ribbon */}
          <div
            style={{
              position: "absolute",
              bottom: -12,
              right: 0,
              width: 0,
              height: 0,
              borderTop: "12px solid #24685c",
              borderRight: "12px solid transparent"
            }}
          />
        </div>
      </div>
    );
  }

  // 10. Notched Terracotta Banner
  if (style === "notched-banner") {
    return (
      <div
        style={{
          position: "relative",
          margin: compact ? 0 : "14px 6px 16px",
          width: "100%",
          maxWidth: compact ? "100%" : 420
        }}
      >
        <ActionOverlay />
        <div
          style={{
            background: "#df684c",
            borderRadius: 12,
            padding: compact ? "16px 20px" : "24px 26px",
            color: "#ffffff",
            position: "relative",
            boxShadow: "0 8px 24px rgba(223, 104, 76, 0.28)",
            border: "2px solid #2d1c15"
          }}
        >
          {/* Top pointed notch */}
          <div
            style={{
              position: "absolute",
              top: -9,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 14,
              height: 14,
              background: "#df684c",
              borderTop: "2px solid #2d1c15",
              borderLeft: "2px solid #2d1c15"
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: "serif", lineHeight: 0.9 }}>
              “
            </span>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: compact ? 13 : 15,
                  lineHeight: 1.5,
                  fontWeight: 500,
                  margin: "0 0 10px"
                }}
              >
                {quote.text}
              </p>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", opacity: 0.95 }}>
                — {quote.author || "Anonymous"}
              </div>
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: "serif", lineHeight: 0.9 }}>
              ”
            </span>
          </div>

          {/* Bottom pointed notch */}
          <div
            style={{
              position: "absolute",
              bottom: -9,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 14,
              height: 14,
              background: "#df684c",
              borderBottom: "2px solid #2d1c15",
              borderRight: "2px solid #2d1c15"
            }}
          />
        </div>
      </div>
    );
  }

  // 11. Minimal Ring Disc
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: compact ? "100%" : 320,
        aspectRatio: "1/1",
        margin: compact ? 0 : "12px auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <ActionOverlay />
      {/* Offset fine outline ring */}
      <div
        style={{
          position: "absolute",
          inset: 6,
          borderRadius: "50%",
          border: "1.5px solid #3c2a21",
          transform: "rotate(-12deg)",
          pointerEvents: "none"
        }}
      />
      {/* Soft circular badge */}
      <div
        style={{
          width: "86%",
          height: "86%",
          borderRadius: "50%",
          background: "#f8cfbe",
          padding: compact ? "18px" : "26px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "center",
          color: "#352219",
          boxShadow: "0 6px 20px rgba(248, 207, 190, 0.35)"
        }}
      >
        <div style={{ alignSelf: "flex-start", fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "serif", lineHeight: 1 }}>
          “
        </div>
        <div>
          <p
            style={{
              fontSize: compact ? 12.5 : 13.5,
              lineHeight: 1.5,
              fontWeight: 500,
              margin: "0 0 6px",
              color: "#332018"
            }}
          >
            {quote.text}
          </p>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#e76f51" }}>
            — {quote.author || "Anonymous"}
          </div>
        </div>
        <div style={{ alignSelf: "flex-end", fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "serif", lineHeight: 1 }}>
          ”
        </div>
      </div>
    </div>
  );
};
