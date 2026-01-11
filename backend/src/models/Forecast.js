import mongoose from 'mongoose';

/**
 * Forecast schema
 * Stores ML-generated cash flow forecasts
 * Includes confidence bands and risk indicators
 */
const forecastSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    forecastType: {
      type: String,
      enum: ['7day', '14day', '30day'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    predictions: [
      {
        date: Date,
        predictedAmount: Number,
        lowerBound: Number,
        upperBound: Number,
        confidence: Number,
      },
    ],
    riskIndicator: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    metadata: {
      modelVersion: String,
      trainingDataRange: {
        start: Date,
        end: Date,
      },
      featuresUsed: [String],
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for latest forecast per user and type
forecastSchema.index({ userId: 1, forecastType: 1, computedAt: -1 });

// Static method to get latest forecast
forecastSchema.statics.getLatest = function (userId, forecastType) {
  return this.findOne({ userId, forecastType }).sort({ computedAt: -1 });
};

const Forecast = mongoose.model('Forecast', forecastSchema);

export default Forecast;
