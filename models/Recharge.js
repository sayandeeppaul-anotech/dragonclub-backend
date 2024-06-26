const mongoose = require('mongoose')

const RechargeSchema = new mongoose.Schema({
    id:{type:String},
    amount:{type:Number},
    date:{type:String}
})

module.exports = RechargeSchema










