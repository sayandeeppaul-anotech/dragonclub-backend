const mongoose = require("mongoose");
const User = require("../models/userModel");


const SavingsSchema = mongoose.Schema({
  amount: { type: Number, default: 0, required: true },
  duration:{type:Number, required:true},
  Startduration: { type: Date, required: true },
  EndDuration: { type: Date, required: true },
 
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Savings = mongoose.model("Savings", SavingsSchema);

module.exports = Savings;
