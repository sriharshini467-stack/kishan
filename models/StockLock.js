/**
 * MongoDB StockLock Schema (Mongoose)
 * Implements atomic 10-minute temporary stock reservation during buyer checkout
 * Prevents overselling during high-volume wholesale procurement
 */
import mongoose from 'mongoose';

const StockLockSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyerPhone: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.1,
    },
    lockExpiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes default TTL
    },
    status: {
      type: String,
      enum: ['active', 'released', 'converted'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically prune expired stock reservations if not manually converted
StockLockSchema.index({ lockExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models?.StockLock || mongoose.model('StockLock', StockLockSchema);
