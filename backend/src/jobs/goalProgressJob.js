import cron from 'node-cron';
import goalService from '../services/goalService.js';
import Goal from '../models/Goal.js';
import logger from '../utils/logger.js';

/**
 * Background job for updating goal progress
 * Runs every 6 hours to update progress for active goals
 */
class GoalProgressJob {
  start() {
    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      logger.info('Starting goal progress update job');

      try {
        const activeGoals = await Goal.find({ status: 'active' }).select('_id userId');

        let successCount = 0;
        let errorCount = 0;

        for (const goal of activeGoals) {
          try {
            await goalService.updateProgress(goal.userId, goal._id);
            successCount++;
          } catch (error) {
            logger.error(`Goal progress update failed for goal ${goal._id}:`, error);
            errorCount++;
          }
        }

        logger.info('Goal progress job completed', {
          total: activeGoals.length,
          success: successCount,
          errors: errorCount,
        });
      } catch (error) {
        logger.error('Goal progress job error:', error);
      }
    });

    logger.info('Goal progress job scheduled (every 6 hours)');
  }
}

export default new GoalProgressJob();
