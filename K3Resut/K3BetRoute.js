const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/userModel");
const k3betmodel = require('../models/K3BetModel')
const K3ResultModel = require('../models/K3ResultModel')

router.post("/K3betgame", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.walletAmount < 100) {
      return res.status(400).send({ message: "Insufficient wallet balance" });
    }

    user.walletAmount -= req.body.totalBet;
    await user.save();

    const totalBetAfterTax = req.body.totalBet * 0.98; // 2% tax

    // Base bet data
    const betData = {
      user: req.user._id,
      betAmount: req.body.betAmount,
      selectedItem: req.body.selectedItem,
      selectedTimer:req.body.selectedTimer,
      multiplier: req.body.multiplier,
      diceOutcome:K3ResultModel.diceOutcome,
      totalBet: totalBetAfterTax,
      tax: req.body.totalBet - totalBetAfterTax,
      periodId: req.body.periodId,
      status: req.body.status,
      winLoss: req.body.winLoss,
    };

    // Add the relevant field based on the selectedItem
    switch (req.body.selectedItem) {
      case "totalSum":
        betData.totalSum = req.body.totalSum;
        break;
      case "twoSameOneDifferent":
        betData.twoSameOneDifferent = req.body.twoSameOneDifferent;
        break;
      case "threeSame":
        betData.threeSame = req.body.threeSame;
        break;
      case "threeDifferentNumbers":
        betData.threeDifferentNumbers = req.body.threeDifferentNumbers;
        break;
      case "size":
        betData.size = req.body.size;
        break;
      case "parity":
        betData.parity = req.body.parity;
        break;
      default:
        return res.status(400).send({ message: "Invalid selected item" });
    }

    const k3bet = new k3betmodel(betData);
    await k3bet.save();

    // Commission logic remains the same
    let commissionRates = [0.05, 0.04, 0.03, 0.02, 0.01];
    let currentUserId = req.user._id;

    for (let i = 0; i < 5; i++) {
      let currentUser = await User.findById(currentUserId);
      if (!currentUser || !currentUser.referrer) {
        break;
      }
      let referrer = await User.findById(currentUser.referrer);
      if (!referrer) {
        break;
      }
      let commission = req.body.totalBet * commissionRates[i];
      referrer.walletAmount += commission;

      let today = new Date();
      today.setHours(0, 0, 0, 0);

      let commissionRecord = referrer.commissionRecords.find((record) => {
        let recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      if (commissionRecord) {
        commissionRecord.commission += commission;
        commissionRecord.betAmount += req.body.totalBet;
      } else {
        referrer.commissionRecords.push({
          date: today,
          level: i + 1,
          uid: req.user.uid,
          commission: commission,
          betAmount: req.body.totalBet,
        });
      }

      await referrer.save();
      currentUserId = referrer._id;
    }

    res.status(201).json(k3bet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving bet", error: error.message });
  }
});

module.exports = router;