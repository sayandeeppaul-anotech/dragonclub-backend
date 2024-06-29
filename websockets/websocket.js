const WebSocket = require("ws");
// const {
//   createTimer,
//   calculateRemainingTime,
//   secondsToHms,
// } = require("../controllers/cronJobControllers");
const {
  createTrxTimer1,
  calculateRemainingTime1,
  secondsToHms1,
} = require("../controllers/cronjobTRXController");
const {
  createTimer2,
  calculateRemainingTime2,
  secondsToHms2,
} = require("../controllers/K3CronjobController");

const mongoose = require("mongoose");
const async = require("async");
const {
  Timer1Min,
  Timer3Min,
  Timer5Min,
  Timer10Min,
} = require("../models/timersModel");


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

// createTimer(Timer1Min, 1, "1min"); // 1 min
// createTimer(Timer3Min, 3, "3min"); // 3 min
// createTimer(Timer5Min, 5, "5min"); // 5 min
// createTimer(Timer10Min, 10, "10min"); // 10 min

createTrxTimer1(Timer1Min, 1, "1min"); // 1 min
createTrxTimer1(Timer3Min, 3, "3min"); // 3 min
createTrxTimer1(Timer5Min, 5, "5min"); // 5 min
createTrxTimer1(Timer10Min, 10, "10min"); // 10 min

createTimer2(Timer1Min, 1, "1min"); // 1 min
createTimer2(Timer3Min, 3, "3min"); // 3 min
createTimer2(Timer5Min, 5, "5min"); // 5 min
createTimer2(Timer10Min, 10, "10min"); // 10 min

wss.on("connection", (ws) => {
  console.log("Client connected");

  const sendTimers = async () => {
    const timers = await async.parallel({
      "1min": async () => {
        const timer = await Timer1Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime2(timer[0].periodId, 1);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms2(remainingTime),
        };
      },
      "3min": async () => {
        const timer = await Timer3Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime2(timer[0].periodId, 3);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms2(remainingTime),
        };
      },
      "5min": async () => {
        const timer = await Timer5Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime2(timer[0].periodId, 5);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms2(remainingTime),
        };
      },
      "10min": async () => {
        const timer = await Timer10Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime2(timer[0].periodId, 10);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms1(remainingTime),
        };
      },
    });


    const timers1 = await async.parallel({
      "1min": async () => {
        const timer = await Timer1Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime1(timer[0].periodId, 1);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms1(remainingTime),
        };
      },
      "3min": async () => {
        const timer = await Timer3Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime1(timer[0].periodId, 3);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms1(remainingTime),
        };
      },
      "5min": async () => {
        const timer = await Timer5Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime1(timer[0].periodId, 5);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms1(remainingTime),
        };
      },
      "10min": async () => {
        const timer = await Timer10Min.find().sort({ _id: -1 }).limit(1);
        const remainingTime = calculateRemainingTime1(timer[0].periodId, 10);
        return {
          periodId: timer[0].periodId,
          remainingTime: secondsToHms1(remainingTime),
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

module.exports = { setupWebSocket, wss };
