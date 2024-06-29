const express = require("express");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const logger = require("./middlewares/logger");
const db = require("./db");
const { setupWebSocket } = require("./websockets/websocket");
const routes = require("./routes/Routes");
const practice = require("./routes/common/practice");
const user = require("./routes/common/userSchema");

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

// Database connection
db.connectDB();

// WebSocket setup
setupWebSocket(server);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002'], 
  credentials: true
}));

// Static file serving
app.use(express.static(path.join(__dirname, 'build')));
app.use('/admin', express.static(path.join(__dirname, 'admin/build')));

// CORS headers setup
// app.use((req, res, next) => {
//   const allowedOrigins = ['http://localhost:3001', 'http://localhost:3002'];
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.header('Access-Control-Allow-Origin', origin);
//   }
//   res.header('Access-Control-Allow-Credentials', 'true');
//   next();
// });

// Logger middleware
app.use(logger);

// Routes
app.use(routes);
app.use('/', practice);
app.use('/', user);


// Fallback route for the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
