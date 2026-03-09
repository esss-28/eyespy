"use client"
import { API, WS } from "@/lib/api"
import { useEffect, useState } from "react"
import axios from "axios"

const LABELS: Record<string, string> = {
  sp500: "S&P 500", nasdaq: "NASDAQ", gold: "GOLD",
  oil: "BRENT", vix: "VIX", dowjones: "DOW"
}

export default function MarketTicker() {
  const [markets, setMarkets] = useState<Record<string, any>>({})

  useEffect(() => {
    const load = () =>
      axios.get(`${API}/markets`).then(r => setMarkets(r.data)).catch(() => {})
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const items = Object.entries(markets)
  if (items.length === 0) return (
    <div style={{
      height: 24, flexShrink: 0, background: "rgba(0,0,0,0.7)",
      borderTop: "1px solid rgba(0,210,255,0.08)",
      borderBottom: "1px solid rgba(0,210,255,0.08)",
      display: "flex", alignItems: "center", padding: "0 16px",
      fontFamily: "var(--font-display)", fontSize: 7.5, letterSpacing: "0.2em",
      color: "rgba(0,210,255,0.25)"
    }}>
      ▶ CONNECTING TO MARKET FEEDS...
    </div>
  )

  return (
    <div style={{
      height: 24, flexShrink: 0, overflow: "hidden",
      background: "rgba(0,0,0,0.7)",
      borderTop: "1px solid rgba(0,210,255,0.08)",
      borderBottom: "1px solid rgba(0,210,255,0.08)",
      display: "flex", alignItems: "center"
    }}>
      {/* Prefix label */}
      <div style={{
        padding: "0 10px", height: "100%",
        display: "flex", alignItems: "center",
        borderRight: "1px solid rgba(0,210,255,0.12)",
        background: "rgba(0,210,255,0.05)",
        fontFamily: "var(--font-display)", fontSize: 7, letterSpacing: "0.25em",
        color: "var(--c-accent)", flexShrink: 0, whiteSpace: "nowrap"
      }}>
        MKTS
      </div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div className="animate-marquee" style={{
          display: "flex", gap: 40, whiteSpace: "nowrap",
          fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.12em",
          alignItems: "center"
        }}>
          {[...items, ...items].map(([key, val], i) => {
            const up = val?.direction === "up"
            const color = up ? "#00ff9d" : "#ff2d55"
            return (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>{LABELS[key] || key}</span>
                <span style={{ color: "rgba(255,255,255,0.8)" }}>
                  {typeof val?.price === "number" ? val.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                </span>
                <span style={{ color, textShadow: `0 0 8px ${color}60` }}>
                  {up ? "▲" : "▼"} {Math.abs(val?.change_pct ?? 0).toFixed(2)}%
                </span>
                <span style={{ color: "rgba(0,210,255,0.15)", fontSize: 8 }}>|</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}