from transformers import pipeline
 
# Multilingual — handles English, Arabic, French, Spanish headlines
_model = None
 
def _get_model():
    global _model
    if _model is None:
        _model = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-xlm-roberta-base-sentiment",
            truncation=True,
            max_length=512
        )
    return _model
 
def analyze_sentiment(text: str):
    model = _get_model()
    result = model(text)
    return result

