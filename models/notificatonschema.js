const mongoose = require('mongoose')

const Notification = mongoose.Schema({
    title:{type:String, required:true},
    message:{type:String, required:true},
    date:{type:Number, default:Date.now}
})

const notify = mongoose.model("notify", Notification);

module.exports = notify;