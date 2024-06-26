const Withdraw = require("../models/withdrawModel");

exports.getTotalWithdrawAmountLast24Hours = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const totalWithdrawAmount = await Withdraw.aggregate([
      {
        $match: {
          createdAt: { $gte: twentyFourHoursAgo },
          status: "Completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$balance" },
        },
      },
    ]);

    const total =
      totalWithdrawAmount.length > 0 ? totalWithdrawAmount[0].total : 0;
    res.json({ totalWithdrawAmount: total });
  } catch (error) {
    next(error);
  }
};


