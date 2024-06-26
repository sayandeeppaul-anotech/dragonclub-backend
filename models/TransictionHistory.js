const mongoose = require('mongoose')
const User = require('./userModel')
 const TransactionHistory = mongoose.Schema({
    amount:{type:Number, required:true},
    type:{type:String, required:true},
    date: {
        type: Date, 
        default: Date.now
      },
      user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
 })
  const transactions = mongoose.model('transactions',TransactionHistory)
  module.exports = transactions