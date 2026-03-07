from keybert import KeyBERT
 
_kw_model = None
 
def _get_model():
    global _kw_model
    if _kw_model is None:
        _kw_model = KeyBERT()
    return _kw_model
 
def extract_keywords(text: str):
    model = _get_model()
    keywords = model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 2),
        stop_words="english",
        top_n=5
    )
    return keywords   # list of (phrase, score) tuples

