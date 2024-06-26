const express = require('express');
const { updateDepositBonus, getAllDepositBonuses } = require('../../controllers/depositBonusController');

const router = express.Router();

router.put('/admin/update-deposit-bonus', updateDepositBonus);
router.get('/admin/all-deposit-bonuses', getAllDepositBonuses);

module.exports = router;