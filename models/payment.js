const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    payOrderId: { type: String, required: true, unique: true },
    income: Number,
    mchId: String,
    appId: String,
    productId: String,
    mchOrderNo: String,
    amount: Number,
    status: String,
    channelOrderNo: String,
    channelAttach: String,
    param1: String,
    param2: String,
    paySuccTime: Date,
    backType: String
});

const Payment = mongoose.model('Payment', PaymentSchema);
module.exports = Payment;