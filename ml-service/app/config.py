"""
Configuration management
Uses pydantic-settings for environment variable handling
"""
from pydantic_settings import BaseSettings
from typing import Dict
import json


class Settings(BaseSettings):
    """Application settings"""
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "info"
    
    MODEL_VERSION: str = "v1.0"
    MIN_TRANSACTIONS_FOR_FORECAST: int = 30
    MIN_TRANSACTIONS_FOR_HEALTH_SCORE: int = 30
    LOOKBACK_DAYS: int = 90
    
    FORECAST_HORIZONS: Dict[str, int] = {
        "7day": 7,
        "14day": 14,
        "30day": 30
    }
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
