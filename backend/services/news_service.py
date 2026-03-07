import requests
from services.sentiment_service import analyze_sentiment
from services.keyword_service import extract_keywords
 
NEWS_API_KEY = os.getenv(NEWS_API_KEY)  # ← paste your key
 
SOURCE_RELIABILITY = {
    "Reuters": 0.95, "Associated Press": 0.94, "BBC News": 0.91,
    "The Guardian": 0.85, "Al Jazeera English": 0.83,
    "Financial Times": 0.88, "Wall Street Journal": 0.87,
    "The New York Times": 0.86, "Bloomberg": 0.90,
    "default": 0.65
}
 
def _confidence(source_name: str, has_description: bool) -> float:
    base = SOURCE_RELIABILITY.get(source_name, SOURCE_RELIABILITY["default"])
    if not has_description:
        base -= 0.10
    return round(min(max(base, 0.0), 1.0), 2)
 
def fetch_news():
    url = ("https://newsapi.org/v2/everything"
           f"?q=geopolitics+conflict+war&sortBy=publishedAt"
           f"&language=en&pageSize=20&apiKey={NEWS_API_KEY}")
    res = requests.get(url, timeout=10)
    data = res.json()
    articles = []
    for a in data.get("articles", []):
        articles.append({
            "title": a["title"],
            "source": a["source"]["name"],
            "description": a["description"],
            "url": a["url"],
            "publishedAt": a["publishedAt"],
        })
    return articles
 
def fetch_news_with_analysis():
    """Full pipeline: news → sentiment → confidence → keywords."""
    articles = fetch_news()
    enriched = []
    for a in articles[:12]:   # limit to 12 to keep response fast
        text = (a["title"] or "") + " " + (a["description"] or "")
        try:
            sentiment_result = analyze_sentiment(text[:512])
            label = sentiment_result[0]["label"].upper()
            score = sentiment_result[0]["score"]
            # Map: Positive→+score, Negative→-score, Neutral→0
            if label == "NEGATIVE":
                sentiment_score = -round(score, 3)
            elif label == "POSITIVE":
                sentiment_score = round(score, 3)
            else:
                sentiment_score = 0.0
        except Exception:
            label, score, sentiment_score = "NEUTRAL", 0.5, 0.0
 
        kws = []
        try:
            raw_kws = extract_keywords(text[:512])
            kws = [k for k, _ in raw_kws[:4]]
        except Exception:
            pass
 
        enriched.append({
            **a,
            "sentiment_label": label,
            "sentiment_score": sentiment_score,
            "confidence": _confidence(a["source"], bool(a["description"])),
            "keywords": kws,
        })
    return enriched

