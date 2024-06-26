const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  withdrawalStartHour: { type: Number, default: 8 },
  withdrawalEndHour: { type: Number, default: 21 },
  maxWithdrawRequestsPerDay: { type: Number, default: 3 },
  minWithdrawAmount: { type: Number, default: 110 },
  maxWithdrawAmount: { type: Number, default: 100000 },
});

module.exports = mongoose.model("Settings", settingsSchema);