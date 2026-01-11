import cron from 'node-cron';
import healthScoreService from '../services/healthScoreService.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Background job for computing financial health scores
 * Runs daily at 2 AM to compute scores for all active users
 */
class HealthScoreJob {
  start() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Starting daily health score computation job');

      try {
        const users = await User.find({ isActive: true }).select('_id');

        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
          try {
            await healthScoreService.computeAndStore(user._id);
            successCount++;
          } catch (error) {
            logger.error(`Health score computation failed for user ${user._id}:`, error);
            errorCount++;
          }
        }

        logger.info('Health score job completed', {
          total: users.length,
          success: successCount,
          errors: errorCount,
        });
      } catch (error) {
        logger.error('Health score job error:', error);
      }
    });

    logger.info('Health score job scheduled (daily at 2 AM)');
  }
}

export default new HealthScoreJob();
