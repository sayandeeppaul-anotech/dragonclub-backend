const Withdraw = require("../models/withdrawModel");
const User = require("../models/userModel");

exports.withdrawAcceptanceController = async (req, res) => {
  try {
    if (!req.user || req.user.accountType !== "Admin") {
      return res.status(403).json({
        message: "You are not authorized to perform this action",
      });
    }

    const { withdrawId, acceptanceType } = req.body;

    if (!["Completed", "Rejected"].includes(acceptanceType)) {
      return res.status(400).json({
        message: "Invalid acceptance type provided.",
      });
    }

    const updatedRequest = await Withdraw.findByIdAndUpdate(
      withdrawId,
      { status: acceptanceType },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        message: "Withdrawal request not found or already processed.",
      });
    }

    if (acceptanceType === "Completed") {
      // Update the user's wallet
      const user = await User.findById(updatedRequest.userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      // Deduct the balance from the user's wallet
    //   user.walletAmount -= updatedRequest.balance;
      await user.save();
    }

    res.status(200).json({
      message: `Withdraw request has been ${acceptanceType}.`,
      updatedRequest: updatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating withdraw request",
      error: error.message,
    });
  }
};
