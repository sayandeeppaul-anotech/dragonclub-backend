const express = require("express");
const router = express.Router();
const User = require("../../models/userModel");
const auth = require("../../middlewares/auth");
const {isAdmin,isNormal,isRestricted,} = require("../../middlewares/roleSpecificMiddleware");
require("dotenv").config();

router.get("/total-registrations", auth, async (req, res) => {
  try {
    const userDetails = await User.find();
    if (!userDetails) {
      console.log("No user found in the DB");
    }
    let count = userDetails.length;
    res.status(200).json({
      count: count,
      success: true,
      message: "data fetched succesfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// have to add auth middleware
router.get("/todays-registrations", async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(new Date() - 24 * 60 * 60 * 1000);

    const registrations = await User.find({
      registrationDate: { $gte: twentyFourHoursAgo },
    });

    let count = registrations.length;
    res.status(200).json({
      success: true,
      countOfDailyUsers: count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/user-balance", auth, async (req, res) => {
  try {
    const userDetails = await User.find();
    if (!userDetails) {
      console.log("No user found in the DB");
    }

    let totalAmount = 0;
    for (let i = 0; i < userDetails.length; i++) {
      totalAmount = totalAmount + userDetails[i].walletAmount;
    }
    res.status(200).json({
      walletAmount: totalAmount,
      success: true,
      message: "data fetched succesfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
