const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },                
    type: {
        type: String,
        enum: ["match", "message", "swipe_like", "system"],
        required: true,
    },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    metadata: { type: Object }, // optional (e.g., matchId, messageId)
},
    { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;