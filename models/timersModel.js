const mongoose = require('mongoose');

const Timer1Min = mongoose.model('Timer1Min', new mongoose.Schema({
    periodId: String
}));

const Timer3Min = mongoose.model('Timer3Min', new mongoose.Schema({
    periodId: String
}));

const Timer5Min = mongoose.model('Timer5Min', new mongoose.Schema({
    periodId: String
}));

const Timer10Min = mongoose.model('Timer10Min', new mongoose.Schema({
    periodId: String
}));

module.exports = {
    Timer1Min,
    Timer3Min,
    Timer5Min,
    Timer10Min
};