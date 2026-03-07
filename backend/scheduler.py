"""
scheduler.py  —  EyeSpy Automated Briefing Scheduler
Place in: backend/scheduler.py

Run alongside uvicorn OR let main.py start it as a background thread.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz, logging

IST = pytz.timezone("Asia/Kolkata")
logger = logging.getLogger(__name__)

def _run_morning_briefing():
    """07:00 IST — Morning Intelligence Brief"""
    try:
        from services.news_service import fetch_news_with_analysis
        from services.market_service import get_market
        from services.email_service import send_daily_briefing

        logger.info("[SCHEDULER] Running morning briefing...")
        articles = fetch_news_with_analysis()
        markets  = get_market()
        send_daily_briefing(articles, markets, session="MORNING")
        logger.info("[SCHEDULER] Morning briefing dispatched.")
    except Exception as e:
        logger.error(f"[SCHEDULER] Morning briefing failed: {e}")


def _run_evening_briefing():
    """22:00 IST — Evening Intelligence Summary"""
    try:
        from services.news_service import fetch_news_with_analysis
        from services.market_service import get_market
        from services.email_service import send_daily_briefing

        logger.info("[SCHEDULER] Running evening briefing...")
        articles = fetch_news_with_analysis()
        markets  = get_market()
        send_daily_briefing(articles, markets, session="EVENING")
        logger.info("[SCHEDULER] Evening briefing dispatched.")
    except Exception as e:
        logger.error(f"[SCHEDULER] Evening briefing failed: {e}")


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone=IST)

    # 07:00 IST daily
    scheduler.add_job(
        _run_morning_briefing,
        trigger=CronTrigger(hour=7, minute=0, timezone=IST),
        id="morning_briefing",
        replace_existing=True,
    )

    # 22:00 IST daily
    scheduler.add_job(
        _run_evening_briefing,
        trigger=CronTrigger(hour=22, minute=0, timezone=IST),
        id="evening_briefing",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("[SCHEDULER] EyeSpy briefing scheduler active — 07:00 & 22:00 IST")
    return scheduler