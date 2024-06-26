const Withdraw = require("../models/withdrawModel");
const User = require("../models/userModel");

exports.totalWithdrawsController = async (req, res) => {
  try {
    const completedWithdraws = await Withdraw.find({ status: "Completed" });
    let totalCompletedWithdrawlLength = completedWithdraws.length;
    let getTotalWithdrawCompletedAmount = 0;
    for (let i = 0; i < totalCompletedWithdrawlLength; i++) {
      getTotalWithdrawCompletedAmount += completedWithdraws[i].balance;
    }

    res.status(200).json({
      success: true,
      completeWithdrawAmount: getTotalWithdrawCompletedAmount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching withdrawal data",
      error: error.message,
    });
  }
};
