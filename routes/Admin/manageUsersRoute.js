const express = require('express')
const UserModel = require('../../models/userModel')
const router = express.Router()
const auth = require("../../middlewares/auth")

router.get('/manage-users', auth, async (req, res) => {
    try {
        const userDetails = await UserModel.find();
        if (!userDetails) {
            console.log("No user found in the DB");
        }
        let userData = []
        const count = userDetails.length;
        for (let i = 0; i < count; i++) {
            userData.push({
                mobile: userDetails[i].mobile,
                username: userDetails[i].username,
                walletAmount: userDetails[i].walletAmount,
                registrationDate: userDetails[i].registrationDate
            })
        }
        res.status(200).json({
            userData: userData,
            success: true,
            message: "data fetched succesfully",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Server Error" });
    }
}
)

router.delete('/manage-users/delete/', auth, async (req, res) => {
    try {
        const user = req.body.mobile;
        const userDetails = await UserModel.findOneAndDelete({ mobile: user });
        if (!userDetails) {
            console.log("No user found in the DB");
        }
        res.status(200).json({
            success: true,
            message: "User Deleted",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Server Error" });
    }
}
)

module.exports = router;
