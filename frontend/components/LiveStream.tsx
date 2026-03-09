"use client"
// LiveStream.tsx
import { useEffect, useState, useRef } from "react"
import { API, WS } from "@/lib/api"

const SEV_COLOR: Record<string, string> = {
  NEGATIVE: "#ff2d55", NEUTRAL: "rgba(255,255,255,0.3)", POSITIVE: "#00ff9d"
}

const TYPE_TAG: Record<string, string> = {
  NEGATIVE: "tag-mil", NEUTRAL: "tag-dip", POSITIVE: "tag-int"
}

export default function LiveStream() {
  const [events, setEvents] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    let ws: WebSocket
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      if (cancelled) return
      ws = new WebSocket(`${WS}/stream`)
      wsRef.current = ws
      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        if (!cancelled) reconnectTimer = setTimeout(connect, 3000)
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data)
        setEvents(prev => [data, ...prev].slice(0, 12))
      }
    }

    const initTimer = setTimeout(connect, 120)
    return () => {
      cancelled = true
      clearTimeout(initTimer)
      clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [])

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="panel-hdr">
        <span className="live-ring">LIVE PULSE FEED</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className={connected ? "connected-dot" : ""} style={!connected ? { width: 5, height: 5, borderRadius: "50%", background: "#ff2d55", display: "inline-block" } : {}} />
          <span className="panel-hdr-right">{connected ? "CONNECTED" : "RECONNECTING..."}</span>
        </div>
      </div>

      {events.length === 0 && (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.3em",
          color: "rgba(0,210,255,0.3)", animation: "livePulse 1.5s infinite"
        }}>
          AWAITING SIGNAL...
        </div>
      )}

      <div className="scrollable" style={{ flex: 1 }}>
        {events.map((e, i) => {
          const color = SEV_COLOR[e.sentiment_label] || "rgba(255,255,255,0.3)"
          return (
            <div key={`${e.publishedAt}-${i}`} className="event-card"
              style={{ opacity: 1 - i * 0.07 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <div style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0
                }} />
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: 7.5,
                  letterSpacing: "0.2em", color: "var(--c-accent)", padding: "1px 5px",
                  background: "rgba(0,210,255,0.06)", border: "1px solid rgba(0,210,255,0.15)"
                }}>
                  {e.source?.toUpperCase().slice(0, 14) || "UNKNOWN"}
                </span>
                <span style={{
                  marginLeft: "auto", fontSize: 7.5, fontFamily: "var(--font-display)",
                  color, letterSpacing: "0.1em"
                }}>
                  {e.sentiment_label}
                </span>
              </div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: 10.5, fontWeight: 400,
                color: "rgba(200,220,235,0.85)", lineHeight: 1.35,
                letterSpacing: "0.01em"
              }}>
                {e.title}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}