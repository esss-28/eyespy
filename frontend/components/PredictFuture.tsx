"use client"
import { useEffect, useState } from "react"
import axios from "axios"

const TOPIC_META: Record<string, { short: string; icon: string }> = {
  ukraine_ceasefire: { short: "Ukraine Ceasefire",    icon: "🕊" },
  taiwan_conflict:   { short: "Taiwan Military Action",icon: "⚔" },
  iran_nuclear:      { short: "Iran Nuclear Deal",     icon: "☢" },
  gaza_resolution:   { short: "Gaza Two-State Deal",   icon: "🌍" },
  russia_collapse:   { short: "Putin Stays in Power",  icon: "👁" },
}

export default function PredictFuture() {
  const [polls,   setPolls]   = useState<Record<string, any>>({})
  const [active,  setActive]  = useState("ukraine_ceasefire")
  const [voted,   setVoted]   = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [voting,  setVoting]  = useState(false)
  const [flash,   setFlash]   = useState("")

  const fetchPolls = () => {
    axios.get("http://localhost:8000/polls")
      .then(r => { setPolls(r.data.polls || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchPolls()
    const t = setInterval(fetchPolls, 30_000)
    return () => clearInterval(t)
  }, [])

  const handleVote = async (choice: "yes" | "no") => {
    if (voted[active] || voting) return
    setVoting(true)
    try {
      const r = await axios.post(
        `http://localhost:8000/vote?topic=${active}&choice=${choice}`
      )
      setPolls(prev => ({
        ...prev,
        [active]: { ...prev[active], ...r.data }
      }))
      setVoted(prev => ({ ...prev, [active]: choice }))
      setFlash(choice === "yes" ? "VOTE REGISTERED: YES" : "VOTE REGISTERED: NO")
      setTimeout(() => setFlash(""), 2500)
    } catch {}
    setVoting(false)
  }

  const poll       = polls[active]
  const userVote   = voted[active]
  const yesPct     = poll?.yes_pct ?? 0
  const noPct      = poll?.no_pct  ?? 0
  const total      = poll?.total   ?? 0

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 12, gap: 10, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 8,
          letterSpacing: "0.35em", color: "rgba(0,210,255,0.5)", marginBottom: 4
        }}>
          ◈ PREDICTIVE INTELLIGENCE — CROWD FORECAST ENGINE
        </div>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: 12,
          color: "rgba(180,210,225,0.5)", letterSpacing: "0.02em"
        }}>
          Aggregated probability forecasts from the EyeSpy analyst network.
          Cast your assessment — shape the intelligence consensus.
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 10, overflow: "hidden", minHeight: 0 }}>

        {/* LEFT: topic list */}
        <div className="panel" style={{
          width: 220, flexShrink: 0,
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div className="panel-hdr">
            <span>ACTIVE FORECASTS</span>
            <span className="panel-hdr-right">{Object.keys(polls).length} OPEN</span>
          </div>
          <div className="scrollable" style={{ flex: 1 }}>
            {Object.entries(TOPIC_META).map(([topic, meta]) => {
              const p        = polls[topic]
              const isActive = active === topic
              const hasVoted = !!voted[topic]
              return (
                <div key={topic} onClick={() => setActive(topic)} style={{
                  padding: "10px 12px", cursor: "pointer",
                  borderBottom: "1px solid rgba(0,210,255,0.05)",
                  background: isActive ? "rgba(0,210,255,0.06)" : "transparent",
                  borderLeft: `2px solid ${isActive ? "var(--c-accent)" : "transparent"}`,
                  transition: "all 0.15s"
                }}>
                  <div style={{
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12,
                    color: isActive ? "#fff" : "rgba(200,220,235,0.65)",
                    marginBottom: 4, lineHeight: 1.3
                  }}>
                    {meta.short}
                  </div>
                  {p && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* mini bar */}
                      <div style={{
                        flex: 1, height: 3, background: "rgba(255,255,255,0.05)",
                        borderRadius: 1, overflow: "hidden"
                      }}>
                        <div style={{
                          height: "100%", borderRadius: 1,
                          width: `${p.yes_pct}%`,
                          background: "linear-gradient(90deg, #00d2ff50, #00d2ff)"
                        }} />
                      </div>
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: 9,
                        color: "var(--c-accent)", minWidth: 32, textAlign: "right"
                      }}>
                        {p.yes_pct}% Y
                      </span>
                    </div>
                  )}
                  {hasVoted && (
                    <div style={{
                      marginTop: 3, fontFamily: "var(--font-display)",
                      fontSize: 6.5, color: "#00ff9d", letterSpacing: "0.12em"
                    }}>
                      ● VOTED {voted[topic].toUpperCase()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: active poll detail */}
        <div className="panel panel-corner" style={{
          flex: 1, display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div className="panel-hdr">
            <span>ANALYST FORECAST</span>
            <span className="panel-hdr-right">
              {total.toLocaleString()} ANALYSTS VOTED
            </span>
          </div>

          {loading ? (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: 9,
              color: "var(--c-text3)", letterSpacing: "0.3em",
              animation: "livePulse 1.5s infinite"
            }}>
              LOADING FORECASTS...
            </div>
          ) : poll ? (
            <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20, overflow: "auto" }}>

              {/* Question */}
              <div style={{
                fontFamily: "var(--font-body)", fontWeight: 600,
                fontSize: 20, color: "#fff", lineHeight: 1.4,
                letterSpacing: "0.01em"
              }}>
                {poll.question}
              </div>

              {/* Big YES percentage */}
              <div style={{
                padding: "20px 24px",
                background: "rgba(0,210,255,0.04)",
                border: "1px solid rgba(0,210,255,0.12)",
                display: "flex", alignItems: "center", gap: 28
              }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "var(--font-display)", fontWeight: 900,
                    fontSize: 72, color: "var(--c-accent)", lineHeight: 1,
                    textShadow: "0 0 30px rgba(0,210,255,0.4)"
                  }}>
                    {yesPct}
                    <span style={{ fontSize: 32 }}>%</span>
                  </div>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 8,
                    color: "var(--c-text3)", letterSpacing: "0.25em", marginTop: 4
                  }}>
                    PROBABILITY — YES
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  {/* YES bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontFamily: "var(--font-display)", fontSize: 7.5,
                      color: "var(--c-text3)", letterSpacing: "0.15em", marginBottom: 4
                    }}>
                      <span style={{ color: "#00ff9d" }}>YES</span>
                      <span>{poll.yes?.toLocaleString()} votes</span>
                    </div>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${yesPct}%`,
                        background: "linear-gradient(90deg, #00ff9d50, #00ff9d)",
                        transition: "width 1s ease"
                      }} />
                    </div>
                  </div>

                  {/* NO bar */}
                  <div>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontFamily: "var(--font-display)", fontSize: 7.5,
                      color: "var(--c-text3)", letterSpacing: "0.15em", marginBottom: 4
                    }}>
                      <span style={{ color: "#ff2d55" }}>NO</span>
                      <span>{poll.no?.toLocaleString()} votes</span>
                    </div>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${noPct}%`,
                        background: "linear-gradient(90deg, #ff2d5550, #ff2d55)",
                        transition: "width 1s ease"
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Flash message */}
              {flash && (
                <div style={{
                  padding: "8px 16px",
                  background: "rgba(0,255,157,0.06)",
                  border: "1px solid rgba(0,255,157,0.3)",
                  fontFamily: "var(--font-display)", fontSize: 9,
                  color: "#00ff9d", letterSpacing: "0.25em", textAlign: "center"
                }}>
                  ✓ {flash}
                </div>
              )}

              {/* Vote buttons */}
              {!userVote ? (
                <div>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 8,
                    color: "var(--c-text3)", letterSpacing: "0.25em", marginBottom: 12
                  }}>
                    SUBMIT YOUR ASSESSMENT
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => handleVote("yes")} disabled={voting}
                      style={{
                        flex: 1, padding: "14px", cursor: voting ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-display)", fontSize: 10,
                        letterSpacing: "0.25em", border: "1px solid rgba(0,255,157,0.4)",
                        color: "#00ff9d", background: "rgba(0,255,157,0.06)",
                        transition: "all 0.2s", opacity: voting ? 0.5 : 1
                      }}
                      onMouseEnter={e => { if (!voting) (e.target as HTMLElement).style.background = "rgba(0,255,157,0.12)" }}
                      onMouseLeave={e => (e.target as HTMLElement).style.background = "rgba(0,255,157,0.06)"}
                    >
                      ▲ YES — LIKELY
                    </button>
                    <button onClick={() => handleVote("no")} disabled={voting}
                      style={{
                        flex: 1, padding: "14px", cursor: voting ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-display)", fontSize: 10,
                        letterSpacing: "0.25em", border: "1px solid rgba(255,45,85,0.4)",
                        color: "#ff2d55", background: "rgba(255,45,85,0.06)",
                        transition: "all 0.2s", opacity: voting ? 0.5 : 1
                      }}
                      onMouseEnter={e => { if (!voting) (e.target as HTMLElement).style.background = "rgba(255,45,85,0.12)" }}
                      onMouseLeave={e => (e.target as HTMLElement).style.background = "rgba(255,45,85,0.06)"}
                    >
                      ▼ NO — UNLIKELY
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "14px", textAlign: "center",
                  background: "rgba(0,255,157,0.04)",
                  border: "1px solid rgba(0,255,157,0.15)"
                }}>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 9,
                    color: "#00ff9d", letterSpacing: "0.25em"
                  }}>
                    ● ASSESSMENT SUBMITTED — VOTED {userVote.toUpperCase()}
                  </div>
                  <div style={{
                    marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10,
                    color: "var(--c-text3)"
                  }}>
                    Your vote has been added to the intelligence consensus.
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div style={{
                display: "flex", gap: 12, marginTop: "auto"
              }}>
                {[
                  { label: "TOTAL ANALYSTS", value: total.toLocaleString() },
                  { label: "CONSENSUS",      value: yesPct >= 50 ? "LIKELY YES" : "LIKELY NO" },
                  { label: "CONFIDENCE",     value: `${Math.max(yesPct, noPct).toFixed(0)}%` },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, padding: "10px 12px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(0,210,255,0.08)"
                  }}>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 7,
                      color: "var(--c-text3)", letterSpacing: "0.2em", marginBottom: 4
                    }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 16,
                      fontWeight: 700, color: "var(--c-accent)"
                    }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: 9,
              color: "var(--c-text3)", letterSpacing: "0.25em"
            }}>
              SELECT A FORECAST FROM THE LIST
            </div>
          )}
        </div>
      </div>
    </div>
  )
}