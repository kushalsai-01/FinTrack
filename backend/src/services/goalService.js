import Goal from '../models/Goal.js';
import transactionRepository from '../repositories/transactionRepository.js';
import userRepository from '../repositories/userRepository.js';
import mlService from './mlService.js';
import logger from '../utils/logger.js';

/**
 * Goal service
 * Manages financial goals including AI-recommended goals
 */
class GoalService {
  async create(userId, goalData) {
    const goal = new Goal({
      ...goalData,
      userId,
      source: 'user',
    });

    return await goal.save();
  }

  async getAll(userId, filters = {}) {
    const query = { userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.source) {
      query.source = filters.source;
    }

    return await Goal.find(query).sort({ createdAt: -1 });
  }

  async getById(userId, goalId) {
    const goal = await Goal.findById(goalId);
    
    if (!goal || goal.userId.toString() !== userId.toString()) {
      throw new Error('Goal not found');
    }

    return goal;
  }

  async update(userId, goalId, updateData) {
    const goal = await this.getById(userId, goalId);
    
    Object.assign(goal, updateData);
    return await goal.save();
  }

  async delete(userId, goalId) {
    const goal = await this.getById(userId, goalId);
    await Goal.findByIdAndDelete(goalId);
    return goal;
  }

  async generateAIRecommendations(userId) {
    try {
      // Get user profile
      const user = await userRepository.findById(userId);

      // Get last 60 days of transactions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);

      const transactions = await transactionRepository.getByDateRange(userId, startDate, endDate);

      if (transactions.length < 10) {
        return { goals: [] };
      }

      const transactionHistory = transactions.map((t) => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
      }));

      const userProfile = {
        monthlyIncome: user.monthlyIncome,
        budgetPreferences: user.budgetPreferences,
      };

      // Call ML service
      const recommendations = await mlService.generateGoals(userId, transactionHistory, userProfile);

      // Create goal records
      const goals = [];
      for (const rec of recommendations.goals || []) {
        const goal = new Goal({
          userId,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          targetValue: rec.targetValue,
          period: rec.period,
          startDate: new Date(rec.startDate),
          endDate: new Date(rec.endDate),
          source: 'ai_recommended',
          aiReasoning: rec.reasoning,
          evidence: rec.evidence || [],
        });

        await goal.save();
        goals.push(goal);
      }

      logger.info('AI goals generated', { userId, count: goals.length });

      return { goals };
    } catch (error) {
      logger.error('AI goal generation error:', { userId, error: error.message });
      return { goals: [] };
    }
  }

  async updateProgress(userId, goalId) {
    const goal = await this.getById(userId, goalId);
    
    // Calculate current value based on goal type
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);

    let currentValue = 0;

    if (goal.type === 'spending_cap' || goal.type === 'category_limit') {
      // Sum expenses in period
      const transactions = await transactionRepository.getByDateRange(userId, startDate, endDate);
      currentValue = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    } else if (goal.type === 'savings_target') {
      // Calculate savings in period
      const transactions = await transactionRepository.getByDateRange(userId, startDate, endDate);
      const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      currentValue = income - expenses;
    }

    goal.currentValue = Math.max(currentValue, 0);
    goal.progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);

    if (goal.progress >= 100 && goal.status === 'active') {
      goal.status = 'completed';
    }

    return await goal.save();
  }
}

export default new GoalService();
