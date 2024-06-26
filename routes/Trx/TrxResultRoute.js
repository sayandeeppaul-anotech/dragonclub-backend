const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const GameResult = require('../../models/trxResultModel')



router.get('/trxgameResults', async (req, res) => {
    try {
        const gameResults = await GameResult.find();
        res.json(gameResults);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router