import Transaction from '../models/Transaction.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Transaction repository
 * Data access layer for transaction operations
 */
class TransactionRepository {
  async create(transactionData) {
    const transaction = new Transaction(transactionData);
    return await transaction.save();
  }

  async findById(id) {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      throw new NotFoundError('Transaction');
    }
    return transaction;
  }

  async findByUserId(userId, filters = {}) {
    const query = { userId };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id, updateData) {
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    return transaction;
  }

  async delete(id) {
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      throw new NotFoundError('Transaction');
    }
    return transaction;
  }

  async getByDateRange(userId, startDate, endDate) {
    return await Transaction.getByDateRange(userId, startDate, endDate);
  }

  async getCategoryTotals(userId, startDate, endDate, type = null) {
    return await Transaction.getCategoryTotals(userId, startDate, endDate, type);
  }

  async getMonthlySummary(userId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.getByDateRange(userId, startDate, endDate);

    const summary = transactions.reduce(
      (acc, txn) => {
        if (txn.type === 'income') {
          acc.totalIncome += txn.amount;
        } else {
          acc.totalExpenses += txn.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );

    summary.savings = summary.totalIncome - summary.totalExpenses;
    summary.transactionCount = transactions.length;

    return summary;
  }
}

export default new TransactionRepository();
