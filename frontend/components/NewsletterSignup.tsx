"use client"
import { useState } from "react"
import axios from "axios"

type Step = "idle" | "loading" | "success" | "error"

export default function NewsletterSignup() {
  const [email, setEmail]       = useState("")
  const [codename, setCodename] = useState("")
  const [step, setStep]         = useState<Step>("idle")
  const [result, setResult]     = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const enroll = async () => {
    if (!email.trim()) return
    setStep("loading")
    try {
      const r = await axios.post("http://localhost:8000/newsletter/signup", {
        email: email.trim(),
        codename: codename.trim() || "",
      })
      setResult(r.data)
      setStep("success")
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail || "Enrollment failed. Check backend connection.")
      setStep("error")
    }
  }

  // ── SUCCESS STATE ──────────────────────────────────────────────────────────
  if (step === "success" && result) {
    return (
      <div style={{
        height: "100%", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24,
      }}>
        <div style={{
          maxWidth: 520, width: "100%",
          border: "1px solid rgba(0,255,157,0.3)",
          background: "rgba(0,255,157,0.03)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Top bar */}
          <div style={{ height: 2, background: "linear-gradient(90deg,#00d2ff,#00ff9d)" }} />

          {/* Glitch header */}
          <div style={{ padding: "28px 32px 0" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 8,
              letterSpacing: "0.4em", color: "rgba(0,255,157,0.6)", marginBottom: 12
            }}>
              ◈ ENROLLMENT CONFIRMED · TRANSMISSION SECURE
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: 26, letterSpacing: "0.2em", color: "#fff",
              textShadow: "0 0 30px rgba(0,255,157,0.5)", lineHeight: 1.2
            }}>
              WELCOME TO THE<br />
              <span style={{ color: "#00ff9d" }}>NETWORK</span>
            </div>
          </div>

          {/* Agent credentials */}
          <div style={{ padding: "20px 32px" }}>
            <div style={{
              background: "#000d1a",
              border: "1px solid rgba(0,255,157,0.2)",
              padding: "16px 20px",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
              marginBottom: 20,
            }}>
              {[
                { label: "CODENAME", value: result.codename, color: "#00ff9d" },
                { label: "AGENT ID", value: result.agent_id, color: "#00d2ff" },
              ].map(f => (
                <div key={f.label}>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 7.5,
                    color: "rgba(0,210,255,0.4)", letterSpacing: "0.25em", marginBottom: 5
                  }}>
                    {f.label}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 17,
                    fontWeight: 700, color: f.color, letterSpacing: "0.15em",
                    textShadow: `0 0 12px ${f.color}60`
                  }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              fontFamily: "var(--font-body)", fontSize: 12.5,
              color: "rgba(200,220,235,0.8)", lineHeight: 1.8,
              letterSpacing: "0.02em", marginBottom: 20
            }}>
              Your onboarding briefing has been dispatched to{" "}
              <span style={{ color: "#00d2ff" }}>{email}</span>.
              Check your inbox — you have been assigned a mission.
            </div>

            <div style={{
              padding: "10px 14px",
              background: "rgba(255,179,0,0.05)",
              border: "1px solid rgba(255,179,0,0.2)",
              borderLeft: "2px solid #ffb300",
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "rgba(255,179,0,0.7)", lineHeight: 1.6
            }}>
              ⚠ Daily briefings will arrive at 07:00 IST and 22:00 IST.
              Check spam folder if you don't see the onboarding email.
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(0,255,157,0.3),transparent)" }} />
        </div>
      </div>
    )
  }

  // ── FORM STATE ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: "100%", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <div style={{ maxWidth: 560, width: "100%" }}>

        {/* Title block */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 8,
            letterSpacing: "0.4em", color: "rgba(0,210,255,0.5)",
            marginBottom: 10
          }}>
            ◈ CLASSIFIED INTELLIGENCE SERVICE
          </div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: 28, letterSpacing: "0.15em", color: "#fff",
            lineHeight: 1.25, marginBottom: 12,
            textShadow: "0 0 40px rgba(0,210,255,0.3)"
          }}>
            ENROLL AS AN<br />
            <span style={{ color: "#00d2ff" }}>EYESPY AGENT</span>
          </div>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: 13,
            color: "rgba(180,210,225,0.6)", lineHeight: 1.7,
            letterSpacing: "0.02em", maxWidth: 440
          }}>
            Receive classified intelligence briefings at <span style={{ color: "#00d2ff" }}>07:00</span> and{" "}
            <span style={{ color: "#00d2ff" }}>22:00 IST</span> daily.
            Real-time conflict assessments, market impact analysis, and AI-generated
            geopolitical forecasts — delivered to your inbox.
          </div>
        </div>

        {/* What you get */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 8, marginBottom: 28
        }}>
          {[
            { icon: "◈", label: "Morning Brief", desc: "07:00 IST — overnight developments" },
            { icon: "◈", label: "Evening Summary", desc: "22:00 IST — day's top intelligence" },
            { icon: "◈", label: "Agent Onboarding", desc: "Spy-themed mission briefing on signup" },
            { icon: "◈", label: "Market Correlations", desc: "Geopolitics → market impact scores" },
          ].map(f => (
            <div key={f.label} style={{
              padding: "10px 12px",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(0,210,255,0.1)"
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#00d2ff", fontSize: 9, marginTop: 1 }}>{f.icon}</span>
                <div>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 8.5,
                    color: "#00d2ff", letterSpacing: "0.15em", marginBottom: 3
                  }}>
                    {f.label.toUpperCase()}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 9.5,
                    color: "rgba(180,210,225,0.5)", lineHeight: 1.4
                  }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="panel" style={{ padding: 24 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 8,
            letterSpacing: "0.3em", color: "rgba(0,210,255,0.5)",
            marginBottom: 18
          }}>
            ▶ AGENT ENROLLMENT FORM
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Email */}
            <div>
              <label style={{
                display: "block", fontFamily: "var(--font-display)", fontSize: 7.5,
                color: "rgba(0,210,255,0.5)", letterSpacing: "0.25em",
                marginBottom: 6, textTransform: "uppercase"
              }}>
                Secure Email Address *
              </label>
              <input
                className="input-intel"
                type="email"
                placeholder="agent@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && enroll()}
              />
            </div>

            {/* Codename */}
            <div>
              <label style={{
                display: "block", fontFamily: "var(--font-display)", fontSize: 7.5,
                color: "rgba(0,210,255,0.5)", letterSpacing: "0.25em",
                marginBottom: 6, textTransform: "uppercase"
              }}>
                Choose Your Codename{" "}
                <span style={{ color: "rgba(0,210,255,0.3)", fontSize: 7 }}>
                  (optional — auto-assigned if blank)
                </span>
              </label>
              <input
                className="input-intel"
                type="text"
                placeholder="NIGHTHAWK · IRONCLAD · CIPHER · ..."
                value={codename}
                onChange={e => setCodename(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && enroll()}
                maxLength={20}
              />
            </div>

            {/* Error */}
            {step === "error" && (
              <div style={{
                padding: "10px 14px",
                background: "rgba(255,45,85,0.06)",
                border: "1px solid rgba(255,45,85,0.3)",
                fontFamily: "var(--font-mono)", fontSize: 10,
                color: "#ff2d55"
              }}>
                ✕ {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              className="btn-intel"
              onClick={enroll}
              disabled={step === "loading" || !email.trim()}
              style={{
                padding: "14px 24px", fontSize: 9,
                width: "100%", marginTop: 4,
                borderColor: "rgba(0,255,157,0.4)",
                color: step === "loading" ? "rgba(0,255,157,0.4)" : "#00ff9d",
                background: "rgba(0,255,157,0.05)",
              }}
            >
              {step === "loading"
                ? "◈ ENROLLING AGENT..."
                : "◈ ACTIVATE INTELLIGENCE FEED"}
            </button>
          </div>

          <div style={{
            marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 9,
            color: "rgba(90,122,144,0.6)", lineHeight: 1.6
          }}>
            Your identity is protected under EyeSpy operational security protocols.
            No data is shared with third parties. Unsubscribe at any time.
          </div>
        </div>
      </div>
    </div>
  )
}