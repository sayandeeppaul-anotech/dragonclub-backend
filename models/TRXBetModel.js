const mongoose = require("mongoose");

const trxBetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  selectedItem: String,
  sizeOutcome: {
    type: String,
  },
  betAmount: Number,
  multiplier: Number,
  totalBet: Number,
  tax: Number,
  fee: { type: String, default: "2%" },
  selectedTimer: String,
  periodId: String,
  timestamp: { type: Date, default: Date.now },
  result: String,
  status: { type: String, default: "Loading" },
  winLoss: String,
});

const TrxBet = mongoose.model("TrxBet", trxBetSchema);

module.exports = TrxBet;