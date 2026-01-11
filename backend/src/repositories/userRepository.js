import User from '../models/User.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * User repository
 * Data access layer for user operations
 * Separates database logic from business logic
 */
class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id) {
    const user = await User.findById(id).select('-password');
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() }).select('+password');
  }

  async update(id, updateData) {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  async delete(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async addRefreshToken(userId, token) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return await user.addRefreshToken(token);
  }

  async removeRefreshToken(userId, token) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return await user.removeRefreshToken(token);
  }
}

export default new UserRepository();
