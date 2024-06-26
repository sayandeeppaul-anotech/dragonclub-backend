// const WingoResult = require("../models/wingoResultModel");
// const cron = require("node-cron");
// const moment = require("moment");
// const Bets = require("../models/betsModel");
// const User = require("../models/userModel");
// const { Timer1Min, Timer3Min, Timer5Min, Timer10Min } = require("../models/timersModel");


// function secondsToHms(d) {
//   d = Number(d);
//   var m = Math.floor((d % 3600) / 60);
//   return ("0" + m).slice(-2) + ":" + ("0" + (d % 60)).slice(-2);
// }

// async function getLatestPeriodId(timer) {
//   const timerModels = {
//     "1min": Timer1Min,
//     "3min": Timer3Min,
//     "5min": Timer5Min,
//     "10min": Timer10Min,
//   };
  
//   const timerModel = timerModels[timer];
//   const latestTimer = await timerModel.find().sort({ _id: -1 }).limit(1);
//   return latestTimer[0].periodId;
// }




// const createTimer = (TimerModel, interval, timerName) => {
//   const cronInterval = `*/${interval} * * * *`;

//   const jobFunction = async () => {
//     const periodId = moment().format("YYYYMMDDHHmmss");
//     await TimerModel.create({ periodId });

//     setTimeout(async () => {
//       const bets = await Bets.find({ periodId });
//       const numberBetSums = Array.from({ length: 10 }, (_, i) => ({ number: i.toString(), totalBet: 0 }));
//       const sizeBetSums = { big: 0, small: 0 };
//       const colorBetSums = { green: 0, red: 0, violet: 0 };


  

      
//       bets.forEach((bet) => {
//         if (/^[0-9]$/.test(bet.selectedItem)) {
//           numberBetSums[parseInt(bet.selectedItem)].totalBet += bet.totalBet;
//         } else if (bet.selectedItem in sizeBetSums) {
//           sizeBetSums[bet.selectedItem] += bet.totalBet;
//         } else if (bet.selectedItem in colorBetSums) {
//           colorBetSums[bet.selectedItem] += bet.totalBet;
//         }
//       });

//       const getLeastBetSum = (betSums) => {
//         if (Array.isArray(betSums)) {
//           return betSums.reduce((min, item) => (item.totalBet < min.totalBet ? item : min), betSums[0]).number;
//         } else {
//           return Object.keys(betSums).reduce((min, item) => (betSums[item] < betSums[min] ? item : min));
//         }
//       };
     

//       let colorOutcome = [];
//       let numberOutcome = null;
//       let sizeOutcome = null;

//       if (bets.length === 0) {
//         let colors = ["red", "green", "violet"];
//         let sizes = ["big", "small"];
//         colorOutcome.push(colors[Math.floor(Math.random() * colors.length)]);
//         sizeOutcome = sizes[Math.floor(Math.random() * sizes.length)];
//       }else{
//        colorOutcome = [getLeastBetSum(colorBetSums)];
//        sizeOutcome = getLeastBetSum(sizeBetSums); 
//        numberOutcome = getLeastBetSum(numberBetSums);
//       }

//       if (colorOutcome.includes("red") && sizeOutcome.includes("big")) {
//         let outcomes = [6, 8];
//         numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
//     } else if (colorOutcome.includes("green") && sizeOutcome.includes("small")) {
//         let outcomes = [1, 3];
//         numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
//     } else if (colorOutcome.includes("violet") && sizeOutcome.includes("big")) {
//         numberOutcome = "5";
//     } else if (colorOutcome.includes("red") && sizeOutcome.includes("small")) {
//         let outcomes = ["2", "4", "0"];
//         numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
//     } else if (colorOutcome.includes("green") && sizeOutcome.includes("small")) {
//         let outcomes = [1, 3];
//         numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
//     } else if (colorOutcome.includes("violet") && sizeOutcome.includes("small")) {
//         numberOutcome = "0";
//     } else if (colorOutcome.includes("green") && sizeOutcome.includes("big")) {
//         let outcomes = ["7", "9"," 5"];
//         numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
//     }
    

//     console.log("numberOutcome",typeof(numberOutcome),numberOutcome);


//     if (String(numberOutcome) === "0") {
//       colorOutcome = ["violet", "red"];
//     }
//    if (String(numberOutcome) === "5") {
//       colorOutcome = ["violet", "green"];
//     }


//       await WingoResult.create({
//         timer: timerName,
//         periodId,
//         colorOutcome,
//         numberOutcome,
//         sizeOutcome,
//       });

//       if (bets.length > 0) {
//         const processBetResults = async (bet) => {
//           let winLoss = 0;
//           let status = "Failed";
//           let result = numberOutcome;

//           if (bet.selectedItem === numberOutcome) {
//             winLoss = bet.totalBet * 9;
//           } else if (colorOutcome.includes(bet.selectedItem)) {
//             winLoss = bet.totalBet * 2;
//           } else if (bet.selectedItem === sizeOutcome) {
//             winLoss = bet.totalBet * 2;
//           }

//           if (winLoss !== 0) {
//             const user = await User.findById(bet.userId);
//             if (user) {
//               user.walletAmount += winLoss;
//               await user.save();
//             }
//             status = "Succeed";
//           } else {
//             winLoss = bet.totalBet * -1;
//           }

//           await Bets.findByIdAndUpdate(bet._id, { status, winLoss, result });
//         };

//         await Promise.all(bets.filter((bet) => bet.selectedTimer === timerName).map(processBetResults));
//       }
//     }, interval * 60 * 1000);
//   };

//   jobFunction();
//   cron.schedule(cronInterval, jobFunction).start();
// };

// const calculateRemainingTime = (periodId, minutes) => {
//   const endTime = moment(periodId, "YYYY-MM-DD-HH-mm-ss").add(minutes, "minutes");
//   const now = moment();
//   const diff = endTime.diff(now, "seconds");
//   return diff > 0 ? diff : 0;
// };

// module.exports = {
//   secondsToHms,
//   calculateRemainingTime,
//   getLatestPeriodId,
//   createTimer,
// };

const WingoResult = require("../models/wingoResultModel");
const cron = require("node-cron");
const moment = require("moment");
const Bets = require("../models/betsModel");
const User = require("../models/userModel");

function secondsToHms(d) {
  d = Number(d);
  var m = Math.floor((d % 3600) / 60);
  return ("0" + m).slice(-2) + ":" + ("0" + (d % 60)).slice(-2);
}

async function getLatestPeriodId(timer) {
  const timerModels = {
    "1min": Timer1Min,
    "3min": Timer3Min,
    "5min": Timer5Min,
    "10min": Timer10Min,
  };

  const timerModel = timerModels[timer];
  const latestTimer = await timerModel.find().sort({ _id: -1 }).limit(1);
  return latestTimer[0].periodId;
}

const createTimer = (TimerModel, interval, timerName) => {
  const cronInterval = `*/${interval} * * * *`;

  const jobFunction = async () => {
    const periodId = moment().format("YYYYMMDDHHmmss");
    await TimerModel.create({ periodId });

    setTimeout(async () => {
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

      const getLeastBetSum = (betSums) => {
        if (Array.isArray(betSums)) {
          return betSums.reduce((min, item) => (item.totalBet < min.totalBet ? item : min), betSums[0]).number;
        } else {
          return Object.keys(betSums).reduce((min, item) => (betSums[item] < betSums[min] ? item : min));
        }
      };

      let colorOutcome = null;
      let numberOutcome = null;
      let sizeOutcome = null;

      if (bets.length === 0) {
        let colors = ["red", "green", "violet"];
        let sizes = ["big", "small"];
        colorOutcome = colors[Math.floor(Math.random() * colors.length)];
        sizeOutcome = sizes[Math.floor(Math.random() * sizes.length)];
      } else {
        colorOutcome = getLeastBetSum(colorBetSums);
        sizeOutcome = getLeastBetSum(sizeBetSums);
        numberOutcome = getLeastBetSum(numberBetSums);
      }

      // Determine the number outcome

      // Determine the number outcome based on color and size outcomes
      if (colorOutcome === "red" && sizeOutcome === "big") {
        let outcomes = [6, 8];
        numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      } else if (colorOutcome === "red" && sizeOutcome === "small") {
        let outcomes = [2, 4, 0];
        numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      } else if (colorOutcome === "green" && sizeOutcome === "big") {
        let outcomes = [7, 9, 5];
        numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      } else if (colorOutcome === "green" && sizeOutcome === "small") {
        let outcomes = [1, 3];
        numberOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      } else if (colorOutcome === "violet" && sizeOutcome === "small") {
        numberOutcome = "0";
      } else if (colorOutcome === "violet" && sizeOutcome === "big") {
        numberOutcome = "5";
      }
      
      // Hardcoded mapping of number to color
      const numberColorMap = {
        "0": ["violet", "red"],
        "1": "green",
        "2": "red",
        "3": "green",
        "4": "red",
        "5": ["violet", "green"],
        "6": "red",
        "7": "green",
        "8": "red",
        "9": "green",
      };

      colorOutcome = numberColorMap[numberOutcome];

      console.log("colorOutcome", colorOutcome);
      console.log("numberOutcome", numberOutcome);
      console.log("sizeOutcome", sizeOutcome);

      await WingoResult.create({
        timer: timerName,
        periodId,
        colorOutcome,
        numberOutcome,
        sizeOutcome,
      });

      console.log(`Wingo Timer ${timerName} & ${periodId} ended.`);
      
      if (bets.length > 0) {
        const processBetResults = async (bet) => {
          let winLoss = 0;
          let status = "Failed";
          let result = numberOutcome;

          if (bet.selectedItem === numberOutcome) {
            winLoss = bet.totalBet * 9;
          } else if (Array.isArray(colorOutcome) && colorOutcome.includes(bet.selectedItem)) {
            winLoss = bet.totalBet * 2;
          } else if (colorOutcome === bet.selectedItem) {
            winLoss = bet.totalBet * 2;
          } else if (bet.selectedItem === sizeOutcome) {
            winLoss = bet.totalBet * 2;
          }

          if (winLoss !== 0) {
            const user = await User.findById(bet.userId);
            if (user) {
              user.walletAmount += winLoss;
              await user.save();
            }
            status = "Succeed";
          } else {
            winLoss = bet.totalBet * -1;
          }

          await Bets.findByIdAndUpdate(bet._id, { status, winLoss, result });
        };

        await Promise.all(bets.filter((bet) => bet.selectedTimer === timerName).map(processBetResults));
      }
    }, interval * 60 * 1000);
    console.log(`Wingo Timer ${timerName} & ${periodId} started.`);
  };

  jobFunction();
  cron.schedule(cronInterval, jobFunction).start();
};

const calculateRemainingTime = (periodId, minutes) => {
  const endTime = moment(periodId, "YYYYMMDDHHmmss").add(minutes, "minutes");
  const now = moment();
  const diff = endTime.diff(now, "seconds");
  return diff > 0 ? diff : 0;
};

module.exports = {
  secondsToHms,
  calculateRemainingTime,
  getLatestPeriodId,
  createTimer,
};