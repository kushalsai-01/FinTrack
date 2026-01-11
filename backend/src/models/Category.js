import mongoose from 'mongoose';

/**
 * Category schema
 * Manages both default and user-defined categories
 * Supports budget tracking per category
 */
const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'both'],
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: '💰',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    monthlyBudget: {
      type: Number,
      default: null,
      min: [0, 'Budget cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: user can't have duplicate category names
categorySchema.index({ userId: 1, name: 1 }, { unique: true });
categorySchema.index({ userId: 1, isActive: 1 });

// Static method to get or create default categories
categorySchema.statics.initializeDefaults = async function (userId) {
  const defaultCategories = [
    { name: 'Salary', type: 'income', icon: '💼', color: '#10b981' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#10b981' },
    { name: 'Investment', type: 'income', icon: '📈', color: '#10b981' },
    { name: 'Other Income', type: 'income', icon: '💰', color: '#10b981' },
    { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444' },
    { name: 'Rent & Utilities', type: 'expense', icon: '🏠', color: '#ef4444' },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#ef4444' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ef4444' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#ef4444' },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#ef4444' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#ef4444' },
    { name: 'Travel', type: 'expense', icon: '✈️', color: '#ef4444' },
    { name: 'Bills & Fees', type: 'expense', icon: '📄', color: '#ef4444' },
    { name: 'Other Expense', type: 'expense', icon: '💸', color: '#ef4444' },
  ];

  const existingCategories = await this.find({ userId, isDefault: true });
  const existingNames = new Set(existingCategories.map((c) => c.name));

  const categoriesToCreate = defaultCategories
    .filter((cat) => !existingNames.has(cat.name))
    .map((cat) => ({
      ...cat,
      userId,
      isDefault: true,
    }));

  if (categoriesToCreate.length > 0) {
    await this.insertMany(categoriesToCreate);
  }

  return this.find({ userId });
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
