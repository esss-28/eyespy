"use client"
import { useEffect, useState } from "react"
import axios from "axios"

interface Article {
  title: string; source: string; description: string
  url: string; sentiment_label: string; sentiment_score: number
  confidence: number; keywords: string[]
}

const CLASSIFY_KEYWORDS = {
  MILITARY:   ["military","missile","strike","troops","army","war","weapon","attack","drone","navy","bomb"],
  ESCALATION: ["escalat","tension","standoff","surge","crisis","aggress"],
  SANCTIONS:  ["sanction","embargo","ban","restrict","penalty"],
  DIPLOMACY:  ["diplomat","talk","treaty","deal","summit","ceasefire","negot"],
  ECONOMIC:   ["market","trade","gdp","inflation","oil","currency","economy","bank"],
}

function classifyArticle(title: string, desc: string): string[] {
  const text = (title + " " + (desc || "")).toLowerCase()
  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(CLASSIFY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) tags.push(tag)
  }
  return tags.slice(0, 2)
}

const TAG_STYLE: Record<string, string> = {
  MILITARY: "tag-mil", ESCALATION: "tag-san", SANCTIONS: "tag-eco",
  DIPLOMACY: "tag-dip", ECONOMIC: "tag-eco"
}

export default function NewsFeed() {
  const [news, setNews] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = () => {
    setLoading(true)
    axios.get("http://localhost:8000/news")
      .then(r => { setNews(r.data); setLoading(false); setLastUpdated(new Date()) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 120000)
    return () => clearInterval(interval)
  }, [])

  const sentColor = (s: number) =>
    s < -0.5 ? "#ff2d55" : s < -0.1 ? "#ff6d00" : s > 0.3 ? "#00ff9d" : "rgba(255,255,255,0.3)"

  const sentLabel = (s: number) =>
    s < -0.6 ? "NEG" : s < -0.1 ? "NEU−" : s > 0.3 ? "POS" : "NEU"

  const pad = (n: number) => String(n).padStart(2, "0")
  const timeStr = lastUpdated
    ? `${pad(lastUpdated.getUTCHours())}:${pad(lastUpdated.getUTCMinutes())}Z`
    : "··:··Z"

  return (
    <div className="panel panel-corner" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <div className="panel-hdr">
        <span className="live-ring">INTELLIGENCE FEED</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="panel-hdr-right">UPD {timeStr}</span>
          <button className="btn-intel" style={{ padding: "2px 8px", fontSize: 7 }} onClick={load}>
            ↺ REFRESH
          </button>
        </div>
      </div>

      <div className="scrollable" style={{ flex: 1 }}>
        {loading && (
          <div style={{
            padding: 20, textAlign: "center", fontFamily: "var(--font-display)",
            fontSize: 9, letterSpacing: "0.3em", color: "rgba(0,210,255,0.4)",
            animation: "livePulse 1.5s infinite"
          }}>
            ▶ FETCHING INTELLIGENCE FEEDS...
          </div>
        )}

        {news.map((n, i) => {
          const tags = classifyArticle(n.title, n.description)
          const sc = n.sentiment_score
          const confPct = Math.round(n.confidence * 100)

          return (
            <a key={i} href={n.url} target="_blank" rel="noreferrer"
              className="news-card"
              style={{ display: "block", textDecoration: "none" }}
            >
              {/* Top row: source + sentiment + bias */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: 7.5,
                  letterSpacing: "0.2em", padding: "2px 7px",
                  background: "rgba(0,210,255,0.07)",
                  border: "1px solid rgba(0,210,255,0.2)",
                  color: "var(--c-accent)"
                }}>
                  {n.source.toUpperCase().slice(0, 16)}
                </span>

                {/* Tags */}
                {tags.map(tag => (
                  <span key={tag} className={`tag ${TAG_STYLE[tag] || "tag-int"}`}>
                    {tag}
                  </span>
                ))}

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: 8,
                    color: sentColor(sc), letterSpacing: "0.1em"
                  }}>
                    {sentLabel(sc)} {sc > 0 ? "+" : ""}{sc.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Headline */}
              <div style={{
                fontFamily: "var(--font-body)", fontSize: 11.5, fontWeight: 500,
                color: "rgba(200,220,235,0.9)", lineHeight: 1.45, marginBottom: 6,
                letterSpacing: "0.02em"
              }}>
                {n.title}
              </div>

              {/* Description */}
              {n.description && (
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 9,
                  color: "var(--c-text2)", lineHeight: 1.4, marginBottom: 6,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden"
                }}>
                  {n.description}
                </div>
              )}

              {/* Bottom: confidence + keywords */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
                  <span style={{ fontSize: 7.5, color: "var(--c-text3)", fontFamily: "var(--font-display)", letterSpacing: "0.15em", whiteSpace: "nowrap" }}>
                    CONF
                  </span>
                  <div className="conf-bar" style={{ flex: 1 }}>
                    <div className="conf-bar-fill" style={{ width: `${confPct}%` }} />
                  </div>
                  <span style={{
                    fontSize: 8, fontFamily: "var(--font-display)",
                    color: confPct >= 80 ? "var(--c-accent2)" : "var(--c-text3)",
                    letterSpacing: "0.1em"
                  }}>
                    {confPct}%
                  </span>
                </div>

                {/* Keywords */}
                {n.keywords?.slice(0, 2).map((kw, j) => (
                  <span key={j} style={{
                    fontSize: 7.5, padding: "1px 5px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--c-text3)", fontFamily: "var(--font-display)",
                    letterSpacing: "0.1em"
                  }}>
                    {kw.toUpperCase()}
                  </span>
                ))}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}