// ++++++++++++++++++++++++++++++++ sayandeep added ++++++++++++++++++++++++++++++++++++++++++++
const jsonwebtoken = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/userModel");
// isNormal
const isNormal = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Normal") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route for Normal users only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified , please try again",
    });
  }
};

// isRestricted
const isRestricted = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Restricted") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route for Restricted only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified , please try again",
    });
  }
};

// isAdmin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route for Admin only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified , please try again",
    });
  }
};

module.exports = {isAdmin,isNormal,isRestricted}