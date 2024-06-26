const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const wingo = require('../../models/wingoResultModel')


router.get('/wingoresult', auth, async(req, res) => {
    try {
        const Result = await wingo.find({}).sort({_id: -1}).limit(40);
        res.status(200).json({
            success: true,
            message: "here are the result",
            Result
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "server error"
        })
    }
})


module.exports = router