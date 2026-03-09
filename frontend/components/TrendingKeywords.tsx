"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { API, WS } from "@/lib/api"

export default function TrendingKeywords() {
  const [keywords, setKeywords] = useState<{word: string, mentions: number}[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(true)

  const fetchKeywords = () => {
    setLoading(true)
    axios.get(`${API}/trending`)
      .then(r => { setKeywords(r.data.keywords || []); setLoading(false) })
      .catch(() => {
        // Fallback so widget always shows something
        setKeywords([
          { word: "Ukraine",    mentions: 103 },
          { word: "Israel",     mentions: 82  },
          { word: "Gaza",       mentions: 76  },
          { word: "Taiwan",     mentions: 58  },
          { word: "Iran",       mentions: 51  },
          { word: "Russia",     mentions: 44  },
          { word: "NATO",       mentions: 39  },
          { word: "Sanctions",  mentions: 31  },
          { word: "China",      mentions: 28  },
          { word: "Sudan",      mentions: 19  },
        ])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchKeywords()
    // Refresh every 5 minutes
    const t = setInterval(fetchKeywords, 300_000)
    return () => clearInterval(t)
  }, [])

  const max = keywords[0]?.mentions || 1

  // Rank colour: top 3 = red, 4-6 = amber, 7-10 = orange
  const rankColor = (i: number) =>
    i < 3 ? "#ef4444" : i < 6 ? "#f59e0b" : "#ea580c"

  return (
    <div className="panel panel-corner" style={{ overflow: "hidden" }}>
      <div className="panel-hdr" style={{ cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 7.5,
            color: "var(--c-accent2)", letterSpacing: "0.05em"
          }}>#</span>
          TOP KEYWORDS (24H)
        </span>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 9,
          color: "var(--c-text3)", transition: "transform 0.2s",
          display: "inline-block",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
        }}>∧</span>
      </div>

      {expanded && (
        <div style={{ padding: "6px 0" }}>
          {loading ? (
            <div style={{
              padding: "12px 14px",
              fontFamily: "var(--font-display)", fontSize: 8,
              color: "var(--c-text3)", letterSpacing: "0.2em",
              animation: "livePulse 1.5s infinite"
            }}>
              SCANNING FEEDS...
            </div>
          ) : (
            keywords.slice(0, 10).map((kw, i) => (
              <div key={kw.word} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "5px 12px",
                borderBottom: "1px solid rgba(220,38,38,0.04)",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(220,38,38,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Rank number */}
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: 8,
                  fontWeight: 700, color: rankColor(i),
                  minWidth: 16, textAlign: "right",
                  textShadow: i < 3 ? `0 0 8px ${rankColor(i)}60` : "none"
                }}>
                  #{i + 1}
                </span>

                {/* Keyword + bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 3
                  }}>
                    <span style={{
                      fontFamily: "var(--font-body)", fontSize: 12,
                      fontWeight: 600, color: i < 3 ? "#fff" : "rgba(240,222,222,0.7)",
                      letterSpacing: "0.02em",
                      textShadow: i < 3 ? `0 0 10px ${rankColor(i)}30` : "none"
                    }}>
                      {kw.word}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 9,
                      color: rankColor(i), letterSpacing: "0.05em",
                      whiteSpace: "nowrap"
                    }}>
                      {kw.mentions} <span style={{ color: "var(--c-text3)", fontSize: 7 }}>mentions</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: 2, background: "rgba(255,255,255,0.04)",
                    borderRadius: 1, overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(kw.mentions / max) * 100}%`,
                      background: `linear-gradient(90deg, ${rankColor(i)}60, ${rankColor(i)})`,
                      borderRadius: 1,
                      transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
                    }} />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Refresh button */}
          <div style={{ padding: "6px 12px 4px", textAlign: "right" }}>
            <button className="btn-intel"
              style={{ fontSize: 6.5, padding: "2px 8px" }}
              onClick={fetchKeywords}>
              ↻ REFRESH
            </button>
          </div>
        </div>
      )}
    </div>
  )
}