const express = require('express');
const router = express.Router();
const startSalaryCronJob = require('../../controllers/autoSalaryCronJob');
const auth = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/roleSpecificMiddleware');
const salaryModel = require('../../models/salaryModel');

router.post('/set-salary',auth,isAdmin, async (req, res) => {
  try {
    await startSalaryCronJob(req.body);
    res.status(200).json({ message: 'Salary details set successfully.' });
  } catch (error) {
    console.error('Error setting salary details:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


router.get('/get-salary-records', auth, isAdmin, async (req, res) => {
  try {
    const records = await salaryModel.find({});
    res.status(200).json(records);
  } catch (error) {
    console.error('Error getting salary records:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;