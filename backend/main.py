"""
main.py  —  EyeSpy FastAPI Application (UPDATED)
Place in: backend/main.py  —  REPLACE your existing main.py entirely
"""

import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import asyncio, json, logging

from services.news_service import fetch_news, fetch_news_with_analysis
from services.sentiment_service import analyze_sentiment
from services.keyword_service import extract_keywords
from services.bias_service import calculate_bias
from services.market_service import get_market
from services.chatbot import ask_ai
from services.email_service import add_subscriber, get_subscribers, send_daily_briefing
from models.conflict_model import predict_conflict
from scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="EyeSpy Intelligence API", version="4.2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── START SCHEDULER ON BOOT ─────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    start_scheduler()
    logging.info("[EYESPY] Intelligence network online.")


# ── NEWS ────────────────────────────────────────────────────────────────────
@app.get("/news")
def get_news():
    return fetch_news_with_analysis()


# ── MARKETS ─────────────────────────────────────────────────────────────────
@app.get("/markets")
def markets():
    return get_market()


# ── HISTORY ─────────────────────────────────────────────────────────────────
@app.get("/history")
def history():
    with open("data/history.json") as f:
        return json.load(f)


# ── AI CHAT ──────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(question: str):
    answer = ask_ai(question)
    return {"answer": answer}


# ── KEYWORDS ─────────────────────────────────────────────────────────────────
@app.post("/keywords")
def keywords(text: str):
    return extract_keywords(text)


# ── CONFLICT MODEL ───────────────────────────────────────────────────────────
@app.post("/conflict")
def conflict(sentiment: float, volatility: float, military_events: float):
    return predict_conflict(sentiment, volatility, military_events)


# ── MULTI-PERSPECTIVE: bias between source groups ────────────────────────────
@app.get("/perspectives")
def perspectives(topic: str = "geopolitics"):
    import requests as req_lib
    from urllib.parse import quote as url_quote

    NEWS_API_KEY = os.getenv("NEWS_API_KEY")   # same key as in news_service.py

    # Broad queries — no sources= filter (breaks NewsAPI free tier)
    QUERIES = {
        "western":  topic,
        "eastern":  f"{topic} china OR russia OR iran OR beijing OR kremlin",
        "regional": f"{topic} india OR pakistan OR africa OR gulf OR southeast asia",
    }

    def normalise_label(raw: str) -> str:
        """Handle both LABEL_0/1/2 and NEGATIVE/NEUTRAL/POSITIVE from different model configs."""
        r = raw.strip().upper()
        return {
            "LABEL_0": "NEGATIVE", "NEGATIVE": "NEGATIVE", "NEG": "NEGATIVE",
            "LABEL_1": "NEUTRAL",  "NEUTRAL":  "NEUTRAL",  "NEU": "NEUTRAL",
            "LABEL_2": "POSITIVE", "POSITIVE": "POSITIVE", "POS": "POSITIVE",
        }.get(r, "NEUTRAL")

    results = {}

    for group_name, query in QUERIES.items():
        enriched = []
        scores   = []

        try:
            url = (
                "https://newsapi.org/v2/everything"
                f"?q={url_quote(query)}"
                f"&language=en&sortBy=publishedAt&pageSize=20"
                f"&apiKey={NEWS_API_KEY}"
            )
            res  = req_lib.get(url, timeout=10)
            data = res.json()

            if data.get("status") != "ok":
                print(f"[PERSPECTIVES] NewsAPI error ({group_name}): {data.get('message')}")
                results[group_name] = {"articles": [], "avg_sentiment": 0.0, "article_count": 0}
                continue

            for idx, a in enumerate(data.get("articles", [])):
                title  = (a.get("title")                 or "").strip()
                desc   = (a.get("description")           or "").strip()
                source = (a.get("source", {}).get("name") or "Unknown").strip()
                art_url = a.get("url", "#")
                pub     = a.get("publishedAt", "")

                if not title or title.lower() == "[removed]":
                    continue

                text = f"{title}. {desc}"[:512] if desc else title[:512]

                # Sentiment
                numeric    = 0.0
                norm_label = "NEUTRAL"
                try:
                    raw_list = analyze_sentiment(text)
                    if raw_list and isinstance(raw_list, list):
                        best       = raw_list[0]
                        raw_score  = float(best.get("score", 0.5))
                        norm_label = normalise_label(best.get("label", "LABEL_1"))
                        if norm_label == "NEGATIVE":
                            numeric = -round(raw_score, 4)
                        elif norm_label == "POSITIVE":
                            numeric =  round(raw_score, 4)
                except Exception as e:
                    print(f"[SENTIMENT ERROR] {group_name}[{idx}]: {e}")

                scores.append(numeric)
                enriched.append({
                    "id":              f"{group_name}_{idx}_{abs(hash(art_url)) % 999983}",
                    "title":           title,
                    "source":          source,
                    "url":             art_url,
                    "description":     desc,
                    "publishedAt":     pub,
                    "sentiment":       numeric,
                    "sentiment_label": norm_label,
                })

        except Exception as e:
            print(f"[PERSPECTIVES FETCH ERROR] {group_name}: {e}")
            results[group_name] = {"articles": [], "avg_sentiment": 0.0, "article_count": 0}
            continue

        avg_sentiment = round(sum(scores) / len(scores), 4) if scores else 0.0
        results[group_name] = {
            "articles":      enriched,
            "avg_sentiment": avg_sentiment,
            "article_count": len(enriched),
        }

    bias = calculate_bias(
        results.get("western", {}).get("avg_sentiment", 0.0),
        results.get("eastern",  {}).get("avg_sentiment", 0.0),
    )

    return {"perspectives": results, "bias": bias, "topic": topic}

# ── NEWSLETTER SIGNUP ────────────────────────────────────────────────────────
class SignupPayload(BaseModel):
    email: str
    codename: str = ""

@app.post("/newsletter/signup")
def newsletter_signup(payload: SignupPayload):
    """Register agent and send onboarding email immediately."""
    result = add_subscriber(payload.email, payload.codename)
    return result


@app.get("/newsletter/subscribers")
def newsletter_subscribers():
    """Admin endpoint — list enrolled agents (for demo purposes)."""
    return {"count": len(get_subscribers()), "agents": get_subscribers()}


@app.post("/newsletter/test-briefing")
def test_briefing():
    """
    Trigger a manual briefing right now — use during demo to show judges
    without waiting for 7am/10pm schedule.
    """
    articles = fetch_news_with_analysis()
    markets  = get_market()
    send_daily_briefing(articles, markets, session="MORNING")
    return {"status": "briefing_dispatched", "recipients": len(get_subscribers())}


# ── WEBSOCKET LIVE STREAM ─────────────────────────────────────────────────────
@app.websocket("/stream")
async def stream_updates(websocket: WebSocket):
    await websocket.accept()
    index = 0
    try:
        while True:
            articles = fetch_news_with_analysis()
            if articles:
                event = articles[index % len(articles)]
                await websocket.send_json(event)
                index += 1
            await asyncio.sleep(8)
    except WebSocketDisconnect:
        pass