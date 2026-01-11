import dotenv from 'dotenv';
import database from '../config/database.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import logger from '../utils/logger.js';

dotenv.config();

/**
 * Seed script for development
 * Creates sample users and transactions for testing
 */
async function seed() {
  try {
    await database.connect(process.env.MONGODB_URI);

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Transaction.deleteMany({});

    logger.info('Cleared existing data');

    // Create test user
    const user = await User.create({
      email: 'test@finsight.ai',
      password: 'Test1234!',
      firstName: 'John',
      lastName: 'Doe',
      monthlyIncome: 5000,
      currency: 'USD',
      budgetPreferences: {
        savingsTarget: 20,
        alertThreshold: 80,
      },
    });

    logger.info('Created test user:', user.email);

    // Initialize default categories
    await Category.initializeDefaults(user._id);
    const categories = await Category.find({ userId: user._id });
    logger.info(`Initialized ${categories.length} default categories`);

    // Create sample transactions for last 90 days
    const now = new Date();
    const transactions = [];

    // Income transactions (monthly salary)
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      transactions.push({
        userId: user._id,
        type: 'income',
        amount: 5000,
        description: 'Monthly Salary',
        category: 'Salary',
        categorySource: 'user',
        paymentMethod: 'bank_transfer',
        date,
      });
    }

    // Expense transactions (varied)
    const expenseCategories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Rent & Utilities'];
    const descriptions = [
      ['Grocery Store', 'Restaurant', 'Coffee Shop', 'Fast Food'],
      ['Gas Station', 'Uber Ride', 'Parking', 'Public Transport'],
      ['Amazon Purchase', 'Clothing Store', 'Electronics', 'Online Shopping'],
      ['Movie Tickets', 'Concert', 'Streaming Service', 'Games'],
      ['Rent Payment', 'Electricity Bill', 'Internet Bill', 'Water Bill'],
    ];

    for (let day = 0; day < 90; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      // Random expense (not every day)
      if (Math.random() > 0.3) {
        const categoryIndex = Math.floor(Math.random() * expenseCategories.length);
        const category = expenseCategories[categoryIndex];
        const descList = descriptions[categoryIndex];
        const description = descList[Math.floor(Math.random() * descList.length)];

        transactions.push({
          userId: user._id,
          type: 'expense',
          amount: Math.round((Math.random() * 200 + 10) * 100) / 100,
          description,
          category,
          categorySource: 'user',
          paymentMethod: ['card', 'cash', 'digital_wallet'][Math.floor(Math.random() * 3)],
          date,
        });
      }
    }

    await Transaction.insertMany(transactions);
    logger.info(`Created ${transactions.length} sample transactions`);

    logger.info('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
