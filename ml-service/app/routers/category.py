"""
Category prediction router
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import CategoryPredictionRequest, CategoryPredictionResponse
from app.services.category_predictor import category_predictor
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/predict/category", response_model=CategoryPredictionResponse)
async def predict_category(request: CategoryPredictionRequest):
    """
    Predict transaction category and needs vs wants classification
    """
    try:
        result = category_predictor.predict(
            description=request.description,
            amount=request.amount,
            transaction_type=request.type
        )
        
        return CategoryPredictionResponse(
            category=result['category'],
            needsVsWants=result['needsVsWants'],
            confidence=result['confidence'],
            reasoning=result.get('reasoning')
        )
    except Exception as e:
        logger.error(f"Category prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
