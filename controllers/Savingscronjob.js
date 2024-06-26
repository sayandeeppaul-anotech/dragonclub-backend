const Savings = require("../models/SavingsAmount");
const cron = require("node-cron");
const User = require('../models/userModel');
const {addTransactionDetails} = require('./TransactionHistoryControllers')
const calculateInterest = (amount, duration) => {
  let interestRate;
  if (duration >= 24) {
    interestRate = 0.1;
  } else if (duration >= 12) {
    interestRate = 0.07;
  } else if (duration >= 6) {
    interestRate = 0.05;
  } else {
    interestRate = 0;
  }
  return amount * interestRate;
};

const scheduleYearlyUpdate = () => {
  cron.schedule("0 0 1 * *", async () => { 
    try {
      console.log("Running cron job");

      const savingDocs = await Savings.find();
      console.log(`${savingDocs.length} savings documents found`);

      for (const savings of savingDocs) {
        const interest = calculateInterest(savings.amount, savings.duration);
        console.log(`Interest calculated for user ${savings.user}: ${interest}`);

        const user = await User.findById(savings.user);
        console.log('User found:', user);

        if (user) {
          user.walletAmount += interest; 
          await user.save();
          addTransactionDetails(savings.user,interest,"interset")
          console.log(`Wallet amount updated for user ${user._id}: ${user.walletAmount}`);
        }
      }

      console.log(`${savingDocs.length} users' wallet amounts were updated with interest`);
    } catch (error) {
      console.error("Error running cron job:", error);
    }
  });
};

module.exports = scheduleYearlyUpdate;
