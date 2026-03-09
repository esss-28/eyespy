"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { API, WS } from "@/lib/api"

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: "#ff2d55",
  HIGH:     "#ff6d00",
  MODERATE: "#ffb300",
  STABLE:   "#00ff9d",
}

export default function EconomicIndex() {
  const [data,    setData]    = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [expanded,setExpanded]= useState(true)

  const fetchData = () => {
    setLoading(true)
    axios.get(`${API}/economy`)
      .then(r => { setData(r.data.economy || {}); setLoading(false) })
      .catch(() => {
        setData({
          "Russia":      { instability_index: 78.2, level: "CRITICAL", live: false },
          "Middle East": { instability_index: 72.4, level: "CRITICAL", live: false },
          "China":       { instability_index: 54.1, level: "HIGH",     live: false },
          "Europe":      { instability_index: 48.6, level: "MODERATE", live: false },
          "USA":         { instability_index: 41.2, level: "MODERATE", live: false },
          "India":       { instability_index: 35.8, level: "MODERATE", live: false },
          "Africa":      { instability_index: 62.3, level: "HIGH",     live: false },
        })
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 300_000)
    return () => clearInterval(t)
  }, [])

  const entries = Object.entries(data).sort(
    ([,a], [,b]) => b.instability_index - a.instability_index
  )

  return (
    <div style={{ overflow: "hidden" }}>
      <div className="panel-hdr" style={{ cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--c-amber)" }}>◈</span>
          ECONOMIC INSTABILITY INDEX
        </span>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 9,
          color: "var(--c-text3)", transition: "transform 0.2s",
          display: "inline-block",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
        }}>∧</span>
      </div>

      {expanded && (
        <div>
          {loading ? (
            <div style={{
              padding: "14px", fontFamily: "var(--font-display)",
              fontSize: 8, color: "var(--c-text3)",
              letterSpacing: "0.2em", animation: "livePulse 1.5s infinite"
            }}>
              ANALYSING ECONOMIC FEEDS...
            </div>
          ) : (
            entries.map(([region, info]) => {
              const color = LEVEL_COLOR[info.level] || "#ffb300"
              const idx   = info.instability_index as number
              return (
                <div key={region} style={{
                  padding: "7px 12px",
                  borderBottom: "1px solid rgba(0,210,255,0.05)",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,210,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 4
                  }}>
                    <span style={{
                      fontFamily: "var(--font-body)", fontWeight: 600,
                      fontSize: 12, color: "var(--c-text)", letterSpacing: "0.03em"
                    }}>
                      {region}
                      {info.live && (
                        <span style={{
                          marginLeft: 6, fontFamily: "var(--font-display)",
                          fontSize: 6.5, color: "#00ff9d"
                        }}>● LIVE</span>
                      )}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: 7,
                        padding: "1px 6px", letterSpacing: "0.15em",
                        color, border: `1px solid ${color}40`,
                        background: `${color}0a`
                      }}>
                        {info.level}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: 13,
                        fontWeight: 700, color,
                        textShadow: `0 0 8px ${color}60`, minWidth: 36,
                        textAlign: "right"
                      }}>
                        {idx.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    height: 3, background: "rgba(255,255,255,0.04)",
                    borderRadius: 1, overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 1,
                      width: `${idx}%`,
                      background: `linear-gradient(90deg, ${color}50, ${color})`,
                      transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
                    }} />
                  </div>
                </div>
              )
            })
          )}

          <div style={{ padding: "5px 12px 4px", textAlign: "right" }}>
            <button className="btn-intel"
              style={{ fontSize: 6.5, padding: "2px 8px" }}
              onClick={fetchData}>
              ↻ REFRESH
            </button>
          </div>
        </div>
      )}
    </div>
  )
}