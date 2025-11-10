const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },

},
    { timestamps: true }
)

module.exports = mongoose.model('Message',messageSchema);