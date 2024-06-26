const cron = require("node-cron");
const moment = require("moment");
const User = require("../models/userModel");
const DepositHistory = require("../models/depositHistoryModel");
const Bets = require("../models/betsModel");
const WebSocket = require("ws");
const AdminSetting = require("../models/adminSettingsModel");

const runSalaryCronJob = (wss) => {
  cron.schedule(
    "58 23 * * *",
    async () => {
      try {
        console.log("Salary cron job running...");

        const users = await User.find({});
        const adminSettings = await AdminSetting.find({}).sort({
          minimumSubordinates: -1,
        });
        console.log("adminSettings--->", adminSettings);

        console.log("User list --->", users);

        for (const user of users) {
          console.log("Individual users --->", user);
          const subordinatesCount = user.directSubordinates
            ? user.directSubordinates.length
            : 0;
          console.log("subordinatesCount--->", subordinatesCount);

          const twentyFourHoursAgo = moment().subtract(24, "hours");

          let salaryAdded = false;

          for (const setting of adminSettings) {
            console.log("minSubodinates--->", setting.minimumSubordinates);
            if (subordinatesCount >= setting.minimumSubordinates) {
              let totalDeposit = 0;
              let allDeposited = true;
              let allPlayedBet = true;

              console.log("inside this if block");

              for (const subordinate of user.directSubordinates) {
                console.log("subordinate--->", subordinate);
                const deposits = await DepositHistory.find({
                  userId: subordinate.userId,
                  depositDate: {
                    $gte: twentyFourHoursAgo.toDate(),
                    $lt: moment().toDate(),
                  },
                });

                console.log("deposits--->", deposits);

                const totalSubordinateDeposit = deposits.reduce(
                  (sum, deposit) => sum + deposit.depositAmount,
                  0
                );

                if (deposits.length === 0 || totalSubordinateDeposit === 0) {
                  allDeposited = false;
                  break;
                }

                const betPlayed = await Bets.findOne({
                  userId: subordinate.userId,
                  timestamp: {
                    $gte: twentyFourHoursAgo.toDate(),
                    $lt: moment().toDate(),
                  },
                });

                if (!betPlayed) {
                  allPlayedBet = false;
                  break;
                }

                totalDeposit += totalSubordinateDeposit;
              }

              console.log("totalDeposit--->", totalDeposit);

              if (
                allDeposited &&
                allPlayedBet &&
                totalDeposit >= setting.minimumDepositAmount
              ) {
                user.walletAmount += setting.bonusAmount;
                await user.save();
                console.log(`Salary credited to user: ${user._id}`);

                // Broadcast salary update to WebSocket clients
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(`Salary credited to user: ${user._id}`);
                  }
                });

                salaryAdded = true;
                break;
              }
            }
          }

          if (!salaryAdded) {
            console.log(`Criteria not met for user: ${user._id}`);
          }
        }
      } catch (error) {
        console.error("Error running salary cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

module.exports = { runSalaryCronJob };