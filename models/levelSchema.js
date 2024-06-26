const mongoose = require("mongoose");
const { Schema } = mongoose;

const levelSchema = new Schema({
  minAmount: { type: Number, required: true },
  bonusAmount: { type: Number, required: true },
  awarded: { type: String, required: true },
});

const mainLevelSchema = new Schema({
  levels: {
    type: [levelSchema],
    default: () => [
      { minAmount: 1000, bonusAmount: 100, awarded: "Bronze" },
      { minAmount: 5000, bonusAmount: 250, awarded: "Silver" },
      { minAmount: 10000, bonusAmount: 500, awarded: "Gold" },
      { minAmount: 20000, bonusAmount: 750, awarded: "Platinum" },
      { minAmount: 50000, bonusAmount: 1000, awarded: "Diamond" },
    ],
  },
});

const MainLevelModel = mongoose.model("MainLevelModel", mainLevelSchema);

module.exports = MainLevelModel;
