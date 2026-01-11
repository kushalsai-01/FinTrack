import userRepository from '../repositories/userRepository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import Category from '../models/Category.js';

/**
 * Authentication service
 * Handles user registration, login, and token management
 * Business logic layer - no direct database access
 */
class AuthService {
  async register(userData) {
    const { email, password, firstName, lastName, monthlyIncome, currency } = userData;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create user
    const user = await userRepository.create({
      email,
      password,
      firstName,
      lastName,
      monthlyIncome: monthlyIncome || 0,
      currency: currency || 'USD',
    });

    // Initialize default categories for new user
    await Category.initializeDefaults(user._id);

    // Generate tokens
    const accessToken = generateAccessToken({ id: user._id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Store refresh token
    await userRepository.addRefreshToken(user._id, refreshToken);

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        monthlyIncome: user.monthlyIncome,
        currency: user.currency,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({ id: user._id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Store refresh token
    await userRepository.addRefreshToken(user._id, refreshToken);

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        monthlyIncome: user.monthlyIncome,
        currency: user.currency,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await userRepository.findById(decoded.id);

      // Generate new access token
      const accessToken = generateAccessToken({ id: user._id, email: user.email });

      return { accessToken };
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId, refreshToken) {
    await userRepository.removeRefreshToken(userId, refreshToken);
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId) {
    return await userRepository.findById(userId);
  }

  async updateProfile(userId, updateData) {
    // Prevent role updates via this endpoint
    const { role, ...allowedUpdates } = updateData;
    return await userRepository.update(userId, allowedUpdates);
  }
}

export default new AuthService();
