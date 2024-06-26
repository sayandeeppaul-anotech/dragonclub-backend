const Withdraw = require("../models/withdrawModel");
const User = require("../models/userModel");

exports.fetchWithdrawController = async (req, res) => {
  try {
    const user = req.user._id;
    const userDetails = await User.findById(user)
    console.log("userDetails-->",userDetails)
    console.log("this route hitted & user type -->",userDetails.accountType);
    if (userDetails.accountType == "Admin") {
      const userWithdrawals = await Withdraw.find().sort({_id: -1}).populate('userId', 'bankDetails TRXAddress');
      console.log("withdrawals-->",userWithdrawals)
      res.status(200).json({
        success: true,
       userWithdrawals,
      });
    } else {
      const userWithdrawals = await Withdraw.find({userId:user}).sort({_id: -1}).populate('userId', 'bankDetails TRXAddress');
      console.log(userWithdrawals);
      res.status(200).json({
        success: true,
        userWithdrawals,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error fetching withdrawal data",
      error: error.message,
    });
  }
};
