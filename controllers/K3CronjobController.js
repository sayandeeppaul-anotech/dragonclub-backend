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

    setTimeout(async () => {
      try {
        const bets = await k3betmodel.find({ periodId });

        if (bets.length === 0) {
          console.log(`No bets for ${timerName} & ${periodId}`);
          return;
        }

        const totalBets = {
          totalSum: 0,
          twoSameOneDifferent: 0,
          threeSame: 0,
          threeDifferentNumbers: 0,
        };

        bets.forEach((bet) => {
          if (totalBets.hasOwnProperty(bet.selectedItem)) {
            totalBets[bet.selectedItem] += bet.betAmount;
          }
        });

        const leastBettedSection = Object.keys(totalBets).reduce((a, b) => totalBets[a] < totalBets[b] ? a : b);

        let leastBettedSubset;
        let winningNumberTotalSum;
        let diceOutcomeD1, diceOutcomeD2, diceOutcomeD3;

        switch (leastBettedSection) {
          case 'totalSum':
            leastBettedSubset = bets.filter(bet => bet.selectedItem === 'totalSum');
            winningNumberTotalSum = leastBettedSubset.length > 0 ? leastBettedSubset[0].totalSum : null;
            break;
          case 'twoSameOneDifferent':
            leastBettedSubset = bets.filter(bet => bet.selectedItem === 'twoSameOneDifferent');
            break;
          case 'threeSame':
            leastBettedSubset = bets.filter(bet => bet.selectedItem === 'threeSame');
            break;
          case 'threeDifferentNumbers':
            leastBettedSubset = bets.filter(bet => bet.selectedItem === 'threeDifferentNumbers');
            break;
        }

        if (leastBettedSubset && leastBettedSubset.length > 0) {
          // Find the subset with the least total bet amount
          const leastBettedBet = leastBettedSubset.reduce((prev, current) => prev.betAmount < current.betAmount ? prev : current);
          
          switch (leastBettedSection) {
            case 'totalSum':
              // Calculate possible outcomes for totalSum
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
              break;
            case 'twoSameOneDifferent':
              [diceOutcomeD1, diceOutcomeD2, diceOutcomeD3] = leastBettedBet.twoSameOneDifferent;
              break;
            case 'threeSame':
              diceOutcomeD1 = leastBettedBet.threeSame[0];
              diceOutcomeD2 = leastBettedBet.threeSame[0];
              diceOutcomeD3 = leastBettedBet.threeSame[0];
              break;
            case 'threeDifferentNumbers':
              [diceOutcomeD1, diceOutcomeD2, diceOutcomeD3] = leastBettedBet.threeDifferentNumbers;
              break;
          }
        } else {
          // If no bets found in the least betted section, generate random outcomes
          diceOutcomeD1 = Math.floor(Math.random() * 6) + 1;
          diceOutcomeD2 = Math.floor(Math.random() * 6) + 1;
          diceOutcomeD3 = Math.floor(Math.random() * 6) + 1;
          winningNumberTotalSum = diceOutcomeD1 + diceOutcomeD2 + diceOutcomeD3;
        }

        await K3Result.create({
          timerName,
          periodId,
          totalSum: winningNumberTotalSum || (diceOutcomeD1 + diceOutcomeD2 + diceOutcomeD3),
          size: winningNumberTotalSum >= 3 && winningNumberTotalSum <= 18 ? "Small" : "Big",
          parity: winningNumberTotalSum % 2 === 0 ? "Even" : "Odd",
          diceOutcome: [diceOutcomeD1, diceOutcomeD2, diceOutcomeD3],
          twoSameOneDifferent: [],
          threeSame: [],
          threeDifferentNumbers: [],
        });

        console.log(`K3 Timer ${timerName} & ${periodId} ended.`);

        const processBetResults = async (bet) => {
          let userWon = false;
          let winAmount = 0;

          // Check if the bet matches the winning conditions
          switch (bet.selectedItem) {
            case "totalSum":
              if (bet.totalSum === winningNumberTotalSum) {
                userWon = true;
                winAmount = bet.betAmount * 9;
              }
              break;
            case "twoSameOneDifferent":
              if (diceOutcomeD1 === diceOutcomeD2 && diceOutcomeD3 !== diceOutcomeD1 &&
                bet.twoSameOneDifferent.includes(diceOutcomeD1) && bet.twoSameOneDifferent.includes(diceOutcomeD3)) {
                userWon = true;
                winAmount = bet.betAmount * 2;
              }
              break;
            case "threeSame":
              if (diceOutcomeD1 === diceOutcomeD2 && diceOutcomeD2 === diceOutcomeD3 &&
                bet.threeSame.includes(diceOutcomeD1)) {
                userWon = true;
                winAmount = bet.betAmount * 2;
              }
              break;
            case "threeDifferentNumbers":
              if (new Set([diceOutcomeD1, diceOutcomeD2, diceOutcomeD3]).size === 3 &&
                bet.threeDifferentNumbers.every(num => [diceOutcomeD1, diceOutcomeD2, diceOutcomeD3].includes(num))) {
                userWon = true;
                winAmount = bet.betAmount * 2;
              }
              break;
          }

          if (userWon) {
            const user = await User.findById(bet.user);
            if (user) {
              user.walletAmount += winAmount;
              await user.save();
            }
            bet.status = "Succeed";
            bet.winLoss = winAmount;
          } else {
            bet.status = "Failed";
            bet.winLoss = bet.betAmount * -1;
          }

          await k3betmodel.findByIdAndUpdate(bet._id, { status: bet.status, winLoss: bet.winLoss });
        };

        await Promise.all(bets.filter((bet) => bet.selectedTimer === timerName).map(processBetResults));

      } catch (error) {
        console.error(`Error processing bets for ${timerName} & ${periodId}:`, error);
      }
    }, interval * 60 * 1000);

    console.log(`K3 Timer ${timerName} & ${periodId} started.`);
  };

  cron.schedule(cronInterval, jobFunction).start();
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
