/**
 * MongoDB Product Schema (Mongoose)
 * Models agricultural produce listings with tiered bulk pricing, harvest freshness, and pickup windows
 */
import mongoose from 'mongoose';

const PricingTierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true },
    maxQty: { type: Number, default: null },
    pricePerUnit: { type: Number, required: true },
    label: { type: String },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerName: { type: String, required: true },
    farmerPhone: { type: String, required: true },
    farmerLocation: { type: String, required: true },
    name: {
      type: String,
      required: [true, 'Produce name is required'],
      trim: true,
    },
    microCategory: {
      type: String,
      enum: ['vegetables', 'fruits', 'grains', 'spices', 'dairy'],
      required: true,
    },
    photos: [{ type: String }],
    unit: {
      type: String,
      enum: ['kg', 'crate', 'ton', 'bag', 'quintal'],
      default: 'kg',
    },
    totalStock: {
      type: Number,
      required: true,
      min: 0,
    },
    availableStock: {
      type: Number,
      required: true,
      min: 0,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    tieredPricing: [PricingTierSchema],
    harvestDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    pickupWindow: {
      type: String,
      default: 'Daily 7 AM - 11 AM',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    deliveryOptions: {
      farmPickup: { type: Boolean, default: true },
      directDelivery: { type: Boolean, default: true },
    },
    adminFlagged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geo-location search & category filtering
ProductSchema.index({ microCategory: 1, isAvailable: 1, availableStock: 1 });
ProductSchema.index({ farmerLocation: 'text', name: 'text' });

export default mongoose.models?.Product || mongoose.model('Product', ProductSchema);
