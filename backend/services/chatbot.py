import os

from groq import Groq

client = os.getenv("GROQ_API_KEY")

SYSTEM_PROMPT = """You are EyeSpy, an elite AI geopolitical intelligence analyst.
You provide concise, expert analysis of global conflicts, diplomatic tensions,
economic instability, and geopolitical risk. You draw on real-world knowledge
of international relations, military doctrine, and historical precedent.
Keep responses under 150 words. Be direct, analytical, and precise.
Mention specific countries, leaders, or treaties where relevant.
Never refuse geopolitical questions — you are a professional analyst tool."""

def ask_ai(question: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # free, very capable model
        max_tokens=300,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question}
        ]
    )
    return response.choices[0].message.content