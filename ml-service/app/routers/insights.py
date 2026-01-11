"""
Insights generation router
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import InsightsRequest, InsightsResponse
from app.services.insights_generator import insights_generator
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/insights/generate", response_model=InsightsResponse)
async def generate_insights(request: InsightsRequest):
    """
    Generate explainable insights and nudges
    """
    try:
        # Convert transaction history
        transactions = [
            {
                'amount': t.amount,
                'date': t.date,
                'type': t.type,
                'category': t.category,
                'description': t.description or ''
            }
            for t in request.transactions
        ]
        
        profile = {
            'monthlyIncome': request.profile.monthlyIncome,
            'currency': request.profile.currency,
            'budgetPreferences': request.profile.budgetPreferences or {}
        }
        
        health_score = request.healthScore if request.healthScore else None
        
        result = insights_generator.generate(transactions, profile, health_score)
        
        return InsightsResponse(**result)
    except Exception as e:
        logger.error(f"Insights generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Insights generation failed: {str(e)}")
