const Withdraw = require("../models/withdrawModel");
const User = require("../models/userModel");
const Bet = require("../models/betsModel");
const DepositHistory = require("../models/depositHistoryModel");
const Settings = require("../models/Settings");

const requestWithdraw = async (req, res) => {
  let savedRequest;
  try {
    const userId = req.user._id;
    const userDetail = await User.find({ _id: userId });
    const balance = req.body.balance;
    let settings = await Settings.findOne();


    // If no settings document exists, create a default one
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    
    const currentHour = new Date().getHours();
    if (currentHour < settings.withdrawalStartHour || currentHour > settings.withdrawalEndHour) {
      return res.status(400).json({
        success: false,
        message: `You can only send a withdrawal request from ${settings.withdrawalStartHour}AM to ${settings.withdrawalEndHour}PM`,
      });
    }

     // Check if the user has already made the maximum number of withdrawal requests today
     if (userDetail[0].withdrawRequestsToday >= settings.maxWithdrawRequestsPerDay) {
      return res.status(400).json({
        success: false,
        message: `You can only send ${settings.maxWithdrawRequestsPerDay} withdrawal requests per day`,
      });
    }
  // Check if the requested withdrawal amount is within the allowed range
  if (balance < settings.minWithdrawAmount || balance > settings.maxWithdrawAmount) {
    return res.status(400).json({
      success: false,
      message: `You can only withdraw between ${settings.minWithdrawAmount} and ${settings.maxWithdrawAmount}`,
    });
  }
  let totalBetAmount = await Bet.aggregate([
    { $match: { userId: userId } },
    { $group: { _id: null, total: { $sum: { $add: ["$totalBet", "$tax"] } } } },
  ]);
    
    if (totalBetAmount.length === 0) {
      totalBetAmount = [{ total: 0 }];
    }
const totalDepositAmount = await DepositHistory.aggregate([
  { 
    $match: { 
      userId: userId,
      depositStatus: 'completed' 
    } 
  },
  { 
    $group: { 
      _id: null, 
      total: { $sum: "$depositAmount" } 
    } 
  },
]);


console.log('Total bet amount:', totalBetAmount[0].total);
console.log('Total deposit amount:', totalDepositAmount[0].total);
console.log('Total bet amount type:', typeof totalBetAmount[0].total);
console.log('Total deposit amount type:', typeof totalDepositAmount[0].total);
if (
  totalDepositAmount.length > 0 &&
  totalBetAmount.length > 0 &&
  totalDepositAmount[0].total > totalBetAmount[0].total
) {
  res.status(400).json({
    success: false,
    message: "You can't withdraw because You have not met the withdrawl requirement",
  });
} else if (userDetail[0].walletAmount < balance) {
      res.status(400).json({
        success: false,
        message: "You have insufficient balance to withdraw",
      });
    } else if (balance <= 50) {
      res.status(400).json({
        success: false,
        message: "Minimum withdraw amount is 300",
      });
    } 
    else {
      const withdrawRequest = new Withdraw({
        balance: balance,
        withdrawMethod: req.body.withdrawMethod,
        status: "Pending",
        userId: userId,
      });
    
      savedRequest = await withdrawRequest.save();
    
      // Increment the withdrawRequestsToday field for the user
      await User.findByIdAndUpdate(
        userId,
        { 
          $push: { withdrawRecords: savedRequest._id },
          $inc: { withdrawRequestsToday: 1 },  // increment by 1
            $inc: { walletAmount: -balance } 
          
        
        },
        { new: true }
      );
    
      await User.updateMany(
        { accountType: "Admin" },
        { $push: { withdrawRecords: savedRequest._id } }
      );
    
      res.status(201).json({
        message: "Withdrawal request sent to admin for review.",
        withdrawRequest: savedRequest,
      });
    }
  } catch (error) {
    // If creating the withdrawal request fails, also try to delete the created request
    if (savedRequest && savedRequest._id) {
      await Withdraw.findByIdAndDelete(savedRequest._id);
    }

    res.status(500).json({
      message: "Error creating withdrawal request",
      error: error.message,
    });
  }
};



const calculateRemainingBetAmount = async (req, res) => {
  try {
    const userId = req.user._id;

    let totalBetAmount = await Bet.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, total: { $sum: { $add: ["$totalBet", "$tax"] } } } },
    ]);

    if (totalBetAmount.length === 0) {
      totalBetAmount = [{ total: 0 }];
    }

    const totalDepositAmount = await DepositHistory.aggregate([
      { 
        $match: { 
          userId: userId,
          depositStatus: 'completed' 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$depositAmount" } 
        } 
      },
    ]);

    if (totalDepositAmount.length > 0 && totalBetAmount.length > 0) {
      let remainingBetAmount = totalDepositAmount[0].total - totalBetAmount[0].total;
      if (remainingBetAmount < 0) {
        remainingBetAmount = 0;
      }
      res.status(200).json({
        remainingBetAmount: remainingBetAmount,
      });
    } else {
      res.status(400).json({
        message: "Error calculating remaining bet amount",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error calculating remaining bet amount",
      error: error.message,
    });
  }
};
module.exports = { requestWithdraw , calculateRemainingBetAmount};