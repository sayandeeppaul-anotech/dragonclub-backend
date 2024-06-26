const DepositHistoryModel = require("../../models/depositHistoryModel");
const express = require("express");
const router = express.Router();

router.get("/transactions-last-24-hours", async (req, res) => {
  try {
    const twentyFourHours = new Date(new Date() - 24 * 60 * 60 * 1000);
    const recharge = await DepositHistoryModel.find({
      depositDate: { $gte: twentyFourHours },
    });
    console.log(recharge.length);
    let totalAmount = 0;
    for (let i = 0; i < recharge.length; i++) {
      totalAmount = totalAmount + recharge[i].depositAmount;
    }

    res.status(200).json({
      success: true,
      message: "ammount fetched successfully",
      totalRechargeAmount: totalAmount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
