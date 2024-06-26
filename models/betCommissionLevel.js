const mongoose = require('mongoose');

const CommissionRateSchema = new mongoose.Schema({
    level1: { type: Number, required: true, default: 0 },
    level2: { type: Number, required: true, default: 0 },
    level3: { type: Number, required: true, default: 0 },
    level4: { type: Number, required: true, default: 0 },
    level5: { type: Number, required: true, default: 0 },
}, {
    timestamps: true
});

module.exports = mongoose.model('CommissionRate', CommissionRateSchema);