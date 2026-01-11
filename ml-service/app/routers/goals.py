"""
Goal recommendation router
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import GoalRecommendationRequest, GoalRecommendationResponse
from app.services.goal_recommender import goal_recommender
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/goals/recommend", response_model=GoalRecommendationResponse)
async def recommend_goals(request: GoalRecommendationRequest):
    """
    Generate AI-recommended financial goals
    """
    try:
        # Convert transaction history
        transactions = [
            {
                'amount': t.amount,
                'date': t.date,
                'type': t.type,
                'category': t.category
            }
            for t in request.transactions
        ]
        
        profile = {
            'monthlyIncome': request.profile.monthlyIncome,
            'currency': request.profile.currency,
            'budgetPreferences': request.profile.budgetPreferences or {}
        }
        
        result = goal_recommender.recommend(transactions, profile)
        
        return GoalRecommendationResponse(**result)
    except Exception as e:
        logger.error(f"Goal recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Goal recommendation failed: {str(e)}")
