const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Transaction = require("../models/transaction.model");

// RAW body parser required for signature verification
router.post(
    "/razorpay",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        try {
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
            const signature = req.headers["x-razorpay-signature"];
            const body = req.body; // raw buffer

            const expected = crypto
                .createHmac("sha256", webhookSecret)
                .update(body)
                .digest("hex");

            if (signature !== expected)
                return res.status(400).send("Invalid webhook signature");

            const payload = JSON.parse(body.toString());

            // Handle specific events
            if (payload.event === "payment.captured") {
                const paymentEntity = payload.payload.payment.entity;
                await Transaction.findOneAndUpdate(
                    { razorpayOrderId: paymentEntity.order_id },
                    { status: "captured", razorpayPaymentId: paymentEntity.id }
                );
            }

            if (payload.event === "payment.failed") {
                const paymentEntity = payload.payload.payment.entity;
                await Transaction.findOneAndUpdate(
                    { razorpayOrderId: paymentEntity.order_id },
                    { status: "failed" }
                );
            }

            // Add payout/refund event handlers as needed

            res.status(200).json({ ok: true });
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ message: "Webhook handler error" });
        }
    }
);

module.exports = router;
