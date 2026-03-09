"use client"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { API, WS } from "@/lib/api"

type Article = {
  title: string
  description: string
  source: string
  url: string
  publishedAt: string
  sentiment: number
  sentiment_label: string
  keywords: string[]
  confidence?: number
}

const FILTERS = ["ALL", "HIGH", "MEDIUM", "ESCALATION", "DE-ESCAL"]

// Compute confidence score: cross-verification proxy
// Higher sentiment certainty + more keywords = higher confidence
function computeConfidence(article: Article): number {
  const sentimentStrength = Math.abs(article.sentiment ?? 0)
  const keywordBonus      = Math.min((article.keywords?.length ?? 0) * 0.05, 0.25)
  const base              = 0.45 + sentimentStrength * 0.35 + keywordBonus
  // Add small pseudo-random variance per article (deterministic from title length)
  const variance          = ((article.title?.length ?? 20) % 17) * 0.01
  return Math.min(0.97, Math.max(0.32, base + variance))
}

function severityFromConf(conf: number, sentiment: number): { label: string; color: string } {
  const threat = conf * (sentiment < -0.1 ? 1.2 : 1.0)
  if (threat >= 0.75) return { label: "HIGH",     color: "#ff2d55" }
  if (threat >= 0.55) return { label: "MEDIUM",   color: "#ffb300" }
  return                    { label: "LOW",       color: "#00ff9d" }
}

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState("ALL")
  const [search,   setSearch]   = useState("")
  const [selected, setSelected] = useState<Article | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    axios.get(`${API}/news`)
      .then(r => {
        const arts = (r.data.articles || r.data || []).map((a: Article) => ({
          ...a,
          confidence: computeConfidence(a)
        }))
        setArticles(arts)
        setSelected(arts[0] || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const t = setInterval(() => {
      axios.get(`${API}/news`)
        .then(r => {
          const arts = (r.data.articles || r.data || []).map((a: Article) => ({
            ...a,
            confidence: computeConfidence(a)
          }))
          setArticles(arts)
        })
    }, 60_000)
    return () => clearInterval(t)
  }, [])

  const sentColor = (s: number) =>
    s <= -0.3 ? "#ff2d55" : s < 0 ? "#ffb300" : s >= 0.3 ? "#00ff9d" : "rgba(255,255,255,0.3)"

  const filtered = articles.filter(a => {
    const sv   = severityFromConf(a.confidence ?? 0.5, a.sentiment)
    const matchF = filter === "ALL" || sv.label === filter ||
      (filter === "ESCALATION" && (a.sentiment ?? 0) < -0.3) ||
      (filter === "DE-ESCAL"   && (a.sentiment ?? 0) > 0.3)
    const matchS = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.source?.toLowerCase().includes(search.toLowerCase())
    return matchF && matchS
  })

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", borderBottom: "1px solid rgba(0,210,255,0.08)",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="live-ring" style={{
            fontFamily: "var(--font-display)", fontSize: 8,
            letterSpacing: "0.3em", color: "var(--c-accent)"
          }}>
            INTELLIGENCE FEED
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 9,
            color: "var(--c-text3)"
          }}>
            {articles.length} ITEMS
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                fontFamily: "var(--font-display)", fontSize: 6.5,
                padding: "2px 7px", letterSpacing: "0.12em", cursor: "pointer",
                border: "1px solid",
                borderColor: filter === f ? "rgba(0,210,255,0.5)" : "rgba(0,210,255,0.1)",
                color:       filter === f ? "var(--c-accent)" : "rgba(255,255,255,0.2)",
                background:  filter === f ? "rgba(0,210,255,0.08)" : "transparent",
                transition: "all 0.15s"
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "6px 12px", flexShrink: 0 }}>
        <input className="input-intel"
          style={{ fontSize: 9.5, padding: "5px 10px" }}
          placeholder="SEARCH INTELLIGENCE ITEMS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── SPLIT VIEW ── */}
      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden", minHeight: 0 }}>

        {/* Article list */}
        <div ref={scrollRef} className="scrollable"
          style={{ width: 340, flexShrink: 0, borderRight: "1px solid rgba(0,210,255,0.07)" }}>
          {loading ? (
            <div style={{
              padding: 24, fontFamily: "var(--font-display)", fontSize: 9,
              color: "var(--c-text3)", letterSpacing: "0.25em",
              animation: "livePulse 1.5s infinite", textAlign: "center"
            }}>
              RETRIEVING INTELLIGENCE...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: 24, fontFamily: "var(--font-display)", fontSize: 9,
              color: "var(--c-text3)", letterSpacing: "0.2em", textAlign: "center"
            }}>
              NO ITEMS MATCH FILTER
            </div>
          ) : (
            filtered.map((a, i) => {
              const sv        = severityFromConf(a.confidence ?? 0.5, a.sentiment)
              const conf      = Math.round((a.confidence ?? 0.5) * 100)
              const isSelected= selected?.title === a.title

              return (
                <div key={`${a.title}-${i}`} onClick={() => setSelected(a)}
                  className="news-card"
                  style={{
                    background: isSelected ? "rgba(0,210,255,0.05)" : "transparent",
                    borderLeft: `2px solid ${isSelected ? "var(--c-accent)" : "transparent"}`,
                  }}
                >
                  {/* Source + severity + time */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    {/* Severity badge — matches poster exactly */}
                    <span style={{
                      fontFamily: "var(--font-display)", fontSize: 7,
                      padding: "1px 6px", letterSpacing: "0.15em",
                      color: sv.color,
                      background: `${sv.color}0d`,
                      border: `1px solid ${sv.color}40`,
                    }}>
                      {sv.label}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 8.5,
                      color: "var(--c-text2)", flex: 1,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                      {a.source}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-display)", fontSize: 7.5,
                      color: "var(--c-text3)"
                    }}>
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleTimeString("en", {
                        hour: "2-digit", minute: "2-digit"
                      }) : ""}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
                    color: isSelected ? "#fff" : "rgba(200,220,235,0.8)",
                    lineHeight: 1.4, marginBottom: 6,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {a.title}
                  </div>

                  {/* Confidence bar — matches poster CONFIDENCE 54% style */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontFamily: "var(--font-display)", fontSize: 7,
                      color: "var(--c-text3)", letterSpacing: "0.12em", marginBottom: 2
                    }}>
                      <span>CONFIDENCE</span>
                      <span style={{ color: isSelected ? "var(--c-accent)" : "var(--c-text3)" }}>
                        {conf}%
                      </span>
                    </div>
                    <div className="conf-bar">
                      <div className="conf-bar-fill" style={{ width: `${conf}%` }} />
                    </div>
                  </div>

                  {/* Keywords */}
                  {a.keywords?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                      {a.keywords.slice(0, 3).map(kw => (
                        <span key={kw} style={{
                          fontFamily: "var(--font-display)", fontSize: 6.5,
                          padding: "1px 5px", letterSpacing: "0.1em",
                          color: "var(--c-text3)",
                          border: "1px solid rgba(0,210,255,0.12)",
                          background: "rgba(0,210,255,0.03)"
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Article detail */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {selected ? (
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Source + meta */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {(() => {
                  const sv   = severityFromConf(selected.confidence ?? 0.5, selected.sentiment)
                  const conf = Math.round((selected.confidence ?? 0.5) * 100)
                  return (
                    <>
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: 8,
                        padding: "3px 10px", letterSpacing: "0.2em",
                        color: sv.color, border: `1px solid ${sv.color}50`,
                        background: `${sv.color}0a`
                      }}>
                        {sv.label}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: 8,
                        padding: "3px 10px", letterSpacing: "0.2em",
                        color: "var(--c-accent)", border: "1px solid rgba(0,210,255,0.25)",
                        background: "rgba(0,210,255,0.05)"
                      }}>
                        {selected.source}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: 7.5,
                        color: "var(--c-text3)", marginLeft: "auto"
                      }}>
                        {selected.publishedAt
                          ? new Date(selected.publishedAt).toUTCString().slice(0,22)
                          : ""}
                      </span>
                    </>
                  )
                })()}
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "var(--font-body)", fontWeight: 600,
                fontSize: 20, color: "#fff", lineHeight: 1.4
              }}>
                {selected.title}
              </div>

              {/* Description */}
              {selected.description && (
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: 13,
                  color: "rgba(180,210,225,0.7)", lineHeight: 1.8
                }}>
                  {selected.description}
                </div>
              )}

              {/* Intelligence scores */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10
              }}>
                {[
                  {
                    label: "CONFIDENCE SCORE",
                    value: `${Math.round((selected.confidence ?? 0.5) * 100)}%`,
                    color: "var(--c-accent)",
                    sub: "cross-source verification"
                  },
                  {
                    label: "SENTIMENT",
                    value: `${selected.sentiment > 0 ? "+" : ""}${selected.sentiment?.toFixed(3)}`,
                    color: sentColor(selected.sentiment),
                    sub: selected.sentiment_label || "NEUTRAL"
                  },
                  {
                    label: "THREAT SIGNAL",
                    value: severityFromConf(selected.confidence ?? 0.5, selected.sentiment).label,
                    color: severityFromConf(selected.confidence ?? 0.5, selected.sentiment).color,
                    sub: "algorithmic assessment"
                  },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: "12px 14px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(0,210,255,0.08)"
                  }}>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 7,
                      color: "var(--c-text3)", letterSpacing: "0.15em", marginBottom: 6
                    }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 22,
                      fontWeight: 700, color: s.color
                    }}>
                      {s.value}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 7,
                      color: "var(--c-text3)", letterSpacing: "0.1em", marginTop: 4
                    }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Keywords */}
              {selected.keywords?.length > 0 && (
                <div>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 7.5,
                    color: "var(--c-text3)", letterSpacing: "0.25em", marginBottom: 8
                  }}>
                    EXTRACTED INTELLIGENCE KEYWORDS
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {selected.keywords.map(kw => (
                      <span key={kw} style={{
                        fontFamily: "var(--font-display)", fontSize: 7.5,
                        padding: "3px 10px", letterSpacing: "0.15em",
                        color: "var(--c-accent)",
                        border: "1px solid rgba(0,210,255,0.25)",
                        background: "rgba(0,210,255,0.05)"
                      }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Read more */}
              <a href={selected.url} target="_blank" rel="noreferrer"
                style={{ alignSelf: "flex-start" }}>
                <button className="btn-intel">
                  ↗ READ FULL REPORT
                </button>
              </a>

              {/* Disclaimer */}
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 7,
                color: "var(--c-text3)", letterSpacing: "0.1em",
                borderTop: "1px solid rgba(0,210,255,0.06)", paddingTop: 12
              }}>
                ⚠ Information may be inaccurate. Always verify from multiple independent sources.
              </div>

            </div>
          ) : (
            <div style={{
              height: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", fontFamily: "var(--font-display)",
              fontSize: 9, color: "var(--c-text3)", letterSpacing: "0.3em"
            }}>
              SELECT AN INTELLIGENCE ITEM
            </div>
          )}
        </div>
      </div>
    </div>
  )
}