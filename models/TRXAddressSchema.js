const mongoose = require('mongoose')
const User = require('./userModel')
const trxAddressSchema = new mongoose.Schema({
  TRXAddress:{
    type:Number,
    required:true
  },
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
  }

})
const TRXAddress = mongoose.model('TRXAddress',trxAddressSchema)

module.exports = TRXAddress