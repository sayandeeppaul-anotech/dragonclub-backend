// adminSettingsModel.js
const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema({
  minimumSubordinates: { type: Number, required: true },
  minimumDepositAmount: { type: Number, required: true },
  bonusAmount: { type: Number, required: true },
});

const AdminSettings = mongoose.model("AdminSettings", adminSettingsSchema);

// Initialize the admin settings with default values if not already present
const initializeAdminSettings = async () => {
  const settings = [
    { minimumSubordinates: 3, minimumDepositAmount: 3000, bonusAmount: 300 },
    { minimumSubordinates: 5, minimumDepositAmount: 5000, bonusAmount: 500 },
    { minimumSubordinates: 10, minimumDepositAmount: 10000, bonusAmount: 800 },
    { minimumSubordinates: 20, minimumDepositAmount: 20000, bonusAmount: 1300 },
    { minimumSubordinates: 40, minimumDepositAmount: 40000, bonusAmount: 2500 },
  ];

  for (const setting of settings) {
    const existingSetting = await AdminSettings.findOne(setting);
    if (!existingSetting) {
      await new AdminSettings(setting).save();
    }
  }
};

// Call the initialize function
initializeAdminSettings().catch(console.error);

module.exports = AdminSettings;