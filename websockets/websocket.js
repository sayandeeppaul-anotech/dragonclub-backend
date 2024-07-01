const WebSocket = require("ws");
const {
  createTimer,
  calculateRemainingTime,
  secondsToHms,
} = require("../controllers/cronJobControllers");
const {
  createTimer1,
  calculateRemainingTime1,
  secondsToHms1,
} = require("../controllers/cronjobTRXController");
const mongoose = require("mongoose");
const async = require("async");
const {
  Timer1Min,
  Timer3Min,
  Timer5Min,
  Timer10Min,
} = require("../models/timersModel");
const { runSalaryCronJob } = require("../controllers/cronJobSalaryController");
const User = require("../models/userModel"); // Assuming you have a User model defined
const Bet = require("../models/betsModel"); // Assuming you have Bet model defined
const cron = require("node-cron");
const MainLevelModel = require("../models/levelSchema"); // Assuming you have MainLevelModel defined

cron.schedule("* * * * *", async () => {
  try {
    console.log("Running cron job at:", new Date().toISOString());

    // Aggregate total bets per user
    const betAggregation = await Bet.aggregate([
      {
        $addFields: {
          multipliedBetAmount: { $multiply: ["$betAmount", "$multiplier"] } // Calculate betAmount * multiplier
        }
      },
      {
        $group: {
          _id: "$userId",
          totalAmountOfBets: { $sum: "$multipliedBetAmount" }, // Summing up the multiplied betAmount for each user
          betCount: { $sum: 1 }, // Counting the number of bets for each user
        }
      },
      {
        $project: {
          userId: "$_id",
          totalAmountOfBets: 1,
          betCount: 1,
          _id: 0
        }
      }
    ])

    console.log(
      "Bet aggregation results:",
      JSON.stringify(betAggregation)
    ); 

    // Fetch main levels schema
    const mainLevelsDoc = await MainLevelModel.findOne();
    if (!mainLevelsDoc) {
      console.error("Main levels data not found.");
      return;
    }

    console.log("Main levels:", JSON.stringify(mainLevelsDoc.levels, null, 2));

    // Iterate through aggregated results
    for (const result of betAggregation) {
      const { userId, totalAmountOfBets } = result;

      console.log(
        `Processing user with ID ${userId}: totalAmountOfBets=${totalAmountOfBets}`
      );

      // Find the user and update based on total bets
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User with ID ${userId} not found.`);
        continue;
      }

      let highestAchievedLevel = null;
      for (const level of mainLevelsDoc.levels) {
        if (totalAmountOfBets >= level.minAmount) {
          highestAchievedLevel = level;
        } else {
          break; // Levels are sorted by minAmount, so no need to check lower levels
        }
      }

      if (highestAchievedLevel) {
        // Check if this level is already achieved
        const levelAchievement = `Reached ${highestAchievedLevel.awarded} level`;
        if (!user.achievements.includes(levelAchievement)) {
          // Add one-time bonus to user's wallet
          user.walletAmount += highestAchievedLevel.oneTimeBonus;
          console.log(
            `Added one-time bonus of ${highestAchievedLevel.oneTimeBonus} to user with ID ${userId}. New wallet balance: ${user.walletAmount}`
          );

          // Update achievements and mark level as achieved
          user.achievements.push(levelAchievement);
          console.log(
            `Updated achievements for user with ID ${userId}: ${user.achievements}`
          );
        }

        // Add monthly bonus
        user.walletAmount += highestAchievedLevel.monthlyBonus;
        console.log(
          `Added monthly bonus of ${highestAchievedLevel.monthlyBonus} to user with ID ${userId}. New wallet balance: ${user.walletAmount}`
        );
      }

      // Save updated user
      await user.save();
      console.log(`Saved updates for user with ID ${userId}`);
    }

    console.log(
      "User updates based on total bets and mainLevels completed successfully."
    );
  } catch (err) {
    console.error("Error updating users:", err);
  }
});

const wss = new WebSocket.Server({ noServer: true });
function setupWebSocket(server) {
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    console.log("a user connected");
    ws.on("close", () => {
      console.log("user disconnected");
    });
    ws.on("message", (msg) => {
      console.log("message: " + msg);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    });
  });
}

wss.on("connection", async (ws) => {
  ws.on("message", async (message) => {
    message = message.toString().trim();
    console.log("Received message:", message);
    if (message === "getUsers") {
      try {
        ws.send("hi lll");
      } catch (error) {
        console.error("error reading data", error);
      }
    }
  });
});

createTimer(Timer1Min, 1, "1min", 0); // 1 min
createTimer(Timer3Min, 3, "3min"); // 3 min
createTimer(Timer5Min, 5, "5min"); // 5 min
createTimer(Timer10Min, 10, "10min"); // 10 min

createTimer1(Timer1Min, 1, "1min"); // 1 min
createTimer1(Timer3Min, 3, "3min"); // 3 min
createTimer1(Timer5Min, 5, "5min"); // 5 min
createTimer1(Timer10Min, 10, "10min"); // 10 min

wss.on("connection", (ws) => {
  console.log("Client connected");

  const sendTimers = async () => {
    const timers = await async.parallel({
      "1min": async () => {
        const timer = await Timer1Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime(timer[0].periodId, 1);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms(remainingTime),
        };
      },
      "3min": async () => {
        const timer = await Timer3Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime(timer[0].periodId, 3);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms(remainingTime),
        };
      },
      "5min": async () => {
        const timer = await Timer5Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime(timer[0].periodId, 5);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms(remainingTime),
        };
      },
      "10min": async () => {
        const timer = await Timer10Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime(timer[0].periodId, 10);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms(remainingTime),
        };
      },
    });

    ws.send(JSON.stringify({ timers }));
  };

  sendTimers();
  const intervalId = setInterval(sendTimers, 1000); // Send timers every second

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(intervalId);
  });
});

runSalaryCronJob(wss);

module.exports = { setupWebSocket, wss };
