import healthScoreService from '../services/healthScoreService.js';

/**
 * Health score controller
 * Handles HTTP requests for financial health score endpoints
 */
class HealthController {
  async compute(req, res, next) {
    try {
      const healthScore = await healthScoreService.computeAndStore(req.user.id);
      res.json({
        success: true,
        data: healthScore,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLatest(req, res, next) {
    try {
      const healthScore = await healthScoreService.getLatest(req.user.id);
      if (!healthScore) {
        return res.json({
          success: true,
          data: null,
          message: 'No health score computed yet',
        });
      }
      res.json({
        success: true,
        data: healthScore,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { limit } = req.query;
      const history = await healthScoreService.getHistory(
        req.user.id,
        parseInt(limit) || 30
      );
      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new HealthController();
