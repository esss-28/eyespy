"""
email_service.py  —  EyeSpy Newsletter & Briefing System
Place in: backend/services/email_service.py
"""

import os
import json
from datetime import datetime, timezone
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, To, From, Subject, HtmlContent

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")   # ← paste your free SendGrid key
FROM_EMAIL       = os.getenv("SENDGRID_FROM_EMAIL") # ← your verified sender email
FROM_NAME        = "EyeSpy Intelligence Network"

sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)

# ─── IN-MEMORY SUBSCRIBER STORE ──────────────────────────────────────────────
# For production use a real DB; for the competition this is fine.
_subscribers: list[dict] = []

def add_subscriber(email: str, codename: str) -> dict:
    """Register a new agent and send onboarding briefing immediately."""
    # Prevent duplicates
    for s in _subscribers:
        if s["email"] == email:
            return {"status": "already_registered", "codename": s["codename"]}

    agent_number = f"A{len(_subscribers) + 1:04d}"
    record = {
        "email": email,
        "codename": codename or f"AGENT-{agent_number}",
        "agent_id": agent_number,
        "enrolled_at": datetime.now(timezone.utc).isoformat(),
    }
    _subscribers.append(record)

    # Fire onboarding email immediately
    send_onboarding(record)
    return {"status": "enrolled", "agent_id": agent_number, "codename": record["codename"]}


def get_subscribers() -> list[dict]:
    return _subscribers


# ─── ONBOARDING EMAIL ─────────────────────────────────────────────────────────

def send_onboarding(agent: dict):
    """Spy-themed MI6/EyeSpy onboarding letter sent on signup."""
    now_utc = datetime.now(timezone.utc)
    timestamp = now_utc.strftime("%d %B %Y · %H:%M UTC")
    codename  = agent["codename"].upper()
    agent_id  = agent["agent_id"]

    html = _build_onboarding_html(codename, agent_id, timestamp)

    message = Mail(
        from_email=(FROM_EMAIL, FROM_NAME),
        to_emails=agent["email"],
        subject=f"[EYES ONLY] Welcome to EyeSpy, {codename} — Your Mission Briefing",
        html_content=html,
    )
    try:
        sg.send(message)
        print(f"[EMAIL] Onboarding sent → {agent['email']}")
    except Exception as e:
        print(f"[EMAIL ERROR] Onboarding failed: {e}")


# ─── DAILY BRIEFING EMAIL ─────────────────────────────────────────────────────

def send_daily_briefing(articles: list[dict], markets: dict, session: str = "MORNING"):
    """Send the daily intelligence briefing to all subscribers."""
    now_utc   = datetime.now(timezone.utc)
    timestamp = now_utc.strftime("%d %B %Y · %H:%M UTC")

    html = _build_briefing_html(articles, markets, timestamp, session)

    for agent in _subscribers:
        message = Mail(
            from_email=(FROM_EMAIL, FROM_NAME),
            to_emails=agent["email"],
            subject=f"[CLASSIFIED] EyeSpy {session} Briefing — {now_utc.strftime('%d %b %Y')}",
            html_content=html,
        )
        try:
            sg.send(message)
            print(f"[EMAIL] Briefing sent → {agent['email']}")
        except Exception as e:
            print(f"[EMAIL ERROR] Briefing to {agent['email']} failed: {e}")


# ─── ONBOARDING HTML TEMPLATE ─────────────────────────────────────────────────

def _build_onboarding_html(codename: str, agent_id: str, timestamp: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EyeSpy Agent Onboarding</title>
</head>
<body style="margin:0;padding:0;background:#030608;font-family:'Courier New',Courier,monospace;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#030608;min-height:100vh;">
<tr><td align="center" style="padding:40px 20px;">

<!-- Card -->
<table width="620" cellpadding="0" cellspacing="0" style="background:#06101a;border:1px solid #00d2ff30;max-width:620px;width:100%;">

  <!-- Top accent bar -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#00d2ff,#00ff9d,#00d2ff);"></td></tr>

  <!-- Header -->
  <tr><td style="padding:36px 40px 24px;border-bottom:1px solid #00d2ff15;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <!-- EyeSpy logo text -->
          <div style="font-size:28px;font-weight:700;letter-spacing:0.4em;color:#ffffff;line-height:1;">EYESPY</div>
          <div style="font-size:9px;letter-spacing:0.4em;color:#00d2ff80;margin-top:3px;">GLOBAL INTELLIGENCE PLATFORM</div>
        </td>
        <td align="right" valign="top">
          <div style="font-size:9px;color:#00d2ff60;letter-spacing:0.2em;">CLASSIFICATION</div>
          <div style="font-size:11px;color:#ff2d55;letter-spacing:0.3em;font-weight:700;margin-top:2px;">EYES ONLY</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Redacted stamp area -->
  <tr><td style="padding:0 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #00d2ff;margin:24px 0 0;background:#00d2ff08;">
      <tr><td style="padding:12px 16px;">
        <div style="font-size:8px;color:#00d2ff70;letter-spacing:0.3em;margin-bottom:4px;">TRANSMISSION TIMESTAMP</div>
        <div style="font-size:11px;color:#00d2ff;letter-spacing:0.15em;">{timestamp}</div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Agent ID block -->
  <tr><td style="padding:20px 40px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000d1a;border:1px solid #00d2ff20;">
      <tr>
        <td style="padding:16px 20px;border-right:1px solid #00d2ff15;" width="50%">
          <div style="font-size:8px;color:#00d2ff50;letter-spacing:0.25em;margin-bottom:6px;">AGENT CODENAME</div>
          <div style="font-size:18px;color:#00ff9d;letter-spacing:0.2em;font-weight:700;text-shadow:0 0 12px #00ff9d60;">{codename}</div>
        </td>
        <td style="padding:16px 20px;" width="50%">
          <div style="font-size:8px;color:#00d2ff50;letter-spacing:0.25em;margin-bottom:6px;">AGENT ID</div>
          <div style="font-size:18px;color:#00d2ff;letter-spacing:0.2em;font-weight:700;">{agent_id}</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Main letter -->
  <tr><td style="padding:28px 40px 0;">
    <div style="font-size:11px;color:#00d2ff;letter-spacing:0.3em;margin-bottom:20px;">▶ MISSION ASSIGNMENT BRIEF</div>

    <p style="font-size:13px;color:#c8dce8;line-height:1.9;margin:0 0 16px;letter-spacing:0.03em;">
      Agent <span style="color:#00ff9d;font-weight:700;">{codename}</span>,
    </p>

    <p style="font-size:13px;color:#c8dce8;line-height:1.9;margin:0 0 16px;letter-spacing:0.03em;">
      Your enrollment in the <span style="color:#00d2ff;">EyeSpy Global Intelligence Network</span> has been confirmed 
      and processed at the highest clearance level. Welcome to the network.
    </p>

    <p style="font-size:13px;color:#c8dce8;line-height:1.9;margin:0 0 16px;letter-spacing:0.03em;">
      The world is in flux. Seventeen active conflict zones. Four nuclear-armed states in active 
      diplomatic confrontation. Three resource wars disguised as civil unrest. Markets responding 
      to events that official channels won't acknowledge for another 48 hours.
    </p>

    <p style="font-size:13px;color:#c8dce8;line-height:1.9;margin:0 0 16px;letter-spacing:0.03em;">
      Your mission is clear: <span style="color:#ffb300;font-weight:600;">monitor, analyse, and anticipate.</span>
    </p>

    <!-- Mission parameters box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000d1a;border:1px solid #ffb30030;margin:20px 0;">
      <tr><td style="padding:4px 16px;background:#ffb30015;border-bottom:1px solid #ffb30020;">
        <span style="font-size:8px;color:#ffb300;letter-spacing:0.3em;">MISSION PARAMETERS</span>
      </td></tr>
      <tr><td style="padding:16px;">
        {''.join([f'<div style="display:flex;align-items:flex-start;margin-bottom:10px;"><span style="color:#00d2ff;margin-right:12px;font-size:11px;">◈</span><span style="font-size:12px;color:#c8dce8;line-height:1.6;letter-spacing:0.02em;">{item}</span></div>' for item in [
            "Monitor real-time conflict probability scores across 17 active hotspots",
            "Analyse multi-source sentiment divergence to detect narrative manipulation",
            "Track economic instability indices correlated with geopolitical flashpoints",
            "Access AI-generated assessments from the EyeSpy Analyst Engine",
            "Review historical event data via the Time Machine retrospective module",
        ]])}
      </td></tr>
    </table>

    <p style="font-size:13px;color:#c8dce8;line-height:1.9;margin:0 0 16px;letter-spacing:0.03em;">
      Twice daily, at <span style="color:#00d2ff;">07:00 IST</span> and <span style="color:#00d2ff;">22:00 IST</span>, 
      you will receive an encrypted intelligence briefing summarising overnight developments, 
      updated conflict probability forecasts, and priority items requiring your attention.
    </p>

    <p style="font-size:13px;color:#c8dce8;line-height:1.9;margin:0 0 24px;letter-spacing:0.03em;">
      The platform is live. The feeds are active. The world is not waiting.
    </p>

    <p style="font-size:13px;color:#c8dce8;line-height:1.9;margin:0 0 8px;letter-spacing:0.03em;">
      Good luck, Agent <span style="color:#00ff9d;">{codename}</span>.
    </p>
    <p style="font-size:12px;color:#5a7a90;line-height:1.9;margin:0 0 28px;letter-spacing:0.08em;">
      — The EyeSpy Directorate
    </p>
  </td></tr>

  <!-- Access button -->
  <tr><td style="padding:0 40px 32px;" align="center">
    <table cellpadding="0" cellspacing="0">
      <tr><td style="background:#00d2ff15;border:1px solid #00d2ff50;padding:0;">
        <a href="http://localhost:3000" style="display:block;padding:14px 40px;color:#00d2ff;text-decoration:none;font-size:10px;letter-spacing:0.4em;font-weight:700;">
          ▶ ACCESS INTELLIGENCE PLATFORM
        </a>
      </td></tr>
    </table>
  </td></tr>

  <!-- Redaction footer -->
  <tr><td style="padding:0 40px 32px;">
    <div style="border-top:1px solid #00d2ff15;padding-top:20px;">
      <p style="font-size:9px;color:#2a4a5a;line-height:1.8;margin:0;letter-spacing:0.05em;">
        This communication is classified and intended solely for Agent {agent_id} ({codename}). 
        Unauthorised disclosure is a violation of the Official Secrets Act 1989. 
        This message will be automatically purged from EyeSpy servers in 72 hours. 
        EyeSpy Intelligence Network · Automated Briefing System v4.2.1 · 
        All intelligence assessments are AI-generated and should be cross-referenced with primary sources.
      </p>
    </div>
  </td></tr>

  <!-- Bottom accent bar -->
  <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#00d2ff40,transparent);"></td></tr>

</table>
<!-- End card -->

</td></tr>
</table>

</body>
</html>"""


# ─── DAILY BRIEFING HTML TEMPLATE ────────────────────────────────────────────

def _build_briefing_html(articles: list, markets: dict, timestamp: str, session: str) -> str:
    session_label = "MORNING INTELLIGENCE BRIEF" if session == "MORNING" else "EVENING INTELLIGENCE SUMMARY"
    session_color = "#ffb300" if session == "MORNING" else "#00d2ff"

    # Top 5 articles
    top_articles = articles[:5] if articles else []

    def sentiment_color(score):
        if score < -0.5: return "#ff2d55"
        if score < 0:    return "#ff6d00"
        if score > 0.3:  return "#00ff9d"
        return "#5a7a90"

    def sentiment_label(score):
        if score < -0.6: return "CRITICAL NEG"
        if score < -0.2: return "NEGATIVE"
        if score >  0.3: return "POSITIVE"
        return "NEUTRAL"

    article_rows = ""
    for i, a in enumerate(top_articles):
        sc    = a.get("sentiment_score", 0)
        conf  = int(a.get("confidence", 0.65) * 100)
        sc_c  = sentiment_color(sc)
        sc_l  = sentiment_label(sc)
        kws   = " · ".join(a.get("keywords", [])[:3]).upper() or "GEOPOLITICS"
        article_rows += f"""
        <tr style="border-bottom:1px solid #00d2ff10;">
          <td style="padding:14px 0;border-bottom:1px solid #00d2ff08;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:8px;color:#00d2ff70;letter-spacing:0.2em;background:#00d2ff0a;border:1px solid #00d2ff20;padding:2px 7px;">
                {a.get('source','UNKNOWN').upper()[:18]}
              </span>
              <span style="font-size:8px;color:{sc_c};letter-spacing:0.15em;">{sc_l} {sc:+.2f}</span>
            </div>
            <a href="{a.get('url','#')}" style="text-decoration:none;">
              <div style="font-size:13px;color:#c8dce8;line-height:1.5;margin-bottom:6px;letter-spacing:0.02em;">{a.get('title','')}</div>
            </a>
            <div style="font-size:9px;color:#2a4a5a;letter-spacing:0.15em;">CONF {conf}% · {kws}</div>
          </td>
        </tr>"""

    # Market rows
    market_html = ""
    mkt_labels = {"sp500":"S&P 500","nasdaq":"NASDAQ","gold":"GOLD","oil":"BRENT CRUDE","vix":"VIX","dowjones":"DOW JONES"}
    for key, val in list(markets.items())[:6]:
        if not val: continue
        up    = val.get("direction") == "up"
        color = "#00ff9d" if up else "#ff2d55"
        arrow = "▲" if up else "▼"
        price = val.get("price", 0)
        chg   = val.get("change_pct", 0)
        market_html += f"""
        <td style="width:33%;padding:8px;" align="center">
          <div style="background:#000d1a;border:1px solid #00d2ff15;padding:10px 8px;">
            <div style="font-size:8px;color:#2a4a5a;letter-spacing:0.2em;margin-bottom:4px;">{mkt_labels.get(key,key).upper()}</div>
            <div style="font-size:14px;color:#ffffff;letter-spacing:0.05em;">{price:,.2f}</div>
            <div style="font-size:10px;color:{color};margin-top:2px;">{arrow} {abs(chg):.2f}%</div>
          </div>
        </td>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#030608;font-family:'Courier New',Courier,monospace;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#030608;">
<tr><td align="center" style="padding:32px 20px;">
<table width="640" cellpadding="0" cellspacing="0" style="background:#06101a;border:1px solid #00d2ff25;max-width:640px;width:100%;">

  <tr><td style="height:3px;background:linear-gradient(90deg,#00d2ff,#00ff9d,#00d2ff);"></td></tr>

  <!-- Header -->
  <tr><td style="padding:28px 36px 20px;border-bottom:1px solid #00d2ff12;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="font-size:22px;font-weight:700;letter-spacing:0.35em;color:#ffffff;">EYESPY</div>
          <div style="font-size:8px;letter-spacing:0.35em;color:#00d2ff60;margin-top:2px;">GLOBAL INTELLIGENCE PLATFORM</div>
        </td>
        <td align="right">
          <div style="font-size:9px;color:#ff2d5580;letter-spacing:0.2em;">CLASSIFICATION</div>
          <div style="font-size:10px;color:#ff2d55;letter-spacing:0.25em;font-weight:700;">RESTRICTED</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Session banner -->
  <tr><td style="padding:0 36px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:{session_color}12;border-left:3px solid {session_color};margin:20px 0 0;">
      <tr>
        <td style="padding:10px 16px;">
          <div style="font-size:9px;color:{session_color};letter-spacing:0.3em;font-weight:700;">{session_label}</div>
          <div style="font-size:10px;color:#5a7a90;letter-spacing:0.15em;margin-top:2px;">{timestamp}</div>
        </td>
        <td align="right" style="padding:10px 16px;">
          <div style="font-size:8px;color:#2a4a5a;letter-spacing:0.2em;">AUTOMATED INTELLIGENCE DIGEST</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Markets -->
  <tr><td style="padding:20px 36px 0;">
    <div style="font-size:8px;color:#00d2ff60;letter-spacing:0.3em;margin-bottom:10px;">◈ MARKET IMPACT INDICATORS</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>{market_html}</tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:20px 36px 0;">
    <div style="height:1px;background:linear-gradient(90deg,transparent,#00d2ff30,transparent);"></div>
  </td></tr>

  <!-- Top Intelligence -->
  <tr><td style="padding:20px 36px 0;">
    <div style="font-size:8px;color:#00d2ff60;letter-spacing:0.3em;margin-bottom:4px;">◈ TOP INTELLIGENCE ITEMS — LIVE FEEDS</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      {article_rows}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:24px 36px 32px;" align="center">
    <table cellpadding="0" cellspacing="0">
      <tr><td style="background:#00d2ff12;border:1px solid #00d2ff40;padding:0;">
        <a href="http://localhost:3000" style="display:block;padding:12px 36px;color:#00d2ff;text-decoration:none;font-size:9px;letter-spacing:0.35em;font-weight:700;">
          ▶ OPEN FULL INTELLIGENCE PLATFORM
        </a>
      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:0 36px 24px;">
    <div style="border-top:1px solid #00d2ff10;padding-top:16px;">
      <p style="font-size:8px;color:#1a3a4a;line-height:1.8;margin:0;letter-spacing:0.04em;">
        EyeSpy Intelligence Network · Automated Briefing System v4.2.1 · 
        This digest is generated by AI and should be verified against primary sources. 
        To unsubscribe from EyeSpy briefings, contact your network administrator.
      </p>
    </div>
  </td></tr>

  <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#00d2ff30,transparent);"></td></tr>

</table>
</td></tr>
</table>

</body>
</html>"""