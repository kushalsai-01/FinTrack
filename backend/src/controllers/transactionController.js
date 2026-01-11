import transactionService from '../services/transactionService.js';

/**
 * Transaction controller
 * Handles HTTP requests for transaction endpoints
 */
class TransactionController {
  async create(req, res, next) {
    try {
      const transaction = await transactionService.create(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await transactionService.getAll(req.user.id, req.query);
      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const transaction = await transactionService.getById(req.user.id, req.params.id);
      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const transaction = await transactionService.update(
        req.user.id,
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await transactionService.delete(req.user.id, req.params.id);
      res.json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlySummary(req, res, next) {
    try {
      const { year, month } = req.query;
      const summary = await transactionService.getMonthlySummary(
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

  async getCategoryTotals(req, res, next) {
    try {
      const { startDate, endDate, type } = req.query;
      const totals = await transactionService.getCategoryTotals(
        req.user.id,
        startDate,
        endDate,
        type
      );
      res.json({
        success: true,
        data: totals,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
