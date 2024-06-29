const express = require("express");
const TRXBet = require("../../models/TRXBetModel");
const User = require("../../models/userModel");
const TrxResult = require("../../models/trxResultModel");
const auth = require("../../middlewares/auth");
const router = express.Router();
const moment = require("moment");

router.post("/trxbet", auth, async (req, res) => {
  try {
    const { _id } = req.user;
    const { betAmount, selectedItem, sizeOutcome, periodId, selectedTimer } = req.body;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.walletAmount < betAmount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    user.walletAmount -= betAmount;
    await user.save();

    const totalBetAfterTx = betAmount * 0.98;
    const tax = betAmount - totalBetAfterTx;

    const trxBet = new TRXBet({
      userId: _id,
      betAmount,
      selectedItem,
      sizeOutcome,
      totalBet: totalBetAfterTx,
      tax,
      selectedTimer,
      periodId,
      timestamp: Date.now(),
      status: "pending",
      result: "",
      winLoss: "0",
    });

    await trxBet.save();

    res.status(201).json(trxBet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving TRX bet", error: error.message });
  }
});

router.get("/user/trxbethistory", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const trxBets = await TRXBet.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json(trxBets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving TRX bet history", error: error.message });
  }
});

module.exports = router;