// controllers/couponController.js
const express = require('express');
const router = express.Router();
const Coupon = require('../../models/coupon'); // Assuming you have a Coupon model
const User =   require('../../models/userModel'); // Assuming you have a User model
const auth = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/roleSpecificMiddleware');
const { addTransactionDetails } = require('../../controllers/TransactionHistoryControllers');

router.post('/create-coupon', async (req, res) => {
  const { code, bonusAmount, redemptionLimit } = req.body;
  const coupon = new Coupon({ code, bonusAmount, redemptionLimit });
  await coupon.save();
  res.send('Coupon created');
});

router.post('/redeem-coupon', auth, async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;
  const coupon = await Coupon.findOne({ code });
  if (!coupon || coupon.redemptionCount >= coupon.redemptionLimit) {
    res.status(400).send('Invalid or expired coupon');
    return;
  }
  const user = await User.findById(userId);
  user.walletAmount += coupon.bonusAmount;
  coupon.redemptionCount += 1;
  addTransactionDetails(userId, coupon.bonusAmount, "Envelop", new Date());

  await user.save();
  await coupon.save();
  res.send('Coupon redeemed');
});


router.get('/coupons-list', async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;








