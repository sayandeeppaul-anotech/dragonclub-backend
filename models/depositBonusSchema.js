const mongoose = require("mongoose");

const depositBonusSchema = new mongoose.Schema({
  minimumDeposit: { type: Number, unique: true, required: true },
  bonus: { type: Number, required: true },
});

const DepositBonus = mongoose.model("DepositBonus", depositBonusSchema);

module.exports = DepositBonus;