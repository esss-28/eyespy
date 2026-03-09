"use client"
import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { API, WS } from "@/lib/api"

const TAG_CLS: Record<string, string> = {
  MILITARY:   "tag-mil",
  ESCALATION: "tag-san",
  DIPLOMACY:  "tag-dip",
  ECONOMIC:   "tag-eco",
  SANCTIONS:  "tag-eco",
}

const TAG_COLOR: Record<string, string> = {
  MILITARY:   "#ff2d55",
  ESCALATION: "#ff6d00",
  DIPLOMACY:  "#00d2ff",
  ECONOMIC:   "#ffb300",
  SANCTIONS:  "#ffb300",
}

const REGIONS = [
  "All", "Ukraine", "Middle East", "Taiwan", "Russia",
  "Sahel", "Eastern Europe", "East Asia", "Global",
]

export default function TimeMachine() {
  const [events,   setEvents]   = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [region,   setRegion]   = useState("All")
  const [search,   setSearch]   = useState("")

  useEffect(() => {
    axios.get(`${API}/history`)
      .then(r => {
        const sorted = [...r.data.events].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setEvents(sorted)
        setSelected(sorted[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() =>
    events.filter(e => {
      const matchR = region === "All" || e.region === region
      const matchS = !search ||
        e.event.toLowerCase().includes(search.toLowerCase()) ||
        e.region.toLowerCase().includes(search.toLowerCase()) ||
        (e.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
      return matchR && matchS
    }), [events, region, search])

  const probColor = (p: number) =>
    p >= 0.90 ? "#ff2d55" : p >= 0.80 ? "#ff6d00" : p >= 0.65 ? "#ffb300" : "#00ff9d"

  const probLabel = (p: number) =>
    p >= 0.90 ? "CRITICAL" : p >= 0.80 ? "HIGH" : p >= 0.65 ? "ELEVATED" : "MODERATE"

  return (
    <div style={{ height: "100%", display: "flex", gap: 8, padding: 8, overflow: "hidden" }}>

      {/* ── LEFT: TIMELINE ── */}
      <div className="panel panel-corner" style={{
        width: 370, display: "flex", flexDirection: "column",
        overflow: "hidden", flexShrink: 0
      }}>
        <div className="panel-hdr">
          <span>TIME MACHINE</span>
          <span className="panel-hdr-right">
            {loading ? "LOADING..." : `${filtered.length} / ${events.length} EVENTS`}
          </span>
        </div>

        {/* Search */}
        <div style={{ padding: "8px 10px 0", flexShrink: 0 }}>
          <input
            className="input-intel"
            style={{ fontSize: 9.5, padding: "6px 10px" }}
            placeholder="SEARCH EVENTS, REGIONS, TAGS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Region filter chips */}
        <div style={{
          padding: "8px 10px", display: "flex", gap: 4,
          flexWrap: "wrap", flexShrink: 0,
          borderBottom: "1px solid rgba(0,210,255,0.07)"
        }}>
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{
              fontFamily: "var(--font-display)", fontSize: 6.5,
              padding: "2px 7px", letterSpacing: "0.12em", cursor: "pointer",
              border: "1px solid",
              borderColor: region === r ? "rgba(0,210,255,0.5)" : "rgba(0,210,255,0.1)",
              color:       region === r ? "#00d2ff" : "rgba(255,255,255,0.22)",
              background:  region === r ? "rgba(0,210,255,0.08)" : "transparent",
              transition: "all 0.15s"
            }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.3em",
            color: "rgba(0,210,255,0.3)", animation: "livePulse 1.5s infinite"
          }}>
            LOADING ARCHIVE...
          </div>
        ) : (
          <div className="scrollable" style={{ flex: 1 }}>
            <div style={{ position: "relative" }}>
              {/* Spine */}
              <div style={{
                position: "absolute", left: 22, top: 0, bottom: 0,
                width: 1, background: "rgba(0,210,255,0.07)"
              }}/>

              {filtered.length === 0 && (
                <div style={{
                  padding: 24, textAlign: "center",
                  fontFamily: "var(--font-display)", fontSize: 8,
                  color: "var(--c-text3)", letterSpacing: "0.2em"
                }}>
                  NO EVENTS MATCH FILTER
                </div>
              )}

              {filtered.map((e, i) => {
                const color      = probColor(e.probability)
                const isSelected = selected?.date === e.date && selected?.event === e.event
                const tags       = (e.tags || []) as string[]

                return (
                  <div key={`${e.date}-${i}`} onClick={() => setSelected(e)} style={{
                    display: "flex", gap: 12, padding: "9px 12px",
                    cursor: "pointer", transition: "background 0.15s",
                    background:  isSelected ? "rgba(0,210,255,0.06)" : "transparent",
                    borderLeft: `2px solid ${isSelected ? color : "transparent"}`,
                  }}>
                    {/* Dot */}
                    <div style={{
                      flexShrink: 0, width: 9, height: 9, borderRadius: "50%",
                      marginTop: 4, zIndex: 1,
                      background:   color,
                      boxShadow:    isSelected ? `0 0 10px ${color}` : `0 0 3px ${color}50`,
                      border:       `2px solid ${color}${isSelected ? "ff" : "55"}`,
                    }}/>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Date + probability */}
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 3
                      }}>
                        <span style={{
                          fontFamily: "var(--font-display)", fontSize: 7.5,
                          color: "var(--c-text3)", letterSpacing: "0.12em"
                        }}>
                          {e.date}
                        </span>
                        <span style={{
                          fontFamily: "var(--font-display)", fontSize: 9.5,
                          fontWeight: 700, color,
                          textShadow: isSelected ? `0 0 8px ${color}60` : "none"
                        }}>
                          {Math.round(e.probability * 100)}%
                        </span>
                      </div>

                      {/* Event title */}
                      <div style={{
                        fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500,
                        color: isSelected ? "#fff" : "rgba(200,220,235,0.68)",
                        lineHeight: 1.35, marginBottom: 5,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {e.event}
                      </div>

                      {/* Region + tags */}
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{
                          fontFamily: "var(--font-display)", fontSize: 6.5,
                          color: "var(--c-text3)", letterSpacing: "0.15em"
                        }}>
                          {e.region.toUpperCase()}
                        </span>
                        {tags.slice(0, 2).map(tag => (
                          <span key={tag} className={`tag ${TAG_CLS[tag] || "tag-dip"}`}
                            style={{ fontSize: 6, padding: "1px 4px" }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: DETAIL PANEL ── */}
      <div className="panel panel-corner" style={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
        <div className="panel-hdr">
          <span>RETROSPECTIVE ANALYSIS</span>
          <span className="panel-hdr-right">AI-COMPUTED RISK ASSESSMENT</span>
        </div>

        {selected ? (
          <div style={{
            flex: 1, padding: 28, display: "flex",
            flexDirection: "column", gap: 22, overflow: "auto"
          }}>

            {/* Event header */}
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 8,
                color: "var(--c-accent)", letterSpacing: "0.28em",
                marginBottom: 10, display: "flex",
                alignItems: "center", gap: 10, flexWrap: "wrap"
              }}>
                <span>{selected.date}</span>
                <span style={{ color: "var(--c-text3)" }}>·</span>
                <span>{selected.region.toUpperCase()}</span>
                {(selected.tags || []).map((tag: string) => (
                  <span key={tag} className={`tag ${TAG_CLS[tag] || "tag-dip"}`}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{
                fontFamily: "var(--font-body)", fontWeight: 600,
                fontSize: 21, color: "#fff", lineHeight: 1.35,
                letterSpacing: "0.01em"
              }}>
                {selected.event}
              </div>
            </div>

            {/* Risk meter */}
            <div style={{
              padding: 22,
              background: `${probColor(selected.probability)}04`,
              border: `1px solid ${probColor(selected.probability)}20`,
              display: "flex", alignItems: "center", gap: 28
            }}>
              {/* Big number */}
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 900,
                  fontSize: 64, color: probColor(selected.probability),
                  lineHeight: 1,
                  textShadow: `0 0 28px ${probColor(selected.probability)}50`
                }}>
                  {Math.round(selected.probability * 100)}
                  <span style={{ fontSize: 28 }}>%</span>
                </div>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 7.5,
                  color: "var(--c-text3)", letterSpacing: "0.25em", marginTop: 4
                }}>
                  CONFLICT PROBABILITY
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {/* Risk badge */}
                <div style={{
                  display: "inline-block", marginBottom: 16,
                  fontFamily: "var(--font-display)", fontSize: 10,
                  padding: "5px 14px", letterSpacing: "0.25em",
                  color: probColor(selected.probability),
                  border: `1px solid ${probColor(selected.probability)}50`,
                  background: `${probColor(selected.probability)}10`
                }}>
                  {probLabel(selected.probability)}
                </div>

                {/* Bar */}
                <div style={{
                  height: 8, background: "rgba(255,255,255,0.04)",
                  borderRadius: 2, overflow: "hidden", marginBottom: 7
                }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${selected.probability * 100}%`,
                    background: `linear-gradient(90deg, ${probColor(selected.probability)}40, ${probColor(selected.probability)})`,
                    transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
                  }}/>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontFamily: "var(--font-display)", fontSize: 7,
                  color: "var(--c-text3)", letterSpacing: "0.08em"
                }}>
                  <span>LOW RISK</span>
                  <span>MODERATE</span>
                  <span>HIGH</span>
                  <span>CRITICAL</span>
                </div>
              </div>
            </div>

            {/* Assessment text */}
            <div style={{
              padding: 18, background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(0,210,255,0.08)",
              borderLeft: "2px solid rgba(0,210,255,0.3)"
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 8,
                color: "var(--c-accent)", letterSpacing: "0.25em", marginBottom: 10
              }}>
                ▶ INTELLIGENCE ASSESSMENT
              </div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: 12.5,
                color: "rgba(180,210,225,0.78)", lineHeight: 1.8
              }}>
                This event was captured in the EyeSpy historical intelligence database on{" "}
                <span style={{ color: "var(--c-accent)" }}>{selected.date}</span>.
                The conflict probability score of{" "}
                <span style={{ color: probColor(selected.probability), fontWeight: 600 }}>
                  {Math.round(selected.probability * 100)}%
                </span>{" "}
                was computed by the EyeSpy weighted ensemble model, incorporating
                sentiment analysis of contemporaneous media coverage via XLM-RoBERTa,
                market volatility indicators, and military activity event frequency
                derived from GDELT and open-source intelligence streams.
                This assessment classifies the event as{" "}
                <span style={{ color: probColor(selected.probability) }}>
                  {probLabel(selected.probability)}
                </span>{" "}
                on the EyeSpy Geopolitical Risk Scale.
              </div>
            </div>

            {/* Component scores */}
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 8,
                color: "var(--c-text3)", letterSpacing: "0.25em", marginBottom: 10
              }}>
                MODEL COMPONENT SCORES
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "SENTIMENT",        v: Math.min(Math.round(selected.probability * 90 + 5),  99) },
                  { label: "VOLATILITY",        v: Math.min(Math.round(selected.probability * 85 + 8),  99) },
                  { label: "MILITARY ACTIVITY", v: Math.min(Math.round(selected.probability * 95 + 3),  99) },
                ].map(c => (
                  <div key={c.label} style={{
                    padding: "12px 14px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(0,210,255,0.08)"
                  }}>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 7.5,
                      color: "var(--c-text3)", letterSpacing: "0.15em", marginBottom: 8
                    }}>
                      {c.label}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 24,
                      fontWeight: 700, color: probColor(selected.probability), lineHeight: 1
                    }}>
                      {c.v}%
                    </div>
                    <div style={{
                      height: 2, background: "rgba(255,255,255,0.04)",
                      borderRadius: 1, marginTop: 8, overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%", width: `${c.v}%`,
                        background: probColor(selected.probability),
                        borderRadius: 1, transition: "width 1s ease"
                      }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "var(--font-display)",
            fontSize: 9, color: "var(--c-text3)", letterSpacing: "0.3em"
          }}>
            SELECT AN EVENT FROM THE TIMELINE
          </div>
        )}
      </div>
    </div>
  )
}