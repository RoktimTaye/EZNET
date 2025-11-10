const mongoose = require('mongoose')
const transactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['payment', 'refund', 'payout', 'fee'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    platformFee: { type: Number, default: 0 },
    status: { type: String, enum: ['created', 'captured', 'failed', 'refunded', 'paid_out'], default: 'created' },
    meta: { type: Object },

}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);