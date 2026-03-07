<div align="center">

```
███████╗██╗   ██╗███████╗███████╗██████╗ ██╗   ██╗
██╔════╝╚██╗ ██╔╝██╔════╝██╔════╝██╔══██╗╚██╗ ██╔╝
█████╗   ╚████╔╝ █████╗  ███████╗██████╔╝ ╚████╔╝ 
██╔══╝    ╚██╔╝  ██╔══╝  ╚════██║██╔═══╝   ╚██╔╝  
███████╗   ██║   ███████╗███████║██║        ██║   
╚══════╝   ╚═╝   ╚══════╝╚══════╝╚═╝        ╚═╝   
```

### `[ CLASSIFICATION: RESTRICTED ]`

**AI-Powered Geopolitical Intelligence Platform**

*Monitor. Analyse. Anticipate.*

---

![Python](https://img.shields.io/badge/Python-3.11+-00d2ff?style=flat-square&logo=python&logoColor=white&labelColor=030608)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-00ff9d?style=flat-square&logo=fastapi&logoColor=white&labelColor=030608)
![Next.js](https://img.shields.io/badge/Next.js-14-ffffff?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=030608)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-00d2ff?style=flat-square&logo=typescript&logoColor=white&labelColor=030608)
![License](https://img.shields.io/badge/License-MIT-ffb300?style=flat-square&labelColor=030608)
![Status](https://img.shields.io/badge/Status-OPERATIONAL-00ff9d?style=flat-square&labelColor=030608)

</div>

---

## `> MISSION OVERVIEW`

**EyeSpy** is a real-time geopolitical intelligence dashboard that fuses AI-driven sentiment analysis, conflict probability modelling, multi-source bias detection, and automated intelligence briefings into a single classified-feeling operations interface.

The platform is designed to answer one question: **what is the world doing right now, and where is it heading?**

---

## `> INTELLIGENCE CAPABILITIES`

```
◈ REAL-TIME NEWS ANALYSIS      — 247 live sources via NewsAPI, refreshed continuously
◈ CONFLICT PROBABILITY ENGINE  — Weighted ensemble: sentiment × volatility × military activity
◈ MULTI-PERSPECTIVE ANALYSIS   — Western vs Eastern vs Regional media with AI bias scoring
◈ INTERACTIVE THREAT GLOBE     — SVG rotating globe with live conflict-probability hotspots
◈ AI GEOPOLITICAL ANALYST      — Groq-powered LLaMA 3.3 70B chatbot with agent persona
◈ LIVE MARKET CORRELATIONS     — S&P 500, NASDAQ, Gold, Brent Crude, VIX, Dow Jones
◈ WEBSOCKET PULSE FEED         — Real articles pushed live every 8 seconds
◈ TIME MACHINE                 — 51 real events from 2022–2025 with risk retrospectives
◈ INTELLIGENCE BRIEFINGS       — Spy-themed email briefings at 07:00 & 22:00 IST daily
◈ AGENT ONBOARDING             — MI6-style classified welcome letter on newsletter signup
```

---

## `> TECH STACK`

| Layer | Technology | Purpose |
|---|---|---|
| **Backend** | FastAPI + Python 3.11 | REST API + WebSocket server |
| **Frontend** | Next.js 14 + TypeScript | Intelligence dashboard UI |
| **Styling** | Tailwind CSS + Custom CSS | Terminal/ops-centre aesthetic |
| **NLP** | `cardiffnlp/twitter-xlm-roberta-base-sentiment` | Multilingual sentiment analysis |
| **Keywords** | KeyBERT + `all-MiniLM-L6-v2` | Geopolitical keyword extraction |
| **AI Chat** | Groq API — LLaMA 3.3 70B Versatile | Live geopolitical analyst responses |
| **Markets** | yfinance | Real-time financial instrument data |
| **Email** | SendGrid API | Automated intelligence briefings |
| **Scheduler** | APScheduler | 07:00 & 22:00 IST automated sends |
| **Charts** | Recharts | Conflict trend visualisations |
| **News** | NewsAPI | Live global headline feeds |

---

## `> SYSTEM ARCHITECTURE`

```
┌─────────────────────────────────────────────────────────────┐
│                    EYESPY PLATFORM v4.2.1                   │
├─────────────────┬───────────────────────┬───────────────────┤
│   DATA SOURCES  │    PROCESSING LAYER   │   DELIVERY LAYER  │
├─────────────────┼───────────────────────┼───────────────────┤
│ NewsAPI         │ XLM-RoBERTa Sentiment │ Next.js Dashboard │
│ yfinance        │ KeyBERT Keywords      │ WebSocket Feed    │
│ WebSocket       │ Conflict Model        │ SendGrid Email    │
│ GDELT (hist.)   │ Bias Calculator       │ REST API          │
│ Groq / LLaMA    │ APScheduler           │ Intelligence Chat │
└─────────────────┴───────────────────────┴───────────────────┘
```

---

## `> DEPLOYMENT INSTRUCTIONS`

### Prerequisites

```
Python 3.11+    Node.js 18+    Git
```

### 1 — Clone the Repository

```bash
git clone https://github.com/esss-28/eyespy.git
cd eyespy
```

### 2 — Configure API Keys

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
NEWS_API_KEY=your_key          # free at newsapi.org
GROQ_API_KEY=your_key          # free at groq.com
SENDGRID_API_KEY=your_key      # free at sendgrid.com  (100 emails/day)
SENDGRID_FROM_EMAIL=you@domain.com
```

> ⚠️ **Never commit `.env`** — it is listed in `.gitignore` and must stay local.

### 3 — Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
# Note: torch (~2GB) will take time on first install

uvicorn main:app --reload --port 8000
```

### 4 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 5 — Open the Platform

```
http://localhost:3000
```

---

## `> API KEYS REQUIRED`

| Service | Where to Get | Cost | Used For |
|---|---|---|---|
| [NewsAPI](https://newsapi.org) | newsapi.org/register | Free | Live news headlines |
| [Groq](https://groq.com) | console.groq.com | Free | AI analyst chatbot |
| [SendGrid](https://sendgrid.com) | sendgrid.com | Free (100/day) | Intelligence briefings |

---

## `> PROJECT STRUCTURE`

```
eyespy/
├── backend/
│   ├── main.py                        # FastAPI app + all endpoints
│   ├── scheduler.py                   # 07:00 & 22:00 IST briefing scheduler
│   ├── requirements.txt
│   ├── .env.example                   # ← copy to .env and fill keys
│   ├── data/
│   │   └── history.json               # 51 real geopolitical events 2022–2025
│   ├── services/
│   │   ├── news_service.py            # NewsAPI + analysis pipeline
│   │   ├── sentiment_service.py       # XLM-RoBERTa sentiment engine
│   │   ├── keyword_service.py         # KeyBERT extraction
│   │   ├── bias_service.py            # Narrative bias calculator
│   │   ├── market_service.py          # yfinance market data
│   │   ├── chatbot.py                 # Groq / LLaMA analyst
│   │   └── email_service.py           # SendGrid briefings + onboarding
│   └── models/
│       └── conflict_model.py          # Weighted conflict probability model
└── frontend/
    ├── app/
    │   ├── page.tsx                   # Main dashboard — 5-tab layout
    │   └── globals.css                # Intelligence terminal design system
    └── components/
        ├── Globe.tsx                  # SVG rotating threat globe
        ├── Sidebar.tsx                # Threat zones + radar chart
        ├── NewsFeed.tsx               # Classified intelligence feed
        ├── LiveStream.tsx             # WebSocket pulse feed
        ├── ConflictChart.tsx          # Probability trend charts
        ├── MarketTicker.tsx           # Live market data ticker
        ├── Chatbot.tsx                # AI analyst terminal
        ├── TimeMachine.tsx            # Historical event browser
        ├── PerspectiveToggle.tsx      # Multi-source bias analysis
        └── NewsletterSignup.tsx       # Agent enrollment + briefings
```

---

## `> INTELLIGENCE FEATURES IN DEPTH`

### Conflict Probability Engine
Each region is scored using a weighted ensemble:
```
P(conflict) = 0.4 × sentiment_score + 0.3 × market_volatility + 0.3 × military_activity
```
Risk levels: `MODERATE` → `ELEVATED` → `HIGH` → `CRITICAL`

### Multi-Perspective Analysis
The same topic is queried across three media ecosystems simultaneously:
- **Western** — Reuters, BBC, NYT, The Guardian
- **Eastern / State** — Al Jazeera, Xinhua, RT, Global Times  
- **Regional** — Times of India, Dawn, Arab News

Each group receives an AI sentiment score. A narrative bias index is computed from the divergence between Western and Eastern average sentiment.

### Automated Intelligence Briefings
Subscribers receive a **classified HTML email** twice daily styled as a CIA/MI6 President's Daily Brief, containing:
- Top 5 live intelligence items with sentiment scores
- Live market impact indicators
- Direct link to the platform

On signup, agents receive an **immediate onboarding letter** assigning them a codename and mission parameters.

---

## `> LICENSE`

```
MIT License — See LICENSE file for details.
This project is built for educational and competition purposes.
Intelligence assessments are AI-generated and should not be used
as the basis for real-world geopolitical decisions.
```

---

<div align="center">

```
[ END OF FILE — CLASSIFICATION: RESTRICTED ]
[   EYESPY INTELLIGENCE NETWORK — v4.2.1   ]
[          ALL SYSTEMS NOMINAL             ]
```

</div>
