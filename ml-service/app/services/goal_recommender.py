"""
Goal recommendation service
Generates AI-recommended financial goals based on user behavior
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class GoalRecommender:
    """
    Recommends financial goals based on transaction patterns
    Uses rule-based + pattern analysis
    """
    
    def recommend(self, transactions: List[Dict], profile: Dict) -> Dict[str, Any]:
        """
        Generate goal recommendations
        
        Args:
            transactions: List of transaction dictionaries
            profile: User profile with income and preferences
        
        Returns:
            Dictionary with recommended goals
        """
        if len(transactions) < 10:
            return {'goals': []}
        
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        
        goals = []
        
        # Analyze spending patterns
        expense_df = df[df['type'] == 'expense']
        income_df = df[df['type'] == 'income']
        
        monthly_income = profile.get('monthlyIncome', 0)
        avg_monthly_expenses = expense_df.groupby(df['date'].dt.to_period('M'))['amount'].sum().mean()
        
        # Goal 1: Savings target
        if monthly_income > 0:
            current_savings_rate = ((monthly_income - avg_monthly_expenses) / monthly_income * 100) if avg_monthly_expenses > 0 else 0
            target_savings_rate = profile.get('budgetPreferences', {}).get('savingsTarget', 20)
            
            if current_savings_rate < target_savings_rate:
                target_savings = monthly_income * (target_savings_rate / 100)
                goals.append(self._create_savings_goal(target_savings, target_savings_rate, current_savings_rate))
        
        # Goal 2: Category spending cap
        category_totals = expense_df.groupby('category')['amount'].sum()
        top_category = category_totals.idxmax() if len(category_totals) > 0 else None
        
        if top_category and category_totals[top_category] > monthly_income * 0.3:
            avg_category_spending = category_totals[top_category] / len(expense_df[expense_df['category'] == top_category].groupby(expense_df['date'].dt.to_period('M')))
            cap = avg_category_spending * 0.9  # 10% reduction
            goals.append(self._create_category_limit_goal(top_category, cap, avg_category_spending))
        
        # Goal 3: Daily spending cap
        if len(expense_df) > 0:
            daily_spending = expense_df.groupby(expense_df['date'].dt.date)['amount'].sum()
            avg_daily = daily_spending.mean()
            p75_daily = daily_spending.quantile(0.75)
            
            if p75_daily > avg_daily * 1.2:
                cap = avg_daily * 1.1
                goals.append(self._create_daily_spending_goal(cap, avg_daily))
        
        return {'goals': goals}
    
    def _create_savings_goal(self, target_amount: float, target_rate: float, current_rate: float) -> Dict:
        """Create savings target goal"""
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=30)
        
        return {
            'title': f'Achieve {target_rate}% Savings Rate',
            'description': f'Increase savings rate from {current_rate:.1f}% to {target_rate}%',
            'type': 'savings_target',
            'targetValue': target_amount,
            'period': 'monthly',
            'startDate': str(start_date),
            'endDate': str(end_date),
            'reasoning': f'Current savings rate ({current_rate:.1f}%) is below target ({target_rate}%). Aim to save ${target_amount:.2f} this month.',
            'evidence': [
                {'metric': 'current_savings_rate', 'value': current_rate, 'explanation': 'Current monthly savings rate'},
                {'metric': 'target_savings_rate', 'value': target_rate, 'explanation': 'Target savings rate from preferences'}
            ]
        }
    
    def _create_category_limit_goal(self, category: str, cap: float, current_avg: float) -> Dict:
        """Create category spending limit goal"""
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=30)
        
        return {
            'title': f'Reduce {category} Spending',
            'description': f'Limit {category} spending to ${cap:.2f} per month',
            'type': 'category_limit',
            'targetValue': cap,
            'period': 'monthly',
            'startDate': str(start_date),
            'endDate': str(end_date),
            'reasoning': f'{category} spending (${current_avg:.2f}/month) is high. Reducing to ${cap:.2f} will improve financial health.',
            'evidence': [
                {'metric': 'current_category_spending', 'value': current_avg, 'explanation': f'Average monthly spending on {category}'},
                {'metric': 'recommended_cap', 'value': cap, 'explanation': '10% reduction target'}
            ]
        }
    
    def _create_daily_spending_goal(self, cap: float, current_avg: float) -> Dict:
        """Create daily spending cap goal"""
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=7)
        
        return {
            'title': 'Daily Spending Cap',
            'description': f'Limit daily spending to ${cap:.2f}',
            'type': 'spending_cap',
            'targetValue': cap,
            'period': 'daily',
            'startDate': str(start_date),
            'endDate': str(end_date),
            'reasoning': f'Daily spending varies significantly. Capping at ${cap:.2f} (vs current avg ${current_avg:.2f}) will reduce volatility.',
            'evidence': [
                {'metric': 'average_daily_spending', 'value': current_avg, 'explanation': 'Average daily spending'},
                {'metric': 'recommended_cap', 'value': cap, 'explanation': '10% above average'}
            ]
        }


# Singleton instance
goal_recommender = GoalRecommender()
