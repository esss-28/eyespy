"use client"

import { useEffect, useState } from "react"
import Globe from "../components/Globe"
import LiveStream from "../components/LiveStream"
import ConflictChart from "../components/ConflictChart"
import NewsFeed from "../components/NewsFeed"
import Sidebar from "../components/Sidebar"
import Chatbot from "../components/Chatbot"
import MarketTicker from "../components/MarketTicker"
import TimeMachine from "../components/TimeMachine"
import NewsletterSignup from "../components/NewsletterSignup"
import PerspectiveToggle from "../components/PerspectiveToggle"

const BOOT_LINES = [
  { text: "INITIALIZING EYESPY INTELLIGENCE NETWORK v4.2.1", delay: 0 },
  { text: "ESTABLISHING ENCRYPTED SIGNAL CHANNELS [AES-256]...", delay: 320 },
  { text: "LOADING GEOPOLITICAL RISK MODELS [XLM-ROBERTA / LSTM]...", delay: 640 },
  { text: "CONNECTING TO NEWSAPI · GDELT · RSS FEEDS [247 SOURCES]...", delay: 960 },
  { text: "CALIBRATING SENTIMENT ANALYSIS ENGINES...", delay: 1280 },
  { text: "SYNCING MARKET DATA FEEDS [NYSE · LSE · CME]...", delay: 1600 },
  { text: "ACTIVATING REAL-TIME WEBSOCKET STREAMS...", delay: 1920 },
  { text: "ALL SYSTEMS NOMINAL — CLEARANCE LEVEL: ALPHA", delay: 2200 },
]

type Tab = "dashboard" | "perspectives" | "history" | "chat" | "brief"

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard",    label: "DASHBOARD"     },
  { id: "perspectives", label: "PERSPECTIVES"  },
  { id: "history",      label: "TIME MACHINE"  },
  { id: "chat",         label: "AI ANALYST"    },
  { id: "brief",        label: "◈ INTEL BRIEF" },
]

export default function Home() {
  const [activeTab, setActiveTab]   = useState<Tab>("dashboard")
  const [time, setTime]             = useState(new Date())
  const [booted, setBooted]         = useState(false)
  const [visibleLines, setVisible]  = useState(0)
  const [bootDone, setBootDone]     = useState(false)

  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => setVisible(i + 1), line.delay)
    })
    setTimeout(() => setBootDone(true), 2600)
    setTimeout(() => setBooted(true), 3000)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => String(n).padStart(2, "0")
  const utcTime = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`
  const utcDate = time.toUTCString().slice(0, 16).toUpperCase()

  if (!booted) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#030608",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 4, fontFamily: "'Share Tech Mono', monospace"
      }}>
        <div className="grid-bg" />
        <div className="vignette" />
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 900,
            fontSize: 52, letterSpacing: "0.3em", color: "#fff",
            textShadow: "0 0 40px rgba(0,210,255,0.6), 0 0 80px rgba(0,210,255,0.2)"
          }}>EYESPY</div>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 10,
            letterSpacing: "0.5em", color: "rgba(0,210,255,0.6)", marginTop: 4
          }}>GLOBAL INTELLIGENCE PLATFORM</div>
        </div>
        <div style={{ width: 540, display: "flex", flexDirection: "column", gap: 6 }}>
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className="boot-line" style={{
              color: i === visibleLines - 1 ? "#00d2ff" : "rgba(0,210,255,0.3)",
              display: "flex", alignItems: "center", gap: 10
            }}>
              <span style={{ color: i === visibleLines - 1 ? "#00d2ff" : "rgba(0,255,157,0.4)" }}>
                {i === visibleLines - 1 ? "▶" : "✓"}
              </span>
              {line.text}
              {i === visibleLines - 1 && !bootDone && (
                <span style={{ animation: "livePulse 0.6s infinite" }}>_</span>
              )}
            </div>
          ))}
        </div>
        {bootDone && (
          <div style={{
            marginTop: 28, fontFamily: "'Orbitron', monospace",
            fontSize: 10, letterSpacing: "0.4em",
            color: "#00ff9d", textShadow: "0 0 20px rgba(0,255,157,0.8)",
            animation: "livePulse 1s ease infinite"
          }}>
            ◈ INTELLIGENCE NETWORK ONLINE ◈
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      height: "100vh", width: "100vw", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "var(--c-bg)", fontFamily: "var(--font-mono)"
    }}>
      <div className="grid-bg" />
      <div className="vignette" />
      <div className="noise" />

      {/* ── HEADER ── */}
      <header style={{
        height: 46, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
        background: "rgba(0,0,0,0.88)",
        borderBottom: "1px solid rgba(0,210,255,0.15)",
        position: "relative", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 26 26">
              <circle cx="13" cy="13" r="12" fill="none" stroke="#00d2ff" strokeWidth="1" />
              <circle cx="13" cy="13" r="7"  fill="none" stroke="rgba(0,210,255,0.4)" strokeWidth="0.8" />
              <circle cx="13" cy="13" r="2.5" fill="#00d2ff" />
              <line x1="13" y1="1"    x2="13" y2="4.5"  stroke="#00d2ff" strokeWidth="1.5" />
              <line x1="13" y1="21.5" x2="13" y2="25"   stroke="#00d2ff" strokeWidth="1.5" />
              <line x1="1"  y1="13"   x2="4.5"  y2="13" stroke="#00d2ff" strokeWidth="1.5" />
              <line x1="21.5" y1="13" x2="25" y2="13"   stroke="#00d2ff" strokeWidth="1.5" />
            </svg>
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 900,
                fontSize: 15, letterSpacing: "0.4em", color: "#fff", lineHeight: 1,
                textShadow: "0 0 20px rgba(0,210,255,0.5)"
              }}>EYESPY</div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 7,
                letterSpacing: "0.3em", color: "rgba(0,210,255,0.5)"
              }}>INTELLIGENCE PLATFORM</div>
            </div>
          </div>

          <div style={{ width: 1, height: 26, background: "rgba(0,210,255,0.15)" }} />

          {/* Tabs */}
          <nav style={{ display: "flex", gap: 2 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: "var(--font-display)", fontSize: 8,
                  letterSpacing: "0.2em", padding: "5px 12px",
                  border: "1px solid",
                  borderColor: activeTab === tab.id
                    ? tab.id === "brief"
                      ? "rgba(0,255,157,0.5)"
                      : "rgba(0,210,255,0.5)"
                    : "transparent",
                  color: activeTab === tab.id
                    ? tab.id === "brief" ? "#00ff9d" : "#00d2ff"
                    : "rgba(255,255,255,0.28)",
                  background: activeTab === tab.id
                    ? tab.id === "brief" ? "rgba(0,255,157,0.07)" : "rgba(0,210,255,0.07)"
                    : "transparent",
                  textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
                }}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: status + clock */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "CRITICAL", n: 2, color: "var(--c-red)"    },
              { label: "HIGH",     n: 3, color: "var(--c-orange)"  },
              { label: "ELEVATED", n: 5, color: "var(--c-amber)"   },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, fontFamily: "var(--font-display)" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <span style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 700 }}>{s.n}</span>
              </div>
            ))}
          </div>
          <div style={{ width: 1, height: 22, background: "rgba(0,210,255,0.12)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 16, letterSpacing: "0.15em",
              color: "#00d2ff", textShadow: "0 0 16px rgba(0,210,255,0.6)"
            }}>{utcTime} UTC</div>
            <div style={{
              fontSize: 8, color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.12em", fontFamily: "var(--font-display)"
            }}>{utcDate}</div>
          </div>
          <div className="connected-dot" />
        </div>
      </header>

      {/* ── MARKET TICKER ── */}
      <MarketTicker />

      {/* ── CONTENT ── */}
      <main style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>

        {activeTab === "dashboard" && (
          <div style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: "280px 1fr 300px",
            gap: 6, padding: 6,
          }}>
            <Sidebar />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, overflow: "hidden", minHeight: 0 }}>
              <Globe />
              <ConflictChart />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, overflow: "hidden", minHeight: 0 }}>
              <LiveStream />
              <NewsFeed />
            </div>
          </div>
        )}

        {activeTab === "perspectives" && <PerspectiveToggle />}
        {activeTab === "history"      && <TimeMachine />}
        {activeTab === "chat"         && <Chatbot />}
        {activeTab === "brief"        && <NewsletterSignup />}

      </main>

      {/* ── STATUS BAR ── */}
      <footer className="status-bar">
        <span>◈ EYESPY v4.2.1</span>
        <span className="status-ok">◈ ALL SYSTEMS NOMINAL</span>
        <span>◈ SOURCES: 247 ACTIVE</span>
        <span>◈ MODELS: ONLINE</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 24 }}>
          <span className="status-warn">◈ THREAT LEVEL: ELEVATED</span>
          <span>◈ CLASSIFICATION: RESTRICTED</span>
          <span>◈ SESSION: ALPHA-7</span>
        </div>
      </footer>
    </div>
  )
}