const mongoose = require('mongoose');

const dailyStatsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: [{ 
        type: Date,
        unique: true
    }],
    count: {
        type: Number,
        default: 0
    }
});

dailyStatsSchema.statics.incrementCount = async function(date) {
    return this.findOneAndUpdate(
        { date },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
    );
};

const DailyStats = mongoose.model('DailyStats', dailyStatsSchema);
module.exports = DailyStats;