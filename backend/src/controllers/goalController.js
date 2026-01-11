import goalService from '../services/goalService.js';

/**
 * Goal controller
 * Handles HTTP requests for goal endpoints
 */
class GoalController {
  async create(req, res, next) {
    try {
      const goal = await goalService.create(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const goals = await goalService.getAll(req.user.id, req.query);
      res.json({
        success: true,
        data: goals,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const goal = await goalService.getById(req.user.id, req.params.id);
      res.json({
        success: true,
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const goal = await goalService.update(req.user.id, req.params.id, req.body);
      res.json({
        success: true,
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await goalService.delete(req.user.id, req.params.id);
      res.json({
        success: true,
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async generateRecommendations(req, res, next) {
    try {
      const result = await goalService.generateAIRecommendations(req.user.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProgress(req, res, next) {
    try {
      const goal = await goalService.updateProgress(req.user.id, req.params.id);
      res.json({
        success: true,
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new GoalController();
