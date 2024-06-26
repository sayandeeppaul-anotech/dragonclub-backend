const mongoose = require('mongoose');

const ReferredUserSchema = new mongoose.Schema({
  mobile: String,
  uid: Number,
  date: Date,
  level: Number
});

module.exports = mongoose.model('ReferredUser', ReferredUserSchema);