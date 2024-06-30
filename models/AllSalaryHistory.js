// models/allSalaryHistoryModel.js

const mongoose = require("mongoose");

const allSalaryHistorySchema = new mongoose.Schema({
  uid: { type: String, required: true },
  salaryAmount: { type: Number, required: true },
  salaryFrequency: {
    type: String,
    enum: ["Daily", "Weekly", "Monthly", "Yearly", "Hourly", "Minutely"],
    required: true,
  },
  paymentDate: { type: Date, default: Date.now },
});

const AllSalaryHistory = mongoose.model("AllSalaryHistory", allSalaryHistorySchema);

module.exports = AllSalaryHistory;
