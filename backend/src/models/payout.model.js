const mongoose = require('mongoose');
const payoutSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayPayoutId: { type: String },
    status: { type: String, enum: ['created', 'processed', 'failed'], default: 'created' },
    meta: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('payout', payoutSchema);