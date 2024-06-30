const mongoose = require("mongoose");
const { Schema } = mongoose;

const levelSchema = new Schema({
  minAmount: { type: Number, required: true },
  bonusAmount: { type: Number, required: true },
  oneTimeBonus: { type: Number, required: true }, // Added oneTimeBonus
  awarded: { type: String, required: true },
  monthlyBonus: { type: Number, required: true } // Added monthlyBonus
});

const mainLevelSchema = new Schema({
  levels: {
    type: [levelSchema],
    default: () => [
      { minAmount: 3000, bonusAmount: 100, oneTimeBonus: 100, awarded: "Bronze", monthlyBonus: 50 },
      { minAmount: 5000, bonusAmount: 250, oneTimeBonus: 200, awarded: "Silver", monthlyBonus: 100 },
      { minAmount: 10000, bonusAmount: 500, oneTimeBonus: 300, awarded: "Gold", monthlyBonus: 200 },
      { minAmount: 20000, bonusAmount: 750, oneTimeBonus: 400, awarded: "Platinum", monthlyBonus: 300 },
      { minAmount: 50000, bonusAmount: 1000, oneTimeBonus: 500, awarded: "Diamond", monthlyBonus: 500 },
    ],
  },
});

const MainLevelModel = mongoose.model("MainLevelModel", mainLevelSchema);

module.exports = MainLevelModel;
