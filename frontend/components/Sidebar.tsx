"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"

const HOTSPOTS = [
  { id: "ukraine",    name: "Ukraine",        region: "E. EUROPE",   lat: 49,  lng: 31,
    radar: [{s:"MILITARY",v:95},{s:"ECONOMIC",v:78},{s:"POLITICAL",v:88},{s:"SOCIAL",v:72},{s:"DIPLOMATIC",v:45}],
    inputs: [0.78, 0.85, 0.90] as [number,number,number] },
  { id: "taiwan",     name: "Taiwan Strait",  region: "E. ASIA",     lat: 23,  lng: 121,
    radar: [{s:"MILITARY",v:80},{s:"ECONOMIC",v:90},{s:"POLITICAL",v:75},{s:"SOCIAL",v:55},{s:"DIPLOMATIC",v:40}],
    inputs: [0.62, 0.70, 0.65] as [number,number,number] },
  { id: "middleeast", name: "Gaza / M.East",  region: "MIDDLE EAST", lat: 31,  lng: 34,
    radar: [{s:"MILITARY",v:88},{s:"ECONOMIC",v:60},{s:"POLITICAL",v:70},{s:"SOCIAL",v:85},{s:"DIPLOMATIC",v:30}],
    inputs: [0.71, 0.68, 0.80] as [number,number,number] },
  { id: "sahel",      name: "Sahel Region",   region: "W. AFRICA",   lat: 15,  lng: 2,
    radar: [{s:"MILITARY",v:70},{s:"ECONOMIC",v:55},{s:"POLITICAL",v:65},{s:"SOCIAL",v:78},{s:"DIPLOMATIC",v:50}],
    inputs: [0.58, 0.55, 0.62] as [number,number,number] },
  { id: "myanmar",    name: "Myanmar",        region: "SE. ASIA",    lat: 19,  lng: 96,
    radar: [{s:"MILITARY",v:75},{s:"ECONOMIC",v:50},{s:"POLITICAL",v:60},{s:"SOCIAL",v:80},{s:"DIPLOMATIC",v:35}],
    inputs: [0.50, 0.48, 0.56] as [number,number,number] },
]

export default function Sidebar() {
  const [selected, setSelected] = useState(HOTSPOTS[0])
  const [conflicts, setConflicts] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchAll = async () => {
      const res: Record<string, any> = {}
      for (const h of HOTSPOTS) {
        try {
          const r = await axios.post(
            `http://localhost:8000/conflict?sentiment=${h.inputs[0]}&volatility=${h.inputs[1]}&military_events=${h.inputs[2]}`
          )
          res[h.id] = r.data
        } catch { res[h.id] = { conflict_probability: 0.5, risk_level: "UNKNOWN" } }
      }
      setConflicts(res)
    }
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [])

  const riskColor = (p: number) =>
    p >= 0.85 ? "#ff2d55" : p >= 0.70 ? "#ff6d00" : p >= 0.50 ? "#ffb300" : "#00ff9d"

  const sel = conflicts[selected.id]
  const selProb = sel?.conflict_probability ?? 0.5
  const selColor = riskColor(selProb)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, overflow: "hidden", height: "100%", minHeight: 0 }}>

      {/* ── HOTSPOT LIST ── */}
      <div className="panel panel-corner" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <div className="panel-hdr">
          <span className="live-ring">ACTIVE THREAT ZONES</span>
          <span className="panel-hdr-right">{HOTSPOTS.length} MONITORED</span>
        </div>
        <div className="scrollable" style={{ flex: 1 }}>
          {HOTSPOTS.map(h => {
            const c = conflicts[h.id]
            const prob = c?.conflict_probability ?? 0.5
            const color = riskColor(prob)
            const isActive = selected.id === h.id
            return (
              <div key={h.id}
                className={`hotspot-row ${isActive ? "active" : ""}`}
                onClick={() => setSelected(h)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-body)", fontWeight: 600,
                      fontSize: 12, color: isActive ? "#fff" : "var(--c-text)",
                      letterSpacing: "0.05em", lineHeight: 1.2
                    }}>
                      {h.name}
                    </div>
                    <div style={{
                      fontSize: 8, color: "var(--c-text3)", letterSpacing: "0.2em",
                      marginTop: 1, fontFamily: "var(--font-display)"
                    }}>
                      {h.region}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 7.5,
                      padding: "2px 7px", letterSpacing: "0.15em",
                      background: `${color}12`, border: `1px solid ${color}40`,
                      color: color, lineHeight: 1.6
                    }}>
                      {c?.risk_level ?? "···"}
                    </div>
                  </div>
                </div>
                {/* Risk bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="risk-bar" style={{ flex: 1 }}>
                    <div className="risk-bar-fill" style={{
                      width: `${prob * 100}%`,
                      background: `linear-gradient(90deg, ${color}60, ${color})`
                    }} />
                  </div>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: 13,
                    fontWeight: 700, color, minWidth: 28, textAlign: "right",
                    textShadow: `0 0 8px ${color}80`
                  }}>
                    {Math.round(prob * 100)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── THREAT VECTOR RADAR ── */}
      <div className="panel panel-corner" style={{ flexShrink: 0 }}>
        <div className="panel-hdr">
          <span>THREAT VECTOR ANALYSIS</span>
          <span className="panel-hdr-right">{selected.name.toUpperCase()}</span>
        </div>
        <div style={{ padding: "6px 8px 8px" }}>
          {/* Risk score display */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14, marginBottom: 6,
            padding: "6px 10px",
            background: `${selColor}08`,
            border: `1px solid ${selColor}20`
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 32,
                fontWeight: 900, color: selColor, lineHeight: 1,
                textShadow: `0 0 20px ${selColor}60`
              }}>
                {Math.round(selProb * 100)}
              </div>
              <div style={{ fontSize: 7, color: "var(--c-text3)", letterSpacing: "0.2em", fontFamily: "var(--font-display)" }}>
                CONFLICT PROB
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 8,
                color: selColor, letterSpacing: "0.2em", marginBottom: 4
              }}>
                {sel?.risk_level ?? "···"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {["MILITARY", "ECONOMIC", "POLITICAL"].map(label => {
                  const v = selected.radar.find(r => r.s === label)?.v ?? 50
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 7, color: "var(--c-text3)", fontFamily: "var(--font-display)", letterSpacing: "0.1em", minWidth: 56 }}>{label}</span>
                      <div className="risk-bar" style={{ flex: 1 }}>
                        <div className="risk-bar-fill" style={{ width: `${v}%`, background: selColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Radar chart */}
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={selected.radar} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <PolarGrid stroke="rgba(0,210,255,0.1)" />
                <PolarAngleAxis dataKey="s" tick={{
                  fill: "rgba(255,255,255,0.3)", fontSize: 7,
                  fontFamily: "'Orbitron', monospace", letterSpacing: 1
                }} />
                <Radar dataKey="v"
                  stroke={selColor} fill={selColor} fillOpacity={0.1}
                  strokeWidth={1.5}
                  dot={{ fill: selColor, r: 2 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}