const TrxResult = require("../models/trxResultModel");
const TrxBet = require("../models/TRXBetModel");
const User = require("../models/userModel");
const crypto = require("crypto");
const cron = require("node-cron");
const moment = require("moment");

const createTrxTimer1 = (TimerModel, interval, timerName) => {
  const cronInterval = `*/${interval} * * * *`;

  const jobFunction1 = async () => {
    try {
      const periodId = moment().format("YYYYMMDDHHmmss");
      await TimerModel.create({ periodId });

      setTimeout(async () => {
        const trxBlockAddress = Math.floor(
          Math.random() * 90000000 + 10000000
        ).toString();
        const blockTime = moment().format("HH:mm:ss");
        const randomHash = crypto.randomBytes(32).toString("hex");

        const trxBets = await TrxBet.find({ periodId });

        // Separate bets into number bets and size bets
        const numberBets = trxBets.filter((bet) =>
          /^[0-9]$/.test(bet.selectedItem)
        );
        const sizeBets = trxBets.filter((bet) =>
          ["small", "big"].includes(bet.sizeOutcome)
        );

        // Initialize betAmounts with all numbers set to 0 and size bets
        const betAmounts = { number: {}, size: { small: 0, big: 0 } };
        for (let i = 0; i < 10; i++) {
          betAmounts.number[i.toString()] = 0;
        }

        // Sum the total bet amounts for number bets and size bets
        numberBets.forEach((bet) => {
          betAmounts.number[bet.selectedItem] += bet.totalBet;
        });
        sizeBets.forEach((bet) => {
          betAmounts.size[bet.sizeOutcome] += bet.totalBet;
        });

        console.log("betAmounts --->", betAmounts);

        // Determine the majority category and the least bet option
        let outcomeCategory, outcomeValue;

        if (numberBets.length >= sizeBets.length) {
          outcomeCategory = "number";
          const minBetAmount = Math.min(...Object.values(betAmounts.number));
          const leastBetNumbers = Object.keys(betAmounts.number).filter(
            (number) => betAmounts.number[number] === minBetAmount
          );
          outcomeValue =
            leastBetNumbers.length > 0
              ? leastBetNumbers[
                  Math.floor(Math.random() * leastBetNumbers.length)
                ]
              : Math.floor(Math.random() * 10).toString();
        } else {
          outcomeCategory = "size";
          const leastBetSize =
            betAmounts.size.small <= betAmounts.size.big ? "small" : "big";
          outcomeValue = leastBetSize;
        }

        console.log("outcome category ---->", outcomeCategory);

        // Determine number outcome if size outcome is selected
        let numberOutcome;
        if (outcomeCategory === "size") {
          const bigNumbers = ["5", "6", "7", "8", "9"];
          const smallNumbers = ["0", "1", "2", "3", "4"];

          if (outcomeValue === "small") {
            const smallNumberBets = numberBets.filter((bet) =>
              smallNumbers.includes(bet.selectedItem)
            );
            const minSmallBetAmount =
              smallNumberBets.length > 0
                ? Math.min(
                    ...smallNumberBets.map(
                      (bet) => betAmounts.number[bet.selectedItem]
                    )
                  )
                : 0;
            const leastBetSmallNumbers = smallNumbers.filter(
              (number) => (betAmounts.number[number] || 0) === minSmallBetAmount
            );
            numberOutcome =
              leastBetSmallNumbers.length > 0
                ? leastBetSmallNumbers[
                    Math.floor(Math.random() * leastBetSmallNumbers.length)
                  ]
                : smallNumbers[Math.floor(Math.random() * smallNumbers.length)];
          } else {
            const bigNumberBets = numberBets.filter((bet) =>
              bigNumbers.includes(bet.selectedItem)
            );
            const minBigBetAmount =
              bigNumberBets.length > 0
                ? Math.min(
                    ...bigNumberBets.map(
                      (bet) => betAmounts.number[bet.selectedItem]
                    )
                  )
                : 0;
            const leastBetBigNumbers = bigNumbers.filter(
              (number) => (betAmounts.number[number] || 0) === minBigBetAmount
            );
            numberOutcome =
              leastBetBigNumbers.length > 0
                ? leastBetBigNumbers[
                    Math.floor(Math.random() * leastBetBigNumbers.length)
                  ]
                : bigNumbers[Math.floor(Math.random() * bigNumbers.length)];
          }
        } else {
          numberOutcome = outcomeValue;
        }

        const sizeOutcome = parseInt(numberOutcome) < 5 ? "small" : "big";
        let colorOutcome;
        switch (numberOutcome) {
          case "1":
          case "3":
          case "7":
          case "9":
            colorOutcome = "green";
            break;
          case "2":
          case "4":
          case "6":
          case "8":
            colorOutcome = "red";
            break;
          case "0":
            colorOutcome = ["red", "violet"];
            break;
          case "5":
            colorOutcome = ["green", "violet"];
            break;
          default:
            colorOutcome = "unknown";
        }

        await TrxResult.create({
          timer: timerName,
          periodId,
          colorOutcome,
          numberOutcome,
          sizeOutcome,
          trxBlockAddress,
          blockTime,
          hash: randomHash,
        });

        console.log(`TRX Timer ${timerName} & ${periodId} ended.`);

        if (trxBets.length === 0) {
          console.log(`No bets for ${timerName} & ${periodId}`);
          return;
        }

        console.log(`Bets for ${timerName} & ${periodId} found.`);

        for (const bet of trxBets.filter(
          (bet) => bet.selectedTimer === timerName
        )) {
          let winLoss = 0;
          let status = "lost";
          const result = numberOutcome.toString();

          if (bet.selectedItem === numberOutcome.toString()) {
            winLoss =
              typeof bet.totalBet === "number"
                ? (bet.totalBet * 9).toString()
                : "0";
            status = "win";
          } else if (
            bet.selectedItem === "red" ||
            bet.selectedItem === "green"
          ) {
            winLoss =
              typeof bet.totalBet === "number"
                ? (bet.totalBet * 2).toString()
                : "0";
            status = "win";
          } else if (bet.sizeOutcome === sizeOutcome) {
            winLoss =
              typeof bet.totalBet === "number"
                ? (bet.totalBet * 2).toString()
                : "0";
            status = "win";
          } else {
            winLoss =
              typeof bet.totalBet === "number"
                ? (bet.totalBet * -1).toString()
                : "0";
          }

          if (status === "win") {
            const user = await User.findById(bet.userId);
            if (user) {
              user.walletAmount += Number(winLoss);
              await user.save();
            }
          }

          await TrxBet.findByIdAndUpdate(bet._id, {
            status,
            winLoss,
            result,
          });
        }
      }, interval * 60 * 1000);
      console.log(`TRX Timer ${timerName} & ${periodId} started.`);
    } catch (error) {
      console.error("Error in TRX Timer function:", error);
    }
  };

  jobFunction1();

  const job = cron.schedule(cronInterval, jobFunction1);

  job.start();
};

const calculateRemainingTime1 = (periodId, minutes) => {
  const endTime = moment(periodId, "YYYYMMDDHHmmss").add(minutes, "minutes");
  const now = moment();
  const diff = endTime.diff(now, "seconds");
  return diff > 0 ? diff : 0;
};

const secondsToHms1 = (d) => {
  d = Number(d);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor(d % 60);
  const hDisplay = h > 0 ? (h < 10 ? "0" + h : h) : "00";
  const mDisplay = m > 0 ? (m < 10 ? "0" + m : m) : "00";
  const sDisplay = s > 0 ? (s < 10 ? "0" + s : s) : "00";
  return `${hDisplay}:${mDisplay}:${sDisplay}`;
};

const getLatestPeriodId1 = async (timerModel) => {
  const latestTimer = await timerModel.find().sort({ _id: -1 }).limit(1);
  return latestTimer.length > 0 ? latestTimer[0].periodId : null;
};

module.exports = {
  createTrxTimer1,
  calculateRemainingTime1,
  secondsToHms1,
  getLatestPeriodId1,
};