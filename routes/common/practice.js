const express = require("express");
const router = express.Router();
const user = require("../../models/userModel");
const auth = require("../../middlewares/auth");
const {isAdmin,isNormal,isRestricted,} = require("../../middlewares/roleSpecificMiddleware");

router.get("/all-users", auth, async(req, res) => {
    try{
        const userDetails = await user.find();
        const users = [];
        if(userDetails.length > 0){
            const count = userDetails.length;
            for (let i=0; i<count; i++){
                users.push({
                    email:userDetails[i].email,
                    username:userDetails[i].username,
                    registrationDate:userDetails[i].registrationDate,
                    role:userDetails[i].role,
                    walletAmount:userDetails[i].walletAmount,
                })
            }
        } else {
            console.log("No user found in the DB");
        }
    res.status(200).json({
        user:users,
        success:true,
        message:"data fetched succesfully"
    })
    }catch(error){
        res.status(500).json({
            error:error.message,
            success:false,
            message:"internal issues"
        })
    }
})


router.get('/user/subordinatedata',auth, async (req, res) => {
    try {
      const User = await user.findById(req.user._id).select('commissionRecords');
      if (!User) {
        return res.status(404).send('User not found');
      }
    res.send(User.commissionRecords);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  
module.exports =  router;