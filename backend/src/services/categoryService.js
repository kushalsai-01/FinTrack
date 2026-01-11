import categoryRepository from '../repositories/categoryRepository.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Category service
 * Handles category business logic
 */
class CategoryService {
  async create(userId, categoryData) {
    const { name, type, monthlyBudget, icon, color } = categoryData;

    // Check if category already exists
    const existing = await categoryRepository.findByName(userId, name);
    if (existing) {
      throw new ValidationError(`Category "${name}" already exists`);
    }

    return await categoryRepository.create({
      userId,
      name: name.trim(),
      type,
      monthlyBudget: monthlyBudget || null,
      icon: icon || '💰',
      color: color || '#6366f1',
      isDefault: false,
    });
  }

  async getAll(userId, filters = {}) {
    return await categoryRepository.findByUserId(userId, filters);
  }

  async getById(userId, categoryId) {
    return await categoryRepository.findById(categoryId);
  }

  async update(userId, categoryId, updateData) {
    const category = await categoryRepository.findById(categoryId);

    // Verify ownership
    if (category.userId.toString() !== userId.toString()) {
      throw new ValidationError('Category not found');
    }

    // Prevent modifying default categories' core properties
    if (category.isDefault && updateData.name) {
      throw new ValidationError('Cannot rename default categories');
    }

    // Check name uniqueness if name is being updated
    if (updateData.name && updateData.name !== category.name) {
      const existing = await categoryRepository.findByName(userId, updateData.name);
      if (existing && existing._id.toString() !== categoryId) {
        throw new ValidationError(`Category "${updateData.name}" already exists`);
      }
    }

    return await categoryRepository.update(categoryId, updateData);
  }

  async delete(userId, categoryId) {
    const category = await categoryRepository.findById(categoryId);

    // Verify ownership
    if (category.userId.toString() !== userId.toString()) {
      throw new ValidationError('Category not found');
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      throw new ValidationError('Cannot delete default categories');
    }

    return await categoryRepository.delete(categoryId);
  }

  async initializeDefaults(userId) {
    return await categoryRepository.initializeDefaults(userId);
  }
}

export default new CategoryService();
