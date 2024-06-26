const express = require("express");
const router = express.Router();
const Savings = require("../../models/SavingsAmount");
const auth = require("../../middlewares/auth");
const User = require("../../models/userModel");
const scheduleYearlyUpdate = require('../../controllers/Savingscronjob');
scheduleYearlyUpdate();

router.post("/Savings", auth, async (req, res) => {
  try {
    const { amount, duration, Startduration, EndDuration } = req.body;

    if (!amount || !duration || !Startduration || !EndDuration) {
      return res.status(400).json({ msg: "Please fill all the fields" });
    }

    const user = await User.findById(req.user._id);
    console.log('..........>',user)
    if (user.walletAmount < amount) {
      return res.status(400).json({
        msg: "Insufficient Balance",
      });
    }
    user.walletAmount -= amount;
    await user.save();

    let savings = await Savings.findOne({ user:user._id });
    console.log("------------------>",savings)
    if (savings) {
        savings.amount += amount;
        savings.duration = duration;
       
    }

    else {
        savings = new Savings({
            user: req.user._id, 
            amount,
            duration,
            Startduration,
            EndDuration
        });
    }
    await savings.save();
    addTransactionDetails(uId,amount,"savings", new Date())

    res.status(200).json({
        success: true,
        message: "Successfully added to savings account!"
    })
  } catch (error) {
    console.error('Internal Server Error:', error);


    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    })
  }
});

//////////////////// showing savings//////////////////////////
router.get('/ShowSavings',auth,async(req,res)=>{
  try {
    const FindSavings = await Savings.find({user:req.user._id})
    if (!FindSavings){
      res.status(404).json({
        success: false,
        message:"No Saving Found"
      })
    }
    res.status(200).json({
      success: true,
      savings:FindSavings
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:"Internal Error!!"
    })
  }
})

module.exports = router;
