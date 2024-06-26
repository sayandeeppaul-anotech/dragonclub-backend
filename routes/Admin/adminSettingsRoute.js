const express = require("express");
const router = express.Router();
const {
  createOrUpdateAdminSettings,
  getAdminSettings,
} = require("../../controllers/adminSettingsController");
const { isAdmin } = require("../../middlewares/roleSpecificMiddleware");
const auth = require("../../middlewares/auth");

// Get all admin settings
router.get("/get-salary-criteria", auth, isAdmin, getAdminSettings);

// Create or update admin settings
router.post(
  "/update-salary-criteria",
  auth,
  isAdmin,
  createOrUpdateAdminSettings
);

module.exports = router;