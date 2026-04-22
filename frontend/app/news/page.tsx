"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = "https://autodrivebackend-3.onrender.com";

// ─── TYPES — matched exactly to backend response ──────────────────────────────
interface Article {
  article_id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  source: string;
  published_at: string; // snake_case from backend
  saved_at: string;
  region: string;
  date: string;
}

// ─── SOURCE COLOUR MAP ────────────────────────────────────────────────────────
const SOURCE_PALETTE: { match: string; color: string; bg: string }[] = [
  { match: "economic times", color: "#F59E0B", bg: "rgba(245,158,11,0.13)" },
  { match: "times of india", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  { match: "cnbc", color: "#3B82F6", bg: "rgba(59,130,246,0.13)" },
  { match: "ndtv", color: "#10B981", bg: "rgba(16,185,129,0.13)" },
  { match: "financial", color: "#00D4FF", bg: "rgba(0,212,255,0.11)" },
  { match: "hindu", color: "#8B5CF6", bg: "rgba(139,92,246,0.13)" },
  { match: "firstpost", color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
  { match: "india today", color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  { match: "times now", color: "#06B6D4", bg: "rgba(6,182,212,0.12)" },
];
const DEFAULT_STYLE = { color: "#4361EE", bg: "rgba(67,97,238,0.14)" };

function getSourceStyle(source: string) {
  const s = source.toLowerCase();
  for (const p of SOURCE_PALETTE) {
    if (s.includes(p.match)) return { color: p.color, bg: p.bg };
  }
  return DEFAULT_STYLE;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateLabel(dateStr: string, isFirst: boolean) {
  if (!dateStr) return dateStr;
  try {
    const d = new Date(dateStr);
    const label = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return isFirst ? `Today - ${label}` : label;
  } catch {
    return dateStr;
  }
}

function readTime(content: string) {
  const words = (content || "").trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function initials(source: string) {
  return (source || "N")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        overflow: "hidden",
        animation: "skPulse 1.6s ease-in-out infinite",
      }}
    >
      <div style={{ height: 196, background: "rgba(255,255,255,0.055)" }} />
      <div style={{ padding: "1.4rem" }}>
        {[50, 85, 65, 40].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 1 ? 16 : 10,
              width: `${w}%`,
              background: "rgba(255,255,255,0.065)",
              borderRadius: 6,
              marginBottom: i === 3 ? 0 : "0.65rem",
            }}
          />
        ))}
      </div>
      <style>{`@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
}

// ─── REGION BADGE ─────────────────────────────────────────────────────────────
function RegionBadge({ region }: { region: string }) {
  const isIndia = region === "india";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.18rem 0.6rem",
        borderRadius: 9999,
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        background: isIndia ? "rgba(255,153,51,0.15)" : "rgba(67,97,238,0.15)",
        color: isIndia ? "#FF9933" : "#4361EE",
        border: `1px solid ${isIndia ? "rgba(255,153,51,0.25)" : "rgba(67,97,238,0.25)"}`,
      }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <circle cx="4" cy="4" r="4" fill={isIndia ? "#FF9933" : "#4361EE"} />
      </svg>
      {isIndia ? "India" : "Global"}
    </span>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const [region, setRegion] = useState<"india" | "global">("india");
  const [articles, setArticles] = useState<Article[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [datesLoading, setDatesLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // ── Fetch available dates when region changes ─────────────────────────────
  useEffect(() => {
    setDates([]);
    setSelectedDate("");
    setArticles([]);
    setDatesLoading(true);

    fetch(`${API_BASE}/news/dates?region=${region}`)
      .then((r) => r.json())
      .then((data) => {
        if (
          data.success &&
          Array.isArray(data.dates) &&
          data.dates.length > 0
        ) {
          setDates(data.dates);
          setSelectedDate(data.dates[0]);
        } else {
          // Fallback: use today's date
          const today = new Date().toISOString().split("T")[0];
          setDates([today]);
          setSelectedDate(today);
        }
      })
      .catch(() => {
        const today = new Date().toISOString().split("T")[0];
        setDates([today]);
        setSelectedDate(today);
      })
      .finally(() => setDatesLoading(false));
  }, [region]);

  // ── Fetch articles when selectedDate or region changes ────────────────────
  const fetchArticles = useCallback(() => {
    if (!selectedDate) return;
    setLoading(true);
    setError("");
    setArticles([]);

    fetch(`${API_BASE}/news?region=${region}&date=${selectedDate}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.success) {
          // Backend returns snake_case — map directly, no transformation needed
          setArticles(data.articles || []);
          setTotalCount(data.count || data.articles?.length || 0);
        } else {
          setError("Could not load news. Please try again.");
        }
      })
      .catch((e) => setError(`Network error: ${e.message}`))
      .finally(() => setLoading(false));
  }, [region, selectedDate]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const featured = articles[0] ?? null;
  const rest = articles.slice(1);

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: "7rem",
          paddingBottom: "3.5rem",
          background:
            "linear-gradient(135deg,#080d1a 0%,#0c1535 55%,#110a28 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient blobs */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 15% 60%,rgba(67,97,238,.14) 0%,transparent 70%)," +
              "radial-gradient(ellipse 50% 40% at 85% 20%,rgba(168,85,247,.1) 0%,transparent 60%)",
          }}
        />
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px)," +
              "linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          {/* Eyebrow badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 1rem",
              borderRadius: 9999,
              background: "rgba(67,97,238,.15)",
              border: "1px solid rgba(67,97,238,.3)",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#818cf8",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
              <circle cx="3" cy="3" r="3" fill="#818cf8" />
            </svg>
            AutoDrive News Feed
          </div>

          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              color: "#f0f6ff",
              lineHeight: 1.18,
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Latest from the{" "}
            <span
              style={{
                background: "linear-gradient(125deg,#4361EE 0%,#a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Auto World
            </span>
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,.5)",
              fontSize: "1.05rem",
              maxWidth: 520,
              lineHeight: 1.7,
            }}
          >
            Real-time auto industry news from India and around the globe — EV
            launches, market insights, policy updates, and more.
          </p>

          {/* Stats row */}
          {!loading && totalCount > 0 && (
            <div
              style={{
                display: "flex",
                gap: "2rem",
                marginTop: "2rem",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Stories Today", value: totalCount },
                {
                  label: "Region",
                  value: region === "india" ? "India" : "Global",
                },
                { label: "Date", value: formatDate(selectedDate) || "Latest" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: "#f0f6ff",
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,.38)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(8,13,26,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,.07)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.85rem 0",
              flexWrap: "wrap",
            }}
          >
            {/* Region Tabs */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,.05)",
                borderRadius: 9999,
                padding: "0.2rem",
                gap: "0.15rem",
              }}
            >
              {(["india", "global"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  style={{
                    padding: "0.38rem 1.1rem",
                    borderRadius: 9999,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all .18s ease",
                    background:
                      region === r
                        ? "linear-gradient(135deg,#4361EE,#7c3aed)"
                        : "transparent",
                    color: region === r ? "#fff" : "rgba(255,255,255,.45)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {r === "india" ? "India" : "Global"}
                </button>
              ))}
            </div>

            {/* Separator */}
            <div
              style={{
                width: 1,
                height: 22,
                background: "rgba(255,255,255,.1)",
                flexShrink: 0,
              }}
            />

            {/* Date Selector */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  pointerEvents: "none",
                  opacity: 0.5,
                }}
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <rect
                  x="1"
                  y="2"
                  width="12"
                  height="11"
                  rx="2"
                  stroke="#f0f6ff"
                  strokeWidth="1.3"
                />
                <path
                  d="M4 1v2M10 1v2M1 6h12"
                  stroke="#f0f6ff"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              {datesLoading ? (
                <div
                  style={{
                    padding: "0.38rem 1rem 0.38rem 2.2rem",
                    fontSize: "0.82rem",
                    color: "rgba(255,255,255,.35)",
                    background: "rgba(255,255,255,.06)",
                    borderRadius: 9999,
                    border: "1px solid rgba(255,255,255,.1)",
                    minWidth: 160,
                  }}
                >
                  Loading dates...
                </div>
              ) : (
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: "0.38rem 1.25rem 0.38rem 2.2rem",
                    borderRadius: 9999,
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    border: "1px solid rgba(255,255,255,.1)",
                    background: "rgba(255,255,255,.06)",
                    color: "#f0f6ff",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    minWidth: 180,
                  }}
                >
                  {dates.map((d, idx) => (
                    <option key={d} value={d} style={{ background: "#0d1117" }}>
                      {formatDateLabel(d, idx === 0)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Article count chip */}
            {!loading && totalCount > 0 && (
              <div
                style={{
                  padding: "0.3rem 0.8rem",
                  borderRadius: 9999,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: "rgba(67,97,238,.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(67,97,238,.2)",
                  letterSpacing: "0.04em",
                }}
              >
                {totalCount} articles
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={fetchArticles}
              disabled={loading}
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.38rem 0.9rem",
                borderRadius: 9999,
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(255,255,255,.04)",
                color: "rgba(255,255,255,.45)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                transition: "all .2s",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  animation: loading ? "spin 1s linear infinite" : "none",
                }}
              >
                <path
                  d="M11 6A5 5 0 1 1 6 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M6 1l1.5 1.5L6 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── ARTICLES BODY ─────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "3rem 0 5rem",
          background: "#080d1a",
          minHeight: "60vh",
        }}
      >
        <div className="container">
          {/* ── ERROR ───────────────────────────────────────────────────── */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "1.25rem 1.5rem",
                borderRadius: 12,
                marginBottom: "2rem",
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.2)",
                color: "#fca5a5",
                fontSize: "0.875rem",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <circle
                  cx="9"
                  cy="9"
                  r="8"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                />
                <path
                  d="M9 5.5v4M9 12.5h.01"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <strong>Failed to load news</strong>
                <br />
                <span style={{ opacity: 0.75 }}>{error}</span>
              </div>
            </div>
          )}

          {/* ── EMPTY ───────────────────────────────────────────────────── */}
          {!loading && !error && articles.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "7rem 0",
                color: "rgba(255,255,255,.3)",
              }}
            >
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                fill="none"
                style={{ marginBottom: "1.25rem", opacity: 0.4 }}
              >
                <rect
                  x="8"
                  y="10"
                  width="40"
                  height="36"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M16 20h24M16 28h16M16 36h12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,.45)",
                  marginBottom: "0.5rem",
                }}
              >
                No news available for this date
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                Select a different date or region above
              </div>
            </div>
          )}

          {/* ── SKELETON ────────────────────────────────────────────────── */}
          {loading && (
            <>
              {/* Featured skeleton */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                  gap: "0",
                  marginBottom: "3rem",
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 20,
                  overflow: "hidden",
                  animation: "skPulse 1.6s ease-in-out infinite",
                  minHeight: 300,
                }}
              >
                <div style={{ background: "rgba(255,255,255,.055)" }} />
                <div style={{ padding: "2rem" }}>
                  {[40, 80, 65, 55, 30].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        height: i === 1 ? 24 : i === 2 ? 14 : 11,
                        width: `${w}%`,
                        background: "rgba(255,255,255,.065)",
                        borderRadius: 6,
                        marginBottom: "0.85rem",
                      }}
                    />
                  ))}
                </div>
              </div>
              {/* Grid skeletons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                  gap: "1.5rem",
                }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </>
          )}

          {/* ── FEATURED CARD ───────────────────────────────────────────── */}
          {!loading && featured && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                marginBottom: "3rem",
                background: "rgba(255,255,255,.025)",
                border: "1px solid rgba(255,255,255,.09)",
                borderRadius: 20,
                overflow: "hidden",
                transition: "border-color .25s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(67,97,238,.4)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,.09)")
              }
            >
              {/* Image side */}
              <div
                style={{
                  position: "relative",
                  minHeight: 300,
                  background: "rgba(67,97,238,.1)",
                  overflow: "hidden",
                }}
              >
                {featured.image && (
                  <img
                    src={featured.image}
                    alt={featured.title}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top,rgba(8,13,26,.7) 0%,transparent 60%)",
                  }}
                />
                {/* Badges */}
                <div
                  style={{
                    position: "absolute",
                    top: "1rem",
                    left: "1rem",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      padding: "0.28rem 0.75rem",
                      borderRadius: 9999,
                      background: "linear-gradient(135deg,#4361EE,#7c3aed)",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Featured
                  </span>
                  <RegionBadge region={featured.region} />
                </div>
              </div>

              {/* Text side */}
              <div
                style={{
                  padding: "2.5rem 2rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "0.85rem",
                }}
              >
                {/* Source badge */}
                {(() => {
                  const sStyle = getSourceStyle(featured.source);
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        width: "fit-content",
                        padding: "0.25rem 0.8rem",
                        background: sStyle.bg,
                        color: sStyle.color,
                        borderRadius: 9999,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {featured.source}
                    </span>
                  );
                })()}

                <h2
                  style={{
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontSize: "clamp(1.25rem,2.5vw,1.75rem)",
                    fontWeight: 800,
                    color: "#f0f6ff",
                    lineHeight: 1.3,
                    letterSpacing: "-0.01em",
                    margin: 0,
                  }}
                >
                  {featured.title}
                </h2>

                <p
                  style={{
                    color: "rgba(255,255,255,.5)",
                    lineHeight: 1.75,
                    fontSize: "0.9rem",
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {featured.description}
                </p>

                {/* Meta row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#4361EE,#7c3aed)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {initials(featured.source)}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#e2e8f0",
                      }}
                    >
                      {featured.source}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,.38)",
                      }}
                    >
                      {formatDate(featured.published_at)} &middot;{" "}
                      {readTime(featured.content)}
                    </div>
                  </div>
                </div>

                <a
                  href={featured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "fit-content",
                    padding: "0.6rem 1.4rem",
                    borderRadius: 9999,
                    background: "linear-gradient(135deg,#4361EE,#7c3aed)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    marginTop: "0.25rem",
                    transition: "opacity .2s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.opacity = "0.85")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.opacity = "1")
                  }
                >
                  Read Full Article
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6h7M6.5 3l3 3-3 3"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {/* ── ARTICLES GRID ────────────────────────────────────────────── */}
          {!loading && rest.length > 0 && (
            <>
              {/* Section label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "rgba(255,255,255,.3)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  All Stories
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,.07)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,.25)",
                    fontWeight: 600,
                  }}
                >
                  {rest.length} articles
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                  gap: "1.5rem",
                }}
              >
                {rest.map((article, idx) => {
                  const sStyle = getSourceStyle(article.source);
                  return (
                    <article
                      key={article.article_id || article.url || idx}
                      style={{
                        background: "rgba(255,255,255,.025)",
                        border: "1px solid rgba(255,255,255,.08)",
                        borderRadius: 16,
                        overflow: "hidden",
                        transition:
                          "transform .22s cubic-bezier(.4,0,.2,1), border-color .22s, box-shadow .22s",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = "translateY(-4px)";
                        el.style.borderColor = "rgba(67,97,238,.3)";
                        el.style.boxShadow = "0 16px 48px rgba(0,0,0,.55)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = "translateY(0)";
                        el.style.borderColor = "rgba(255,255,255,.08)";
                        el.style.boxShadow = "none";
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          height: 196,
                          overflow: "hidden",
                          background: "rgba(67,97,238,.08)",
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        {article.image && (
                          <img
                            src={article.image}
                            alt={article.title}
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                              transition: "transform .4s ease",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                            onMouseEnter={(e) =>
                              ((e.target as HTMLImageElement).style.transform =
                                "scale(1.04)")
                            }
                            onMouseLeave={(e) =>
                              ((e.target as HTMLImageElement).style.transform =
                                "scale(1)")
                            }
                          />
                        )}
                        {/* Region badge on image */}
                        <div
                          style={{
                            position: "absolute",
                            top: "0.75rem",
                            right: "0.75rem",
                          }}
                        >
                          <RegionBadge region={article.region} />
                        </div>
                      </div>

                      {/* Body */}
                      <div
                        style={{
                          padding: "1.35rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.65rem",
                          flex: 1,
                        }}
                      >
                        {/* Source + read time */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.2rem 0.65rem",
                              background: sStyle.bg,
                              color: sStyle.color,
                              borderRadius: 9999,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              maxWidth: "70%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {article.source}
                          </span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "rgba(255,255,255,.28)",
                              fontWeight: 600,
                            }}
                          >
                            {readTime(article.content)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          style={{
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            fontSize: "0.975rem",
                            fontWeight: 700,
                            color: "#eef2ff",
                            lineHeight: 1.45,
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {article.title}
                        </h3>

                        {/* Description */}
                        <p
                          style={{
                            fontSize: "0.83rem",
                            color: "rgba(255,255,255,.42)",
                            lineHeight: 1.65,
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {article.description}
                        </p>

                        {/* Footer */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "auto",
                            paddingTop: "0.75rem",
                            borderTop: "1px solid rgba(255,255,255,.06)",
                          }}
                        >
                          {/* Avatar + date */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.55rem",
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg,#4361EE,#7c3aed)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                color: "#fff",
                                flexShrink: 0,
                              }}
                            >
                              {initials(article.source)}
                            </div>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: "rgba(255,255,255,.32)",
                                fontWeight: 500,
                              }}
                            >
                              {/* Use published_at from backend */}
                              {formatDate(article.published_at)}
                            </span>
                          </div>

                          {/* Read link */}
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.75rem",
                              color: "#818cf8",
                              fontWeight: 700,
                              textDecoration: "none",
                              transition: "color .15s",
                            }}
                            onMouseEnter={(e) =>
                              ((e.currentTarget as HTMLElement).style.color =
                                "#a5b4fc")
                            }
                            onMouseLeave={(e) =>
                              ((e.currentTarget as HTMLElement).style.color =
                                "#818cf8")
                            }
                          >
                            Read
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                            >
                              <path
                                d="M2 5h6M5.5 2.5l2.5 2.5-2.5 2.5"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 0",
          background:
            "linear-gradient(135deg,rgba(67,97,238,.08) 0%,rgba(124,58,237,.06) 100%)",
          borderTop: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.3rem 0.9rem",
              borderRadius: 9999,
              background: "rgba(67,97,238,.12)",
              border: "1px solid rgba(67,97,238,.25)",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#818cf8",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
              <circle cx="3" cy="3" r="3" fill="#818cf8" />
            </svg>
            Newsletter
          </div>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontSize: "clamp(1.6rem,3.5vw,2.25rem)",
              fontWeight: 800,
              color: "#f0f6ff",
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            Never Miss a Story
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,.45)",
              maxWidth: 420,
              margin: "0 auto 2rem",
              lineHeight: 1.7,
            }}
          >
            Get the latest auto news, EV updates, and market insights delivered
            to your inbox every week.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              display: "flex",
              gap: "0.65rem",
              maxWidth: 460,
              margin: "0 auto",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <input
              type="email"
              placeholder="Your email address"
              style={{
                flex: 1,
                minWidth: 220,
                padding: "0.7rem 1.25rem",
                borderRadius: 9999,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.05)",
                color: "#f0f6ff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.7rem 1.5rem",
                borderRadius: 9999,
                border: "none",
                background: "linear-gradient(135deg,#4361EE,#7c3aed)",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link
                href="/"
                className="nav-logo"
                style={{ marginBottom: ".5rem" }}
              >
                <div className="nav-logo-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect
                      x="1"
                      y="6"
                      width="16"
                      height="8"
                      rx="3"
                      stroke="#4361EE"
                      strokeWidth="1.5"
                    />
                    <circle cx="5" cy="14" r="2" fill="#4361EE" />
                    <circle cx="13" cy="14" r="2" fill="#4361EE" />
                    <path
                      d="M3 6l2-4h8l2 4"
                      stroke="#4361EE"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="nav-logo-text">
                  Auto<span>Drive</span>
                </span>
              </Link>
              <p>
                Your trusted marketplace for premium certified pre-owned
                vehicles. Transparent, fast, and hassle-free.
              </p>
              <div className="footer-social">
                {["f", "in", "tw", "yt"].map((s) => (
                  <a key={s} href="#" className="social-btn">
                    {s}
                  </a>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <h4>Browse</h4>
              <div className="footer-links">
                {[
                  "All Cars",
                  "Certified Cars",
                  "SUVs & Trucks",
                  "Sedans",
                  "Electric Cars",
                ].map((l) => (
                  <Link key={l} href="/cars" className="footer-link">
                    {l}
                  </Link>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <h4>Services</h4>
              <div className="footer-links">
                <Link href="/predict" className="footer-link">
                  Price Predictor
                </Link>
                <Link href="/booking" className="footer-link">
                  Test Drive
                </Link>
                <Link href="/booking" className="footer-link">
                  Car Reservation
                </Link>
                <a href="#" className="footer-link">
                  EMI Calculator
                </a>
                <a href="#" className="footer-link">
                  Car Inspection
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <div className="footer-links">
                <a href="#about" className="footer-link">
                  About Us
                </a>
                <a href="#" className="footer-link">
                  Careers
                </a>
                <Link href="/news" className="footer-link">
                  News
                </Link>
                <a href="#" className="footer-link">
                  Privacy Policy
                </a>
                <a href="#" className="footer-link">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 AutoDrive. All rights reserved.</div>
            <div>
              123 Auto Plaza, Downtown · +1 (800) AUTO-DRV · hello@autodrive.com
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
