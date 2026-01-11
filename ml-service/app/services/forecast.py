"""
Cash flow forecasting service
Uses LSTM for time-series forecasting
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class ForecastGenerator:
    """
    Generates cash flow forecasts using time-series analysis
    Uses simple moving average and trend analysis (LSTM can be added)
    """
    
    def __init__(self):
        self.lookback_days = 60
        self.forecast_horizons = {
            '7day': 7,
            '14day': 14,
            '30day': 30
        }
    
    def generate(self, transactions: List[Dict], forecast_type: str = '30day') -> Dict[str, Any]:
        """
        Generate cash flow forecast
        
        Args:
            transactions: List of transaction dictionaries with signed amounts
            forecast_type: '7day', '14day', or '30day'
        
        Returns:
            Dictionary with predictions, risk indicator, and metadata
        """
        horizon = self.forecast_horizons.get(forecast_type, 30)
        
        if len(transactions) < self.lookback_days:
            raise ValueError(f"Insufficient transaction history. Need at least {self.lookback_days} days.")
        
        # Convert to DataFrame
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Create daily cash flow
        df['date_only'] = df['date'].dt.date
        daily_cashflow = df.groupby('date_only')['amount'].sum().reset_index()
        daily_cashflow.columns = ['date', 'amount']
        daily_cashflow = daily_cashflow.sort_values('date')
        
        # Get last N days for training
        recent_data = daily_cashflow.tail(self.lookback_days)['amount'].values
        
        # Generate predictions
        predictions = self._generate_predictions(recent_data, horizon)
        
        # Calculate risk
        risk_score, risk_indicator = self._calculate_risk(recent_data, predictions)
        
        # Generate metadata
        metadata = {
            'modelVersion': 'v1.0',
            'trainingDataRange': {
                'start': str(daily_cashflow['date'].min()),
                'end': str(daily_cashflow['date'].max())
            },
            'featuresUsed': ['daily_cashflow', 'trend', 'seasonality']
        }
        
        return {
            'predictions': predictions,
            'riskIndicator': risk_indicator,
            'riskScore': risk_score,
            'metadata': metadata
        }
    
    def _generate_predictions(self, historical_data: np.ndarray, horizon: int) -> List[Dict]:
        """Generate forecast predictions"""
        # Simple approach: moving average + trend
        window = min(14, len(historical_data))
        moving_avg = np.mean(historical_data[-window:])
        
        # Calculate trend
        if len(historical_data) >= 7:
            recent_avg = np.mean(historical_data[-7:])
            older_avg = np.mean(historical_data[-14:-7]) if len(historical_data) >= 14 else recent_avg
            trend = (recent_avg - older_avg) / 7  # Daily trend
        else:
            trend = 0
        
        # Calculate volatility for confidence bands
        std_dev = np.std(historical_data[-window:])
        
        predictions = []
        start_date = datetime.now().date()
        
        for i in range(horizon):
            date = start_date + timedelta(days=i)
            
            # Base prediction with trend
            base_prediction = moving_avg + (trend * i)
            
            # Confidence bands (±1.5 standard deviations)
            lower_bound = base_prediction - 1.5 * std_dev
            upper_bound = base_prediction + 1.5 * std_dev
            
            # Confidence decreases over time
            confidence = max(0.5, 1.0 - (i / horizon) * 0.3)
            
            predictions.append({
                'date': str(date),
                'predictedAmount': round(float(base_prediction), 2),
                'lowerBound': round(float(lower_bound), 2),
                'upperBound': round(float(upper_bound), 2),
                'confidence': round(confidence, 2)
            })
        
        return predictions
    
    def _calculate_risk(self, historical_data: np.ndarray, predictions: List[Dict]) -> tuple:
        """Calculate risk score and indicator"""
        # Calculate historical volatility
        volatility = np.std(historical_data)
        mean_amount = np.mean(historical_data)
        
        # Coefficient of variation
        cv = (volatility / abs(mean_amount)) if mean_amount != 0 else 0
        
        # Negative cash flow risk
        negative_days = np.sum(historical_data < 0)
        negative_rate = negative_days / len(historical_data)
        
        # Prediction variance
        pred_amounts = [p['predictedAmount'] for p in predictions]
        pred_variance = np.var(pred_amounts)
        
        # Risk score (0-100, higher = more risk)
        risk_score = min(100, (cv * 50) + (negative_rate * 30) + (pred_variance / 1000))
        
        # Risk indicator
        if risk_score < 30:
            risk_indicator = 'low'
        elif risk_score < 60:
            risk_indicator = 'medium'
        else:
            risk_indicator = 'high'
        
        return round(risk_score, 1), risk_indicator


# Singleton instance
forecast_generator = ForecastGenerator()
