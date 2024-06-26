const UserModel = require('../../models/userModel')
const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')


router.get('/UserBalance', auth,  async(req,res)=>{
    try {
        const User = await UserModel.find()

        let Userbalance = 0 
        for(let i=0;i<User.length;i++){
            Userbalance += User[i].walletAmount
        }
    res.status(200).json({
        success: true,
        message:"User Balance",
        UserBalance:Userbalance
    })

    } catch (error) {
        res.status(500).json({
            success: false,
            message:"Internal issues"
        })
    }
})

module.exports = router