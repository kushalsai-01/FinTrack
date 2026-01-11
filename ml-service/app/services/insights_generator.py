"""
Insights generation service
Generates explainable, data-driven insights and nudges
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class InsightsGenerator:
    """
    Generates natural language insights based on transaction data
    All insights are evidence-based and explainable
    """
    
    def generate(self, transactions: List[Dict], profile: Dict, health_score: Dict = None) -> Dict[str, Any]:
        """
        Generate insights and nudges
        
        Args:
            transactions: List of transaction dictionaries
            profile: User profile
            health_score: Optional health score data
        
        Returns:
            Dictionary with insights
        """
        if len(transactions) < 10:
            return {'insights': []}
        
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        
        insights = []
        
        # Analyze spending trends
        expense_df = df[df['type'] == 'expense']
        income_df = df[df['type'] == 'income']
        
        # Insight 1: Spending trend
        if len(expense_df) >= 14:
            recent_week = expense_df[expense_df['date'] >= (df['date'].max() - timedelta(days=7))]
            previous_week = expense_df[
                (expense_df['date'] >= (df['date'].max() - timedelta(days=14))) &
                (expense_df['date'] < (df['date'].max() - timedelta(days=7)))
            ]
            
            if len(recent_week) > 0 and len(previous_week) > 0:
                recent_total = recent_week['amount'].sum()
                previous_total = previous_week['amount'].sum()
                
                if recent_total > previous_total * 1.2:
                    insights.append({
                        'type': 'spending_increase',
                        'title': 'Spending Increase Detected',
                        'message': f'Your spending increased by {((recent_total/previous_total - 1) * 100):.1f}% compared to last week. This week: ${recent_total:.2f} vs last week: ${previous_total:.2f}.',
                        'evidence': [
                            {'metric': 'this_week_spending', 'value': recent_total, 'explanation': 'Total spending this week'},
                            {'metric': 'last_week_spending', 'value': previous_total, 'explanation': 'Total spending last week'}
                        ],
                        'priority': 'medium',
                        'actionable': True
                    })
        
        # Insight 2: Category analysis
        category_totals = expense_df.groupby('category')['amount'].sum().sort_values(ascending=False)
        if len(category_totals) > 0:
            top_category = category_totals.index[0]
            top_amount = category_totals.iloc[0]
            total_expenses = expense_df['amount'].sum()
            category_percentage = (top_amount / total_expenses * 100) if total_expenses > 0 else 0
            
            if category_percentage > 40:
                insights.append({
                    'type': 'category_concentration',
                    'title': f'High Spending in {top_category}',
                    'message': f'{top_category} accounts for {category_percentage:.1f}% of your total expenses (${top_amount:.2f}). Consider diversifying spending or reviewing this category.',
                    'evidence': [
                        {'metric': 'category', 'value': top_category, 'explanation': 'Top spending category'},
                        {'metric': 'category_percentage', 'value': category_percentage, 'explanation': 'Percentage of total expenses'},
                        {'metric': 'category_amount', 'value': top_amount, 'explanation': 'Total spent in category'}
                    ],
                    'priority': 'high',
                    'actionable': True
                })
        
        # Insight 3: Savings opportunity
        if len(income_df) > 0 and len(expense_df) > 0:
            monthly_income = profile.get('monthlyIncome', 0)
            if monthly_income > 0:
                avg_monthly_expenses = expense_df.groupby(expense_df['date'].dt.to_period('M'))['amount'].sum().mean()
                current_savings = monthly_income - avg_monthly_expenses
                savings_rate = (current_savings / monthly_income * 100) if monthly_income > 0 else 0
                
                if savings_rate < 10:
                    potential_savings = monthly_income * 0.1 - current_savings
                    insights.append({
                        'type': 'savings_opportunity',
                        'title': 'Savings Opportunity',
                        'message': f'Your current savings rate is {savings_rate:.1f}%. By reducing expenses by ${potential_savings:.2f} per month, you could reach a 10% savings rate.',
                        'evidence': [
                            {'metric': 'current_savings_rate', 'value': savings_rate, 'explanation': 'Current monthly savings rate'},
                            {'metric': 'monthly_income', 'value': monthly_income, 'explanation': 'Monthly income'},
                            {'metric': 'monthly_expenses', 'value': avg_monthly_expenses, 'explanation': 'Average monthly expenses'}
                        ],
                        'priority': 'high',
                        'actionable': True
                    })
        
        # Insight 4: Health score based
        if health_score:
            overall_score = health_score.get('overallScore', 0)
            if overall_score < 60:
                insights.append({
                    'type': 'health_score',
                    'title': 'Financial Health Needs Attention',
                    'message': f'Your financial health score is {overall_score:.1f}/100. Focus on improving savings rate and reducing spending volatility.',
                    'evidence': [
                        {'metric': 'health_score', 'value': overall_score, 'explanation': 'Overall financial health score'}
                    ],
                    'priority': 'high',
                    'actionable': True
                })
        
        return {'insights': insights}


# Singleton instance
insights_generator = InsightsGenerator()
