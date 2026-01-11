"""
Anomaly detection service
Uses Isolation Forest and statistical methods
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Detects anomalies in transaction patterns
    Uses Isolation Forest and z-score analysis
    """
    
    def __init__(self):
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
    
    def detect(self, transactions: List[Dict]) -> Dict[str, Any]:
        """
        Detect anomalies in transactions
        
        Args:
            transactions: List of transaction dictionaries
        
        Returns:
            Dictionary with anomalies, risk level, and total count
        """
        if len(transactions) < 10:
            return {
                'anomalies': [],
                'riskLevel': 'low',
                'totalAnomalies': 0
            }
        
        # Convert to DataFrame
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        
        # Extract features
        features = self._extract_features(df)
        
        # Detect anomalies
        anomalies = self._detect_anomalies(df, features)
        
        # Determine risk level
        risk_level = self._determine_risk_level(len(anomalies), len(df))
        
        return {
            'anomalies': anomalies,
            'riskLevel': risk_level,
            'totalAnomalies': len(anomalies)
        }
    
    def _extract_features(self, df: pd.DataFrame) -> np.ndarray:
        """Extract features for anomaly detection"""
        features = []
        
        # Amount features
        amounts = df['amount'].values.reshape(-1, 1)
        
        # Date features (days since first transaction)
        df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
        days = df['days_since_start'].values.reshape(-1, 1)
        
        # Category encoding (simple numeric)
        category_map = {cat: i for i, cat in enumerate(df['category'].unique())}
        df['category_encoded'] = df['category'].map(category_map)
        categories = df['category_encoded'].values.reshape(-1, 1)
        
        # Combine features
        features = np.hstack([amounts, days, categories])
        
        return features
    
    def _detect_anomalies(self, df: pd.DataFrame, features: np.ndarray) -> List[Dict]:
        """Detect anomalies using Isolation Forest and z-score"""
        anomalies = []
        
        # Isolation Forest
        if len(features) >= 10:
            try:
                predictions = self.isolation_forest.fit_predict(features)
                isolation_anomalies = np.where(predictions == -1)[0]
            except:
                isolation_anomalies = []
        else:
            isolation_anomalies = []
        
        # Z-score based detection
        amounts = df['amount'].values
        mean = np.mean(amounts)
        std = np.std(amounts)
        
        z_scores = np.abs((amounts - mean) / std) if std > 0 else np.zeros(len(amounts))
        z_anomalies = np.where(z_scores > 2.5)[0]
        
        # Combine both methods
        all_anomaly_indices = set(list(isolation_anomalies) + list(z_anomalies))
        
        # Create anomaly records
        for idx in all_anomaly_indices:
            row = df.iloc[idx]
            anomaly_score = float(z_scores[idx]) if idx < len(z_scores) else 1.0
            
            # Determine severity
            if anomaly_score > 3.5:
                severity = 'high'
            elif anomaly_score > 2.5:
                severity = 'medium'
            else:
                severity = 'low'
            
            # Generate reason
            reason = self._generate_reason(row, anomaly_score)
            
            anomalies.append({
                'transactionIndex': int(idx),
                'anomalyScore': round(anomaly_score, 2),
                'reason': reason,
                'severity': severity
            })
        
        return anomalies
    
    def _generate_reason(self, row: pd.Series, score: float) -> str:
        """Generate human-readable reason for anomaly"""
        reasons = []
        
        if score > 2.5:
            reasons.append(f"Unusually high amount (${row['amount']:.2f})")
        
        # Check for unusual category
        if row.get('category'):
            reasons.append(f"Transaction in category: {row['category']}")
        
        return ". ".join(reasons) if reasons else "Statistical anomaly detected"
    
    def _determine_risk_level(self, anomaly_count: int, total_count: int) -> str:
        """Determine overall risk level"""
        if total_count == 0:
            return 'low'
        
        anomaly_rate = anomaly_count / total_count
        
        if anomaly_rate > 0.15:
            return 'high'
        elif anomaly_rate > 0.05:
            return 'medium'
        else:
            return 'low'


# Singleton instance
anomaly_detector = AnomalyDetector()
