"use client"
import { useEffect, useState } from "react"
import { API, WS } from "@/lib/api"
import axios from "axios"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts"

const REGIONS = [
  { key: "ukraine",    label: "UKRAINE",     color: "#ff2d55" },
  { key: "taiwan",     label: "TAIWAN",      color: "#ff6d00" },
  { key: "middleeast", label: "M. EAST",     color: "#ffb300" },
  { key: "sahel",      label: "SAHEL",       color: "#00d2ff" },
]

export default function ConflictChart() {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    axios.get(`${API}/history`).then(r => {
      const grouped: Record<string, any> = {}
      r.data.events.forEach((e: any) => {
        const month = e.date.slice(0, 7)
        if (!grouped[month]) grouped[month] = { date: month }
        const region = e.region.toLowerCase().replace(/[\s/]/g, "").replace("middleeast","middleeast")
        grouped[month][region] = Math.round(e.probability * 100)
      })
      setHistory(Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)))
    }).catch(() => {})
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: "rgba(3,6,8,0.96)", border: "1px solid rgba(0,210,255,0.3)",
        padding: "8px 12px", fontFamily: "var(--font-display)", fontSize: 9
      }}>
        <div style={{ color: "var(--c-accent)", letterSpacing: "0.2em", marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 2 }}>
            <div style={{ width: 14, height: 1, background: p.color }} />
            <span style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>{p.name}</span>
            <span style={{ color: p.color, marginLeft: "auto", letterSpacing: "0.1em" }}>{p.value}%</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="panel panel-corner" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <div className="panel-hdr">
        <span>CONFLICT PROBABILITY TRENDS</span>
        <span className="panel-hdr-right">HISTORICAL · 30-DAY PROJECTION</span>
      </div>
      <div style={{ flex: 1, padding: "6px 4px 2px", minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 4, right: 12, bottom: 0, left: -22 }}>
            <defs>
              {REGIONS.map(r => (
                <linearGradient key={r.key} id={`cg_${r.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={r.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={r.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="rgba(0,210,255,0.04)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "'Orbitron',monospace" }}
              axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "'Orbitron',monospace" }}
              axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {REGIONS.map(r => (
              <Area key={r.key} type="monotone" dataKey={r.key} name={r.label}
                stroke={r.color} fill={`url(#cg_${r.key})`}
                strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: r.color }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, padding: "4px 12px 8px", justifyContent: "center" }}>
        {REGIONS.map(r => (
          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 18, height: 1.5, background: r.color, borderRadius: 1 }} />
            <span style={{
              fontFamily: "var(--font-display)", fontSize: 7.5,
              color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em"
            }}>
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}