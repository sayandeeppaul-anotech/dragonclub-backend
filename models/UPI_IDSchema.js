const mongoose = require('mongoose')
const User = require('./userModel')

const UPIAddress = new mongoose.Schema({
    Upi: {
        type: String,
        required: true
    },
    Trx: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    image: {
        type: String
    }
});

const UPI = mongoose.model('UPI',UPIAddress)
module.exports = UPI





