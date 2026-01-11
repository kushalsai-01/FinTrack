"""
Transaction category prediction service
Uses TF-IDF + Logistic Regression for explainable categorization
"""
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import logging

logger = logging.getLogger(__name__)


class CategoryPredictor:
    """
    Predicts transaction category and needs vs wants classification
    Uses TF-IDF for feature extraction and Logistic Regression for classification
    """
    
    def __init__(self):
        self.category_model = None
        self.needs_model = None
        self.vectorizer = None
        self.categories = [
            'Food & Dining', 'Rent & Utilities', 'Transportation', 'Shopping',
            'Entertainment', 'Healthcare', 'Education', 'Travel', 'Bills & Fees',
            'Other Expense', 'Salary', 'Freelance', 'Investment', 'Other Income'
        ]
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize models with training data"""
        # In production, load pre-trained models
        # For now, use rule-based + simple ML
        
        # TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1
        )
        
        # Category classifier
        self.category_model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            multi_class='multinomial'
        )
        
        # Needs vs Wants classifier
        self.needs_model = LogisticRegression(
            max_iter=1000,
            random_state=42
        )
        
        # Train with basic patterns (in production, use real training data)
        self._train_with_patterns()
    
    def _train_with_patterns(self):
        """Train models with pattern-based examples"""
        # Pattern-based training data
        patterns = {
            'Food & Dining': ['restaurant', 'grocery', 'food', 'coffee', 'lunch', 'dinner', 'cafe', 'pizza', 'burger'],
            'Rent & Utilities': ['rent', 'electricity', 'water', 'gas', 'utility', 'apartment', 'housing'],
            'Transportation': ['gas', 'uber', 'taxi', 'parking', 'metro', 'bus', 'train', 'flight'],
            'Shopping': ['amazon', 'store', 'purchase', 'buy', 'shopping', 'mall', 'retail'],
            'Entertainment': ['movie', 'concert', 'netflix', 'spotify', 'game', 'entertainment'],
            'Healthcare': ['doctor', 'pharmacy', 'hospital', 'medical', 'health', 'medicine'],
            'Education': ['school', 'tuition', 'course', 'book', 'education', 'university'],
            'Travel': ['hotel', 'vacation', 'trip', 'travel', 'flight', 'airline'],
            'Bills & Fees': ['bill', 'fee', 'subscription', 'service', 'charge'],
            'Salary': ['salary', 'payroll', 'wage', 'income', 'paycheck'],
            'Freelance': ['freelance', 'contract', 'consulting', 'project'],
            'Investment': ['investment', 'dividend', 'return', 'stock', 'bond'],
        }
        
        # Generate training data
        descriptions = []
        category_labels = []
        needs_labels = []
        
        needs_categories = ['Rent & Utilities', 'Healthcare', 'Bills & Fees', 'Transportation']
        
        for category, keywords in patterns.items():
            for keyword in keywords:
                descriptions.append(keyword)
                category_labels.append(category)
                # Needs vs Wants classification
                if category in needs_categories or category in ['Salary', 'Freelance', 'Investment']:
                    needs_labels.append('needs')
                else:
                    needs_labels.append('wants')
        
        # Vectorize
        X = self.vectorizer.fit_transform(descriptions)
        
        # Train models
        self.category_model.fit(X, category_labels)
        self.needs_model.fit(X, needs_labels)
        
        logger.info("Category prediction models initialized")
    
    def predict(self, description: str, amount: float, transaction_type: str) -> dict:
        """
        Predict category and needs vs wants
        
        Args:
            description: Transaction description
            amount: Transaction amount
            transaction_type: 'income' or 'expense'
        
        Returns:
            Dictionary with category, needsVsWants, confidence, and reasoning
        """
        # Clean description
        cleaned = self._clean_description(description)
        
        # Vectorize
        X = self.vectorizer.transform([cleaned])
        
        # Predict category
        category_probs = self.category_model.predict_proba(X)[0]
        category_idx = np.argmax(category_probs)
        predicted_category = self.category_model.classes_[category_idx]
        category_confidence = float(category_probs[category_idx])
        
        # Filter by transaction type
        if transaction_type == 'income':
            income_categories = ['Salary', 'Freelance', 'Investment', 'Other Income']
            if predicted_category not in income_categories:
                # Find best income category
                income_indices = [i for i, cat in enumerate(self.category_model.classes_) 
                                if cat in income_categories]
                if income_indices:
                    best_income_idx = max(income_indices, key=lambda i: category_probs[i])
                    predicted_category = self.category_model.classes_[best_income_idx]
                    category_confidence = float(category_probs[best_income_idx])
        else:
            expense_categories = [c for c in self.categories if c not in 
                                ['Salary', 'Freelance', 'Investment', 'Other Income']]
            if predicted_category not in expense_categories:
                expense_indices = [i for i, cat in enumerate(self.category_model.classes_) 
                                 if cat in expense_categories]
                if expense_indices:
                    best_expense_idx = max(expense_indices, key=lambda i: category_probs[i])
                    predicted_category = self.category_model.classes_[best_expense_idx]
                    category_confidence = float(category_probs[best_expense_idx])
        
        # Predict needs vs wants
        needs_probs = self.needs_model.predict_proba(X)[0]
        needs_idx = np.argmax(needs_probs)
        needs_prediction = self.needs_model.classes_[needs_idx]
        needs_confidence = float(needs_probs[needs_idx])
        
        # Determine final needs vs wants
        if transaction_type == 'income':
            needs_vs_wants = 'unknown'
        else:
            needs_vs_wants = needs_prediction if needs_confidence > 0.6 else 'unknown'
        
        # Overall confidence (average)
        overall_confidence = (category_confidence + needs_confidence) / 2
        
        # Generate reasoning
        reasoning = self._generate_reasoning(description, predicted_category, needs_vs_wants, overall_confidence)
        
        return {
            'category': predicted_category,
            'needsVsWants': needs_vs_wants,
            'confidence': overall_confidence,
            'reasoning': reasoning
        }
    
    def _clean_description(self, description: str) -> str:
        """Clean and normalize description"""
        # Lowercase
        text = description.lower()
        # Remove special characters (keep spaces)
        text = re.sub(r'[^a-z0-9\s]', '', text)
        # Remove extra spaces
        text = ' '.join(text.split())
        return text
    
    def _generate_reasoning(self, description: str, category: str, needs_vs_wants: str, confidence: float) -> str:
        """Generate human-readable reasoning"""
        confidence_level = "high" if confidence > 0.7 else "medium" if confidence > 0.5 else "low"
        
        reasoning = f"Predicted category '{category}' with {confidence_level} confidence ({confidence:.1%}) "
        reasoning += f"based on description: '{description}'. "
        
        if needs_vs_wants != 'unknown':
            reasoning += f"Classified as '{needs_vs_wants}' based on category patterns."
        
        return reasoning


# Singleton instance
category_predictor = CategoryPredictor()
