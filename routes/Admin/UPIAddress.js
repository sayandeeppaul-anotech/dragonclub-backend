const express = require('express')
const router = express.Router()
const UPIAddress = require('../../models/UPI_IDSchema')
const auth = require('../../middlewares/auth')
const {isAdmin} = require('../../middlewares/roleSpecificMiddleware')

const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});

const upload = multer({ storage: storage });
router.post('/upsertID', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { Upi, Trx } = req.body;
        const image = req.file.path;
        if (!Upi || !Trx) { 
            return res.status(400).json({
                message: "Please Enter The UPI ID and Trx"
            });
        }

        let upiID = await UPIAddress.findOne({ user: req.user._id });

        if (upiID) {
            // UPI ID exists, update it
            upiID.Upi = Upi;
            upiID.Trx = Trx; // Update Trx
            upiID.image = image;
            await upiID.save();
            res.status(200).json({
                success: true,
                message: "UPI ID, Trx and image Updated Successfully"
            });
        } else {
            // UPI ID does not exist, create it
            const newUpiID = new UPIAddress({
                Upi,
                Trx, // Insert Trx
                user: req.user._id,
                image
            });
            await newUpiID.save();
            res.status(200).json({
                success: true,
                message: "UPI ID, Trx and image Added Successfully"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.get('/Getid', auth, async (req, res) => {
    try {
        const upiID = await UPIAddress.findOne(); // Removed the user-specific query
        if (!upiID) {
            return res.status(400).json({
                success: false,
                message: "No UPI ID found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Here is the UPI ID and Trx",
            Upi: upiID.Upi,
            Trx: upiID.Trx // Return Trx
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


 module.exports = router