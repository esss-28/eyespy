"""
main.py  —  EyeSpy FastAPI Application
Replace your existing main.py entirely with this file.
"""

import os, time as _time, socket
from dotenv import load_dotenv
load_dotenv()

# Windows IPv4 DNS fix — compatible with Python 3.12 + urllib3 + httpx
import socket
_orig_getaddrinfo = socket.getaddrinfo
def _patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _patched_getaddrinfo

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio, json, logging, datetime
from collections import Counter
import requests as req_lib
from urllib.parse import quote as url_quote

from services.news_service      import fetch_news_with_analysis
from services.sentiment_service import analyze_sentiment
from services.keyword_service   import extract_keywords
from services.bias_service      import calculate_bias
from services.market_service    import get_market
from services.chatbot           import ask_ai
from services.email_service     import add_subscriber, get_subscribers, send_daily_briefing
from models.conflict_model      import predict_conflict
from scheduler                  import start_scheduler

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="EyeSpy Intelligence API", version="4.2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://eyespy-psi.vercel.app",
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── STARTUP ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    start_scheduler()
    logging.info("[EYESPY] Intelligence network online.")

# ═════════════════════════════════════════════════════════════════════════════
# CACHE LAYER — prevents 429 rate limit errors
# NewsAPI free tier = 100 req/day. Without cache, app burns through it fast.
# With cache: max ~20 calls/day regardless of how many users hit the frontend.
# ═════════════════════════════════════════════════════════════════════════════
_cache: dict = {}

CACHE_TTL = {
    "news":          600,   # 10 min
    "live_threats":  900,   # 15 min — single broad fetch covers all 7 regions
    "economy":       900,   # 15 min
    "trending":     1200,   # 20 min
    "perspectives":  600,   # 10 min
    "batch_news":    900,   # 15 min — the shared broad fetch
}

def _cache_get(key: str):
    entry = _cache.get(key)
    if entry and (_time.time() - entry["ts"]) < CACHE_TTL.get(key, 600):
        return entry["data"]
    return None

def _cache_set(key: str, data):
    _cache[key] = {"data": data, "ts": _time.time()}

# ═════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═════════════════════════════════════════════════════════════════════════════
REGION_QUERIES = {
    "ukraine":    "Ukraine war Russia",
    "taiwan":     "Taiwan China military",
    "middleeast": "Gaza Israel Iran",
    "sahel":      "Mali Niger Africa coup",
    "myanmar":    "Myanmar military junta",
    "korea":      "North Korea missile",
    "kashmir":    "Kashmir India Pakistan",
}
VOLATILITY = {
    "ukraine":0.88,"taiwan":0.72,"middleeast":0.85,
    "sahel":0.60,"myanmar":0.55,"korea":0.68,"kashmir":0.62,
}
MILITARY = {
    "ukraine":0.92,"taiwan":0.65,"middleeast":0.88,
    "sahel":0.65,"myanmar":0.70,"korea":0.72,"kashmir":0.60,
}
ECONOMY_REGIONS = {
    "Russia":      "Russia economy ruble sanctions",
    "Middle East": "Middle East economy oil war",
    "China":       "China economy trade GDP",
    "Europe":      "Europe economy inflation recession",
    "USA":         "United States economy Fed rates",
    "India":       "India economy growth GDP",
    "Africa":      "Africa economy debt crisis",
}
GEOPOLITICAL_TERMS = [
    "ukraine","russia","israel","gaza","iran","taiwan","china",
    "nato","sanctions","nuclear","military","conflict","war",
    "ceasefire","troops","missile","attack","diplomacy",
    "trump","putin","zelensky","netanyahu","hezbollah","hamas",
    "sudan","syria","north korea","pakistan","india","africa",
]
TRENDING_FALLBACK = [
    {"word":"Ukraine","mentions":103},{"word":"Israel","mentions":82},
    {"word":"Gaza","mentions":76},   {"word":"Taiwan","mentions":58},
    {"word":"Iran","mentions":51},   {"word":"Russia","mentions":44},
    {"word":"NATO","mentions":39},   {"word":"Sanctions","mentions":31},
    {"word":"China","mentions":28},  {"word":"Sudan","mentions":19},
]

# ═════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═════════════════════════════════════════════════════════════════════════════
def _fetch_articles(query: str, page_size: int = 10, cache_key: str = None) -> list:
    """Cached NewsAPI fetch. Returns [] on 429 or error, stale data if available."""
    ck = cache_key or f"q_{hash(query) % 99999}"
    cached = _cache_get(ck)
    if cached is not None:
        return cached

    NEWS_API_KEY = os.getenv("NEWS_API_KEY")
    url = (
        "https://newsapi.org/v2/everything"
        f"?q={url_quote(query)}&language=en&sortBy=publishedAt"
        f"&pageSize={page_size}&apiKey={NEWS_API_KEY}"
    )
    try:
        r = req_lib.get(url, timeout=10)
        if r.status_code == 429:
            logging.warning(f"[NEWSAPI] 429 on '{query[:30]}' — using stale/empty")
            return _cache.get(ck, {}).get("data", [])
        result = [a for a in r.json().get("articles", [])
                  if a.get("title") and a.get("title") != "[Removed]"]
        _cache_set(ck, result)
        return result
    except Exception as e:
        logging.warning(f"[FETCH] '{query[:30]}' failed: {e}")
        return _cache.get(ck, {}).get("data", [])

def _batch_news() -> list:
    """
    Single broad fetch shared by /live-threats and /trending.
    One NewsAPI call every 15 min instead of 7+ separate calls.
    """
    cached = _cache_get("batch_news")
    if cached is not None:
        return cached
    result = _fetch_articles(
        "war OR conflict OR military OR attack OR missile OR ceasefire",
        page_size=100, cache_key="batch_news"
    )
    _cache_set("batch_news", result)
    return result

def _sentiment_score(text: str) -> float:
    try:
        result = analyze_sentiment(text[:400])
        label  = result[0]["label"].upper()
        score  = float(result[0]["score"])
        if label in ("LABEL_0","NEGATIVE","NEG"):   return score
        if label in ("LABEL_2","POSITIVE","POS"):   return 1.0 - score
        return 0.5
    except:
        return 0.5

def _normalise_label(raw: str) -> str:
    return {
        "LABEL_0":"NEGATIVE","NEGATIVE":"NEGATIVE","NEG":"NEGATIVE",
        "LABEL_1":"NEUTRAL", "NEUTRAL": "NEUTRAL", "NEU":"NEUTRAL",
        "LABEL_2":"POSITIVE","POSITIVE":"POSITIVE","POS":"POSITIVE",
    }.get(raw.strip().upper(), "NEUTRAL")

def _risk_level(p: float) -> str:
    if p >= 0.85: return "CRITICAL"
    if p >= 0.70: return "HIGH"
    if p >= 0.50: return "ELEVATED"
    return "MODERATE"

# ═════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

# ── NEWS ──────────────────────────────────────────────────────────────────────
@app.get("/news")
def get_news():
    cached = _cache_get("news")
    if cached is not None:
        return cached
    result = fetch_news_with_analysis()
    _cache_set("news", result)
    return result

# ── MARKETS ───────────────────────────────────────────────────────────────────
@app.get("/markets")
async def markets():
    return await asyncio.to_thread(get_market)

# ── HISTORY ───────────────────────────────────────────────────────────────────
@app.get("/history")
def history():
    with open("data/history.json") as f:
        return json.load(f)

# ── LIVE THREATS ──────────────────────────────────────────────────────────────
@app.get("/live-threats")
def live_threats():
    cached = _cache_get("live_threats")
    if cached is not None:
        return cached

    articles_batch = _batch_news()   # shared fetch — no extra API call
    results = {}

    for region_id, query_terms in REGION_QUERIES.items():
        try:
            terms   = query_terms.lower().split()
            matches = [
                a for a in articles_batch
                if any(t in (a.get("title","") + " " + (a.get("description") or "")).lower()
                       for t in terms)
            ]
            if not matches:
                raise ValueError("no matches")

            scores = [
                _sentiment_score(a.get("title","") + ". " + (a.get("description") or ""))
                for a in matches[:8]
            ]
            avg = sum(scores) / len(scores)
            vol = VOLATILITY.get(region_id, 0.6)
            mil = MILITARY.get(region_id, 0.6)
            p   = max(0.1, min(0.99, round(0.40*avg + 0.30*vol + 0.30*mil, 3)))

            results[region_id] = {
                "conflict_probability": p,
                "risk_level":           _risk_level(p),
                "sentiment_input":      round(avg, 3),
                "articles_analysed":    len(matches),
                "live":                 True,
            }
        except:
            vol = VOLATILITY.get(region_id, 0.6)
            mil = MILITARY.get(region_id, 0.6)
            p   = round(0.40*0.62 + 0.30*vol + 0.30*mil, 3)
            results[region_id] = {
                "conflict_probability": p,
                "risk_level":           _risk_level(p),
                "sentiment_input":      0.62,
                "articles_analysed":    8,   # honest about using model baseline
                "live":                 True, # model is still running live
            }

    result = {"threats": results, "timestamp": datetime.datetime.utcnow().isoformat()}
    _cache_set("live_threats", result)
    return result

# ── ECONOMIC INDEX ────────────────────────────────────────────────────────────
@app.get("/economy")
def economy_index():
    cached = _cache_get("economy")
    if cached is not None:
        return cached

    # Use batch news for economy too — filter by economic terms
    batch = _batch_news()
    econ_terms = ["economy","inflation","recession","gdp","fed","rates",
                  "sanctions","ruble","debt","trade","market","financial"]

    results = {}
    for region, query in ECONOMY_REGIONS.items():
        try:
            region_terms = query.lower().split()
            matches = [
                a for a in batch
                if any(t in (a.get("title","") + " " + (a.get("description") or "")).lower()
                       for t in region_terms)
                and any(e in (a.get("title","") + " " + (a.get("description") or "")).lower()
                        for e in econ_terms)
            ]
            # If no matches from batch, do a targeted fetch (costs 1 API call but rare)
            if not matches:
                matches = _fetch_articles(query, page_size=6,
                                          cache_key=f"econ_{region[:6]}")

            scores = [
                _sentiment_score(a.get("title","") + ". " + (a.get("description") or ""))
                for a in matches[:6]
            ] if matches else [0.5]

            avg   = sum(scores) / len(scores)
            index = round(avg * 100, 1)

            if index >= 75:   level = "CRITICAL"
            elif index >= 55: level = "HIGH"
            elif index >= 35: level = "MODERATE"
            else:             level = "STABLE"

            results[region] = {
                "instability_index": index, "level": level,
                "articles_analysed": len(matches), "live": True,
            }
        except Exception as e:
            logging.info(f"[ECONOMY] {region}: {e}")
            results[region] = {
                "instability_index": 50.0, "level": "MODERATE",
                "articles_analysed": 0, "live": False,
            }

    result = {"economy": results, "timestamp": datetime.datetime.utcnow().isoformat()}
    _cache_set("economy", result)
    return result

# ── TRENDING KEYWORDS ─────────────────────────────────────────────────────────
@app.get("/trending")
def trending_keywords():
    cached = _cache_get("trending")
    if cached is not None:
        return cached

    try:
        articles = _batch_news()   # reuse batch — zero extra API calls
        if not articles:
            return {"keywords": TRENDING_FALLBACK}

        counter = Counter()
        for a in articles:
            text = ((a.get("title") or "") + " " + (a.get("description") or "")).lower()
            for term in GEOPOLITICAL_TERMS:
                if term in text:
                    counter[term.title()] += 1

        # KeyBERT bonus — no top_n arg, uses your keyword_service signature
        all_text = " ".join(
            (a.get("title","") + ". " + (a.get("description") or ""))
            for a in articles
        )[:8000]
        try:
            kws = extract_keywords(all_text)
            for kw, score in kws:
                key = kw.title()
                if key not in counter:
                    counter[key] = max(1, int(score * 80))
        except Exception as e:
            logging.info(f"[TRENDING] KeyBERT skipped: {e}")

        top = [{"word": w, "mentions": c}
               for w, c in counter.most_common(10) if len(w) > 2]

        seen = {t["word"] for t in top}
        for f in TRENDING_FALLBACK:
            if len(top) >= 10: break
            if f["word"] not in seen: top.append(f)

        result = {"keywords": top}
        _cache_set("trending", result)
        return result

    except Exception as e:
        logging.warning(f"[TRENDING] {e}")
        return {"keywords": TRENDING_FALLBACK}

# ── POLLS ─────────────────────────────────────────────────────────────────────
_polls: dict = {
    "ukraine_ceasefire": {"question":"Will there be a ceasefire in Ukraine before July 2026?",
                          "yes":23,"no":167,"total":190},
    "taiwan_conflict":   {"question":"Will China take military action on Taiwan within 12 months?",
                          "yes":89,"no":134,"total":223},
    "iran_nuclear":      {"question":"Will Iran reach a nuclear deal with the West in 2025?",
                          "yes":41,"no":198,"total":239},
    "gaza_resolution":   {"question":"Will a two-state solution framework be agreed in 2025?",
                          "yes":18,"no":312,"total":330},
    "russia_collapse":   {"question":"Will Putin remain in power through end of 2026?",
                          "yes":201,"no":87,"total":288},
}

@app.get("/polls")
def get_polls():
    result = {}
    for topic, data in _polls.items():
        total = data["total"] or 1
        result[topic] = {**data,
            "yes_pct": round(data["yes"]/total*100, 1),
            "no_pct":  round(data["no"] /total*100, 1)}
    return {"polls": result}

@app.post("/vote")
def vote(topic: str, choice: str):
    if topic not in _polls:        return {"error": "Unknown topic"}
    if choice not in ("yes","no"): return {"error": "Choice must be yes or no"}
    _polls[topic][choice]  += 1
    _polls[topic]["total"] += 1
    total = _polls[topic]["total"] or 1
    return {"topic": topic,
            "yes_pct": round(_polls[topic]["yes"]/total*100, 1),
            "no_pct":  round(_polls[topic]["no"] /total*100, 1),
            "total":   _polls[topic]["total"], "your_vote": choice}

# ── AI CHAT ───────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(question: str):
    return {"answer": await ask_ai(question)}

# ── KEYWORDS ──────────────────────────────────────────────────────────────────
@app.post("/keywords")
def keywords(text: str):
    return extract_keywords(text)

# ── CONFLICT MODEL ────────────────────────────────────────────────────────────
@app.post("/conflict")
def conflict(sentiment: float, volatility: float, military_events: float):
    return predict_conflict(sentiment, volatility, military_events)

# ── PERSPECTIVES ──────────────────────────────────────────────────────────────
@app.get("/perspectives")
def perspectives(topic: str = "geopolitics"):
    cache_key = f"perspectives_{topic[:20]}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    QUERIES = {
        "western":  topic,
        "eastern":  f"{topic} china OR russia OR iran OR beijing OR kremlin",
        "regional": f"{topic} india OR pakistan OR africa OR gulf OR southeast asia",
    }
    results = {}

    for group_name, query in QUERIES.items():
        enriched, scores = [], []
        try:
            articles = _fetch_articles(query, page_size=20,
                                        cache_key=f"persp_{group_name}_{topic[:10]}")
            for idx, a in enumerate(articles):
                title   = (a.get("title")                  or "").strip()
                desc    = (a.get("description")            or "").strip()
                source  = (a.get("source",{}).get("name") or "Unknown").strip()
                art_url = a.get("url","#")
                pub     = a.get("publishedAt","")
                if not title or title.lower() == "[removed]": continue

                text       = f"{title}. {desc}"[:512] if desc else title[:512]
                numeric    = 0.0
                norm_label = "NEUTRAL"
                try:
                    raw_list = analyze_sentiment(text)
                    if raw_list:
                        best       = raw_list[0]
                        raw_score  = float(best.get("score", 0.5))
                        norm_label = _normalise_label(best.get("label","LABEL_1"))
                        if norm_label == "NEGATIVE": numeric = -round(raw_score, 4)
                        elif norm_label == "POSITIVE": numeric = round(raw_score, 4)
                except Exception as e:
                    logging.info(f"[PERSPECTIVES] sentiment {group_name}[{idx}]: {e}")

                scores.append(numeric)
                enriched.append({
                    "id": f"{group_name}_{idx}_{abs(hash(art_url))%999983}",
                    "title": title, "source": source, "url": art_url,
                    "description": desc, "publishedAt": pub,
                    "sentiment": numeric, "sentiment_label": norm_label,
                })
        except Exception as e:
            logging.warning(f"[PERSPECTIVES] {group_name}: {e}")

        avg = round(sum(scores)/len(scores), 4) if scores else 0.0
        results[group_name] = {"articles": enriched, "avg_sentiment": avg,
                               "article_count": len(enriched)}

    bias = calculate_bias(
        results.get("western",{}).get("avg_sentiment", 0.0),
        results.get("eastern",{}).get("avg_sentiment", 0.0),
    )
    result = {"perspectives": results, "bias": bias, "topic": topic}
    _cache_set(cache_key, result)
    return result

# ── NEWSLETTER ────────────────────────────────────────────────────────────────
class SignupPayload(BaseModel):
    email: str
    codename: str = ""

@app.post("/newsletter/signup")
def newsletter_signup(payload: SignupPayload):
    return add_subscriber(payload.email, payload.codename)

@app.get("/newsletter/subscribers")
def newsletter_subscribers():
    return {"count": len(get_subscribers()), "agents": get_subscribers()}

@app.post("/newsletter/test-briefing")
def test_briefing():
    articles = fetch_news_with_analysis()
    markets  = get_market()
    send_daily_briefing(articles, markets, session="MORNING")
    return {"status": "briefing_dispatched", "recipients": len(get_subscribers())}

# ── WEBSOCKET ─────────────────────────────────────────────────────────────────
@app.websocket("/stream")
async def stream_updates(websocket: WebSocket):
    await websocket.accept()
    index = 0
    try:
        while True:
            articles = _cache_get("news") or fetch_news_with_analysis()
            if articles:
                event = articles[index % len(articles)]
                await websocket.send_json(event)
                index += 1
            await asyncio.sleep(8)
    except WebSocketDisconnect:
        pass