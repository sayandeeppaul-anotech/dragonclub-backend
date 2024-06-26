const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const User = require('../../models/userModel')
const bcrypt = require('bcrypt')

router.post('/ChangePassword',auth,async(req,res)=>{
    try {
        const {oldPassword,newPassword} = req.body
        const userUid = req.user.uid;
        const user = await User.findOne({ uid: userUid });
        if (!user) {
            return res.status(404).json({
                success: "false",
                message: "User not found"
            });
        }
        
        const checkPass = await bcrypt.compare(oldPassword,user.password)
        if(!checkPass){
            return res.status(401).json({
                success:"false",
                message:"Password Incorrect"
            })
        }
        
            user.password = await bcrypt.hash(newPassword,10)
            await user.save()
            return res.status(200).json({
                success:"true",
                message:"Password changed successfully"
            })
        
    } catch (error) {
        res.status(500).json({
            success:"false",
            error:error.message
        })
    }

})
module.exports = router