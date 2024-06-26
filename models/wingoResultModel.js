const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    timer: {
        type: String,
        required: true
    },
    periodId: {
        type: String,
        required: true
    },
    colorOutcome: {
        type: [String], // Changed to an array of strings
        required: true
    },
    numberOutcome: {
        type: String,
        required: true
    },
    sizeOutcome: {
        type: String,
        required: true
    }
});

const Result = mongoose.model('WingoGameResult', ResultSchema);

module.exports = Result;