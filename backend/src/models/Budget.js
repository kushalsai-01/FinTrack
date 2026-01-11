import mongoose from 'mongoose';

/**
 * Budget schema
 * Tracks monthly budgets per category
 * Supports budget vs actual analysis
 */
const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget amount cannot be negative'],
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
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

// Compound unique index: one budget per category per month
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });
budgetSchema.index({ userId: 1, year: 1, month: 1 });

// Virtual for budget utilization percentage
budgetSchema.virtual('utilization').get(function () {
  if (this.amount === 0) return 0;
  return Math.min((this.spent / this.amount) * 100, 100);
});

// Virtual for remaining budget
budgetSchema.virtual('remaining').get(function () {
  return Math.max(this.amount - this.spent, 0);
});

// Static method to get or create budget for month
budgetSchema.statics.getOrCreate = async function (userId, category, month, year, defaultAmount = 0) {
  let budget = await this.findOne({ userId, category, month, year });
  
  if (!budget) {
    budget = await this.create({
      userId,
      category,
      month,
      year,
      amount: defaultAmount,
    });
  }
  
  return budget;
};

// Static method to update spent amount
budgetSchema.statics.updateSpent = async function (userId, category, month, year, amount) {
  const budget = await this.getOrCreate(userId, category, month, year);
  budget.spent = (budget.spent || 0) + amount;
  return budget.save();
};

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
