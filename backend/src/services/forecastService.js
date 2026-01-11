import Forecast from '../models/Forecast.js';
import transactionRepository from '../repositories/transactionRepository.js';
import mlService from './mlService.js';
import logger from '../utils/logger.js';

/**
 * Forecast service
 * Generates and manages cash flow forecasts using ML service
 */
class ForecastService {
  async generateAndStore(userId, forecastType = '30day') {
    try {
      // Get last 90 days of transactions for training
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const transactions = await transactionRepository.getByDateRange(userId, startDate, endDate);

      if (transactions.length < 30) {
        throw new Error('Insufficient transaction history for forecasting (minimum 30 days)');
      }

      // Prepare transaction history
      const transactionHistory = transactions.map((t) => ({
        amount: t.signedAmount, // Use signed amount (positive/negative)
        date: t.date,
        type: t.type,
        category: t.category,
      }));

      // Call ML service
      const forecastData = await mlService.generateForecast(userId, transactionHistory, forecastType);

      // Store forecast
      const forecast = new Forecast({
        userId,
        forecastType,
        startDate: new Date(),
        predictions: forecastData.predictions,
        riskIndicator: forecastData.riskIndicator,
        riskScore: forecastData.riskScore,
        metadata: forecastData.metadata || {},
      });

      await forecast.save();

      logger.info('Forecast generated and stored', { userId, forecastType });

      return forecast;
    } catch (error) {
      logger.error('Forecast generation error:', { userId, error: error.message });
      throw error;
    }
  }

  async getLatest(userId, forecastType = '30day') {
    return await Forecast.getLatest(userId, forecastType);
  }

  async getAll(userId) {
    return await Forecast.find({ userId }).sort({ computedAt: -1 }).lean();
  }
}

export default new ForecastService();
