const express = require('express')
 const router = express.Router()
const K3 = require('../models/K3ResultModel')
const auth = require('../middlewares/auth') 


router.get('/k3result',auth,async(req,res)=>{
try {
        const Result = await K3.find({})
        res.status(200).json({
            success:true,
            message:"Here is the result---->",
            Result
        })
} catch (error) {
    res.status(500).json({
        success:false,
        message:"server error",
    })
}

})
module.exports = router