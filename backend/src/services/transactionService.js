import transactionRepository from '../repositories/transactionRepository.js';
import categoryRepository from '../repositories/categoryRepository.js';
import Budget from '../models/Budget.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import mlService from './mlService.js';
import logger from '../utils/logger.js';

/**
 * Transaction service
 * Handles transaction business logic and ML integration
 * Orchestrates transaction creation with AI categorization
 */
class TransactionService {
  async create(userId, transactionData) {
    const { amount, description, type, date, category, notes, paymentMethod } = transactionData;

    // Validate category exists for user
    let finalCategory = category;
    if (category) {
      const categoryExists = await categoryRepository.findByName(userId, category);
      if (!categoryExists) {
        throw new ValidationError(`Category "${category}" does not exist`);
      }
    }

    // Prepare transaction object
    const transaction = {
      userId,
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      notes: notes?.trim() || '',
      paymentMethod: paymentMethod || 'card',
      date: date ? new Date(date) : new Date(),
      category: finalCategory || 'Other Expense',
      categorySource: category ? 'user' : 'auto',
      needsVsWants: 'unknown',
      needsVsWantsSource: 'user',
    };

    // Get AI prediction if no category provided
    if (!category) {
      try {
        const prediction = await mlService.predictCategory({
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          paymentMethod: transaction.paymentMethod,
        });

        if (prediction) {
          transaction.category = prediction.category;
          transaction.categorySource = 'ai';
          transaction.needsVsWants = prediction.needsVsWants || 'unknown';
          transaction.needsVsWantsSource = 'ai';
          transaction.aiConfidence = prediction.confidence || null;
        }
      } catch (error) {
        logger.error('ML service error during transaction creation:', error);
        // Continue without AI prediction - use default category
        transaction.category = type === 'income' ? 'Other Income' : 'Other Expense';
      }
    }

    // Create transaction
    const createdTransaction = await transactionRepository.create(transaction);

    // Update budget if it's an expense
    if (type === 'expense' && createdTransaction.category) {
      const transactionDate = new Date(createdTransaction.date);
      await Budget.updateSpent(
        userId,
        createdTransaction.category,
        transactionDate.getMonth() + 1,
        transactionDate.getFullYear(),
        createdTransaction.amount
      );
    }

    return createdTransaction;
  }

  async getById(userId, transactionId) {
    const transaction = await transactionRepository.findById(transactionId);
    
    // Verify ownership
    if (transaction.userId.toString() !== userId.toString()) {
      throw new NotFoundError('Transaction');
    }

    return transaction;
  }

  async getAll(userId, filters = {}) {
    return await transactionRepository.findByUserId(userId, filters);
  }

  async update(userId, transactionId, updateData) {
    const existingTransaction = await this.getById(userId, transactionId);

    // If category or amount changed, update budget
    if (updateData.category || updateData.amount) {
      const oldDate = new Date(existingTransaction.date);
      
      // Revert old budget entry
      if (existingTransaction.type === 'expense') {
        await Budget.updateSpent(
          userId,
          existingTransaction.category,
          oldDate.getMonth() + 1,
          oldDate.getFullYear(),
          -existingTransaction.amount
        );
      }

      // Apply new budget entry
      const newAmount = updateData.amount || existingTransaction.amount;
      const newCategory = updateData.category || existingTransaction.category;
      const newDate = updateData.date ? new Date(updateData.date) : oldDate;

      if (existingTransaction.type === 'expense') {
        await Budget.updateSpent(
          userId,
          newCategory,
          newDate.getMonth() + 1,
          newDate.getFullYear(),
          newAmount
        );
      }
    }

    // Update transaction
    return await transactionRepository.update(transactionId, updateData);
  }

  async delete(userId, transactionId) {
    const transaction = await this.getById(userId, transactionId);

    // Revert budget entry
    if (transaction.type === 'expense') {
      const transactionDate = new Date(transaction.date);
      await Budget.updateSpent(
        userId,
        transaction.category,
        transactionDate.getMonth() + 1,
        transactionDate.getFullYear(),
        -transaction.amount
      );
    }

    return await transactionRepository.delete(transactionId);
  }

  async getMonthlySummary(userId, year, month) {
    return await transactionRepository.getMonthlySummary(userId, year, month);
  }

  async getCategoryTotals(userId, startDate, endDate, type = null) {
    return await transactionRepository.getCategoryTotals(userId, startDate, endDate, type);
  }
}

export default new TransactionService();
