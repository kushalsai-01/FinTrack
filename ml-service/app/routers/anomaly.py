"""
Anomaly detection router
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import AnomalyDetectionRequest, AnomalyDetectionResponse
from app.services.anomaly_detector import anomaly_detector
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/anomaly/detect", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """
    Detect anomalies in transaction patterns
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
        
        result = anomaly_detector.detect(transactions)
        
        return AnomalyDetectionResponse(**result)
    except Exception as e:
        logger.error(f"Anomaly detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")
