const Razorpay = require("razorpay");
const crypto = require("crypto");
const Transaction = require("../models/transaction.model");
const Wallet = require("../models/wallet.model");
const Payout = require("../models/payout.model");

// 🔑 Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ===========================================================
   🟢 1️⃣ CREATE ORDER (Frontend calls this before opening checkout)
=========================================================== */
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = "INR", tutorId, studentId, meta } = req.body;

        // amount assumed in ₹ — convert to paise
        const amountPaise = Math.round(amount * 100);

        // 1. Create Razorpay Order
        const options = {
            amount: amountPaise,
            currency,
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1, // auto-capture
        };

        const order = await razorpay.orders.create(options);

        // 2. Record in transaction ledger
        const tx = await Transaction.create({
            type: "payment",
            user: studentId,
            relatedUser: tutorId,
            razorpayOrderId: order.id,
            amount: amountPaise,
            status: "created",
            meta,
        });

        res.status(201).json({
            success: true,
            orderId: order.id,
            amount: amountPaise,
            currency,
            txId: tx._id,
        });
    } catch (error) {
        console.error("Order creation failed:", error);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
};

/* ===========================================================
   🟢 2️⃣ VERIFY PAYMENT SIGNATURE + CREDIT WALLET
=========================================================== */
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, txId } = req.body;

        // Generate hash signature using secret
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        // Validate signature
        if (generated_signature !== razorpay_signature) {
            await Transaction.findByIdAndUpdate(txId, { status: "failed" });
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        // Mark transaction as captured
        await Transaction.findByIdAndUpdate(txId, {
            status: "captured",
            razorpayPaymentId: razorpay_payment_id,
        });

        // Retrieve transaction details
        const tx = await Transaction.findById(txId);
        if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });

        // Compute platform fee (2.5%) and tutor credit
        const platformFee = Math.round(tx.amount * 0.025);
        const tutorAmount = tx.amount - platformFee;

        // Credit tutor wallet
        const wallet = await Wallet.findOneAndUpdate(
            { user: tx.relatedUser },
            { $inc: { balance: tutorAmount }, $push: { ledger: tx._id } },
            { upsert: true, new: true }
        );

        // Record fee transaction (for admin reporting)
        await Transaction.create({
            type: "fee",
            user: null, // platform owner
            relatedUser: tx.relatedUser,
            amount: platformFee,
            status: "captured",
            meta: { originalTx: txId },
        });

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            platformFee,
            tutorAmount,
            updatedWalletBalance: wallet.balance,
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ success: false, message: "Server error during payment verification" });
    }
};

/* ===========================================================
   🟢 3️⃣ CREATE PAYOUT (TUTOR WITHDRAWAL)
=========================================================== */
exports.createPayout = async (req, res) => {
    try {
        const { tutorId, amount } = req.body; // amount in paise
        const wallet = await Wallet.findOne({ user: tutorId });

        if (!wallet || wallet.balance < amount)
            return res.status(400).json({ message: "Insufficient wallet balance" });

        // Create payout record
        const payoutRec = await Payout.create({
            user: tutorId,
            amount,
            status: "created",
        });

        // ⚠️ Example RazorpayX Payout call (pseudo — requires RazorpayX)
        // const resp = await razorpay.payouts.create({
        //   account_number: process.env.RAZORPAYX_ACCOUNT_NO,
        //   fund_account_id: "<tutor_fund_account_id>",
        //   amount,
        //   currency: "INR",
        //   mode: "IMPS",
        //   purpose: "payout",
        // });

        // Simulate payout success
        await Payout.findByIdAndUpdate(payoutRec._id, {
            status: "processed",
            razorpayPayoutId: "demo_payout_id_123",
        });

        // Deduct wallet balance
        await Wallet.findOneAndUpdate({ user: tutorId }, { $inc: { balance: -amount } });

        res.status(200).json({
            success: true,
            message: "Payout processed successfully (demo mode)",
            payoutId: payoutRec._id,
            deductedAmount: amount,
        });
    } catch (error) {
        console.error("Payout creation error:", error);
        res.status(500).json({ message: "Server error during payout creation" });
    }
};
