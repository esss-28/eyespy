"use client"
import React, { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { API, WS } from "@/lib/api"
import axios from "axios"

// Dynamically import the globe to prevent Next.js Server-Side Rendering errors
const GlobeGL = dynamic(() => import("react-globe.gl"), { ssr: false })

const HOTSPOTS = [
  { name: "Ukraine",     lat: 49,   lng: 32,   id: "ukraine"    },
  { name: "Taiwan",      lat: 23.5, lng: 121,  id: "taiwan"     },
  { name: "Gaza",        lat: 31.5, lng: 34.5, id: "middleeast" },
  { name: "Sahel",       lat: 15,   lng: 2,    id: "sahel"      },
  { name: "Myanmar",     lat: 19,   lng: 96,   id: "myanmar"    },
  { name: "Kashmir",     lat: 34,   lng: 74,   id: "kashmir"    },
  { name: "Korea",       lat: 37,   lng: 127,  id: "korea"      },
]

export default function Globe() {
  const globeRef = useRef<any>(null)
  const [countries, setCountries] = useState({ features: [] })
  const [threats, setThreats] = useState<Record<string, any>>({})
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<any>(null) // NEW: State for country hover
  const [isLive, setIsLive] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch real-world GeoJSON borders (High-res official borders)
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then(res => res.json())
      .then(setCountries)
  }, [])

  // Auto-resize the globe canvas to fit your panel
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      })
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Setup Three.js controls (Auto-rotate and Camera Size)
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls()
      controls.autoRotate = true
      
      // 1. SLOW DOWN ROTATION: Changed from 0.8 to 0.3
      controls.autoRotateSpeed = 0.9 
      controls.enableZoom = false 
      
      // 2. INCREASE GLOBE SIZE: Bring the camera closer. 
      // Lower numbers = bigger globe. Default is ~2.5. 
      globeRef.current.pointOfView({ altitude: 1.7 }, 0) 
    }
  }, [countries]) // Re-run when globe mounts
  // Pull threat data
  const fetchThreats = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/live-threats`)
      setThreats(r.data.threats || {})
      setIsLive(true)
    } catch {
      setIsLive(false)
      setThreats({
        ukraine:    { conflict_probability: 0.87, risk_level: "CRITICAL"  },
        taiwan:     { conflict_probability: 0.71, risk_level: "HIGH"      },
        middleeast: { conflict_probability: 0.84, risk_level: "CRITICAL"  },
        sahel:      { conflict_probability: 0.58, risk_level: "ELEVATED"  },
        myanmar:    { conflict_probability: 0.52, risk_level: "ELEVATED"  },
        kashmir:    { conflict_probability: 0.60, risk_level: "ELEVATED"  },
        korea:      { conflict_probability: 0.65, risk_level: "HIGH"      },
      })
    }
  }, [])

  useEffect(() => {
    fetchThreats()
    const t = setInterval(fetchThreats, 120_000)
    return () => clearInterval(t)
  }, [fetchThreats])

  const riskColor = (id: string) => {
    const p = threats[id]?.conflict_probability ?? 0.5
    if (p >= 0.85) return "#f43f5e"
    if (p >= 0.70) return "#fb923c"
    if (p >= 0.50) return "#fbbf24"
    return "#10b981"
  }

  return (
    <div className="panel panel-corner" style={{ height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="scanline" />
      <div className="panel-hdr">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-ring">GLOBAL THREAT TOPOLOGY</span>
          {isLive && <span style={{ fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 600, color: "var(--c-green)", letterSpacing: "0.15em" }}>● LIVE</span>}
        </span>
        <span className="panel-hdr-right">DRAG TO ROTATE · {HOTSPOTS.length} ZONES</span>
      </div>

      <div ref={containerRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, cursor: "grab" }}>
        <GlobeGL
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg" // Dark mode earth
          
          // Country Borders setup
          polygonsData={countries.features}
          polygonAltitude={(d) => d === hoveredCountry ? 0.06 : 0.01} // Pop up slightly on hover
          polygonCapColor={(d) => d === hoveredCountry ? "rgba(41,182,246, 0.4)" : "rgba(29,82,140, 0.14)"} // Highlight on hover
          polygonSideColor={(d) => d === hoveredCountry ? "rgba(41,182,246, 0.4)" : "rgba(29,82,140, 0.14)"}
          polygonStrokeColor={() => "rgba(41,182,246, 0.3)"}
          onPolygonHover={setHoveredCountry} // Set hover state
          
          // NEW: Country tooltip label
          polygonLabel={(d: any) => `
            <div style="background: rgba(3,8,18,0.95); border: 1px solid rgba(41,182,246,0.5); padding: 6px 10px; border-radius: 4px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; color: #e2eaf4; letter-spacing: 1px; box-shadow: 0 0 10px rgba(41,182,246,0.2);">
              ${d.properties.ADMIN || d.properties.NAME || 'UNKNOWN TERRITORY'}
            </div>
          `}
          
          // Glowing rings for hotspots
          ringsData={HOTSPOTS}
          ringColor={(d: any) => riskColor(d.id)}
          ringMaxRadius={5}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1000}
          
          // Custom HTML overlays for your threat tooltips
          htmlElementsData={HOTSPOTS}
          htmlElement={(d: any) => {
            const el = document.createElement("div");
            el.innerHTML = `
              <div style="width: 12px; height: 12px; background: ${riskColor(d.id)}; border-radius: 50%; box-shadow: 0 0 10px ${riskColor(d.id)}; cursor: pointer;"></div>
            `;
            
            el.onmouseenter = () => setHoveredId(d.id);
            el.onmouseleave = () => setHoveredId(null);
            
            if (hoveredId === d.id) {
              const pct = Math.round((threats[d.id]?.conflict_probability ?? 0.5) * 100);
              const lbl = threats[d.id]?.risk_level ?? "ELEVATED";
              const lw = d.name.length * 6.8 + 56;
              el.innerHTML += `
                <div style="position: absolute; left: 20px; top: -10px; width: ${lw}px; padding: 6px; background: rgba(3,8,18,0.95); border: 1px solid ${riskColor(d.id)}; border-radius: 4px; pointer-events: none;">
                  <div style="font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 600; color: rgba(200,220,235,0.8); letter-spacing: 1px;">
                    ${d.name.toUpperCase()}
                  </div>
                  <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: ${riskColor(d.id)}; margin-top: 2px;">
                    ${pct}% · ${lbl}
                  </div>
                </div>
              `;
            }
            return el;
          }}
        />
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 10, left: 14,
        display: "flex", gap: 14, pointerEvents: "none",
        fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 600, letterSpacing: "0.14em",
      }}>
        {[["CRITICAL", "#f43f5e"], ["HIGH", "#fb923c"], ["ELEVATED", "#fbbf24"], ["MODERATE", "#10b981"]].map(([l, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}80` }} />
            <span style={{ color: "rgba(255,255,255,0.28)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}