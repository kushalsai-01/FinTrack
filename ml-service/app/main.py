"""
Main FastAPI application
Entry point for the ML service
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import category, health, forecast, anomaly, goals, insights
from app.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="FinSight AI ML Service",
    description="AI-powered financial intelligence microservice",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(category.router, prefix="/api/v1", tags=["Category Prediction"])
app.include_router(health.router, prefix="/api/v1", tags=["Health Score"])
app.include_router(forecast.router, prefix="/api/v1", tags=["Forecast"])
app.include_router(anomaly.router, prefix="/api/v1", tags=["Anomaly Detection"])
app.include_router(goals.router, prefix="/api/v1", tags=["Goals"])
app.include_router(insights.router, prefix="/api/v1", tags=["Insights"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "finsight-ai-ml-service",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FinSight AI ML Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "category_prediction": "/api/v1/predict/category",
            "health_score": "/api/v1/health/score",
            "forecast": "/api/v1/forecast/generate",
            "anomaly_detection": "/api/v1/anomaly/detect",
            "goal_recommendations": "/api/v1/goals/recommend",
            "insights": "/api/v1/insights/generate"
        }
    }
