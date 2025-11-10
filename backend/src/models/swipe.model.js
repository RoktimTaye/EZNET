const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({

    swiperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    swipedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
        type: String,
        enum: ['left', 'right', 'undo', 'redo'],
        required: true
    },
    timestamp: { type: DataTransfer, default: 0 },
    matchScore: { type: Number, default: 0 },
}, { timestamps: true });

swipeSchema.index({ swiperId: 1, swipedUserId: 1 }, { unique: true });

const swipe = mongoose.model('Swipe', swipeSchema);

module.exports = swipe;