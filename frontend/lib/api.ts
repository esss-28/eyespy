export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
export const WS = API.replace("https://", "wss://").replace("http://", "ws://")