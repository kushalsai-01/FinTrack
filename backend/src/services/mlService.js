import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * ML Service client
 * Communicates with Python ML microservice
 * Handles all AI/ML operations via REST API
 */
class MLService {
  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.ML_SERVICE_TIMEOUT || '30000');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Predict transaction category and needs vs wants
   */
  async predictCategory(transactionData) {
    try {
      const response = await this.client.post('/api/v1/predict/category', transactionData);
      return response.data;
    } catch (error) {
      logger.error('ML service category prediction error:', {
        error: error.message,
        data: transactionData,
      });
      return null;
    }
  }

  /**
   * Compute financial health score
   */
  async computeHealthScore(userId, transactionHistory, userProfile) {
    try {
      const response = await this.client.post('/api/v1/health/score', {
        userId,
        transactions: transactionHistory,
        profile: userProfile,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service health score error:', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate cash flow forecast
   */
  async generateForecast(userId, transactionHistory, forecastType = '30day') {
    try {
      const response = await this.client.post('/api/v1/forecast/generate', {
        userId,
        transactions: transactionHistory,
        forecastType,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service forecast error:', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Detect anomalies in transactions
   */
  async detectAnomalies(userId, transactions) {
    try {
      const response = await this.client.post('/api/v1/anomaly/detect', {
        userId,
        transactions,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service anomaly detection error:', {
        error: error.message,
        userId,
      });
      return { anomalies: [], riskLevel: 'low' };
    }
  }

  /**
   * Generate AI-recommended goals
   */
  async generateGoals(userId, transactionHistory, userProfile) {
    try {
      const response = await this.client.post('/api/v1/goals/recommend', {
        userId,
        transactions: transactionHistory,
        profile: userProfile,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service goal recommendation error:', {
        error: error.message,
        userId,
      });
      return { goals: [] };
    }
  }

  /**
   * Generate explainable insights/nudges
   */
  async generateInsights(userId, transactionHistory, userProfile, healthScore) {
    try {
      const response = await this.client.post('/api/v1/insights/generate', {
        userId,
        transactions: transactionHistory,
        profile: userProfile,
        healthScore,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service insights error:', {
        error: error.message,
        userId,
      });
      return { insights: [] };
    }
  }
}

export default new MLService();
