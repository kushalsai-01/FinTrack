import cron from 'node-cron';
import forecastService from '../services/forecastService.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Background job for generating forecasts
 * Runs daily at 3 AM to generate forecasts for all active users
 */
class ForecastJob {
  start() {
    // Run daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      logger.info('Starting daily forecast generation job');

      try {
        const users = await User.find({ isActive: true }).select('_id');

        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
          try {
            // Generate 30-day forecast
            await forecastService.generateAndStore(user._id, '30day');
            successCount++;
          } catch (error) {
            // User might not have enough transaction history
            if (error.message.includes('Insufficient transaction history')) {
              logger.debug(`Skipping forecast for user ${user._id}: insufficient data`);
            } else {
              logger.error(`Forecast generation failed for user ${user._id}:`, error);
            }
            errorCount++;
          }
        }

        logger.info('Forecast job completed', {
          total: users.length,
          success: successCount,
          errors: errorCount,
        });
      } catch (error) {
        logger.error('Forecast job error:', error);
      }
    });

    logger.info('Forecast job scheduled (daily at 3 AM)');
  }
}

export default new ForecastJob();
