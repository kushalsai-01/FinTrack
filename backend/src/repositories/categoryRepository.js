import Category from '../models/Category.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Category repository
 * Data access layer for category operations
 */
class CategoryRepository {
  async create(categoryData) {
    const category = new Category(categoryData);
    return await category.save();
  }

  async findById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return category;
  }

  async findByUserId(userId, filters = {}) {
    const query = { userId };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return await Category.find(query).sort({ isDefault: -1, name: 1 });
  }

  async update(id, updateData) {
    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new NotFoundError('Category');
    }

    return category;
  }

  async delete(id) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return category;
  }

  async initializeDefaults(userId) {
    return await Category.initializeDefaults(userId);
  }

  async findByName(userId, name) {
    return await Category.findOne({ userId, name: name.trim() });
  }
}

export default new CategoryRepository();
