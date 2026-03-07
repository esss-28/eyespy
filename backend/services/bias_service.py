def calculate_bias(sentiment_left: float, sentiment_right: float):
    """
    Compares sentiment scores from left-leaning vs right-leaning sources.
    sentiment_left / sentiment_right are floats in [-1.0, 1.0].
    """
    bias = abs(sentiment_left - sentiment_right)
    if bias < 0.2:
        label = "NEUTRAL"
    elif bias < 0.5:
        label = "MODERATE BIAS"
    else:
        label = "STRONG BIAS"
    direction = "LEFT" if sentiment_left < sentiment_right else "RIGHT"
    return {
        "bias_score": round(bias, 3),
        "bias_level": label,
        "direction": direction,
        "left_sentiment": round(sentiment_left, 3),
        "right_sentiment": round(sentiment_right, 3),
    }

