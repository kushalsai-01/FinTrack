import categoryService from '../services/categoryService.js';

/**
 * Category controller
 * Handles HTTP requests for category endpoints
 */
class CategoryController {
  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const categories = await categoryService.getAll(req.user.id, req.query);
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await categoryService.getById(req.user.id, req.params.id);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.update(
        req.user.id,
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await categoryService.delete(req.user.id, req.params.id);
      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async initializeDefaults(req, res, next) {
    try {
      const categories = await categoryService.initializeDefaults(req.user.id);
      res.json({
        success: true,
        data: categories,
        message: 'Default categories initialized',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
