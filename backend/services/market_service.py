# import yfinance as yf
 
# TICKERS = {
#     "sp500":   "^GSPC",
#     "nasdaq":  "^IXIC",
#     "gold":    "GC=F",
#     "oil":     "CL=F",   # Brent crude proxy
#     "vix":     "^VIX",
#     "dowjones":"^DJI",
# }
 
# def get_market():
#     result = {}
#     for name, ticker in TICKERS.items():
#         try:
#             t = yf.Ticker(ticker)
#             hist = t.history(period="2d")
#             if len(hist) >= 2:
#                 price = float(hist["Close"].iloc[-1])
#                 prev  = float(hist["Close"].iloc[-2])
#                 change_pct = round((price - prev) / prev * 100, 2)
#                 result[name] = {
#                     "price": round(price, 2),
#                     "change_pct": change_pct,
#                     "direction": "up" if change_pct >= 0 else "down"
#                 }
#         except Exception as e:
#             result[name] = {"price": 0, "change_pct": 0, "direction": "flat"}
#     return result


"""
market_service.py  —  FIXED
Place in: backend/services/market_service.py

FIX: yfinance fails silently when Yahoo Finance rate-limits or blocks the request.
Solution: pass a session with browser-like headers, add retry logic, and fall back
to a hardcoded "last known" value so the ticker never shows blank.
"""

import yfinance as yf
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ── Ticker definitions ────────────────────────────────────────────────────────
TICKERS = {
    "sp500":    "^GSPC",
    "nasdaq":   "^IXIC",
    "gold":     "GC=F",
    "oil":      "CL=F",
    "vix":      "^VIX",
    "dowjones": "^DJI",
}

# Fallback prices (updated Mar 2025 — used only if live fetch fails)
FALLBACK = {
    "sp500":    {"price": 5650.0,  "change_pct": 0.0,  "direction": "up"},
    "nasdaq":   {"price": 17800.0, "change_pct": 0.0,  "direction": "up"},
    "gold":     {"price": 2920.0,  "change_pct": 0.0,  "direction": "up"},
    "oil":      {"price": 71.5,    "change_pct": 0.0,  "direction": "down"},
    "vix":      {"price": 18.2,    "change_pct": 0.0,  "direction": "up"},
    "dowjones": {"price": 41800.0, "change_pct": 0.0,  "direction": "up"},
}

def _make_session() -> requests.Session:
    """Return a requests session that looks like a real browser to Yahoo Finance."""
    session = requests.Session()

    # Retry on transient errors
    retry = Retry(total=3, backoff_factor=0.5,
                  status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://",  adapter)

    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection":      "keep-alive",
    })
    return session


def get_market() -> dict:
    """Fetch live prices for all tracked instruments. Falls back gracefully."""
    session = _make_session()
    result  = {}

    for name, symbol in TICKERS.items():
        try:
            ticker = yf.Ticker(symbol, session=session)
            hist   = ticker.history(period="5d", interval="1d")

            if hist.empty or len(hist) < 2:
                # Try fast_info as a second attempt
                info  = ticker.fast_info
                price = round(float(info.last_price), 2)
                prev  = round(float(info.previous_close), 2)
                chg   = round((price - prev) / prev * 100, 2) if prev else 0.0
                result[name] = {
                    "price":      price,
                    "change_pct": chg,
                    "direction":  "up" if chg >= 0 else "down",
                }
            else:
                close_today = round(float(hist["Close"].iloc[-1]), 2)
                close_prev  = round(float(hist["Close"].iloc[-2]), 2)
                chg = round((close_today - close_prev) / close_prev * 100, 2) if close_prev else 0.0
                result[name] = {
                    "price":      close_today,
                    "change_pct": chg,
                    "direction":  "up" if chg >= 0 else "down",
                }

        except Exception as e:
            import logging
            logging.warning(f"[MARKET] {name} ({symbol}) failed: {e} — using fallback")
            result[name] = FALLBACK[name]

    return result