import mongoose from 'mongoose';

/**
 * Transaction schema
 * Core entity for all financial transactions
 * Stores both user-provided and AI-predicted metadata
 */
const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    categorySource: {
      type: String,
      enum: ['user', 'ai', 'auto'],
      default: 'user',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'],
      default: 'card',
    },
    needsVsWants: {
      type: String,
      enum: ['needs', 'wants', 'unknown'],
      default: 'unknown',
    },
    needsVsWantsSource: {
      type: String,
      enum: ['user', 'ai'],
      default: 'user',
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });

// Virtual for formatted amount (positive for income, negative for expense)
transactionSchema.virtual('signedAmount').get(function () {
  return this.type === 'income' ? this.amount : -this.amount;
});

// Static method to get user transactions in date range
transactionSchema.statics.getByDateRange = function (userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: -1 });
};

// Static method to get category totals
transactionSchema.statics.getCategoryTotals = function (userId, startDate, endDate, type) {
  const match = {
    userId,
    date: { $gte: startDate, $lte: endDate },
  };
  if (type) match.type = type;

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
