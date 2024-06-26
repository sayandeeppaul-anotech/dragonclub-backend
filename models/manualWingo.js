const mongoose = require('mongoose');

const TimerSettingsSchema = new mongoose.Schema({
  manual1min: { type: String, default: '' },
  manual3min: { type: String, default: '' },
  manual5min: { type: String, default: '' },
  manual10min: { type: String, default: '' },
});

const TimerSettings = mongoose.model('TimerSettings', TimerSettingsSchema);

module.exports = TimerSettings;