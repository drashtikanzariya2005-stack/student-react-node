const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // The coupon code customers type in the cart. Always stored uppercase
    // so "save20" and "SAVE20" are treated as the same code.
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // "percent" -> discountValue is a % of the subtotal
    // "flat"    -> discountValue is a flat rupee amount
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      default: "percent",
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Optional maximum discount cap for percent discounts (e.g. 50% up to ₹150)
    maxDiscount: {
      type: Number,
      default: null,
    },

    // Minimum cart subtotal required before this coupon can be used.
    minOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Date & Time when this offer becomes valid / starts
    startDate: {
      type: Date,
      default: null,
    },

    // Date & Time when this offer expires / closes
    endDate: {
      type: Date,
      default: null,
    },

    // Admin toggle: Active vs Disabled
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

offerSchema.index({ code: 1, isActive: 1 });
offerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("Offer", offerSchema);
