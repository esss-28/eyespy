"""
market_service.py — with SENSEX added
backend/services/market_service.py
"""
import requests
import logging

logger = logging.getLogger(__name__)

FALLBACK = {
    "sp500":    {"price": 5667.20,  "change_pct":  0.55,  "direction": "up"},
    "nasdaq":   {"price": 17899.02, "change_pct":  0.31,  "direction": "up"},
    "dowjones": {"price": 41938.45, "change_pct":  0.40,  "direction": "up"},
    "gold":     {"price": 2921.50,  "change_pct":  0.18,  "direction": "up"},
    "oil":      {"price": 70.84,    "change_pct": -0.72,  "direction": "down"},
    "vix":      {"price": 18.21,    "change_pct":  2.30,  "direction": "up"},
    "sensex":   {"price": 74119.45, "change_pct":  0.22,  "direction": "up"},
}

# stooq symbols — SENSEX = ^bse
STOOQ_SYMBOLS = {
    "sp500":    "^spx",
    "nasdaq":   "^ndq",
    "dowjones": "^dji",
    "gold":     "xauusd",
    "oil":      "cl.f",
    "vix":      "^vix",
    "sensex":   "^bse",
}

FMP_SYMBOLS = {
    "sp500":    "%5EGSPC",
    "nasdaq":   "%5EIXIC",
    "dowjones": "%5EDJI",
    "gold":     "GCUSD",
    "oil":      "CLUSD",
    "vix":      "%5EVIX",
    # SENSEX not on FMP free tier — stooq handles it
}


def _fetch_via_fmp() -> dict:
    try:
        symbols_str = ",".join(FMP_SYMBOLS.values())
        r = requests.get(
            f"https://financialmodelingprep.com/api/v3/quote/{symbols_str}",
            timeout=8, headers={"User-Agent": "Mozilla/5.0"}
        )
        if r.status_code != 200:
            return {}
        data = r.json()
        if not isinstance(data, list):
            return {}
        rev    = {v: k for k, v in FMP_SYMBOLS.items()}
        result = {}
        for item in data:
            key = rev.get(item.get("symbol", ""))
            if not key:
                continue
            price = round(float(item.get("price", 0)), 2)
            chg   = round(float(item.get("changesPercentage", 0)), 2)
            result[key] = {"price": price, "change_pct": chg,
                           "direction": "up" if chg >= 0 else "down"}
        return result
    except Exception as e:
        logger.warning(f"[MARKET] FMP failed: {e}")
        return {}


def _fetch_via_stooq() -> dict:
    result  = {}
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0"})
    for key, sym in STOOQ_SYMBOLS.items():
        try:
            r     = session.get(f"https://stooq.com/q/d/l/?s={sym}&i=d", timeout=6)
            lines = r.text.strip().split("\n")
            if len(lines) < 3:
                continue
            last = lines[-1].split(",")
            prev = lines[-2].split(",")
            close      = float(last[4])
            prev_close = float(prev[4])
            chg        = round((close - prev_close) / prev_close * 100, 2) if prev_close else 0.0
            result[key] = {"price": round(close, 2), "change_pct": chg,
                           "direction": "up" if chg >= 0 else "down"}
        except Exception as e:
            logger.warning(f"[MARKET] stooq {key} failed: {e}")
    return result


def get_market() -> dict:
    """Try FMP first (no SENSEX), then fill missing with stooq (has SENSEX)."""
    result = _fetch_via_fmp()

    # Always run stooq to get SENSEX + fill any FMP gaps
    stooq_data = _fetch_via_stooq()
    for k, v in stooq_data.items():
        if k not in result:
            result[k] = v

    if len(result) >= 4:
        logger.info(f"[MARKET] Live data — {len(result)} instruments")
    else:
        logger.warning("[MARKET] Providers failed — using fallback")
        result = FALLBACK.copy()

    # Always ensure all keys present
    for k in FALLBACK:
        if k not in result:
            result[k] = FALLBACK[k]

    return result