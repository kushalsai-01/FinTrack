"""
Financial health score computation service
Calculates composite health score from multiple factors
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class HealthScoreCalculator:
    """
    Computes financial health score (0-100) based on multiple factors
    Each factor is weighted and contributes to overall score
    """
    
    def __init__(self):
        self.weights = {
            'savingsRate': 0.25,
            'spendingVolatility': 0.20,
            'incomeToExpenseRatio': 0.25,
            'budgetAdherence': 0.20,
            'anomalyScore': 0.10
        }
    
    def calculate(self, transactions: List[Dict], profile: Dict) -> Dict[str, Any]:
        """
        Calculate comprehensive health score
        
        Args:
            transactions: List of transaction dictionaries
            profile: User profile with income and preferences
        
        Returns:
            Dictionary with overall score, sub-scores, explanation, metrics, and recommendations
        """
        if len(transactions) < 10:
            return self._default_health_score("Insufficient transaction history")
        
        # Convert to DataFrame
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Calculate metrics
        metrics = self._calculate_metrics(df, profile)
        
        # Calculate sub-scores
        sub_scores = {
            'savingsRate': self._score_savings_rate(metrics['savingsRate']),
            'spendingVolatility': self._score_volatility(metrics['spendingStdDev'], metrics['avgDailySpending']),
            'incomeToExpenseRatio': self._score_income_expense_ratio(metrics['incomeToExpenseRatio']),
            'budgetAdherence': self._score_budget_adherence(metrics.get('budgetUtilization', 0)),
            'anomalyScore': self._score_anomalies(metrics.get('anomalyCount', 0), len(df))
        }
        
        # Calculate weighted overall score
        overall_score = sum(
            sub_scores[key]['score'] * self.weights[key]
            for key in sub_scores.keys()
        )
        
        # Generate explanation
        explanation = self._generate_explanation(overall_score, sub_scores, metrics)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(sub_scores, metrics)
        
        return {
            'overallScore': round(overall_score, 1),
            'subScores': {
                key: {
                    'score': round(value['score'], 1),
                    'weight': self.weights[key]
                }
                for key, value in sub_scores.items()
            },
            'explanation': explanation,
            'metrics': {
                'totalIncome': float(metrics['totalIncome']),
                'totalExpenses': float(metrics['totalExpenses']),
                'savings': float(metrics['savings']),
                'savingsRate': float(metrics['savingsRate']),
                'avgDailySpending': float(metrics['avgDailySpending']),
                'spendingStdDev': float(metrics['spendingStdDev']),
                'budgetUtilization': float(metrics.get('budgetUtilization', 0)),
                'anomalyCount': int(metrics.get('anomalyCount', 0))
            },
            'recommendations': recommendations
        }
    
    def _calculate_metrics(self, df: pd.DataFrame, profile: Dict) -> Dict:
        """Calculate base metrics from transactions"""
        income_df = df[df['type'] == 'income']
        expense_df = df[df['type'] == 'expense']
        
        total_income = income_df['amount'].sum() if len(income_df) > 0 else 0
        total_expenses = expense_df['amount'].sum() if len(expense_df) > 0 else 0
        savings = total_income - total_expenses
        
        # Savings rate
        savings_rate = (savings / total_income * 100) if total_income > 0 else 0
        
        # Daily spending statistics
        if len(expense_df) > 0:
            expense_df['date_only'] = expense_df['date'].dt.date
            daily_spending = expense_df.groupby('date_only')['amount'].sum()
            avg_daily_spending = daily_spending.mean()
            spending_std = daily_spending.std() if len(daily_spending) > 1 else 0
        else:
            avg_daily_spending = 0
            spending_std = 0
        
        # Income to expense ratio
        income_to_expense = (total_income / total_expenses) if total_expenses > 0 else float('inf')
        
        # Budget utilization (if available)
        budget_utilization = 0  # Would need budget data
        
        # Anomaly count (simple z-score based)
        anomaly_count = self._count_anomalies(expense_df)
        
        return {
            'totalIncome': total_income,
            'totalExpenses': total_expenses,
            'savings': savings,
            'savingsRate': savings_rate,
            'avgDailySpending': avg_daily_spending,
            'spendingStdDev': spending_std,
            'incomeToExpenseRatio': income_to_expense,
            'budgetUtilization': budget_utilization,
            'anomalyCount': anomaly_count
        }
    
    def _score_savings_rate(self, savings_rate: float) -> Dict:
        """Score savings rate (0-100)"""
        # Target: 20% savings rate = 100 points
        # 0% = 0 points, 20%+ = 100 points
        score = min(savings_rate / 0.20 * 100, 100)
        score = max(score, 0)
        return {'score': score}
    
    def _score_volatility(self, std_dev: float, avg_spending: float) -> Dict:
        """Score spending volatility (lower is better)"""
        if avg_spending == 0:
            return {'score': 100}
        
        # Coefficient of variation
        cv = (std_dev / avg_spending) if avg_spending > 0 else 0
        
        # Lower CV = higher score
        # CV of 0.5 = 50 points, CV of 0 = 100 points
        score = max(100 - (cv * 200), 0)
        return {'score': score}
    
    def _score_income_expense_ratio(self, ratio: float) -> Dict:
        """Score income to expense ratio"""
        # Ratio > 1.2 = excellent (100 points)
        # Ratio 1.0 = 50 points
        # Ratio < 0.8 = 0 points
        if ratio >= 1.2:
            score = 100
        elif ratio >= 1.0:
            score = 50 + (ratio - 1.0) * 250
        else:
            score = max(ratio / 0.8 * 50, 0)
        
        return {'score': min(score, 100)}
    
    def _score_budget_adherence(self, utilization: float) -> Dict:
        """Score budget adherence"""
        # 0-80% utilization = 100 points
        # 80-100% = decreasing score
        # >100% = 0 points
        if utilization <= 80:
            score = 100
        elif utilization <= 100:
            score = 100 - (utilization - 80) * 5
        else:
            score = 0
        
        return {'score': max(score, 0)}
    
    def _score_anomalies(self, anomaly_count: int, total_transactions: int) -> Dict:
        """Score based on anomaly count"""
        if total_transactions == 0:
            return {'score': 100}
        
        anomaly_rate = anomaly_count / total_transactions
        
        # 0% anomalies = 100 points
        # 10%+ anomalies = 0 points
        score = max(100 - (anomaly_rate * 1000), 0)
        return {'score': score}
    
    def _count_anomalies(self, expense_df: pd.DataFrame) -> int:
        """Count anomalies using z-score"""
        if len(expense_df) < 3:
            return 0
        
        amounts = expense_df['amount'].values
        mean = np.mean(amounts)
        std = np.std(amounts)
        
        if std == 0:
            return 0
        
        z_scores = np.abs((amounts - mean) / std)
        anomalies = np.sum(z_scores > 2.5)  # 2.5 standard deviations
        
        return int(anomalies)
    
    def _generate_explanation(self, overall_score: float, sub_scores: Dict, metrics: Dict) -> str:
        """Generate human-readable explanation"""
        score_level = "excellent" if overall_score >= 80 else "good" if overall_score >= 60 else "fair" if overall_score >= 40 else "poor"
        
        explanation = f"Your financial health score is {overall_score:.1f}/100 ({score_level}). "
        
        # Highlight strengths
        strengths = [key for key, value in sub_scores.items() if value['score'] >= 70]
        if strengths:
            explanation += f"Strengths: {', '.join(strengths)}. "
        
        # Highlight weaknesses
        weaknesses = [key for key, value in sub_scores.items() if value['score'] < 50]
        if weaknesses:
            explanation += f"Areas for improvement: {', '.join(weaknesses)}. "
        
        explanation += f"Savings rate: {metrics['savingsRate']:.1f}%. "
        explanation += f"Monthly income: ${metrics['totalIncome']:.2f}, expenses: ${metrics['totalExpenses']:.2f}."
        
        return explanation
    
    def _generate_recommendations(self, sub_scores: Dict, metrics: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if sub_scores['savingsRate']['score'] < 60:
            recommendations.append("Increase your savings rate. Aim for at least 20% of income.")
        
        if sub_scores['spendingVolatility']['score'] < 60:
            recommendations.append("Reduce spending volatility. Try to maintain consistent daily spending patterns.")
        
        if sub_scores['incomeToExpenseRatio']['score'] < 60:
            recommendations.append("Your expenses are high relative to income. Consider reducing discretionary spending.")
        
        if sub_scores['budgetAdherence']['score'] < 60:
            recommendations.append("Improve budget adherence. Track spending against your budget categories.")
        
        if sub_scores['anomalyScore']['score'] < 60:
            recommendations.append("Review unusual transactions. Some spending patterns may need attention.")
        
        if not recommendations:
            recommendations.append("Keep up the good work! Your financial health is on track.")
        
        return recommendations
    
    def _default_health_score(self, reason: str) -> Dict:
        """Return default health score when insufficient data"""
        return {
            'overallScore': 50.0,
            'subScores': {
                'savingsRate': {'score': 50.0, 'weight': 0.25},
                'spendingVolatility': {'score': 50.0, 'weight': 0.20},
                'incomeToExpenseRatio': {'score': 50.0, 'weight': 0.25},
                'budgetAdherence': {'score': 50.0, 'weight': 0.20},
                'anomalyScore': {'score': 50.0, 'weight': 0.10}
            },
            'explanation': f"{reason}. Default score assigned.",
            'metrics': {},
            'recommendations': ["Add more transactions to get accurate health score"]
        }


# Singleton instance
health_score_calculator = HealthScoreCalculator()
