const mongoose = require('mongoose');

const GameResult = mongoose.model('TrxGameResult', new mongoose.Schema({
    timer: String,
    periodId: String,
    colorOutcome: [String],
    numberOutcome: String,
    sizeOutcome: String,
    trxBlockAddress: String,
    blockTime: String,
    hash: String
}));

module.exports = GameResult;





