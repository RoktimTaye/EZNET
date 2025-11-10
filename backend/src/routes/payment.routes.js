const express = require("express");
const { createOrder, verifyPayment, createPayout } = require("../controller/payment.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// ✅ Step 1: Create Razorpay Order
router.post("/order", protect, createOrder);

// ✅ Step 2: Verify Payment (after client success)
router.post("/verify", protect, verifyPayment);

// ✅ Step 3: Tutor Requests Payout
router.post("/payout", protect, createPayout);

module.exports = router;
