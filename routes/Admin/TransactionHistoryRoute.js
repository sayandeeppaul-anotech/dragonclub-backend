const express = require('express')
const router = express.Router()
const TransactionHistory = require('../../models/TransictionHistory')
const auth = require('../../middlewares/auth')
const {isAdmin} = require('../../middlewares/roleSpecificMiddleware')

///////////to get transaction history///////////

router.get('/transaction', auth, async(req,res)=>{
    try {
        const userId = req.user._id
        const transactionHistory = await TransactionHistory.find({user:userId})
        console.log('....>',transactionHistory)
        res.status(200).json({
            success:true,
            message:"here is the history",transactionHistory
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            error:error.message
        })
    }
})

module.exports = router