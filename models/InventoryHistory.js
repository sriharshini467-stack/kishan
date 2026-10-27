/**
 * MongoDB InventoryHistory Schema (Mongoose)
 * Comprehensive audit trail tracking farmer inventory lifecycle:
 * Initial stock listing, checkout lock allocations, lock releases, order fulfillments, and restocks.
 */
import mongoose from 'mongoose';

const InventoryHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    changeType: {
      type: String,
      enum: ['initial', 'stock_lock', 'lock_release', 'order_fulfilled', 'manual_update', 'restock'],
      required: true,
    },
    delta: {
      type: Number,
      required: true,
    },
    resultingStock: {
      type: Number,
      required: true,
      min: 0,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    reason: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

InventoryHistorySchema.index({ farmerId: 1, createdAt: -1 });

export default mongoose.models?.InventoryHistory || mongoose.model('InventoryHistory', InventoryHistorySchema);
