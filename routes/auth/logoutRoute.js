const express = require('express');
const router = express.Router();


router.get('/logout', (req, res) => {
    res.cookie('token', '', {expires: new Date(Date.now() + 2 * 1000), httpOnly: true});
    res.status(200).json({msg: "Logged out"});
}
);

module.exports = router;








