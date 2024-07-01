const mongoose = require("mongoose");
const { Schema } = mongoose;

const levelSchema = new Schema({
  minAmount: { type: Number, required: true },
  oneTimeBonus: { type: Number, required: true }, // Removed bonusAmount
  awarded: { type: String, required: true },
  monthlyBonus: { type: Number, required: true },
});

const mainLevelSchema = new Schema({
  levels: {
    type: [levelSchema],
    default: () => [
      {
        minAmount: 1000,
        oneTimeBonus: 100,
        awarded: "Bronze",
        monthlyBonus: 50,
      },
      {
        minAmount: 5000,
        oneTimeBonus: 250,
        awarded: "Silver",
        monthlyBonus: 100,
      },
      {
        minAmount: 10000,
        oneTimeBonus: 500,
        awarded: "Gold",
        monthlyBonus: 200,
      },
      {
        minAmount: 20000,
        oneTimeBonus: 1000,
        awarded: "Platinum",
        monthlyBonus: 300,
      },
      {
        minAmount: 50000,
        oneTimeBonus: 2000,
        awarded: "Diamond",
        monthlyBonus: 500,
      },
    ],
  },
});

const MainLevelModel = mongoose.model("MainLevelModel", mainLevelSchema);

module.exports = MainLevelModel;
