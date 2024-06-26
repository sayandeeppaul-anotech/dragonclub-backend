const express = require("express");
const User = require("../../models/userModel");
const TRXAddressModel = require("../../models/TRXAddressSchema");
const auth = require("../../middlewares/auth");
const { isAdmin } = require("../../middlewares/roleSpecificMiddleware");
const router = express.Router();

///////////////////// For Create the Address POST/////

router.post("/CreateAddress", auth, isAdmin, async (req, res) => {
  try {
    const { TRXAddress } = req.body;

    console.log("--->", TRXAddress);
    if (!TRXAddress) {
      return res.status(400).send("TRXAddress is required");
    }
    const newTRXAddress = new TRXAddressModel({
      TRXAddress,
      user: req.user._id,
    });

    await newTRXAddress.save();

    res.status(200).json({
      success: true,
      message: "Saved the address",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error" + error.message,
    });
  }
});

router.put("/UpdateAddress/:id", auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { TRXAddress } = req.body;

    // Ensure that TRXAddress is provided in the request body
    if (!TRXAddress) {
      return res.status(400).send("TRXAddress is required");
    }
    const user = await User.findById(req.user._id);
    console.log(
      `Attempting to update TRX address for record with ID: ${id} to "${TRXAddress}".`
    );

    // Perform the update operation
    const updatedTRXAddress = await TRXAddressModel.findByIdAndUpdate(
      id,
      { TRXAddress },
      { new: true }
    );
    console.log(".....>", updatedTRXAddress);

    // Verify if a document was found and updated
    if (!updatedTRXAddress) {
      console.log(`No document found with ID: ${id} for user: ${req.user._id}`);
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Update successful
    console.log(`Successfully updated TRX address for record with ID: ${id}.`);
    res.status(200).json({
      success: true,
      message: "Updated the address",
      updatedTRXAddress, // Optionally include the updated address in the response
    });
  } catch (error) {
    console.error("Error updating TRX address:", error); // Log the error if it occurs
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});
///////// GET Address//////////
router.get("/getAddresses", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).send("User not found");
    }
    let addresses;

    if (user.role === "admin") {
      addresses = await TRXAddressModel.find();
    } else {
      addresses = await TRXAddressModel.find();
    }
    console.log("......>", addresses);

    if (!addresses.length) {
      return res.status(404).json({
        success: false,
        message: "No addresses found",
      });
    }

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

module.exports = router;
