const Withdraw = require("../models/withdrawModel");
const User = require("../models/userModel");
exports.totalWithdrawRequestController = async (req, res) => {
  try {
    // const pendingWithdrawRequestArray =[]
    const pendingWithdraws = await Withdraw.find({ status: "Pending" });
    let totalPendingWithdrawalLength = pendingWithdraws.length;
    let getTotalWithdrawPendingAmount = 0;
    for (let i = 0; i < totalPendingWithdrawalLength; i++) {
      getTotalWithdrawPendingAmount += pendingWithdraws[i].balance;
    }

    res.status(200).json({
      success: true,
      pendingWithdrawAmount: getTotalWithdrawPendingAmount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching withdrawal data",
      error: error.message,
    });
  }
};
