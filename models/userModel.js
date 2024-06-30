const mongoose = require("mongoose");
const ReferredUser = require("./ReferredUser");
const TRXAddress = require("./TRXAddressSchema");

function round(val) {
  return Math.round(val * 100) / 100;
}

const subordinateSchema = new mongoose.Schema(
  
  {
    noOfRegister: { type: Number, default: 0 },
    depositNumber: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    firstDeposit: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    level: { type: Number, default: 1 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  mobile: { type: Number, required: true, unique: true },
  password: { type: String, required: true },
  invitecode: { type: String, default: null },
  invitationCode: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  uid: { type: String, required: true, unique: true },
  referralLink: { type: String, default: null },
  walletAmount: { type: Number, default: 0 ,set: round},
  accountType: {
    type: String,
    enum: ["Admin", "Normal", "Restricted"],
    default: "Normal"
  },
  lastBonusWithdrawal: { type: Date, default: null },
  totalCommission: { type: Number, default: 0 ,set: round},
  avatar: { type: String, default: null },
  token: { type: String, default: null },
  directSubordinates: [subordinateSchema],
  teamSubordinates: [subordinateSchema],
  lastLoginTime: { type: Date, default: null },
  registrationDate: { type: Date, default: Date.now },
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  firstDepositMade: { type: Boolean, default: false },
  totalBonusAmount: {
    type: Number,
    default: 0,
  },
  consecutiveDays: {
    type: Number,
    default: 0,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  lastMonthlyBonusMinute: { type: Number, default: 0 } ,
  referredUsers: [ReferredUser.schema],
  commissionRecords: [
    {
      level: Number,
      commission: Number,
      date: Date,
      uid: String,
      betAmount: { type: Number, default: 0 },
      depositAmount: Number
    }
  ],
  notification: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "notify"
    }
  ],
  bankDetails: [{
    name: String,
    accountNo: String,
    ifscCode: String,
    mobile: String,
    bankName: String,
  }],
  withdrawRequestsToday: { type: Number, default: 0 },
  TRXAddress:[
    {
      type:String,
      default: null
    }
  ],
  withdrawRecords: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Withdraw",
      default: [
        {
          status: "NA",
          balance: 0,
          withdrawMethod: ""
        }
      ]
    }
  ],
  achievements: [String]
});

const User = mongoose.model("User", userSchema);

module.exports = User;




