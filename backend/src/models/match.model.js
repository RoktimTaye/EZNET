const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    user1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    user2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    matchedAt: { type: Date, default: Date.now },
    chatRoomId: { type: String },

},
    { timestamps: true }
);

matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;