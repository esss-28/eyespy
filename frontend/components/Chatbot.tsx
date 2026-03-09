"use client"
import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { API, WS } from "@/lib/api"

interface Message { role: "user" | "assistant"; text: string; time: Date }

const SUGGESTED = [
  "What is the current risk level in the Taiwan Strait?",
  "Explain the conflict drivers in the Sahel region",
  "How does the Ukraine war affect European energy markets?",
  "What are the diplomatic options for the Middle East crisis?",
  "Which regions are most likely to escalate in the next 30 days?",
]

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    text: "EYESPY ANALYST ONLINE. I am your AI geopolitical intelligence assistant powered by advanced language models. I analyze global conflicts, diplomatic tensions, economic instability, and geopolitical risk. Submit your query to begin analysis.",
    time: new Date()
  }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [dots, setDots] = useState(".")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400)
    return () => clearInterval(t)
  }, [loading])

  const send = async (q?: string) => {
    const text = (q || input).trim()
    if (!text || loading) return
    setInput("")
    const userMsg: Message = { role: "user", text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const r = await axios.post(`${API}/chat?question=${encodeURIComponent(text)}`)
      setMessages(prev => [...prev, { role: "assistant", text: r.data.answer, time: new Date() }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "[SIGNAL LOST — Backend connection failed. Ensure server is running on port 8000.]",
        time: new Date()
      }])
    }
    setLoading(false)
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  const fmt = (d: Date) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      padding: 12, gap: 10, overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.3em",
        color: "var(--c-accent)", borderBottom: "1px solid rgba(0,210,255,0.1)",
        paddingBottom: 8
      }}>
        <span className="live-ring">AI GEOPOLITICAL ANALYST</span>
        <span style={{ color: "var(--c-text3)" }}>POWERED BY GROQ · LLAMA-3.3-70B</span>
      </div>

      {/* Suggested queries */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        {SUGGESTED.map((q, i) => (
          <button key={i} onClick={() => send(q)} className="btn-intel"
            style={{ fontSize: 7.5, padding: "4px 10px" }}>
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="panel" style={{
        flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        {/* Terminal header */}
        <div style={{
          padding: "5px 12px",
          borderBottom: "1px solid rgba(0,210,255,0.08)",
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(0,0,0,0.3)"
        }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["#ff5f57","#febc2e","#28c840"].map(c => (
              <div key={c} style={{ width: 7, height: 7, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 7.5,
            color: "rgba(0,210,255,0.4)", letterSpacing: "0.3em"
          }}>
            SECURE INTELLIGENCE TERMINAL — SESSION ALPHA-7
          </span>
        </div>

        <div className="scrollable" style={{ flex: 1, padding: "12px 0" }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              flexDirection: m.role === "user" ? "row-reverse" : "row",
              gap: 10, padding: "0 12px 12px"
            }}>
              {/* Avatar */}
              <div style={{
                flexShrink: 0, marginTop: 2,
                fontFamily: "var(--font-display)", fontSize: 7.5,
                letterSpacing: "0.15em", padding: "4px 8px",
                height: "fit-content",
                border: "1px solid",
                borderColor: m.role === "assistant" ? "rgba(0,210,255,0.3)" : "rgba(0,255,157,0.25)",
                color: m.role === "assistant" ? "var(--c-accent)" : "var(--c-accent2)",
                background: m.role === "assistant" ? "rgba(0,210,255,0.05)" : "rgba(0,255,157,0.04)"
              }}>
                {m.role === "assistant" ? "EYESPY" : "YOU"}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 4 }}>
                <div className={m.role === "assistant" ? "chat-bubble-ai" : "chat-bubble-user"}>
                  <div style={{
                    fontFamily: m.role === "assistant" ? "var(--font-body)" : "var(--font-mono)",
                    fontSize: m.role === "assistant" ? 12 : 11,
                    fontWeight: m.role === "assistant" ? 400 : 400,
                    color: m.role === "assistant" ? "rgba(200,220,235,0.9)" : "rgba(180,220,200,0.9)",
                    lineHeight: 1.6, letterSpacing: "0.01em"
                  }}>
                    {m.text}
                  </div>
                </div>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 7,
                  color: "var(--c-text3)", letterSpacing: "0.15em",
                  textAlign: m.role === "user" ? "right" : "left"
                }}>
                  {fmt(m.time)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: "flex", gap: 10, padding: "0 12px 12px" }}>
              <div style={{
                flexShrink: 0, fontFamily: "var(--font-display)", fontSize: 7.5,
                padding: "4px 8px", border: "1px solid rgba(0,210,255,0.3)",
                color: "var(--c-accent)", background: "rgba(0,210,255,0.05)"
              }}>
                EYESPY
              </div>
              <div className="chat-bubble-ai" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  display: "flex", gap: 3, alignItems: "center"
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "var(--c-accent)",
                      animation: `livePulse 1s ease ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: 8,
                  color: "rgba(0,210,255,0.5)", letterSpacing: "0.2em",
                  animation: "livePulse 1.5s infinite"
                }}>
                  ANALYZING INTELLIGENCE{dots}
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Input bar */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontFamily: "var(--font-display)", fontSize: 9, color: "rgba(0,210,255,0.4)",
            pointerEvents: "none", letterSpacing: "0.15em"
          }}>
            ▶
          </span>
          <input
            className="input-intel"
            style={{ paddingLeft: 28 }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="QUERY INTELLIGENCE DATABASE..."
          />
        </div>
        <button className="btn-intel" onClick={() => send()} disabled={loading || !input.trim()}
          style={{ padding: "0 20px", whiteSpace: "nowrap" }}>
          TRANSMIT
        </button>
      </div>
    </div>
  )
}