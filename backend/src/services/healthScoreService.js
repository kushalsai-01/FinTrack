import FinancialHealth from '../models/FinancialHealth.js';
import transactionRepository from '../repositories/transactionRepository.js';
import userRepository from '../repositories/userRepository.js';
import mlService from './mlService.js';
import logger from '../utils/logger.js';

/**
 * Financial Health Score service
 * Orchestrates health score computation using ML service
 * Stores results with explainability
 */
class HealthScoreService {
  async computeAndStore(userId) {
    try {
      // Get user profile
      const user = await userRepository.findById(userId);

      // Get last 90 days of transactions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const transactions = await transactionRepository.getByDateRange(userId, startDate, endDate);

      // Prepare data for ML service
      const transactionHistory = transactions.map((t) => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
        description: t.description,
      }));

      const userProfile = {
        monthlyIncome: user.monthlyIncome,
        currency: user.currency,
        budgetPreferences: user.budgetPreferences,
      };

      // Call ML service
      const healthData = await mlService.computeHealthScore(
        userId,
        transactionHistory,
        userProfile
      );

      // Store health score
      const healthScore = new FinancialHealth({
        userId,
        date: new Date(),
        overallScore: healthData.overallScore,
        subScores: healthData.subScores,
        explanation: healthData.explanation,
        metrics: healthData.metrics,
        recommendations: healthData.recommendations || [],
      });

      await healthScore.save();

      logger.info('Health score computed and stored', { userId, score: healthData.overallScore });

      return healthScore;
    } catch (error) {
      logger.error('Health score computation error:', { userId, error: error.message });
      throw error;
    }
  }

  async getLatest(userId) {
    return await FinancialHealth.getLatest(userId);
  }

  async getHistory(userId, limit = 30) {
    return await FinancialHealth.find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
  }
}

export default new HealthScoreService();
