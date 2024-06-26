const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedItem: String,
  betAmount: Number,
  multiplier: Number,
  totalBet: Number,
  tax: Number,
  fee: { type: String, default: '2%'},
  selectedTimer: String,
  periodId: Number,
  timestamp: { type: Date, default: Date.now },
  result: String,
  status: { type: String, default: 'Loading' },
  winLoss: String,
});

const Bet = mongoose.model('Bet', betSchema);

module.exports = Bet;










