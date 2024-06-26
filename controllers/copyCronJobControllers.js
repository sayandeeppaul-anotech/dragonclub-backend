// const mongoose = require('mongoose');
// const cron = require('node-cron');
// const User = require('../models/userModel');

// const subordinateSchema = new mongoose.Schema({
//     noOfRegister: { type: Number, default: 0 },
//     depositNumber: { type: Number, default: 0 },
//     depositAmount: { type: Number, default: 0 },
//     firstDeposit: { type: Number, default: 0 },
// }, { _id: false });

// const xyzSchema = new mongoose.Schema({
//     userId: mongoose.Schema.Types.ObjectId,
//     date: { type: Date, default: Date.now },
//     directSubordinates: [subordinateSchema],
//     teamSubordinates: [subordinateSchema]
// });

// const Xyz = mongoose.model('Xyz', xyzSchema);

// async function copyData() {
//     const users = await User.find();

//     for (let user of users) {
//         const xyzData = new Xyz({
//             userId: user._id,
//             directSubordinates: user.directSubordinates,
//             teamSubordinates: user.teamSubordinates
//         });

//         await xyzData.save();

//         user.directSubordinates = user.directSubordinates.map(subordinate => ({ ...subordinate, noOfRegister: 0, depositNumber: 0, depositAmount: 0, firstDeposit: 0 }));
//         user.teamSubordinates = user.teamSubordinates.map(subordinate => ({ ...subordinate, noOfRegister: 0, depositNumber: 0, depositAmount: 0, firstDeposit: 0 }));

//         await user.save();
//     }
// }

// cron.schedule('*/3 * * * *', copyData);

// module.exports = copyData;