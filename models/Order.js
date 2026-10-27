/**
 * MongoDB Order Schema (Mongoose)
 * 5-Stage Order State Machine: Requested -> Accepted -> Ready -> Completed (or Cancelled)
 * Supports Partial Order Acceptance and dynamic recalculations
 */
import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    requestedQuantity: { type: Number, required: true },
    acceptedQuantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalItemPrice: { type: Number, required: true },
    photo: { type: String },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    buyerLocation: { type: String, required: true },
    buyerType: { type: String, default: 'grocer' },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerName: { type: String, required: true },
    farmerPhone: { type: String, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'ready', 'completed', 'cancelled'],
      default: 'requested',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash_on_pickup', 'pay_on_delivery', 'simulated_upi'],
      default: 'cash_on_pickup',
    },
    pickupSlot: {
      type: String,
      default: 'Morning 7 AM - 11 AM',
    },
    partialAcceptanceReason: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ farmerId: 1, status: 1 });
OrderSchema.index({ buyerId: 1, status: 1 });

export default mongoose.models?.Order || mongoose.model('Order', OrderSchema);
