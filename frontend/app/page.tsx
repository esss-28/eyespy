"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Sidebar          from "@/components/Sidebar"
import NewsFeed         from "@/components/NewsFeed"
import MarketTicker     from "@/components/MarketTicker"
import Chatbot          from "@/components/Chatbot"
import NewsletterSignup from "@/components/NewsletterSignup"
import EconomicIndex    from "@/components/EconomicIndex"
import PredictFuture    from "@/components/PredictFuture"

const Globe             = dynamic(() => import("@/components/Globe"),             { ssr: false })
const TimeMachine       = dynamic(() => import("@/components/TimeMachine"),       { ssr: false })
const LiveStream        = dynamic(() => import("@/components/LiveStream"),        { ssr: false })
const PerspectiveToggle = dynamic(() => import("@/components/PerspectiveToggle"), { ssr: false })

// ─────────────────────────────────────────────────
const TABS = [
  { id: "dashboard",    label: "Dashboard",    icon: "○" },
  { id: "perspectives", label: "Perspectives", icon: "◎" },
  { id: "predict",      label: "Predict",      icon: "△" },
  { id: "timemachine",  label: "Time Machine", icon: "◷" },
  { id: "analyst",      label: "AI Analyst",   icon: "◈" },
  { id: "brief",        label: "Intel Brief",  icon: "✉" },
]

const BOOT_LINES = [
  { text: "EYESPY INTELLIGENCE NETWORK v4.2.1",       type: "title" },
  { text: "Initialising neural processing cores",     type: "sys" },
  { text: "XLM-RoBERTa sentiment engine",             type: "ok" },
  { text: "NewsAPI intelligence feeds",               type: "ok" },
  { text: "WebSocket pulse stream",                   type: "ok" },
  { text: "KeyBERT keyword extraction",               type: "ok" },
  { text: "Conflict probability model",               type: "ok" },
  { text: "Groq LLaMA-3.3-70B analyst",              type: "ok" },
  { text: "Economic instability indices",             type: "ok" },
  { text: "Predictive forecast engine",               type: "ok" },
  { text: "APScheduler: 07:00 & 22:00 IST",          type: "ok" },
  { text: "ALL SYSTEMS NOMINAL",                      type: "ready" },
]

// ─────────────────────────────────────────────────
export default function Home() {
  const [booted,   setBooted]   = useState(false)
  const [bootStep, setBootStep] = useState(0)
  const [tab,      setTab]      = useState("dashboard")
  const [time,     setTime]     = useState("")
  const [date,     setDate]     = useState("")

  useEffect(() => {
    if (bootStep < BOOT_LINES.length) {
      const delay = bootStep === 0 ? 200 : 130
      const t = setTimeout(() => setBootStep(s => s + 1), delay)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setBooted(true), 450)
      return () => clearTimeout(t)
    }
  }, [bootStep])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toUTCString().slice(17, 25) + " UTC")
      setDate(now.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }).toUpperCase())
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // ── BOOT ────────────────────────────────────────
  if (!booted) {
    return (
      <div style={{
        height: "100vh", background: "#060a12",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <div className="grid-bg" />

        {/* Outer glow ring */}
        <div style={{
          position: "absolute",
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(41,182,246,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ zIndex: 1, width: 520 }}>
          {/* Big title */}
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 72, letterSpacing: "0.12em",
            color: "#29b6f6",
            textShadow: "0 0 60px rgba(41,182,246,0.4)",
            lineHeight: 1, marginBottom: 6,
          }}>
            EYESPY
          </div>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: 13,
            color: "rgba(41,182,246,0.45)", letterSpacing: "0.35em",
            fontWeight: 500, marginBottom: 36,
          }}>
            GLOBAL INTELLIGENCE PLATFORM
          </div>

          {/* Boot lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {BOOT_LINES.slice(0, bootStep).map((line, i) => (
              <div key={i} className="boot-line"
                style={{
                  animationDelay: `${i * 0.03}s`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                {line.type === "ok" && (
                  <span style={{ color: "rgba(16,185,129,0.6)", fontSize: 10, minWidth: 14 }}>✓</span>
                )}
                {line.type === "sys" && (
                  <span style={{ color: "rgba(41,182,246,0.4)", fontSize: 10, minWidth: 14 }}>›</span>
                )}
                {(line.type === "title" || line.type === "ready") && (
                  <span style={{ minWidth: 14 }}></span>
                )}
                <span style={{
                  color: line.type === "ready" ? "#10b981"
                       : line.type === "title" ? "#29b6f6"
                       : line.type === "ok"    ? "rgba(130,200,220,0.65)"
                       : "rgba(130,200,220,0.45)",
                  fontSize: line.type === "title" ? 13 : 11,
                  fontWeight: line.type === "title" ? 500 : 300,
                  letterSpacing: line.type === "title" ? "0.06em" : "0.04em",
                }}>
                  {line.text}
                  {line.type === "ok" && (
                    <span style={{ color: "rgba(16,185,129,0.5)", marginLeft: 8 }}>— OK</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div style={{ height: 1, background: "rgba(41,182,246,0.08)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(bootStep / BOOT_LINES.length) * 100}%`,
              background: "linear-gradient(90deg, transparent, #29b6f6 80%, #10b981)",
              transition: "width 0.13s ease",
            }} />
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN APP ─────────────────────────────────────
  return (
    <div style={{
      height: "100vh",
      display: "flex", flexDirection: "column",
      background: "var(--c-bg)",
      position: "relative", overflow: "hidden",
    }}>
      <div className="grid-bg" />
      <div className="vignette" />
      <div className="noise" />

      {/* ═══════════ HEADER BAR ══════════════════════ */}
      <div style={{
        height: 44, flexShrink: 0,
        display: "flex", alignItems: "stretch",
        background: "rgba(4, 7, 14, 0.99)",
        borderBottom: "1px solid rgba(41,182,246,0.12)",
        zIndex: 100,
      }}>
        {/* Logo block */}
        <div style={{
          width: 180,
          display: "flex", alignItems: "center",
          padding: "0 20px", gap: 10,
          borderRight: "1px solid rgba(41,182,246,0.09)",
        }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 22, letterSpacing: "0.2em",
            color: "#29b6f6",
            textShadow: "0 0 20px rgba(41,182,246,0.45)",
          }}>
            EYESPY
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 8,
            color: "rgba(41,182,246,0.3)", alignSelf: "flex-end",
            paddingBottom: 3, letterSpacing: "0.1em",
          }}>v4.2</span>
        </div>

        {/* Ticker */}
        <div style={{ flex: 1, overflow: "hidden", borderRight: "1px solid rgba(41,182,246,0.09)" }}>
          <MarketTicker />
        </div>

        {/* Right info */}
        <div style={{
          padding: "0 20px",
          display: "flex", alignItems: "center", gap: 20,
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 12,
              color: "rgba(41,182,246,0.7)", letterSpacing: "0.06em",
              fontVariantNumeric: "tabular-nums",
            }}>{time}</span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: 9,
              color: "var(--c-text3)", letterSpacing: "0.16em",
            }}>{date}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="connected-dot" />
            <span style={{
              fontFamily: "var(--font-body)", fontSize: 9,
              color: "var(--c-green)", letterSpacing: "0.18em", fontWeight: 600,
            }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ═══════════ TAB BAR ════════════════════════ */}
      <div style={{
        height: 36, flexShrink: 0,
        display: "flex", alignItems: "stretch",
        background: "rgba(5, 9, 16, 0.97)",
        borderBottom: "1px solid rgba(41,182,246,0.09)",
        zIndex: 99,
      }}>
        {TABS.map(t => {
          const isActive = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "0 22px",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-ui)",
              fontSize: 12, fontWeight: isActive ? 500 : 400,
              letterSpacing: "0.04em",
              border: "none",
              borderBottom: `2px solid ${isActive ? "#29b6f6" : "transparent"}`,
              color: isActive ? "#e2eaf4" : "rgba(255,255,255,0.3)",
              background: isActive ? "rgba(41,182,246,0.05)" : "transparent",
              cursor: "pointer", transition: "all 0.18s",
              whiteSpace: "nowrap",
            }}>
              <span style={{
                fontSize: 11,
                color: isActive ? "#29b6f6" : "rgba(255,255,255,0.18)",
                transition: "color 0.18s",
              }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />

        {/* Classification */}
        <div style={{
          padding: "0 18px", display: "flex", alignItems: "center",
          borderLeft: "1px solid rgba(41,182,246,0.07)",
        }}>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 600,
            color: "rgba(244,63,94,0.45)", letterSpacing: "0.2em",
            border: "1px solid rgba(244,63,94,0.18)",
            padding: "2px 9px",
          }}>
            CLASSIFICATION: RESTRICTED
          </span>
        </div>
      </div>

      {/* ═══════════ CONTENT AREA ═══════════════════ */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: "272px 1fr 356px",
            gap: 6, padding: 6,
          }}>

            {/* LEFT — Sidebar */}
            <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Sidebar />
            </div>

            {/* CENTRE — Globe full height, it deserves the space */}
            <div className="panel panel-corner" style={{ overflow: "hidden" }}>
              <Globe />
            </div>

            {/* RIGHT — Single unified panel with internal dividers */}
            <div className="panel panel-corner" style={{
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              {/* News feed — takes most of the space */}
              <div style={{
                flex: "1 1 0", minHeight: 0, overflow: "hidden",
                display: "flex", flexDirection: "column",
              }}>
                <NewsFeed />
              </div>

              {/* Divider */}
              <div style={{ height: 1, flexShrink: 0, background: "var(--c-border2)" }} />

              {/* Live stream — compact fixed height */}
              <div style={{ height: 152, flexShrink: 0, overflow: "hidden" }}>
                <LiveStream />
              </div>

              {/* Divider */}
              <div style={{ height: 1, flexShrink: 0, background: "var(--c-border2)" }} />

              {/* Economic index — collapsible, sits at bottom */}
              <div style={{ flexShrink: 0 }}>
                <EconomicIndex />
              </div>
            </div>
          </div>
        )}

        {/* ── PERSPECTIVES ── */}
        {tab === "perspectives" && (
          <div style={{ height: "100%", padding: 6 }}>
            <div className="panel panel-corner" style={{ height: "100%", overflow: "hidden" }}>
              <PerspectiveToggle />
            </div>
          </div>
        )}

        {/* ── PREDICT ── */}
        {tab === "predict" && (
          <div style={{ height: "100%", padding: 6 }}>
            <div className="panel panel-corner" style={{ height: "100%", overflow: "hidden" }}>
              <PredictFuture />
            </div>
          </div>
        )}

        {/* ── TIME MACHINE ── */}
        {tab === "timemachine" && (
          <div style={{ height: "100%", padding: 6 }}>
            <TimeMachine />
          </div>
        )}

        {/* ── AI ANALYST ── */}
        {tab === "analyst" && (
          <div style={{ height: "100%", padding: 6 }}>
            <div className="panel panel-corner" style={{
              height: "100%",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              <Chatbot />
            </div>
          </div>
        )}

        {/* ── INTEL BRIEF ── */}
        {tab === "brief" && (
          <div style={{
            height: "100%", padding: 6,
            display: "flex", justifyContent: "center", alignItems: "flex-start",
          }}>
            <div style={{ width: "100%", maxWidth: 620, marginTop: 28 }}>
              <NewsletterSignup />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ STATUS BAR ═════════════════════ */}
      <div className="status-bar" style={{ zIndex: 100 }}>
        <span className="status-ok">● SYSTEMS NOMINAL</span>
        <span>XLM-RoBERTa</span>
        <span>KeyBERT</span>
        <span>Groq LLaMA-3.3-70B</span>
        <span>Scheduler</span>
        <span>NewsAPI</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: "var(--c-text3)", fontSize: 9 }}>
          EYESPY INTELLIGENCE NETWORK — v4.2.1
        </span>
      </div>
    </div>
  )
}