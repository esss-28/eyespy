import os, asyncio
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

_client = None

SYSTEM_PROMPT = """You are EyeSpy, an elite AI geopolitical intelligence analyst.
You provide concise, expert analysis of global conflicts, diplomatic tensions,
economic instability, and geopolitical risk. You draw on real-world knowledge
of international relations, military doctrine, and historical precedent.
Keep responses under 150 words. Be direct, analytical, and precise.
Mention specific countries, leaders, or treaties where relevant.
Never refuse geopolitical questions — you are a professional analyst tool."""

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

async def ask_ai(question: str) -> str:
    def _sync_call():
        return _get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=300,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question}
            ]
        ).choices[0].message.content
    return await asyncio.to_thread(_sync_call)