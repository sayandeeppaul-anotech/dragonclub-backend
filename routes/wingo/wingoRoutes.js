const express = require('express');
const Bet = require('../../models/betsModel');
const router = express.Router();
const auth = require('../../middlewares/auth');
const User = require('../../models/userModel');
const { addTransactionDetails} = require("../../controllers/TransactionHistoryControllers");
const CommissionRate = require('../../models/betCommissionLevel');
const { isAdmin } = require('../../middlewares/roleSpecificMiddleware');


router.post('/wingobet', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.walletAmount -= req.body.totalBet;
            await user.save();
        }

        // Apply the 2% transaction fee
        const totalBetAfterTx = req.body.totalBet * 0.98;

        const bet = new Bet({
            userId: req.user._id,
            selectedItem: req.body.selectedItem,
            betAmount: req.body.betAmount,
            multiplier: req.body.multiplier,
            totalBet: totalBetAfterTx, // Use the totalBet amount after the transaction fee
            tax: req.body.totalBet - totalBetAfterTx, // Calculate the transaction fee
            selectedTimer: req.body.selectedTimer,
            periodId: req.body.periodId,
            timestamp: Date.now(),
            result: req.body.result,
            status: req.body.status,
            winLoss: req.body.winLoss,
        });

        await bet.save();
        addTransactionDetails(bet.userId,bet.totalBet,"Wingo", new Date())
        // Commission rates
        const { level1, level2, level3, level4, level5 } = await CommissionRate.findOne();
        const commissionRates = [level1, level2, level3, level4, level5];


        // Start with the user who placed the bet
        let currentUserId = req.user._id;

        // For each level in the upline
        for (let i = 0; i < 5; i++) {
            // Find the current user
            let currentUser = await User.findById(currentUserId);

            // If the user doesn't exist or doesn't have a referrer, break the loop
            if (!currentUser || !currentUser.referrer) {
                break;
            }

            // Find the referrer
            let referrer = await User.findById(currentUser.referrer);

            // If the referrer doesn't exist, break the loop
            if (!referrer) {
                break;
            }

            // Calculate the commission for the referrer
            let commission = req.body.totalBet * commissionRates[i];

            // Add the commission to the referrer's wallet
            referrer.walletAmount += commission;
            addTransactionDetails(referrer._id, commission, "Bet", new Date());


// Get today's date
let today = new Date();
today.setHours(0, 0, 0, 0);


// Find the commission record for today
let commissionRecord = referrer.commissionRecords.find(record => {
    let recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime() && record.uid === req.user.uid;
});

if (commissionRecord) {
    // If a record for today exists, update the commission
    commissionRecord.commission += commission;
    commissionRecord.betAmount += req.body.totalBet; // Update the betAmount
} else {
    // If no record for today exists, create a new one
    // Only if the uid of the referrer matches the uid of the user who placed the bet
    if (referrer.uid === req.user.uid) {
        referrer.commissionRecords.push({
            date: today,
            level: i + 1, 
            uid: req.user.uid,
            commission: commission,
            betAmount: req.body.totalBet,
        });
    }
}


await referrer.save();



            // Move to the next user in the upline
            currentUserId = referrer._id;
        }

        res.status(201).json(bet);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving bet', error: error.message });
    }
});
  

router.get('/user/betshistory', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const bets = await Bet.find({ userId: userId }).sort({ timestamp: -1 });
        res.status(200).json(bets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving bet history', error: error.message });
    }
});



router.put('/commissionRates', auth, isAdmin, async (req, res) => {
    try {
        const { level1, level2, level3, level4, level5 } = req.body;

        const commissionRate = await CommissionRate.findOneAndUpdate({}, {
            level1,
            level2,
            level3,
            level4,
            level5
        }, { new: true, upsert: true });

        res.status(200).json(commissionRate);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving commission rates', error: error.message });
    }
});


router.get('/commissionRates-data-get', auth, isAdmin, async (req, res) => {
    try {
        const commissionRates = await CommissionRate.findOne();
        res.status(200).json(commissionRates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching commission rates', error: error.message });
    }
});


  module.exports = router;








  