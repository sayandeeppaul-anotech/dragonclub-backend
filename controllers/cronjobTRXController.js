// const WingoResult = require("../models/wingoResultModel");
const K3Result = require("../models/K3ResultModel");
const TrxResult = require("../models/trxResultModel");
const crypto = require("crypto");
const cron = require("node-cron");
const moment = require("moment");
// const Bets = require("../models/betsModel");
// const User = require("../models/userModel");

function secondsToHms1(d) {
  d = Number(d);
  var m = Math.floor((d % 3600) / 60);
  return ("0" + m).slice(-2) + ":" + ("0" + (d % 60)).slice(-2);
}

async function getLatestPeriodId1(timer) {
  let timerModel;
  switch (timer) {
    case "1min":
      timerModel = Timer1Min;
      break;
    case "3min":
      timerModel = Timer3Min;
      break;
    case "5min":
      timerModel = Timer5Min;
      break;
    case "10min":
      timerModel = Timer10Min;
      break;
  }
  const latestTimer = await timerModel.find().sort({ _id: -1 }).limit(1);
  return latestTimer[0].periodId;
}

const createTimer1 = (TimerModel, interval, timerName) => {
  const cronInterval = `*/${interval} * * * *`;

  const jobFunction = async () => {
    const periodId = moment().format("YYYYMMDDHHmmss");
    await TimerModel.create({ periodId });

    setTimeout(async () => {
      // Fetch all the bets where selectedItem is a number and periodId matches the current periodId
    //   const numberBets = await Bets.find({
    //     periodId,
    //     selectedItem: { $regex: /^[0-9]$/ },
    //   });

      // Initialize betCounts with all numbers set to 0
    //   const betCounts = Array.from({ length: 10 }, (_, i) =>
    //     i.toString()
    //   ).reduce((counts, number) => {
    //     counts[number] = 0;
    //     return counts;
    //   }, {});

      // Count the bets for each number
    //   numberBets.forEach((bet) => {
    //     betCounts[bet.selectedItem]++;
    //   });

      // Find the number(s) with the least bets
    //   const minBetCount = Math.min(...Object.values(betCounts));
    //   const leastBetNumbers = Object.keys(betCounts).filter(
    //     (number) => betCounts[number] === minBetCount
    //   );

      // If there are multiple numbers with the least bets, pick one randomly
      let numberOutcome=1;
    //   if (leastBetNumbers.length > 0) {
    //     const randomIndex = Math.floor(Math.random() * leastBetNumbers.length);
    //     numberOutcome = leastBetNumbers[randomIndex];
    //   } else {
    //     // If no bets are placed on any number, pick a random number as numberOutcome
    //     numberOutcome = Math.floor(Math.random() * 10).toString();
    //   }
    //   let sizeOutcome = parseInt(numberOutcome) < 5 ? "small" : "big";

    //   let colorOutcome;
    //   switch (numberOutcome) {
    //     case "1":
    //     case "3":
    //     case "7":
    //     case "9":
    //       colorOutcome = "green";
    //       break;
    //     case "2":
    //     case "4":
    //     case "6":
    //     case "8":
    //       colorOutcome = "red";
    //       break;
    //     case "0":
    //       colorOutcome = ["red", "violet"];
    //       break;
    //     case "5":
    //       colorOutcome = ["green", "violet"];
    //       break;
    //     default:
    //       colorOutcome = "unknown";
    //   }

    //   await WingoResult.create({
    //     timer: timerName,
    //     periodId,
    //     colorOutcome,
    //     numberOutcome,
    //     sizeOutcome,
    //   });

    //   console.log(`Timer ${timerName} & ${periodId} ended.`);
    //   // check for this periodId in the bets model
    //   const bets = await Bets.find({ periodId: periodId });

    //   if (bets.length === 0) {
    //     console.log(`No bets for ${timerName} & ${periodId}`);
    //     return;
    //   } else {
    //     console.log(`Bets for ${timerName} & ${periodId} found.`);
    //     if (bets.length > 0) {
    //       bets
    //         .filter((bet) => bet.selectedTimer === timerName) // Only include bets that match the current timer
    //         .forEach(async (bet) => {
    //           let winLoss = 0;
    //           let status = "lost"; // Default status to 'lost'
    //           let result = numberOutcome;
    //           if (bet.selectedItem === numberOutcome) {
    //             winLoss =
    //               typeof bet.totalBet === "number"
    //                 ? (bet.totalBet * 9).toString()
    //                 : "0"; // 9 times if numberOutcome
    //           } else if (bet.selectedItem === colorOutcome) {
    //             winLoss =
    //               typeof bet.totalBet === "number"
    //                 ? (bet.totalBet * 2).toString()
    //                 : "0"; // 2 times if colorOutcome
    //           } else if (bet.selectedItem === sizeOutcome) {
    //             winLoss =
    //               typeof bet.totalBet === "number"
    //                 ? (bet.totalBet * 2).toString()
    //                 : "0"; // 2 times if sizeOutcome
    //           }

    //           if (winLoss !== 0) {
    //             // Update the user's walletAmount
    //             const user = await User.findById(bet.userId);
    //             if (user) {
    //               user.walletAmount += Number(winLoss); // Convert winLoss back to a number before adding it to walletAmount
    //               await user.save();
    //             }
    //             status = "win"; // Update status to 'win' if the user has won
    //           } else {
    //             winLoss =
    //               typeof bet.totalBet === "number"
    //                 ? (bet.totalBet * -1).toString()
    //                 : "0"; // Set winLoss to negative if the user loses
    //           }
    //           await Bets.findByIdAndUpdate(bet._id, {
    //             status,
    //             winLoss,
    //             result,
    //           });
    //         });
    //     }
    //   }
// console.log('inside')
      const trxBlockAddress = Math.floor(
        Math.random() * 90000000 + 10000000
      ).toString();
      const blockTime = moment().format("HH:mm:ss");
      const hash = crypto.randomBytes(20).toString("hex");
      const numberOutcomeGameResult = hash.match(/\d(?=[^\d]*$)/)[0];

      const gameResult = new TrxResult({
        timer: timerName,
        periodId,
        colorOutcome:'red',
        numberOutcome: numberOutcomeGameResult,
        sizeOutcome:'small',
        trxBlockAddress,
        blockTime,
        hash,
      });

      await gameResult.save();
      // console.log('---->',gameResult)

      // K3 game logic
      const diceOutcome = [
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ];
      const totalSum = diceOutcome.reduce((a, b) => a + b, 0);
      const size = totalSum < 15 ? "Small" : "Big";
      const parity = totalSum % 2 === 0 ? "Even" : "Odd";

      const resultK3 = new K3Result({
        timerName: timerName,
        periodId: periodId,
        totalSum: totalSum,
        size: size,
        parity: parity,
        diceOutcome: diceOutcome,
      });

      resultK3.save();
    }, interval * 60 * 1000); // Wait for the end of the period

    // console.log(`Timer ${timerName} & ${periodId}  started.`);
  };

  // Run the job function immediately
  jobFunction();

  const job = cron.schedule(cronInterval, jobFunction);

  // Start the cron job
  job.start();
};

const calculateRemainingTime1 = (periodId, minutes) => {
  const endTime = moment(periodId, "YYYY-MM-DD-HH-mm-ss").add(
    minutes,
    "minutes"
  );
  const now = moment();
  const diff = endTime.diff(now, "seconds");
  return diff > 0 ? diff : 0;
};

module.exports = {
  secondsToHms1,
  calculateRemainingTime1,
  getLatestPeriodId1,
  createTimer1,
};
