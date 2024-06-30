const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../models/userModel"); // Adjust the path as necessary
const axios = require("axios");
const auth = require("../../middlewares/auth");

router.post("/redirect-to-second-website", auth, async (req, res) => {
    const userId = req.user._id;
    const token = req.cookies.token;

    if (!userId || !token) {
        return res.status(400).json({ error: "Missing userId or token" });
    }

    try {
        // Check if user exists on the second website
        const checkUserUrl = `http://localhost:8000/api/users/check/${userId}`;
        let userExists;

        try {
            const userExistsResponse = await axios.get(checkUserUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            userExists = userExistsResponse.data.exists;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                userExists = false;
            } else {
                console.error("Error checking user existence:", error);
                return res.status(500).json({ error: "Error checking user existence" });
            }
        }

        console.log("userExists-->", userExists);

        if (userExists) {
            // If user exists, attempt to login
            const loginUrl = "http://localhost:8000/api/users/login";
            const loginResponse = await axios.post(
                loginUrl,
                { userId, token },
                { withCredentials: true }
            );

            console.log("Login successful");
            // If login is successful, return the response
            return res.status(loginResponse.status).json(loginResponse.data);
        } else {
            console.log(
                "User does not exist on second website, proceeding with registration."
            );

            // Fetch user details from the local database
            const userDetails = await User.findById(userId).exec();
            console.log("userDetails-->",userDetails)
            if (!userDetails) {
                return res.status(404).json({ error: "User not found" });
            }

            // Prepare user data for registration
            const userRegistrationData = {
                fullName: userDetails.mobile,
                email: userDetails.mobile,
                username: userDetails.mobile,
                password: userDetails.mobile,
                role:"user",
                firstWebsiteUserId: userDetails._id, // Pass the first website user ID
                token,
            };

            console.log("userRegistrationData-->",userRegistrationData)

            // Register the user on the second website
            const registerUrl = "http://127.0.0.1:8000/api/users/register";
            const registerResponse = await axios.post(
                registerUrl,
                userRegistrationData,
                { withCredentials: true }
            );

            console.log("Registration successful");

            // If registration is successful, attempt to login
            if (registerResponse.status === 201) {
                const loginResponse = await axios.post(
                    'http://127.0.0.1:8000/api/users/login',
                    { userId, token },
                    { withCredentials: true }
                );

                console.log("Login successful after registration");

                // Return the login response
                return res.status(loginResponse.status).json(loginResponse.data);
            } else {
                return res.status(registerResponse.status).json(registerResponse.data);
            }
        }
    } catch (error) {
        console.error("Error processing request:", error);
        return res
            .status(500)
            .json({ error: "Internal server error", details: error.message });
    }
});

module.exports = router;
