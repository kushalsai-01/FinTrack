import mongoose from 'mongoose';

/**
 * Financial Health Score schema
 * Stores computed health scores with explainability
 * Updated daily via background jobs
 */
const financialHealthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    subScores: {
      savingsRate: {
        score: { type: Number, min: 0, max: 100 },
        weight: { type: Number, default: 0.25 },
      },
      spendingVolatility: {
        score: { type: Number, min: 0, max: 100 },
        weight: { type: Number, default: 0.20 },
      },
      incomeToExpenseRatio: {
        score: { type: Number, min: 0, max: 100 },
        weight: { type: Number, default: 0.25 },
      },
      budgetAdherence: {
        score: { type: Number, min: 0, max: 100 },
        weight: { type: Number, default: 0.20 },
      },
      anomalyScore: {
        score: { type: Number, min: 0, max: 100 },
        weight: { type: Number, default: 0.10 },
      },
    },
    explanation: {
      type: String,
      required: true,
    },
    metrics: {
      totalIncome: Number,
      totalExpenses: Number,
      savings: Number,
      savingsRate: Number,
      avgDailySpending: Number,
      spendingStdDev: Number,
      budgetUtilization: Number,
      anomalyCount: Number,
    },
    recommendations: [
      {
        type: String,
      },
    ],
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for latest score per user
financialHealthSchema.index({ userId: 1, date: -1 });
financialHealthSchema.index({ userId: 1, computedAt: -1 });

// Static method to get latest health score
financialHealthSchema.statics.getLatest = function (userId) {
  return this.findOne({ userId }).sort({ date: -1 });
};

const FinancialHealth = mongoose.model('FinancialHealth', financialHealthSchema);

export default FinancialHealth;
