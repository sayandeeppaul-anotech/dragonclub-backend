const express = require("express");
const router = express.Router();
const user = require("../../models/userModel");
const auth = require("../../middlewares/auth");
const {isAdmin,isNormal,isRestricted,} = require("../../middlewares/roleSpecificMiddleware");
const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const DepositHistory = require("../../models/depositHistoryModel");
const Bet = require("../../models/betsModel");
const Withdraw = require("../../models/withdrawModel");
const { getLatestPeriodId } = require('../../controllers/cronJobControllers');
const Bets = require('../../models/betsModel');
const Settings = require('../../models/Settings');
const mongoose = require("mongoose")




router.get('/user', auth, async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).send({ message: 'No user ID in cookies' });
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      res.send(user);
    } catch (error) {
      res.status(500).send({ message: 'Server error' });
    }
  });


  router.get('/fetchuserdetails',auth,isAdmin,async(req,res)=>{
    try {
        const users = await User.find({},'walletAmount uid username mobile _id')
        if (!users.length){
            res.status(404).json({
                sucess:false,
                message:"No user found" 
            })
        }
        res.status(200).json({
            sucess:true,
            message:"Here is the Details",
            users
        })
    } catch (error) {
        res.status(500).json({
            sucess:false,
            message:"server error",
            error:error.message 
        })
    }
})

router.delete('/deleteuser', auth, isAdmin, async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Please enter the mobile number"
      });
    }

    let user = await User.findOne({ mobile: mobile });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with the provided mobile number"
      });
    }

    user.locked = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User Locked Successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

function generateUsername() {
  const randomNumbers = Math.floor(Math.random() * 10000);
  const randomAlphabets = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `MEMBER${randomNumbers}${randomAlphabets}`;
}

function generateInviteCode() {
  return Math.floor(100000000000 + Math.random() * 900000000000);
}

function generateUID() {
  return Math.floor(100000 + Math.random() * 900000);
}

function generateReferralLink(req, invitationCode) {
  let baseUrl = req.protocol + "://" + req.get("host");
  return `${baseUrl}/register?invitecode=${invitationCode}`;
}

function generateProfilePicture(req) {
  const randomNumber = Math.floor(Math.random() * 6) + 1;
  let baseUrl = req.protocol + "://" + req.get("host");
  return `${baseUrl}/${randomNumber}.jpg`;
}


  // Endpoint for admin to register a new user
  router.post("/re-register", auth,isAdmin,async (req, res) => {
    try {
      // Extract data from request body
      const { mobile, password, accountType = "Normal" } = req.body;
  
      // Check if mobile and password are provided
      if (!mobile || !password) {
        return res.status(400).json({ msg: "Mobile and password are required fields" });
      }
  
      // Check if the requesting user is an admin
      if (req.user.accountType !== "Admin") {
        return res.status(403).json({ msg: "Unauthorized: Only admins can register new users" });
      }
  
      // Check if user already exists with the provided mobile number
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return res.status(400).json({ msg: "User already exists" });
      }
  
      // Hash the password
      const encryptedPassword = await bcrypt.hash(password, 10);
  
      // Generate user data
      const invitationCode = generateInviteCode();
      const userData = {
        mobile,
        password: encryptedPassword,
        username: generateUsername(),
        invitationCode,
        uid: generateUID(),
        accountType,
        referralLink: generateReferralLink(req, invitationCode),
        avatar: generateProfilePicture(req)
      };
  
      // Register the new user
      const newUser = new User(userData);
      await newUser.save();
  
      // Generate JWT token for the new user
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: 3600 });
      newUser.token = token;
      newUser.password = undefined;
  
      // Return success response
      res.status(200).json({ success: true, message: "User registered successfully", user: newUser });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server Error" });
    }
  });



// Endpoint to update username
router.put('/user/username', auth, async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username || user.username;

    await user.save();

    res.json({ message: 'Username updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred', error });
  }
});

// Endpoint to update avatar
router.put('/user/avatar',auth, async (req, res) => {
  const { avatar } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar || user.avatar;

    await user.save();

    res.json({ message: 'Avatar updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred', error });
  }
});


router.get('/user-profile/:userId', auth, isAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    const depositHistory = await DepositHistory.find({ userId });
    const bets = await Bet.find({ userId });
    const withdraws = await Withdraw.find({ userId });

    // Fetch user details
    const user = await User.findById(userId).populate('referredUsers');
    const { bankDetails, walletAmount } = user;

    // Extract mobile numbers from referred users
    const referredUserMobiles = user.referredUsers.map(referredUser => referredUser.mobile);

    // Sum up all values in one from all objects in teamSubordinates and directSubordinates
    const sumValues = (subordinates) => {
      return subordinates.reduce((acc, curr) => {
        acc.noOfRegister += curr.noOfRegister;
        acc.depositNumber += curr.depositNumber;
        acc.depositAmount += curr.depositAmount;
        acc.firstDeposit += curr.firstDeposit;
        return acc;
      }, { noOfRegister: 0, depositNumber: 0, depositAmount: 0, firstDeposit: 0 });
    };

    const teamSubordinates = sumValues(user.teamSubordinates);
    const directSubordinates = sumValues(user.directSubordinates);


    const sumCommissionByLevel = user.commissionRecords.reduce((acc, curr) => {
      acc[`level${curr.level}`] = (acc[`level${curr.level}`] || 0) + curr.commission;
      return acc;
    }, {});

    res.json({
      depositHistory,
      bets,
      withdraws,
      bankDetails,
      teamSubordinates,
      directSubordinates,
      walletAmount,
      referredUserMobiles,
      commission: sumCommissionByLevel
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.get('/latest-bet-sums', auth, isAdmin, async (req, res) => {
  try {
    const timers = ['1min', '3min', '5min', '10min'];
    const betSums = {};

    for (const timer of timers) {
      const periodId = await getLatestPeriodId(timer);
      const bets = await Bets.find({ periodId });

      const numberBetSums = Array.from({ length: 10 }, (_, i) => ({ number: i.toString(), totalBet: 0 }));
      const sizeBetSums = { big: 0, small: 0 };
      const colorBetSums = { green: 0, red: 0, violet: 0 };

      bets.forEach((bet) => {
        if (/^[0-9]$/.test(bet.selectedItem)) {
          numberBetSums[parseInt(bet.selectedItem)].totalBet += bet.totalBet;
        } else if (bet.selectedItem in sizeBetSums) {
          sizeBetSums[bet.selectedItem] += bet.totalBet;
        } else if (bet.selectedItem in colorBetSums) {
          colorBetSums[bet.selectedItem] += bet.totalBet;
        }
      });
      betSums[timer] = { periodId, numberBetSums, sizeBetSums, colorBetSums };
    }
    res.json(betSums);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.put('/updateWallet', async (req, res) => {
  const { uid, amount, action } = req.body;

  try {
    const user = await User.findOne({ uid: uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'increase') {
      user.walletAmount += amount;
    } else if (action === 'decrease') {
      user.walletAmount -= amount;
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await user.save();

    res.json({ message: `Wallet amount ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});




router.get('/settings-withdraw', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings-modify-withdrawl', auth, async (req, res) => {
  try {
    const { withdrawalStartHour, withdrawalEndHour, maxWithdrawRequestsPerDay, minWithdrawAmount, maxWithdrawAmount } = req.body;

    const update = {};
    if (withdrawalStartHour !== undefined) update.withdrawalStartHour = withdrawalStartHour;
    if (withdrawalEndHour !== undefined) update.withdrawalEndHour = withdrawalEndHour;
    if (maxWithdrawRequestsPerDay !== undefined) update.maxWithdrawRequestsPerDay = maxWithdrawRequestsPerDay;
    if (minWithdrawAmount !== undefined) update.minWithdrawAmount = minWithdrawAmount;
    if (maxWithdrawAmount !== undefined) update.maxWithdrawAmount = maxWithdrawAmount;

    const settings = await Settings.findOneAndUpdate({}, update, { new: true });

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.get('/completed_withdraws_sum',auth, async (req, res) => {
  try {
    let user = req.user._id;
    const result = await Withdraw.aggregate([
      { $match: { userId: user, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
console.log(result);
    const totalBalance = result.length > 0 ? result[0].total : 0;
      res.json({ totalBalance });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


module.exports =  router;
