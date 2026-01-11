"""
Health score router
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import HealthScoreRequest, HealthScoreResponse
from app.services.health_score import health_score_calculator
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/health/score", response_model=HealthScoreResponse)
async def compute_health_score(request: HealthScoreRequest):
    """
    Compute financial health score
    """
    try:
        # Convert transaction history to dict format
        transactions = [
            {
                'amount': t.amount,
                'type': t.type,
                'category': t.category,
                'date': t.date,
                'description': t.description or ''
            }
            for t in request.transactions
        ]
        
        profile = {
            'monthlyIncome': request.profile.monthlyIncome,
            'currency': request.profile.currency,
            'budgetPreferences': request.profile.budgetPreferences or {}
        }
        
        result = health_score_calculator.calculate(transactions, profile)
        
        return HealthScoreResponse(**result)
    except Exception as e:
        logger.error(f"Health score computation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health score computation failed: {str(e)}")
