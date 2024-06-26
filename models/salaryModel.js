const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  uid: { type: String, required: true },
  salaryAmount: { type: Number, required: true },
  salaryFrequency: {
    type: String,
    enum: ["Daily", "Weekly", "Monthly"],
    required: true,
  },
  nextPaymentDate: {
    type: Date,
    // required: true
  },
  frequencyLimit: { type: Number, required: true },
});
const Salary = mongoose.model("Salary", salarySchema);

module.exports = Salary;