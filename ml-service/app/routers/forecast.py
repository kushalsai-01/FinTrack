"""
Forecast router
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import ForecastRequest, ForecastResponse
from app.services.forecast import forecast_generator
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/forecast/generate", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """
    Generate cash flow forecast
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
        
        result = forecast_generator.generate(transactions, request.forecastType)
        
        return ForecastResponse(**result)
    except ValueError as e:
        logger.error(f"Forecast generation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Forecast generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")
