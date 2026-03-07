"use client"
import React, { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"

const HOTSPOTS = [
  { name: "Ukraine",     lat: 49,  lng: 31,  id: "ukraine"    },
  { name: "Taiwan",      lat: 23,  lng: 121, id: "taiwan"     },
  { name: "Gaza",        lat: 31,  lng: 34,  id: "middleeast" },
  { name: "Sahel",       lat: 15,  lng: 2,   id: "sahel"      },
  { name: "Myanmar",     lat: 19,  lng: 96,  id: "myanmar"    },
  { name: "Venezuela",   lat: 8,   lng: -66, id: "venezuela"  },
]

const CONFLICT_INPUTS: Record<string, [number, number, number]> = {
  ukraine:   [0.78, 0.85, 0.90],
  taiwan:    [0.62, 0.70, 0.65],
  middleeast:[0.71, 0.68, 0.80],
  sahel:     [0.58, 0.55, 0.62],
  myanmar:   [0.50, 0.48, 0.56],
  venezuela: [0.38, 0.42, 0.35],
}

export default function Globe() {
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [rotStart, setRotStart] = useState(0)
  const [conflicts, setConflicts] = useState<Record<string, number>>({})
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [radarAngle, setRadarAngle] = useState(0)
  const animRef = useRef<number>(0)
  const radarRef = useRef<number>(0)
  const lastT = useRef(0)

  useEffect(() => {
    const fetchConflicts = async () => {
      const res: Record<string, number> = {}
      for (const [id, [s, v, m]] of Object.entries(CONFLICT_INPUTS)) {
        try {
          const r = await axios.post(
            `http://localhost:8000/conflict?sentiment=${s}&volatility=${v}&military_events=${m}`
          )
          res[id] = r.data.conflict_probability
        } catch { res[id] = 0.5 }
      }
      setConflicts(res)
    }
    fetchConflicts()
  }, [])

  useEffect(() => {
    if (dragging) { cancelAnimationFrame(animRef.current); lastT.current = 0; return }
    const animate = (t: number) => {
      if (lastT.current) setRotation(r => (r + (t - lastT.current) * 0.012) % 360)
      lastT.current = t
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [dragging])

  useEffect(() => {
    const animRadar = (t: number) => {
      setRadarAngle(a => (a + 0.8) % 360)
      radarRef.current = requestAnimationFrame(animRadar)
    }
    radarRef.current = requestAnimationFrame(animRadar)
    return () => cancelAnimationFrame(radarRef.current)
  }, [])

  const project = (lat: number, lng: number) => {
    const adj = ((lng + rotation) % 360 + 360) % 360
    const x = 200 + 160 * Math.cos(lat * Math.PI / 180) * Math.sin(adj * Math.PI / 180)
    const y = 200 - 160 * Math.sin(lat * Math.PI / 180)
    const cosLng = Math.cos(adj * Math.PI / 180)
    return { x, y, visible: cosLng > -0.15, depth: cosLng }
  }

  const getRiskColor = (id: string) => {
    const p = conflicts[id] ?? 0.5
    if (p >= 0.85) return "#ff2d55"
    if (p >= 0.70) return "#ff6d00"
    if (p >= 0.50) return "#ffb300"
    return "#00ff9d"
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setRotation(((rotStart - (e.clientX - dragX) * 0.25) % 360 + 360) % 360)
  }, [dragging, dragX, rotStart])

  // Grid lines
  const gridLines: React.ReactElement[] = []
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: string[] = []
    for (let lng = 0; lng <= 360; lng += 4) {
      const p = project(lat, lng - 180)
      if (p.visible) pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }
    if (pts.length > 3) gridLines.push(
      <polyline key={`la${lat}`} points={pts.join(" ")}
        fill="none" stroke="rgba(0,210,255,0.06)" strokeWidth="0.5" />
    )
  }
  for (let lng = -180; lng <= 180; lng += 30) {
    const pts: string[] = []
    for (let lat = -80; lat <= 80; lat += 4) {
      const p = project(lat, lng)
      if (p.visible) pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }
    if (pts.length > 3) gridLines.push(
      <polyline key={`ln${lng}`} points={pts.join(" ")}
        fill="none" stroke="rgba(0,210,255,0.06)" strokeWidth="0.5" />
    )
  }

  // Radar sweep geometry
  const radarRad = radarAngle * Math.PI / 180
  const rx2 = 200 + 162 * Math.cos(radarRad - Math.PI / 2)
  const ry2 = 200 + 162 * Math.sin(radarRad - Math.PI / 2)
  const rx3 = 200 + 162 * Math.cos(radarRad - Math.PI / 2 - 0.5)
  const ry3 = 200 + 162 * Math.sin(radarRad - Math.PI / 2 - 0.5)

  return (
    <div className="panel panel-corner" style={{ height: 370, position: "relative", overflow: "hidden" }}>
      <div className="scanline" />
      <div className="panel-hdr">
        <span className="live-ring">GLOBAL THREAT TOPOLOGY</span>
        <span className="panel-hdr-right">DRAG TO ROTATE · {HOTSPOTS.length} ACTIVE ZONES</span>
      </div>

      <div style={{
        height: "calc(100% - 30px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 8px 8px",
      }}>
        <svg
          viewBox="0 0 400 400"
          style={{ width: "100%", height: "100%", cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={e => { setDragging(true); setDragX(e.clientX); setRotStart(rotation); lastT.current = 0 }}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
        >
          <defs>
            <radialGradient id="globeCore" cx="38%" cy="38%">
              <stop offset="0%" stopColor="#0a1c2e" />
              <stop offset="45%" stopColor="#050e1a" />
              <stop offset="100%" stopColor="#020810" />
            </radialGradient>
            <radialGradient id="globeAtmo" cx="50%" cy="50%">
              <stop offset="65%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,180,255,0.12)" />
            </radialGradient>
            <radialGradient id="globeSpec" cx="30%" cy="28%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="radarGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(0,210,255,0)" />
              <stop offset="100%" stopColor="rgba(0,210,255,0.07)" />
            </radialGradient>
            <clipPath id="sphereClip"><circle cx="200" cy="200" r="162" /></clipPath>
            <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="atmosphereBlur">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Outer atmosphere */}
          <circle cx="200" cy="200" r="178" fill="rgba(0,80,140,0.04)" filter="url(#atmosphereBlur)" />
          <circle cx="200" cy="200" r="174" fill="none" stroke="rgba(0,210,255,0.06)" strokeWidth="10" />
          <circle cx="200" cy="200" r="170" fill="none" stroke="rgba(0,210,255,0.12)" strokeWidth="4" />
          <circle cx="200" cy="200" r="167" fill="none" stroke="rgba(0,210,255,0.08)" strokeWidth="1.5" />

          {/* Globe body */}
          <circle cx="200" cy="200" r="162" fill="url(#globeCore)" />

          {/* Grid clipped */}
          <g clipPath="url(#sphereClip)">{gridLines}</g>

          {/* Radar sweep (clipped to sphere) */}
          <g clipPath="url(#sphereClip)">
            <path
              d={`M 200 200 L ${rx2.toFixed(1)} ${ry2.toFixed(1)} A 162 162 0 0 0 ${rx3.toFixed(1)} ${ry3.toFixed(1)} Z`}
              fill="rgba(0,210,255,0.04)"
            />
            <line
              x1="200" y1="200" x2={rx2.toFixed(1)} y2={ry2.toFixed(1)}
              stroke="rgba(0,210,255,0.25)" strokeWidth="0.8"
            />
            {/* Radar rings */}
            <circle cx="200" cy="200" r="54"  fill="none" stroke="rgba(0,210,255,0.06)" strokeWidth="0.5" strokeDasharray="2 4" />
            <circle cx="200" cy="200" r="108" fill="none" stroke="rgba(0,210,255,0.06)" strokeWidth="0.5" strokeDasharray="2 4" />
          </g>

          {/* Atmosphere + specular */}
          <circle cx="200" cy="200" r="162" fill="url(#globeAtmo)" />
          <circle cx="200" cy="200" r="162" fill="url(#globeSpec)" />

          {/* Hotspot markers */}
          {HOTSPOTS.map(h => {
            const p = project(h.lat, h.lng)
            if (!p.visible) return null
            const color = getRiskColor(h.id)
            const scale = 0.55 + p.depth * 0.45
            const r = 7 * scale
            const isHovered = hoveredId === h.id
            return (
              <g key={h.id}
                onMouseEnter={() => setHoveredId(h.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: "pointer" }}
                filter="url(#dotGlow)"
              >
                {/* Outer pulse */}
                <circle cx={p.x} cy={p.y} r={r}>
                  <animate attributeName="r" values={`${r};${r * 2.8};${r}`} dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="fill" values={color} dur="2.5s" repeatCount="indefinite" />
                </circle>
                {/* Middle ring */}
                <circle cx={p.x} cy={p.y} r={r * 1.5}
                  fill="none" stroke={color} strokeWidth="0.8" opacity={0.3 + p.depth * 0.4}
                />
                {/* Core dot */}
                <circle cx={p.x} cy={p.y} r={r * 0.5}
                  fill={color} opacity={0.9 * (0.4 + p.depth * 0.6)}
                />
                {/* Hovered label */}
                {isHovered && (
                  <g>
                    <rect x={p.x + r + 4} y={p.y - 9} width={h.name.length * 6 + 12} height={18}
                      fill="rgba(3,6,8,0.9)" stroke={color} strokeWidth="0.5" />
                    <text x={p.x + r + 10} y={p.y + 3.5}
                      fill={color} fontSize="9" fontFamily="'Share Tech Mono', monospace"
                      letterSpacing="1"
                    >
                      {h.name.toUpperCase()}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Globe border */}
          <circle cx="200" cy="200" r="162" fill="none" stroke="rgba(0,210,255,0.2)" strokeWidth="1" />
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 10, left: 12,
        display: "flex", gap: 12, fontSize: 8,
        fontFamily: "var(--font-display)", letterSpacing: "0.15em"
      }}>
        {[
          { l: "CRITICAL", c: "#ff2d55" },
          { l: "HIGH", c: "#ff6d00" },
          { l: "ELEVATED", c: "#ffb300" },
          { l: "MODERATE", c: "#00ff9d" },
        ].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: x.c, boxShadow: `0 0 5px ${x.c}` }} />
            <span style={{ color: "rgba(255,255,255,0.3)" }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}