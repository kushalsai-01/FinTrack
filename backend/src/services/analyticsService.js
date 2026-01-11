import transactionRepository from '../repositories/transactionRepository.js';
import Budget from '../models/Budget.js';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Analytics service
 * Computes financial analytics and aggregates
 * Uses Redis for caching computed metrics
 */
class AnalyticsService {
  async getMonthlySummary(userId, year, month) {
    const cacheKey = `analytics:monthly:${userId}:${year}:${month}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return cached;
    }

    const summary = await transactionRepository.getMonthlySummary(userId, year, month);
    
    // Cache for 5 minutes
    await redisClient.set(cacheKey, summary, 300);
    
    return summary;
  }

  async getCategoryBreakdown(userId, startDate, endDate, type = null) {
    const cacheKey = `analytics:category:${userId}:${startDate}:${endDate}:${type || 'all'}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return cached;
    }

    const totals = await transactionRepository.getCategoryTotals(userId, startDate, endDate, type);
    
    await redisClient.set(cacheKey, totals, 300);
    
    return totals;
  }

  async getBudgetProgress(userId, year, month) {
    const budgets = await Budget.find({
      userId,
      year,
      month,
      isActive: true,
    }).lean();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const categoryTotals = await transactionRepository.getCategoryTotals(
      userId,
      startDate,
      endDate,
      'expense'
    );

    const totalsMap = new Map(
      categoryTotals.map((item) => [item._id, item.total])
    );

    const progress = budgets.map((budget) => {
      const spent = totalsMap.get(budget.category) || 0;
      const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = Math.max(budget.amount - spent, 0);

      return {
        category: budget.category,
        budgeted: budget.amount,
        spent,
        remaining,
        utilization: Math.min(utilization, 100),
        status: utilization >= 100 ? 'exceeded' : utilization >= 80 ? 'warning' : 'ok',
      };
    });

    return progress;
  }

  async getTrends(userId, months = 6) {
    const trends = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const summary = await this.getMonthlySummary(userId, year, month);
      
      trends.push({
        year,
        month,
        monthName: date.toLocaleString('default', { month: 'long' }),
        ...summary,
      });
    }

    return trends;
  }

  async getSavingsRate(userId, year, month) {
    const summary = await this.getMonthlySummary(userId, year, month);
    
    if (summary.totalIncome === 0) {
      return 0;
    }

    return (summary.savings / summary.totalIncome) * 100;
  }
}

export default new AnalyticsService();
