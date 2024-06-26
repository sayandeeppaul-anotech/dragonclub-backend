// controllers/transactionController.js
const TransactionModel = require('../models/TransictionHistory');
const express = require('express')
const userId = require('../models/TransictionHistory')
exports.addTransactionDetails = async (userId,amount,type,time) => {
  try {
    console.log('....> func called')
    const user = userId
    console.log(".....>", userId,amount,type,time)
    const newTransaction = new TransactionModel({
      user,
      amount,
      type,
      time
    });
    console.log(".....>",newTransaction)
    await newTransaction.save();

  } catch (error) {
   
  }
};


