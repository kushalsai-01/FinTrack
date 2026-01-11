import analyticsService from '../services/analyticsService.js';

/**
 * Analytics controller
 * Handles HTTP requests for analytics endpoints
 */
class AnalyticsController {
  async getMonthlySummary(req, res, next) {
    try {
      const { year, month } = req.query;
      const summary = await analyticsService.getMonthlySummary(
        req.user.id,
        parseInt(year),
        parseInt(month)
      );
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBreakdown(req, res, next) {
    try {
      const { startDate, endDate, type } = req.query;
      const breakdown = await analyticsService.getCategoryBreakdown(
        req.user.id,
        startDate,
        endDate,
        type
      );
      res.json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBudgetProgress(req, res, next) {
    try {
      const { year, month } = req.query;
      const progress = await analyticsService.getBudgetProgress(
        req.user.id,
        parseInt(year),
        parseInt(month)
      );
      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const { months } = req.query;
      const trends = await analyticsService.getTrends(
        req.user.id,
        parseInt(months) || 6
      );
      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSavingsRate(req, res, next) {
    try {
      const { year, month } = req.query;
      const rate = await analyticsService.getSavingsRate(
        req.user.id,
        parseInt(year),
        parseInt(month)
      );
      res.json({
        success: true,
        data: { savingsRate: rate },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
