const jsonwebtoken = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/userModel");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).send({ error: "No token provided." });
    }
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error("User not found.");
    }

    // Add the token to the user object in the request
    User.token = token; // Store the token
    req.user = user;

    next();
  } catch (e) {
    console.log(e);
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
