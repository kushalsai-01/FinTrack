import mongoose from 'mongoose';

/**
 * Goal schema
 * Stores AI-recommended and user-defined financial goals
 * Tracks progress and completion
 */
const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: ['spending_cap', 'savings_target', 'category_limit', 'custom'],
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 0,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed', 'paused'],
      default: 'active',
    },
    source: {
      type: String,
      enum: ['user', 'ai_recommended'],
      default: 'user',
    },
    aiReasoning: {
      type: String,
      default: null,
    },
    evidence: [
      {
        metric: String,
        value: mongoose.Schema.Types.Mixed,
        explanation: String,
      },
    ],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, endDate: 1 });
goalSchema.index({ userId: 1, source: 1 });

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end - now;
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
});

// Method to update progress
goalSchema.methods.updateProgress = function (currentValue) {
  this.currentValue = currentValue;
  this.progress = Math.min((currentValue / this.targetValue) * 100, 100);
  
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed';
  }
  
  return this.save();
};

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
