import random
from core.config import settings

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"
]

class SessionManager:
    @staticmethod
    def get_random_user_agent() -> str:
        return random.choice(USER_AGENTS)

    @staticmethod
    def get_proxy() -> dict | None:
        if settings.PROXY_URL:
            return {
                "http": settings.PROXY_URL,
                "https": settings.PROXY_URL
            }
        return None

session_manager = SessionManager()
