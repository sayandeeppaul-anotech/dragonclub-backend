// adminSettingsController.js
const AdminSettings = require("../models/adminSettingsModel");

// Create or update admin settings
const createOrUpdateAdminSettings = async (req, res) => {
  try {
    const { minimumSubordinates, minimumDepositAmount, bonusAmount } = req.body;

    console.log(req.body);

    if (!minimumSubordinates || !minimumDepositAmount || !bonusAmount) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const adminSetting = await AdminSettings.findOneAndUpdate(
      { minimumSubordinates },
      { minimumDepositAmount, bonusAmount },
      { new: true, upsert: true }
    );

    res.status(200).json({
      msg: "Admin settings created/updated successfully",
      adminSetting,
    });
  } catch (error) {
    console.error("Error creating/updating admin settings:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Get all admin settings
const getAdminSettings = async (req, res) => {
  try {
    const adminSettings = await AdminSettings.find({});
    res.status(200).json(adminSettings);
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = { createOrUpdateAdminSettings, getAdminSettings };