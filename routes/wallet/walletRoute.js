const express = require("express");
const router = express.Router();
const User = require("../../models/userModel");
const { isAdmin } = require("../../middlewares/roleSpecificMiddleware");
const auth = require("../../middlewares/auth");
const Deposit = require("../../models/depositHistoryModel");
const Commission = require("../../models/commissionModel");
const MainLevelModel = require("../../models/levelSchema");
const { addTransactionDetails} = require("../../controllers/TransactionHistoryControllers");
const axios = require("axios");
const querystring = require("querystring");
require("dotenv").config();
const crypto = require('crypto');
const Payment = require("../../models/payment");
const DepositBonus = require("../../models/depositBonusSchema");
const mchKey = process.env.API_KEY;
const payHost = process.env.CALLBACK_URL ;


function paramArraySign(paramArray, mchKey) {
    const sortedKeys = Object.keys(paramArray).sort();
    const md5str = sortedKeys.map(key => `${key}=${paramArray[key]}`).join('&');
    const sign = crypto.createHash('md5').update(md5str + `&key=${mchKey}`).digest('hex').toUpperCase();
    return sign;
}

router.post("/wallet", async (req, res) => {
  try {
    const resSign = req.query.sign;

    if (!resSign) {
        return res.status(400).send("fail(sign not exists)");
    }

    const paramArray = {};
    const fields = [
        "payOrderId", "income", "mchId", "appId", "productId", 
        "mchOrderNo", "amount", "status", "channelOrderNo", 
        "channelAttach", "param1", "param2", "paySuccTime", "backType"
    ];

    fields.forEach(field => {
        if (req.query[field]) {
            paramArray[field] = req.query[field];
        }
    });

    const sign = paramArraySign(paramArray, mchKey);

    if (resSign !== sign) {  // Signature verification failed
        return res.status(400).send("fail(verify fail)");
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ payOrderId: paramArray.payOrderId });
    if (existingPayment) {
        return res.status(400).json({ msg: "Payment already added" });
    }

    // If not, save the new payment
    const newPayment = new Payment(paramArray);
    await newPayment.save();

    // Handle business logic here
    console.log(paramArray);

    const { amount, param1: userId, param2: depositId } = paramArray;

    if (!amount) {
      return res.status(400).json({ msg: "Amount is required" });
    }

    // Fetch commission levels configuration
    const mainLevelConfig = await MainLevelModel.findOne();
    if (
      !mainLevelConfig ||
      !mainLevelConfig.levels ||
      mainLevelConfig.levels.length === 0
    ) {
      return res
        .status(500)
        .json({ msg: "Commission levels configuration not found" });
    }
    const { levels } = mainLevelConfig;

    // Calculate total deposit
    const depositDetails = await Deposit.find({ userId: userId });
    const totalPrevDepositAmount = depositDetails.reduce(
      (total, depositEntry) => total + depositEntry.depositAmount,
      0
    );

    const totalDeposit = totalPrevDepositAmount;

    // Update user wallet and achievements based on levels
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletAmount: amount/100 } },
      { new: true }
    );

    // Check and update first deposit
    let isFirstDeposit = false;
    if (!updatedUser.firstDepositMade) {
      updatedUser.firstDepositMade = true;
      isFirstDeposit = true;
      await updatedUser.save();
    }

    // Update deposit history status
    await Deposit.updateOne({ userId: userId, _id: depositId }, { depositStatus: "completed" });

    addTransactionDetails(userId,amount,"deposit", new Date())

    // Distribute commission up the chain
    if (updatedUser.referrer) {
      const commissionRates = await Commission.findOne();
      const commissionRatesArray = [
        commissionRates.level1,
        commissionRates.level2,
        commissionRates.level3,
        commissionRates.level4,
        commissionRates.level5,
      ];

      let currentReferrer = await User.findById(updatedUser.referrer);
      for (let i = 0; i < 5; i++) {
        if (!currentReferrer) {
          break;
        }

        // Update subordinate data
        const today = new Date();
        today.toLocaleDateString('en-IN');

        // Helper function to update or create an entry in the subordinates array
        const updateOrCreateSubordinateEntry = (
          subordinatesArray,
          subordinateData
        ) => {
          const index = subordinatesArray.findIndex(
            (sub) => sub.date.getTime() === today.getTime()
          );

          if (index !== -1) {
            subordinatesArray[index].depositNumber++;
            subordinatesArray[index].depositAmount += amount;
            if (isFirstDeposit) {
              subordinatesArray[index].firstDeposit++;
            }
          } else {
            subordinatesArray.push({
              userId: userId,
              noOfRegister: 0,
              depositNumber: 1,
              depositAmount: amount,
              firstDeposit: isFirstDeposit ? 1 : 0,
              date: today,
              level: subordinateData.level,
            });
          }
        };

        // Update direct or team subordinates based on the level
        if (i === 0) {
          updateOrCreateSubordinateEntry(currentReferrer.directSubordinates, {
            level: i + 1,
          });
        } else {
          updateOrCreateSubordinateEntry(currentReferrer.teamSubordinates, {
            level: i + 1,
          });
        }

        // Calculate and add commission
        let commission = amount * commissionRatesArray[i];
        if (isFirstDeposit) {
          currentReferrer.walletAmount += commission;
        }

        // Update commission records
        let existingRecord = currentReferrer.commissionRecords.find(
          (record) =>
            record.date.getTime() === today.getTime() &&
            record.uid === updatedUser.uid
        );

        if (existingRecord) {
          existingRecord.depositAmount += amount;
          existingRecord.commission += commission;
        } else {
          currentReferrer.commissionRecords.push({
            level: i + 1,
            commission: commission,
            date: today,
            uid: updatedUser.uid,
            depositAmount: amount,
          });
        }
        await currentReferrer.save();
        addTransactionDetails(userId, amount, "Interest", new Date());
        currentReferrer = await User.findById(currentReferrer.referrer);
      }
    }
    if (isFirstDeposit) {
      const depositBonus = await DepositBonus.find().sort({
        minimumDeposit: 1,
      });
      let bonusAmount = 0;

      if (depositBonus.length > 0) {
        for (let i = depositBonus.length - 1; i >= 0; i--) {
          if (totalDeposit = depositBonus[i].minimumDeposit) {
            bonusAmount = depositBonus[i].bonus;
            break;
          }
        }
      }

      console.log(bonusAmount);

      updatedUser.walletAmount += bonusAmount;
      await updatedUser.save();
      console.log(
        `One-time bonus of ${bonusAmount} added to user ${userId}'s wallet.`
      );
    }
    res.status(200).json({ msg: "Wallet updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post("/wallet-manual", async (req, res) => {
  try {
    const { amount, userId, depositId } = req.body;

    if (!amount) {
      return res.status(400).json({ msg: "Amount is required" });
    }

    // Fetch commission levels configuration
    const mainLevelConfig = await MainLevelModel.findOne();
    if (
      !mainLevelConfig ||
      !mainLevelConfig.levels ||
      mainLevelConfig.levels.length === 0
    ) {
      return res
        .status(500)
        .json({ msg: "Commission levels configuration not found" });
    }
    const { levels } = mainLevelConfig;

    // Calculate total deposit
    const depositDetails = await Deposit.find({ userId: userId });
    const totalPrevDepositAmount = depositDetails.reduce(
      (total, depositEntry) => total + depositEntry.depositAmount,
      0
    );

    const totalDeposit = totalPrevDepositAmount ;

    // Update user wallet and achievements based on levels
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletAmount: amount } },
      { new: true }
    );

    // Check and update first deposit
    let isFirstDeposit = false;
    if (!updatedUser.firstDepositMade) {
      updatedUser.firstDepositMade = true;
      isFirstDeposit = true;
      await updatedUser.save();
    }

    // Update deposit history status
    await Deposit.updateOne(
      { userId: userId, _id: depositId },
      { depositStatus: "completed" }
    );

    addTransactionDetails(userId, amount, "deposit", new Date());

    // Distribute commission up the chain
    if (updatedUser.referrer) {
      const commissionRates = await Commission.findOne();
      const commissionRatesArray = [
        commissionRates.level1,
        commissionRates.level2,
        commissionRates.level3,
        commissionRates.level4,
        commissionRates.level5,
      ];

      let currentReferrer = await User.findById(updatedUser.referrer);
      for (let i = 0; i < 5; i++) {
        if (!currentReferrer) {
          break;
        }

        // Update subordinate data
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Helper function to update or create an entry in the subordinates array
        const updateOrCreateSubordinateEntry = (
          subordinatesArray,
          subordinateData
        ) => {
          const index = subordinatesArray.findIndex(
            (sub) => sub.date.getTime() === today.getTime()
          );

          if (index !== -1) {
            subordinatesArray[index].depositNumber++;
            subordinatesArray[index].depositAmount += amount;
            if (isFirstDeposit) {
              subordinatesArray[index].firstDeposit++;
            }
          } else {
            subordinatesArray.push({
              userId: userId,
              noOfRegister: 0,
              depositNumber: 1,
              depositAmount: amount,
              firstDeposit: isFirstDeposit ? 1 : 0,
              date: today,
              level: subordinateData.level,
            });
          }
        };

        // Update direct or team subordinates based on the level
        if (i === 0) {
          updateOrCreateSubordinateEntry(currentReferrer.directSubordinates, {
            level: i + 1,
          });
        } else {
          updateOrCreateSubordinateEntry(currentReferrer.teamSubordinates, {
            level: i + 1,
          });
        }

        // Update commission records
        let commission = isFirstDeposit ? amount * commissionRatesArray[i] : 0;
        let existingRecord = currentReferrer.commissionRecords.find(
          (record) =>
            record.date.getTime() === today.getTime() &&
            record.uid === updatedUser.uid
        );

        if (existingRecord) {
          existingRecord.depositAmount += amount;
          existingRecord.commission += commission;
        } else {
          currentReferrer.commissionRecords.push({
            level: i + 1,
            commission: commission,
            date: today,
            uid: updatedUser.uid,
            depositAmount: amount,
          });
        }

        if (commission > 0) {
          currentReferrer.walletAmount += commission;
          addTransactionDetails(currentReferrer._id, commission, "commission", new Date());
        }

        await currentReferrer.save();
        currentReferrer = await User.findById(currentReferrer.referrer);
      }
    }

    if (isFirstDeposit) {
      const depositBonus = await DepositBonus.find().sort({
        minimumDeposit: 1,
      });
      let bonusAmount = 0;
      console.log(totalDeposit);
      if (depositBonus.length > 0) {
        for (let i = depositBonus.length - 1; i >= 0; i--) {
          if (totalDeposit === depositBonus[i].minimumDeposit) {
            bonusAmount = depositBonus[i].bonus;
            break;
          }
        }
      }
      addTransactionDetails(userId, bonusAmount, "DepositBonus", new Date());
      updatedUser.walletAmount += bonusAmount;
      await updatedUser.save();
      console.log(
        `One-time bonus of ${bonusAmount} added to user ${userId}'s wallet.`
      );
    }
    res.status(200).json({ msg: "Wallet updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


router.post("/rejectDeposit", async (req, res) => {
  try {
    const { userId, depositId } = req.body;
    if (!userId || !depositId) {
      return res.status(400).json({ msg: "User ID and Deposit ID are required" });
    }

    // Update specific deposit status
    await Deposit.updateOne({ userId: userId, _id: depositId }, { depositStatus: "failed" });

    res.status(200).json({ msg: "Deposit status updated to failed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post("/createDeposit", auth, async (req, res) => {
  try {
    const { amount,depositMethod,depositId } = req.body;
    if (!amount) {
      return res.status(400).json({ msg: "Amount is required" });
    }
    const userId = req.user._id;

    // Create deposit history with status 'pending'
    const depositHistory = new Deposit({
      userId: userId,
      uid: req.user.uid,
      depositAmount: amount,
      depositDate: new Date(),
      depositStatus: "pending",
      depositId: depositId,
      depositMethod: depositMethod,
    });
    await depositHistory.save();

    res.status(200).json({ msg: "Deposit created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});



// Endpoint to get all deposit history for admin
router.get("/admin/deposit/history",auth, isAdmin, async (req, res) => {
  try {
    const depositHistory = await Deposit.find();
    res.status(200).json(depositHistory);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


router.get("/deposit/history", auth,  async (req, res) => {
  try {
    const depositHistory = await Deposit.find({ userId: req.user._id });
    res.status(200).json(depositHistory);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/pending-recharge", auth, isAdmin, async (req, res) => {
  try {
    const allDeposit = await Deposit.find();
    if (!allDeposit) {
      console.log("No user found in the DB");
    }
    let pendingRechargeArray = allDeposit.filter(
      (deposit) => deposit.depositStatus !== "completed"
    );
    if (pendingRechargeArray.length === 0) {
      return res.status(200).json({
        pendingAmount: 0,
        success: true,
        message: "No transaction is in pending state",
      });
    }
    let totalPendingAmount = pendingRechargeArray.reduce(
      (total, deposit) => total + deposit.depositAmount,
      0
    );
    res.status(200).json({
      pendingAmount: totalPendingAmount,
      success: true,
      message: "Data fetched successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/success-recharge", auth, isAdmin, async (req, res) => {
  try {
    const allDeposit = await Deposit.find();
    if (!allDeposit) {
      console.log("No user found in the DB");
    }
    let successRechargeArray = allDeposit.filter(
      (deposit) => deposit.depositStatus === "completed"
    );
    if (successRechargeArray.length === 0) {
      return res.status(200).json({
        successRechargeAmount: 0,
        success: true,
        message: "No success recharge done yet",
      });
    }
    let totalSuccessAmount = successRechargeArray.reduce(
      (total, deposit) => total + deposit.depositAmount,
      0
    );
    res.status(200).json({
      successAmount: totalSuccessAmount,
      success: true,
      message: "Data fetched successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post("/attendance", auth, async (req, res) => {
  try {
    const totalDeposit = await Deposit.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: "$depositAmount" } } },
    ]);

    if (!totalDeposit[0] || totalDeposit[0].total < 10000) {
      return res.status(400).json({
        msg: "You have not deposited enough to withdraw the daily bonus",
      });
    }

    if (
      req.user.lastBonusWithdrawal &&
      new Date().setHours(0, 0, 0, 0) ===
        new Date(req.user.lastBonusWithdrawal).setHours(0, 0, 0, 0)
    ) {
      return res
        .status(400)
        .json({ msg: "You have already withdrawn the daily bonus" });
    }

    // Update the wallet amount, last bonus withdrawal, total bonus amount, and consecutive days
    req.user.walletAmount += 100;
    req.user.lastBonusWithdrawal = Date.now();
    req.user.totalBonusAmount += 100;
    req.user.consecutiveDays += 1;
    await req.user.save();

    res.json({ msg: "Daily bonus withdrawn, 100 added to wallet" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/previous-day-stats", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Calculate the start of the previous day
    const startOfPreviousDay = new Date(now);
    startOfPreviousDay.setDate(now.getDate() - 1);
    startOfPreviousDay.setHours(0, 0, 0, 0);

    // Calculate the end of the previous day
    const endOfPreviousDay = new Date(now);
    endOfPreviousDay.setDate(now.getDate() - 1);
    endOfPreviousDay.setHours(23, 59, 59, 999);

    // Fetch user data to get subordinates' information
    const user = await User.findById(userId)
      .populate("directSubordinates.userId", "username")
      .populate("teamSubordinates.userId", "username");

    // Fetch commission rates
    const commissionRates = await Commission.findOne();

    // Fetch and filter deposit records for the previous day only
    const twentyFourHourDeposits = await Deposit.find({
      userId: {
        $in: [userId, ...user.directSubordinates.map((sub) => sub.userId)],
      },
      depositDate: { $gte: startOfPreviousDay, $lte: endOfPreviousDay }, // Only deposits within the previous day
    });

    // Calculate total profit (commission earned)
    let totalProfit = 0;

    // Check if there are any direct subordinates
    if (user.directSubordinates.length === 0) {
      console.log("No direct subordinates found.");
    } else {
      // Calculate commission for direct subordinates
      for (const deposit of twentyFourHourDeposits) {
        if (userId.equals(deposit.userId)) {
          continue; // Skip the user's own deposit
        }
        const sub = user.directSubordinates.find((sub) =>
          sub.userId.equals(deposit.userId)
        );
        if (sub) {
          const commissionRate = commissionRates[`level${sub.level}`] || 0;
          totalProfit += deposit.depositAmount * commissionRate;
        }
      }
    }

    // Check if there are any team subordinates
    if (user.teamSubordinates.length === 0) {
      console.log("No team subordinates found.");
    } else {
      // Calculate commission for team subordinates
      for (const teamSubordinate of user.teamSubordinates) {
        const subUserId = teamSubordinate.userId;

        // Filter deposits made by the current team subordinate
        const subUserDeposits = twentyFourHourDeposits.filter((deposit) =>
          deposit.userId.equals(subUserId)
        );

        // Calculate commission for each deposit made by the team subordinate
        for (const deposit of subUserDeposits) {
          const commissionRate =
            commissionRates[`level${teamSubordinate.level}`] || 0;
          totalProfit += deposit.depositAmount * commissionRate;
        }
      }
    }

    // Fetch and map data for direct subordinates
    const directSubordinatesData = await Promise.all(
      user.directSubordinates.map(async (sub) => {
        const subUserId = sub.userId._id;
        const subUserDeposits = await Deposit.find({
          userId: subUserId,
          depositDate: { $gte: startOfPreviousDay, $lte: endOfPreviousDay }, // Only deposits within the previous day
        });
        const subUserTotalProfit = subUserDeposits.reduce(
          (total, deposit) => total + deposit.depositAmount,
          0
        );
        const commissionRate = commissionRates[`level${sub.level}`] || 0;
        const subUserCommission = subUserTotalProfit * commissionRate;
        return {
          username: sub.userId.username,
          depositAmount: subUserTotalProfit,
          commission: subUserCommission,
        };
      })
    );

    // Fetch and map data for team subordinates
    const teamSubordinatesData = await Promise.all(
      user.teamSubordinates.map(async (sub) => {
        const subUserId = sub.userId._id;
        const subUserDeposits = await Deposit.find({
          userId: subUserId,
          depositDate: { $gte: startOfPreviousDay, $lte: endOfPreviousDay }, // Only deposits within the previous day
        });
        const subUserTotalProfit = subUserDeposits.reduce(
          (total, deposit) => total + deposit.depositAmount,
          0
        );
        const commissionRate = commissionRates[`level${sub.level}`] || 0;
        const subUserCommission = subUserTotalProfit * commissionRate;
        return {
          username: sub.userId.username,
          depositAmount: subUserTotalProfit,
          commission: subUserCommission,
          level: sub.level,
        };
      })
    );

    res.status(200).json({
      totalProfit,
      directSubordinates: directSubordinatesData,
      teamSubordinates: teamSubordinatesData,
      timeFrame: {
        start: startOfPreviousDay.toISOString(),
        end: endOfPreviousDay.toISOString(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});



router.post('/user/bank-details', auth, async (req, res) => {
  // Validate the incoming data
  const { name, accountNo, ifscCode, mobile ,bankName} = req.body;
  if (!name || !accountNo || !ifscCode || !mobile) {
    return res.status(400).send('All fields are required');
  }

  // Create a new bank detail
  const newBankDetail = { name, accountNo, ifscCode, mobile,bankName };

  try {
    // Find the user and push the new bank detail into the bankDetails array
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user already has bank details
    if (user.bankDetails && user.bankDetails.length > 0) {
      return res.status(400).send('Bank details already added. You cannot add more bank details.');
    }

    user.bankDetails.push(newBankDetail);
    await user.save();

    res.send(user);
  } catch (err) {
    res.status(500).send('Server error' + err.message);
  }
});

router.get('/user/bank-details/show', auth, async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user has bank details
    if (!user.bankDetails || user.bankDetails.length === 0) {
      return res.status(404).send('No bank details found for this user.');
    }

    // Send the bank details
    res.send(user.bankDetails);
  } catch (err) {
    res.status(500).send('Server error' + err.message);
  }
});

router.post('/user/trxaddress-update', auth, async (req, res) => {
  // Validate the incoming data
  const { trxAddress } = req.body;
  if (!trxAddress) {
    return res.status(400).send('All fields are required');
  }

  try {
    // Find the user and push the new bank detail into the bankDetails array
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user already has bank details
    if (user.TRXAddress && user.TRXAddress.length > 0) {
      return res.status(400).send('TRX Address already added. You cannot add more TRX Address.');
    }

    user.TRXAddress.push(trxAddress);
    await user.save();

    res.send(user);
  } catch (err) {
    res.status(500).send('Server error' + err.message);
  }
});


router.get('/user/trxaddress-show', auth, async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user has bank details
    if (!user.TRXAddress || user.TRXAddress.length === 0) {
      return res.status(404).send('No TRX Address found for this user.');
    }

    // Send the bank details
    res.send({ walletAddress: user.TRXAddress,network: "TRC 20"});
  } catch (err) {
    res.status(500).send('Server error' + err.message);
  }
})


router.post('/deposit', auth, async (req, res) => {
const { user, am, orderid, depositMethod } = req.body;
const userId = req.user._id;

  const depositHistory = new Deposit({
    userId: userId,
    uid: req.user.uid,
    depositAmount: am,
    depositDate: new Date(),
    depositStatus: "pending",
    depositId: orderid,
    depositMethod: depositMethod,
  });
  await depositHistory.save();





  const amountInCents = am * 100; // Convert amount to cents
    const paramArray = {
        mchId:process.env.MERCHANT_ID,
        productId:8036,
        mchOrderNo: Math.floor(Math.random() * 100000000000), // This will generate a random number between 0 and 99999999999
        currency: 'INR',
        amount: amountInCents.toString(),
        returnUrl: 'https://sunpay.onrender.com/return_page.html',
        notifyUrl: 'https://sunpay.onrender.com/api/pay/notify',
        subject: 'online shopping',
        body: 'something goods',
        param1: userId,
        param2: orderid,
        reqTime: new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14) // Format yyyyMMddHHmmss
    };

    paramArray.sign = paramArraySign(paramArray, mchKey);

    try {
        const response = await axios.post(`${payHost}/api/pay/neworder`, new URLSearchParams(paramArray).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        res.send(response.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});



router.get('/user/depositHistory/sum', auth, async (req, res) => {
  try {
      const userId = req.user._id;
      console.log(userId);
      const depositHistories = await Deposit.find({ userId: userId, depositStatus: 'completed' });
      const sum = depositHistories.reduce((total, deposit) => total + deposit.depositAmount, 0);
      res.json({ totalDeposit: sum });
  } catch (err) {
      res.status(500).json({ message: 'Server error' });
  }
});



router.get('/commission-levelwise', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const commissionSum = user.commissionRecords.reduce((acc, record) => {
      if (!acc[record.level]) {
        acc[record.level] = 0;
      }
      acc[record.level] += record.commission;
      return acc;
    }, {});

    res.send(commissionSum);
  } catch (error) {
    res.status(500).send({ message: 'Server error' });
  }
});

module.exports = router;