const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const trx = require('../models/trxResultModel')


router.get('/trxresult',auth, async(req,res)=>{
    try {
        const Result = await trx.find({})
        res.status(200).json({
            success: true,
            message:"Here is the result",
            Result
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            error:error.message
        })
    }
})


module.exports = router