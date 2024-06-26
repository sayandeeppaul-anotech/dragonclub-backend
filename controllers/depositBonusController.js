const DepositBonus = require('../models/depositBonusSchema');

// Initial data
const initialData = [
    { minimumDeposit: 300, bonus: 50 },
    { minimumDeposit: 500, bonus: 150 },
    { minimumDeposit: 1000, bonus: 200 },
    { minimumDeposit: 3000, bonus: 400 },
    { minimumDeposit: 4000, bonus: 500 },
    { minimumDeposit: 5000, bonus: 600 },
    { minimumDeposit: 10000, bonus: 1100 },
    { minimumDeposit: 50000, bonus: 4100 },
    { minimumDeposit: 100000, bonus: 15001 }
];

DepositBonus.find({}).then(docs => {
    if (docs.length === 0) {
        DepositBonus.insertMany(initialData)
            .then(() => console.log('Initial data added'))
            .catch(err => console.error('Error adding initial data', err));
    }
}).catch(err => console.error('Error finding initial data', err));

exports.updateDepositBonus = async (req, res) => {
    console.log('updateDepositBonus');
    const { minimumDeposit, bonus } = req.body;

    if (minimumDeposit === undefined || bonus === undefined) {
        return res.status(400).json({ error: 'minimumDeposit and bonus are required' });
    }

    try {
        const depositBonus = await DepositBonus.findOneAndUpdate(
            { minimumDeposit },
            { bonus },
            { new: true, upsert: true }
        );
        res.json({ message: 'Deposit bonus updated successfully', depositBonus });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while updating the deposit bonus' });
    }
};

exports.getAllDepositBonuses = async (req, res) => {
    try {
        const depositBonuses = await DepositBonus.find({}).sort({ minimumDeposit: 1 });
        res.json(depositBonuses);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching the deposit bonuses' });
    }
};