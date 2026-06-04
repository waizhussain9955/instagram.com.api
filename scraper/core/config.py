from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Instagram Scraper Service"
    DEBUG: bool = False
    
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    PROXY_URL: str | None = None
    INSTAGRAM_SESSION_ID: str | None = None
    
    class Config:
        env_file = ".env"

settings = Settings()

