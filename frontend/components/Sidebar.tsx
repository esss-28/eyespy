"use client"
import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import TrendingKeywords from "./TrendingKeywords"
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"

const HOTSPOTS = [
  { id: "ukraine",    name: "Ukraine",         region: "E. EUROPE",
    radar: [{s:"MILITARY",v:95},{s:"ECONOMIC",v:78},{s:"POLITICAL",v:88},{s:"SOCIAL",v:72},{s:"DIPLOMATIC",v:45}] },
  { id: "middleeast", name: "Gaza / M.East",   region: "MIDDLE EAST",
    radar: [{s:"MILITARY",v:88},{s:"ECONOMIC",v:60},{s:"POLITICAL",v:70},{s:"SOCIAL",v:85},{s:"DIPLOMATIC",v:30}] },
  { id: "taiwan",     name: "Taiwan Strait",   region: "E. ASIA",
    radar: [{s:"MILITARY",v:80},{s:"ECONOMIC",v:90},{s:"POLITICAL",v:75},{s:"SOCIAL",v:55},{s:"DIPLOMATIC",v:40}] },
  { id: "korea",      name: "Korean Peninsula",region: "E. ASIA",
    radar: [{s:"MILITARY",v:78},{s:"ECONOMIC",v:45},{s:"POLITICAL",v:72},{s:"SOCIAL",v:50},{s:"DIPLOMATIC",v:25}] },
  { id: "kashmir",    name: "Kashmir",         region: "S. ASIA",
    radar: [{s:"MILITARY",v:68},{s:"ECONOMIC",v:50},{s:"POLITICAL",v:74},{s:"SOCIAL",v:65},{s:"DIPLOMATIC",v:35}] },
  { id: "sahel",      name: "Sahel Region",    region: "W. AFRICA",
    radar: [{s:"MILITARY",v:70},{s:"ECONOMIC",v:55},{s:"POLITICAL",v:65},{s:"SOCIAL",v:78},{s:"DIPLOMATIC",v:50}] },
  { id: "myanmar",    name: "Myanmar",         region: "SE. ASIA",
    radar: [{s:"MILITARY",v:75},{s:"ECONOMIC",v:50},{s:"POLITICAL",v:60},{s:"SOCIAL",v:80},{s:"DIPLOMATIC",v:35}] },
]

const FALLBACK_INPUTS: Record<string, [number,number,number]> = {
  ukraine:    [0.78, 0.85, 0.90],
  middleeast: [0.71, 0.68, 0.80],
  taiwan:     [0.62, 0.70, 0.65],
  korea:      [0.65, 0.68, 0.72],
  kashmir:    [0.60, 0.62, 0.60],
  sahel:      [0.58, 0.55, 0.62],
  myanmar:    [0.50, 0.48, 0.56],
}

export default function Sidebar() {
  const [selected,   setSelected]   = useState(HOTSPOTS[0])
  const [conflicts,  setConflicts]  = useState<Record<string, any>>({})
  const [lastUpdate, setLastUpdate] = useState("")
  const [isLive,     setIsLive]     = useState(false)

  const fetchThreats = useCallback(async () => {
    try {
      const r = await axios.get("http://localhost:8000/live-threats")
      setConflicts(r.data.threats)
      setLastUpdate(new Date().toUTCString().slice(17, 22) + "Z")
      setIsLive(true)
    } catch {
      setIsLive(false)
      const res: Record<string, any> = {}
      for (const h of HOTSPOTS) {
        const inp = FALLBACK_INPUTS[h.id] || [0.5, 0.5, 0.5]
        try {
          const r2 = await axios.post(
            `http://localhost:8000/conflict?sentiment=${inp[0]}&volatility=${inp[1]}&military_events=${inp[2]}`
          )
          res[h.id] = r2.data
        } catch {
          res[h.id] = { conflict_probability: inp[0] * 0.85, risk_level: "ELEVATED" }
        }
      }
      setConflicts(res)
      setLastUpdate(new Date().toUTCString().slice(17, 22) + "Z")
    }
  }, [])

  useEffect(() => {
    fetchThreats()
    const t = setInterval(fetchThreats, 120_000)
    return () => clearInterval(t)
  }, [fetchThreats])

  const riskColor = (p: number) =>
    p >= 0.85 ? "#ef4444" : p >= 0.70 ? "#f59e0b" : p >= 0.50 ? "#ea580c" : "#22c55e"

  const sel      = conflicts[selected.id]
  const selProb  = sel?.conflict_probability ?? 0.5
  const selColor = riskColor(selProb)

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      height: "100%", minHeight: 0, overflow: "hidden"
    }}>

      {/* ── ACTIVE THREAT ZONES ── */}
      <div className="panel panel-corner" style={{
        flex: "1 1 180px", minHeight: 180,
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
        <div className="panel-hdr">
          <span className="live-ring">ACTIVE THREAT ZONES</span>
          <span className="panel-hdr-right" style={{ display:"flex", alignItems:"center", gap:6 }}>
            {isLive && (
              <span style={{ fontFamily:"var(--font-display)", fontSize:6.5, color:"#22c55e", letterSpacing:"0.15em" }}>
                ● LIVE
              </span>
            )}
            {HOTSPOTS.length} MONITORED
          </span>
        </div>

        <div className="scrollable" style={{ flex: 1 }}>
          {HOTSPOTS.map(h => {
            const c       = conflicts[h.id]
            const prob    = c?.conflict_probability ?? 0
            const color   = riskColor(prob)
            const isActive = selected.id === h.id
            return (
              <div key={h.id}
                className={`hotspot-row ${isActive ? "active" : ""}`}
                onClick={() => setSelected(h)}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
                  <div>
                    <div style={{
                      fontFamily:"var(--font-body)", fontWeight:600, fontSize:12,
                      color: isActive ? "#fff" : "var(--c-text)", letterSpacing:"0.04em"
                    }}>
                      {h.name}
                    </div>
                    <div style={{
                      fontSize:7.5, color:"var(--c-text3)", letterSpacing:"0.2em",
                      marginTop:1, fontFamily:"var(--font-display)"
                    }}>
                      {h.region}
                      {c?.live && <span style={{ color:"#22c55e", marginLeft:4 }}>· LIVE</span>}
                    </div>
                  </div>
                  <div style={{
                    fontFamily:"var(--font-display)", fontSize:7.5,
                    padding:"2px 7px", letterSpacing:"0.12em",
                    background:`${color}12`, border:`1px solid ${color}40`,
                    color, lineHeight:1.6
                  }}>
                    {prob > 0 ? c?.risk_level : "···"}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div className="risk-bar" style={{ flex:1 }}>
                    <div className="risk-bar-fill" style={{
                      width:`${prob * 100}%`,
                      background:`linear-gradient(90deg, ${color}50, ${color})`
                    }} />
                  </div>
                  <span style={{
                    fontFamily:"var(--font-display)", fontSize:13, fontWeight:700,
                    color, minWidth:28, textAlign:"right",
                    textShadow:`0 0 8px ${color}70`
                  }}>
                    {prob > 0 ? Math.round(prob * 100) : "··"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {lastUpdate && (
          <div style={{
            padding:"3px 12px", borderTop:"1px solid rgba(220,38,38,0.06)",
            fontFamily:"var(--font-display)", fontSize:6.5,
            color:"var(--c-text3)", letterSpacing:"0.12em",
            display:"flex", justifyContent:"space-between", alignItems:"center"
          }}>
            <span>UPDATED {lastUpdate}</span>
            <span onClick={fetchThreats}
              style={{ cursor:"pointer", color:"var(--c-accent)", opacity:0.7 }}>
              ↻
            </span>
          </div>
        )}
      </div>

      {/* ── SCROLLABLE BOTTOM ── */}
      <div className="scrollable" style={{
        flexShrink:0, maxHeight:"56%", overflowY:"auto",
        display:"flex", flexDirection:"column", gap:6
      }}>

        {/* THREAT VECTOR RADAR */}
        <div className="panel panel-corner" style={{ flexShrink:0 }}>
          <div className="panel-hdr">
            <span>THREAT VECTOR ANALYSIS</span>
            <span className="panel-hdr-right">{selected.name.toUpperCase()}</span>
          </div>
          <div style={{ padding:"6px 8px 8px" }}>
            <div style={{
              display:"flex", alignItems:"center", gap:14, marginBottom:6,
              padding:"6px 10px",
              background:`${selColor}08`, border:`1px solid ${selColor}20`
            }}>
              <div>
                <div style={{
                  fontFamily:"var(--font-display)", fontSize:32,
                  fontWeight:900, color:selColor, lineHeight:1,
                  textShadow:`0 0 20px ${selColor}60`
                }}>
                  {Math.round(selProb * 100)}
                </div>
                <div style={{ fontSize:7, color:"var(--c-text3)", letterSpacing:"0.2em", fontFamily:"var(--font-display)" }}>
                  CONFLICT PROB
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:8, color:selColor, letterSpacing:"0.2em", marginBottom:4 }}>
                  {sel?.risk_level ?? "···"}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {["MILITARY","ECONOMIC","POLITICAL"].map(label => {
                    const v = selected.radar.find(r => r.s === label)?.v ?? 50
                    return (
                      <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:7, color:"var(--c-text3)", fontFamily:"var(--font-display)", letterSpacing:"0.1em", minWidth:56 }}>
                          {label}
                        </span>
                        <div className="risk-bar" style={{ flex:1 }}>
                          <div className="risk-bar-fill" style={{ width:`${v}%`, background:selColor }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                {sel?.articles_analysed > 0 && (
                  <div style={{ marginTop:5, fontFamily:"var(--font-display)", fontSize:6.5, color:"#22c55e", letterSpacing:"0.12em" }}>
                    ● {sel.articles_analysed} ARTICLES ANALYSED LIVE
                  </div>
                )}
              </div>
            </div>
            <div style={{ height:140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={selected.radar} margin={{ top:8, right:16, bottom:8, left:16 }}>
                  <PolarGrid stroke="rgba(220,38,38,0.1)" />
                  <PolarAngleAxis dataKey="s" tick={{
                    fill:"rgba(255,255,255,0.3)", fontSize:7,
                    fontFamily:"'Orbitron', monospace", letterSpacing:1
                  }} />
                  <Radar dataKey="v"
                    stroke={selColor} fill={selColor} fillOpacity={0.12}
                    strokeWidth={1.5} dot={{ fill:selColor, r:2 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TRENDING KEYWORDS */}
        <TrendingKeywords />

      </div>
    </div>
  )
}