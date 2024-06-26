// models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true },
  bonusAmount: { type: Number, required: true },
  redemptionLimit: { type: Number, required: true },
  redemptionCount: { type: Number, default: 0 },
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;