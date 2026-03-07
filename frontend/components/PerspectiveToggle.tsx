"use client"
import { useState } from "react"
import axios from "axios"

type Perspective = "western" | "eastern" | "regional"

const META: Record<Perspective, { label: string; sub: string; color: string }> = {
  western:  { label: "WESTERN",        sub: "Reuters · BBC · NYT · Guardian",      color: "#00d2ff" },
  eastern:  { label: "EASTERN / STATE", sub: "Al Jazeera · Xinhua · RT · Global Times", color: "#ff6d00" },
  regional: { label: "REGIONAL",        sub: "Times of India · Dawn · Arab News",   color: "#00ff9d" },
}

const BIAS_COLOR: Record<string, string> = {
  "NEUTRAL":       "#00ff9d",
  "MODERATE BIAS": "#ffb300",
  "STRONG BIAS":   "#ff2d55",
}

const SUGGESTIONS = [
  "Ukraine conflict", "Taiwan China tensions", "Iran nuclear deal",
  "Gaza humanitarian crisis", "North Korea missiles", "India Pakistan border",
]

export default function PerspectiveToggle() {
  const [topic,    setTopic]    = useState("Ukraine conflict")
  const [loading,  setLoading]  = useState(false)
  const [data,     setData]     = useState<any>(null)
  const [active,   setActive]   = useState<Perspective>("western")
  const [error,    setError]    = useState("")
  const [searched, setSearched] = useState(false)

  const search = async (t?: string) => {
    const q = (t || topic).trim()
    if (!q) return
    setTopic(q)
    setLoading(true)
    setError("")
    setData(null)
    setSearched(true)
    try {
      const r = await axios.get(`http://localhost:8000/perspectives?topic=${encodeURIComponent(q)}`)
      setData(r.data)
    } catch {
      setError("Failed to fetch — ensure backend is running on port 8000.")
    }
    setLoading(false)
  }

  const sentColor = (s: number) =>
    s <= -0.5 ? "#ff2d55" : s < -0.05 ? "#ff6d00" : s >= 0.3 ? "#00ff9d" : "rgba(255,255,255,0.35)"

  const sentLabel = (s: number, l: string) => {
    if (l === "NEGATIVE") return s < -0.7 ? "STRONG NEG" : "NEGATIVE"
    if (l === "POSITIVE") return "POSITIVE"
    return "NEUTRAL"
  }

  const TABS: Perspective[] = ["western", "eastern", "regional"]

  const activeMeta        = META[active]
  const activeData        = data?.perspectives?.[active]
  const activeArticles    = activeData?.articles     ?? []
  const activeSentiment   = activeData?.avg_sentiment ?? 0
  const activeCount       = activeData?.article_count ?? 0
  const bias              = data?.bias
  const biasColor         = BIAS_COLOR[bias?.bias_level] ?? "#5a7a90"

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      padding: 12, gap: 10, overflow: "hidden"
    }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexShrink: 0,
        borderBottom: "1px solid rgba(0,210,255,0.1)", paddingBottom: 10
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 8,
            letterSpacing: "0.35em", color: "rgba(0,210,255,0.5)", marginBottom: 4
          }}>
            ◈ MULTI-PERSPECTIVE INTELLIGENCE ANALYSIS
          </div>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: 12,
            color: "rgba(180,210,225,0.55)", letterSpacing: "0.02em"
          }}>
            Compare how Western, Eastern, and Regional media frames the same story — with live AI bias scoring
          </div>
        </div>

        {/* Bias badge */}
        {bias && (
          <div style={{
            padding: "8px 16px", flexShrink: 0,
            background: `${biasColor}10`,
            border: `1px solid ${biasColor}40`, textAlign: "center"
          }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 7,
              color: `${biasColor}80`, letterSpacing: "0.2em", marginBottom: 3
            }}>
              NARRATIVE BIAS INDEX
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 20,
              fontWeight: 700, color: biasColor, letterSpacing: "0.1em"
            }}>
              {bias.bias_score?.toFixed(2)}
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 7.5,
              color: biasColor, letterSpacing: "0.15em", marginTop: 2
            }}>
              {bias.bias_level}
            </div>
          </div>
        )}
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "var(--font-display)", fontSize: 9,
            color: "rgba(0,210,255,0.4)", pointerEvents: "none"
          }}>▶</span>
          <input
            className="input-intel"
            style={{ paddingLeft: 28 }}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="ENTER TOPIC — e.g. Taiwan China, Iran nuclear, Ukraine war..."
          />
        </div>
        <button className="btn-intel" onClick={() => search()} disabled={loading}
          style={{ padding: "0 22px", whiteSpace: "nowrap" }}>
          {loading ? "SCANNING..." : "ANALYSE"}
        </button>
      </div>

      {/* Suggestions */}
      {!searched && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} className="btn-intel"
              style={{ fontSize: 7.5, padding: "3px 10px" }}
              onClick={() => search(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 18
        }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,210,255,0.1)" strokeWidth="1"/>
            <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(0,210,255,0.08)" strokeWidth="1" strokeDasharray="2 4"/>
            <circle cx="40" cy="40" r="12" fill="none" stroke="rgba(0,210,255,0.06)" strokeWidth="1" strokeDasharray="2 4"/>
            <line x1="40" y1="40" x2="40" y2="4" stroke="rgba(0,210,255,0.7)" strokeWidth="1.5"
              style={{ transformOrigin: "40px 40px", animation: "radarSweep 1.5s linear infinite" }}/>
            <circle cx="40" cy="40" r="3" fill="#00d2ff"/>
          </svg>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 9,
            letterSpacing: "0.35em", color: "rgba(0,210,255,0.5)",
            animation: "livePulse 1.5s infinite"
          }}>
            SCANNING GLOBAL INTELLIGENCE FEEDS...
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && !loading && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(255,45,85,0.05)",
          border: "1px solid rgba(255,45,85,0.25)",
          fontFamily: "var(--font-mono)", fontSize: 10, color: "#ff2d55", flexShrink: 0
        }}>
          ✕ {error}
        </div>
      )}

      {/* ── RESULTS ── */}
      {data && !loading && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden", minHeight: 0 }}>

          {/* Perspective selector tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, flexShrink: 0 }}>
            {TABS.map(p => {
              const m        = META[p]
              const pd       = data.perspectives?.[p]
              const sent     = pd?.avg_sentiment  ?? 0
              const count    = pd?.article_count  ?? 0
              const isActive = active === p

              return (
                <div key={p} onClick={() => setActive(p)} style={{
                  padding: "12px 14px", cursor: "pointer", transition: "all 0.2s",
                  border: `1px solid ${isActive ? m.color + "50" : "rgba(0,210,255,0.1)"}`,
                  background: isActive ? `${m.color}08` : "rgba(0,0,0,0.3)",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Active top bar */}
                  {isActive && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      height: 2, background: m.color
                    }}/>
                  )}

                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 8, letterSpacing: "0.2em",
                    color: isActive ? m.color : "rgba(255,255,255,0.3)", marginBottom: 3
                  }}>
                    {m.label}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 8.5,
                    color: "rgba(180,210,225,0.35)", marginBottom: 10
                  }}>
                    {m.sub}
                  </div>

                  {/* Sentiment score */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{
                      fontFamily: "var(--font-display)", fontSize: 7,
                      color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em"
                    }}>
                      AVG SENTIMENT
                    </span>
                    <span style={{
                      fontFamily: "var(--font-display)", fontSize: 13,
                      fontWeight: 700, color: sentColor(sent),
                      textShadow: `0 0 8px ${sentColor(sent)}60`
                    }}>
                      {sent > 0 ? "+" : ""}{sent.toFixed(3)}
                    </span>
                  </div>

                  {/* Bipolar sentiment bar — centre = 0 */}
                  <div style={{
                    height: 3, background: "rgba(255,255,255,0.05)",
                    borderRadius: 2, position: "relative"
                  }}>
                    <div style={{
                      position: "absolute", height: "100%", borderRadius: 2,
                      width: `${Math.min(Math.abs(sent) * 50, 50)}%`,
                      background: sentColor(sent),
                      left: sent < 0 ? `${50 - Math.abs(sent) * 50}%` : "50%",
                    }}/>
                    {/* Centre tick */}
                    <div style={{
                      position: "absolute", left: "50%", top: 0, bottom: 0,
                      width: 1, background: "rgba(255,255,255,0.15)"
                    }}/>
                  </div>

                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 7,
                    color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", marginTop: 6
                  }}>
                    {count} ARTICLES ANALYSED
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bias summary strip */}
          {bias && (
            <div style={{
              padding: "8px 14px", flexShrink: 0,
              background: `${biasColor}06`,
              border: `1px solid ${biasColor}18`,
              display: "flex", alignItems: "center", gap: 14
            }}>
              <span style={{
                fontFamily: "var(--font-display)", fontSize: 7.5,
                color: biasColor, letterSpacing: "0.2em", whiteSpace: "nowrap"
              }}>
                {bias.bias_level}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 9.5,
                color: "rgba(180,210,225,0.4)"
              }}>
                Western avg:{" "}
                <span style={{ color: sentColor(bias.left_sentiment) }}>
                  {bias.left_sentiment > 0 ? "+" : ""}{bias.left_sentiment}
                </span>
                {"  ·  "}
                Eastern avg:{" "}
                <span style={{ color: sentColor(bias.right_sentiment) }}>
                  {bias.right_sentiment > 0 ? "+" : ""}{bias.right_sentiment}
                </span>
                {"  ·  "}
                Divergence:{" "}
                <span style={{ color: biasColor, fontWeight: 700 }}>
                  {bias.bias_score?.toFixed(3)}
                </span>
              </span>
            </div>
          )}

          {/* Articles panel */}
          <div className="panel" style={{
            flex: 1, display: "flex", flexDirection: "column",
            overflow: "hidden", minHeight: 0
          }}>
            <div className="panel-hdr">
              <span style={{ color: activeMeta.color }}>
                {activeMeta.label} — "{data.topic}"
              </span>
              <span className="panel-hdr-right">
                {activeCount} ARTICLES · {activeMeta.sub}
              </span>
            </div>

            <div className="scrollable" style={{ flex: 1 }}>
              {activeArticles.length === 0 ? (
                <div style={{
                  padding: 24, textAlign: "center",
                  fontFamily: "var(--font-display)", fontSize: 9,
                  color: "var(--c-text3)", letterSpacing: "0.2em"
                }}>
                  NO ARTICLES RETURNED FOR THIS SOURCE GROUP
                </div>
              ) : (
                /* KEY FIX: use article.id (unique per article) not array index */
                activeArticles.map((a: any) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                    style={{
                      display: "block", textDecoration: "none",
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(0,210,255,0.05)",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,210,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Source row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: 7.5,
                        padding: "2px 8px", letterSpacing: "0.15em",
                        color: activeMeta.color,
                        background: `${activeMeta.color}0a`,
                        border: `1px solid ${activeMeta.color}25`,
                        maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {a.source?.toUpperCase() || "UNKNOWN"}
                      </span>

                      {/* Sentiment chip */}
                      <span style={{
                        marginLeft: "auto",
                        fontFamily: "var(--font-display)", fontSize: 9,
                        color: sentColor(a.sentiment), letterSpacing: "0.1em",
                        textShadow: `0 0 8px ${sentColor(a.sentiment)}40`
                      }}>
                        {sentLabel(a.sentiment, a.sentiment_label)}{" "}
                        {a.sentiment > 0 ? "+" : ""}{a.sentiment?.toFixed(3)}
                      </span>
                    </div>

                    {/* Title */}
                    <div style={{
                      fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500,
                      color: "rgba(200,220,235,0.88)", lineHeight: 1.45,
                      letterSpacing: "0.01em", marginBottom: a.description ? 5 : 0
                    }}>
                      {a.title}
                    </div>

                    {/* Description */}
                    {a.description && (
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: 9.5,
                        color: "var(--c-text2)", lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {a.description}
                      </div>
                    )}

                    {/* Timestamp */}
                    {a.publishedAt && (
                      <div style={{
                        marginTop: 5, fontFamily: "var(--font-display)",
                        fontSize: 7.5, color: "var(--c-text3)", letterSpacing: "0.1em"
                      }}>
                        {new Date(a.publishedAt).toUTCString().slice(0, 22).toUpperCase()} UTC
                      </div>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && searched && (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontSize: 9,
          color: "var(--c-text3)", letterSpacing: "0.25em"
        }}>
          NO DATA RETURNED — CHECK NEWSAPI KEY AND BACKEND LOGS
        </div>
      )}

      {!searched && !loading && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20
        }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ opacity: 0.25 }}>
            <circle cx="45" cy="45" r="40" fill="none" stroke="#00d2ff" strokeWidth="1"/>
            <circle cx="45" cy="45" r="27" fill="none" stroke="#00d2ff" strokeWidth="0.5" strokeDasharray="3 6"/>
            <circle cx="45" cy="45" r="14" fill="none" stroke="#00d2ff" strokeWidth="0.5" strokeDasharray="3 6"/>
            <line x1="45" y1="5" x2="45" y2="85" stroke="#00d2ff" strokeWidth="0.4" opacity="0.4"/>
            <line x1="5" y1="45" x2="85" y2="45" stroke="#00d2ff" strokeWidth="0.4" opacity="0.4"/>
            <circle cx="45" cy="45" r="4" fill="#00d2ff" opacity="0.8"/>
          </svg>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 10,
              letterSpacing: "0.35em", color: "rgba(0,210,255,0.4)", marginBottom: 8
            }}>
              PERSPECTIVE ENGINE READY
            </div>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: 12.5,
              color: "rgba(180,210,225,0.3)", maxWidth: 380,
              lineHeight: 1.7, textAlign: "center"
            }}>
              Enter any geopolitical topic above to compare how Western,
              Eastern, and Regional media frames the same story —
              with live AI sentiment scoring and narrative bias index.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}