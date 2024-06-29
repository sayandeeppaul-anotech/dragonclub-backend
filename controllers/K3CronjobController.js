const express = require("express");
const User = require("../models/userModel");
const K3Result = require("../models/K3ResultModel");
const k3betmodel = require("../models/K3BetModel");
const cron = require("node-cron");
const moment = require("moment");

function secondsToHms2(d) {
  d = Number(d);
  var m = Math.floor((d % 3600) / 60);
  return ("0" + m).slice(-2) + ":" + ("0" + (d % 60)).slice(-2);
}

async function getLatestPeriodId2(timerName) {
  const timerModels = {
    "1min": Timer1Min,
    "3min": Timer3Min,
    "5min": Timer5Min,
    "10min": Timer10Min,
  };
  const timerModel = timerModels[timerName];
  const latestTimer = await timerModel.find().sort({ _id: -1 }).limit(1);
  return latestTimer[0].periodId;
}

const createTimer2 = (TimerModel, interval, timerName) => {
  const cronInterval = `*/${interval} * * * *`;
  const jobFunction = async () => {
    const periodId = moment().format("YYYYMMDDHHmmss");
    await TimerModel.create({ periodId });

    // console.log(`K3 Timer ${timerName} & ${periodId} started.`);

    // Schedule result processing after the interval
    setTimeout(async () => {
      const userBets = await k3betmodel.find({ periodId });

      // Initialize variables for least bet amounts and total bets
      let leastBetUser = {};
      let leastBetAmount = Infinity;
      let totalBets = {
        totalSum: 0,
        twoSameOneDifferent: 0,
        threeSame: 0,
        threeDifferentNumbers: 0
      };

      // Collect bet amounts and determine least betted section
      userBets.forEach((bet) => {
        totalBets[bet.selectedItem] += bet.betAmount;

        if (bet.betAmount < leastBetAmount) {
          leastBetAmount = bet.betAmount;
          leastBetUser[bet.selectedItem] = bet;
        }
      });

      // Determine the least betted section dynamically
      let leastBettedSection = Object.keys(totalBets).reduce((a, b) => totalBets[a] < totalBets[b] ? a : b);

      // Initialize variables for dice outcomes
      let winningNumberTotalSum;
      let diceOutcomeD1, diceOutcomeD2, diceOutcomeD3;
      let diceOutcomeTwoSameOneDifferent;
      let diceOutcomeThreeSame;
      let diceOutcomeThreeDifferentNumbers;

      // Map the outcome to the least betted section
      switch (leastBettedSection) {
        case 'totalSum':
          if (leastBetUser.totalSum) {
            winningNumberTotalSum = leastBetUser.totalSum.totalSum;
          }
          break;
        case 'twoSameOneDifferent':
          if (leastBetUser.twoSameOneDifferent) {
            const twoSameOneDifferentValue = leastBetUser.twoSameOneDifferent.twoSameOneDifferent;
            diceOutcomeTwoSameOneDifferent = twoSameOneDifferentValue.filter((value, index, self) => self.indexOf(value) === index);
          }
          break;
        case 'threeSame':
          if (leastBetUser.threeSame) {
            const threeSameValue = leastBetUser.threeSame.threeSame;
            diceOutcomeThreeSame = [threeSameValue, threeSameValue, threeSameValue];
          }
          break;
        case 'threeDifferentNumbers':
          if (leastBetUser.threeDifferentNumbers) {
            const threeDifferentNumbersValue = leastBetUser.threeDifferentNumbers.threeDifferentNumbers.map(Number);
            diceOutcomeThreeDifferentNumbers = threeDifferentNumbersValue;
          }
          break;
      }

      // Generate dice outcomes based on the winning number or user bets
      if (winningNumberTotalSum) {
        // Generate dice outcomes that match the winning number
        const possibleOutcomes = [];
        for (let i = 1; i <= 6; i++) {
          for (let j = 1; j <= 6; j++) {
            for (let k = 1; k <= 6; k++) {
              if (i + j + k === winningNumberTotalSum) {
                possibleOutcomes.push([i, j, k]);
              }
            }
          }
        }
        const randomIndex = Math.floor(Math.random() * possibleOutcomes.length);
        [diceOutcomeD1, diceOutcomeD2, diceOutcomeD3] = possibleOutcomes[randomIndex];
      } else if (diceOutcomeTwoSameOneDifferent) {
        // Generate outcomes for twoSameOneDifferent
        diceOutcomeD1 = diceOutcomeTwoSameOneDifferent[0];
        diceOutcomeD2 = diceOutcomeTwoSameOneDifferent[0];
        diceOutcomeD3 = diceOutcomeTwoSameOneDifferent[1];
      } else if (diceOutcomeThreeSame) {
        // Generate outcomes for threeSame
        diceOutcomeD1 = diceOutcomeThreeSame[0];
        diceOutcomeD2 = diceOutcomeThreeSame[0];
        diceOutcomeD3 = diceOutcomeThreeSame[0];
      } else if (diceOutcomeThreeDifferentNumbers) {
        // Generate outcomes for threeDifferentNumbers
        [diceOutcomeD1, diceOutcomeD2, diceOutcomeD3] = diceOutcomeThreeDifferentNumbers;
      } else {
        // Handle the case when there are no user bets or winning number is outside the range
        diceOutcomeD1 = Math.floor(Math.random() * 6) + 1;
        diceOutcomeD2 = Math.floor(Math.random() * 6) + 1;
        diceOutcomeD3 = Math.floor(Math.random() * 6) + 1;
        winningNumberTotalSum = diceOutcomeD1 + diceOutcomeD2 + diceOutcomeD3;
      }

      // Save dice outcomes in the K3Result model
      const K3Results = new K3Result({
        timerName: timerName,
        periodId: periodId,
        totalSum: winningNumberTotalSum,
        size: winningNumberTotalSum >= 3 && winningNumberTotalSum <= 10 ? "Small" : "Big",
        parity: winningNumberTotalSum % 2 === 0 ? "Even" : "Odd",
        diceOutcome: [diceOutcomeD1, diceOutcomeD2, diceOutcomeD3],
        twoSameOneDifferent: diceOutcomeTwoSameOneDifferent,
        threeSame: diceOutcomeThreeSame,
        threeDifferentNumbers: diceOutcomeThreeDifferentNumbers,
      });
      await K3Results.save();
      console.log(`K3 Timer ${timerName} & ${periodId} ended.`);

      // Process user bets
      if (userBets.length === 0) {
        console.log(`No bets for ${timerName} & ${periodId}`);
      } else {
        console.log(`Processing bets for ${timerName} & ${periodId}`, userBets);
      }
      for (let bet of userBets) {
        let userWon = false;
        let winAmount = 0;

        // Check if user's bet matches the winning total sum
        if (bet.selectedItem === "totalSum") {
          if (bet.totalSum === winningNumberTotalSum) {
            userWon = true;
            winAmount = bet.betAmount * bet.multiplier;
          }
        }

        // Check if user's bet matches the twoSameOneDifferent outcome
        if (bet.selectedItem === "twoSameOneDifferent" && diceOutcomeTwoSameOneDifferent) {
          const twoSameOneDifferentValue = bet.twoSameOneDifferent;
          if (
            (diceOutcomeTwoSameOneDifferent[0] === twoSameOneDifferentValue[0] &&
              diceOutcomeTwoSameOneDifferent[1] === twoSameOneDifferentValue[0] &&
              diceOutcomeTwoSameOneDifferent[2] === twoSameOneDifferentValue[1]) ||
            (diceOutcomeTwoSameOneDifferent[0] === twoSameOneDifferentValue[1] &&
              diceOutcomeTwoSameOneDifferent[1] === twoSameOneDifferentValue[0] &&
              diceOutcomeTwoSameOneDifferent[2] === twoSameOneDifferentValue[0]) ||
            (diceOutcomeTwoSameOneDifferent[0] === twoSameOneDifferentValue[0] &&
              diceOutcomeTwoSameOneDifferent[1] === twoSameOneDifferentValue[1] &&
              diceOutcomeTwoSameOneDifferent[2] === twoSameOneDifferentValue[0]) ||
            (diceOutcomeTwoSameOneDifferent[0] === twoSameOneDifferentValue[1] &&
              diceOutcomeTwoSameOneDifferent[1] === twoSameOneDifferentValue[0] &&
              diceOutcomeTwoSameOneDifferent[2] === twoSameOneDifferentValue[0])
          ) {
            userWon = true;
            winAmount = bet.betAmount * bet.multiplier;
          }
        }

        // Check if user's bet matches the threeSame outcome
        if (bet.selectedItem === "threeSame" && diceOutcomeThreeSame) {
          const threeSameValue = bet.threeSame;
          if (
            diceOutcomeThreeSame[0] === threeSameValue &&
            diceOutcomeThreeSame[1] === threeSameValue &&
            diceOutcomeThreeSame[2] === threeSameValue
          ) {
            userWon = true;
            winAmount = bet.betAmount * bet.multiplier;
          }
        }

        // Check if user's bet matches the threeDifferentNumbers outcome
        if (bet.selectedItem === "threeDifferentNumbers" && diceOutcomeThreeDifferentNumbers) {
          const threeDifferentNumbersValue = bet.threeDifferentNumbers.map(Number);
          if (
            threeDifferentNumbersValue.includes(diceOutcomeThreeDifferentNumbers[0]) &&
            threeDifferentNumbersValue.includes(diceOutcomeThreeDifferentNumbers[1]) &&
            threeDifferentNumbersValue.includes(diceOutcomeThreeDifferentNumbers[2]) &&
            new Set(threeDifferentNumbersValue).size === 3
          ) {
            userWon = true;
            winAmount = bet.betAmount * bet.multiplier;
          }
        }

        if (userWon) {
          const user = await User.findById(bet.user);
          if (user) {
            user.walletAmount += winAmount;
            await user.save();
            bet.winLoss = "win";
            bet.status = "won";
          }
        } else {
          bet.winLoss = "loss";
          bet.status = "lost";
        }
        await bet.save();
      }
    }, interval * 60 * 1000);
    console.log(`K3 Timer ${timerName} & ${periodId} started.`);
  };

  const job = cron.schedule(cronInterval, jobFunction);
  job.start();
};

const calculateRemainingTime2 = (periodId, minutes) => {
  const endtime = moment(periodId, "YYYYMMDDHHmmss").add(minutes, "minutes");
  const now = moment();
  const diff = endtime.diff(now, "seconds");
  return diff > 0 ? diff : 0;
};

module.exports = {
  createTimer2,
  getLatestPeriodId2,
  calculateRemainingTime2,
  secondsToHms2,
};
