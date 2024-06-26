const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  level1: { type: Number, default: 0.5 },
  level2: { type: Number, default: 0.4 },
  level3: { type: Number, default: 0.3 },
  level4: { type: Number, default: 0.2 },
  level5: { type: Number, default: 0.1 }
});

module.exports = mongoose.model('Commission', commissionSchema);
