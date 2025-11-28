# EZNAT Backend Documentation

This document provides a comprehensive overview of the EZNAT backend, including its structure, functionalities, and data flow.

## 1. Overview

The EZNAT backend is a Node.js and Express.js application that provides a RESTful API for a skill-based social matching application. It uses MongoDB for data storage, Socket.IO for real-time communication (chat and notifications), and Razorpay for handling payments.

## 2. Folder Structure

```
c:/Users/Raktim/Desktop/EZNAT/
└───backend/
    ├───.env
    ├───.env.example
    ├───.gitignore
    ├───LICENSE
    ├───package-lock.json
    ├───package.json
    ├───production_guide.md
    ├───PROJECT_README.md
    ├───server.js
    ├───node_modules\ ...
    └───src/
        ├───app.js
        ├───config/
        │   └───db.js
        ├───controller/
        │   ├───chat.controller.js
        │   ├───explore.controller.js
        │   ├───match.controller.js
        │   ├───notification.controller.js
        │   ├───payment.controller.js
        │   ├───swipe.controller.js
        │   └───user.controller.js
        ├───middlewares/
        │   └───auth.middleware.js
        ├───models/
        │   ├───match.model.js
        │   ├───message.model.js
        │   ├───notification.model.js
        │   ├───payout.model.js
        │   ├───swipe.model.js
        │   ├───transaction.model.js
        │   ├───user.model.js
        │   └───wallet.model.js
        ├───routes/
        │   ├───chat.routes.js
        │   ├───explore.routes.js
        │   ├───match.routes.js
        │   ├───notification.routes.js
        │   ├───notification.routs.js
        │   ├───payment.routes.js
        │   ├───swipe.routes.js
        │   ├───user.routes.js
        │   └───webhook.routes.js
        ├───services/ (empty)
        └───utils/ (empty)
```

## 3. File Details and Code

### Root Directory (`backend/`)

#### `package.json`
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.19.2",
    "nodemon": "^3.1.10",
    "socket.io": "^4.8.1"
  },
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs"
}
```

#### `server.js`
```javascript
const app = require('./src/app');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const Notification = require('./src/models/notification.model');
connectDB();

//http + socket.io statements
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", method: ["GET", "POST"] }
});

// Handle user joining with userId
let onlineUsers = new Map();

// Suggested optional to be apploed the same logic in other
// blocks for notification in every functionality
// like mossage , match, swipe request etc .
//From here
app.set('io',io);
app.set('onlineUsers',onlineUsers);
// till here
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  // Handle sending a message
  socket.on("sendMessage", async ({ senderId, receiverId, message, matchId }) => {
    //DB is linked to store the message sending
    const Message = require("./models/message.model");

    // Save to DB
    const newMessage = await Message.create({ sender: senderId, receiver: receiverId, message, matchId });

    // Emit to receiver if online
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", newMessage);
    }

    // Acknowledge sender
    socket.emit("messageSent", newMessage);
  });

  socket.on("sendNotification", async ({ userId, senderId, type, message, metadata }) => {
    const newNotification = await Notification.create({
      user: userId,
      sender: senderId,
      type,
      message,
      metadata,
    });

    const receiverSocket = onlineUsers.get(userId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveNotification", newNotification);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) onlineUsers.delete(userId);
    }
  });
  
});

const port = 3000;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

### `src/` Directory

#### `app.js`
```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const userRoutes = require('./routes/user.routes')
const swipeRoutes = require('./routes/swipe.routes')
const matchRoutes = require("./routes/match.routes");
const exploreRoutes = require("./routes/explore.routes");
const chatRoutes = require("./routes/chat.routes");
const notificationRoutes = require("./routes/notification.routes");
const { protect } = require('./middlewares/auth.middleware');
const paymentRoutes = require("./routes/payment.routes");
const webhookRoutes = require("./routes/webhook.routes");

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/users', protect, userRoutes);
app.use('/api/swipes', protect, swipeRoutes);
app.use("/api/matches", protect, matchRoutes);
app.use("/api/explore", protect, exploreRoutes);
app.use("/api/chat", protect, chatRoutes);
app.use("/api/notifications", protect, notificationRoutes);
app.use("/api/payments", protect, paymentRoutes);
app.use("/api/webhooks", webhookRoutes);

app.get("/", (req, res) => {
    res.send("Hello World");
});

module.exports = app;
```

### `src/config/`

#### `db.js`
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
```

### `src/controller/`

#### `chat.controller.js`
```javascript
const mongoose = require('mongoose');

exports.getChatHistory = async (req, res) => {
    try {
        const { user1, user2 } = req.params;

        const messages = await MessageChannel.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 },
            ],
        })

            .populate('sender', 'name profilePic')
            .populate('receiver', 'name profilePic')
            .sort({ createdAt: 1 });

        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
```

#### `explore.controller.js`
```javascript
const User = require("../models/user.model");
const Swipe = require("../models/swipe.model");

exports.getExploreFeed = async (req, res) => {
    try {

        const { userId } = req.params;

        const swipedUsers = await Swipe.find({ swiperId: userId }).select('swipedUserId');
        const swipedIds = swipedUsers.map((s) => s.swipedIds.toString());

        // const query = { _id: { $nin: [userId, ...swipedIds] } };

        const currentUser = await User.findById(userId);

        // const exploreUsers = await User.find(query)

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        //New code from here
        const exploreUsers = await User.find({
            _id: { $nin: [userId, ...swipedIds] },
            $or: [
                { skillsOffered: { $in: currentUser.skillsWanted } },
                { skillsWanted: { $in: currentUser.skillsOffered } }
            ],
        }) // till here
            .select("name age gender skillsOffered skillsWanted profilePic bio")
            .limit(20);

        res.status(200).json(exploreUsers);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

#### `match.controller.js`
```javascript
const Match = require("../models/match.model");
const User = require("../models/user.model");

exports.getUserMatches = async (req, res) => {
    try {
        const { userId } = req.params;
        const matches = await Match.find({
            $or: [{ user1: userId }, { user2: userId }],
        }).populate("user1", "name age profilePic skillsOffered skillsWanted")
            .populate("user2", "name age profilePic skillsOffered skillsWanted");
        res.status(200).json({ matches });
    } catch (error) {
        res.status(500).json({ message: error.message });
    
    }
};
```

#### `notification.controller.js`
```javascript
const Notification = require("../models/notification.model.js");

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("sender", "name profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

#### `payment.controller.js`
```javascript
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
```

#### `swipe.controller.js`
```javascript
const Swipe = require('../models/swipe.model')
const Match = require('../models/match.model')
const Notofication = require('../models/notification.model')

exports.swipeAction = async (req, res) => {
    try {
        const { swiperId, swipedUserId, action } = req.body;
        if (!swiperId || !swipedUserId || !action){
            return res.status(400).json({ message: "Missing fileds" });
        }
        const swipe = await Swipe.findOneAndUpdate(
            { swiperId, swipedUserId },
            { action },
            { upsert: true, new: true }
            
    );

        if (action === 'right') {
            const oppositeSwipe = await Swipe.findOne({
                swiperId: swipedUserId,
                swipedUserId: swiperId,
                action: 'right'
            });

            // May be needed later (keep it) rom here
            // if (oppositeSwipe) {
            //     return res.status(200).json({
            //         message: "It's a Match!",
            //         match: true,
            //         swipe,
            //     });
            // }
            // till here

            if (oppositeSwipe) {
                // Check if match already exists
                const existingMatch = await Match.findOne({
                    $or: [
                        { user1: swiperId, user2: swipedUserId },
                        { user1: swipedUserId, user2: swiperId },
                    ],
                });

                if (!existingMatch) {
                    const newMatch = await Match.create({
                        user1: swiperId,
                        user2: swipedUserId,
                    });

                    return res.status(200).json({
                        message: "It's a Match!",
                        match: true,
                        newMatch,
                    });
                }

                return res.status(200).json({
                    message: "Already matched",
                    match: true,
                    existingMatch,
                });
            }

            // Gemini suggested changes here 
            return res.status(200).json({
                message: 'Swipe recorded.',
                match: false
            });
            // till here
        }
        //gemeni suggested
        return res.status(200).json({
            message: 'Swipe recorded.',
            match: false
        });
        //till her
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

exports.getUserSwipes = async (req, res) => {
    try {
        const { userId } = req.params;
        const swipes = await Swipe.find({ swiperId: userId }).populate('swipedUserId');
        res.status(200).json({ swipes });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

exports.undoSwipe = async (req, res) => {
    try {
        const { swiperId } = req.body;

        const lastSwipe = await Swipe.findOne({ swiperId }).sort({ createdAt: -1 });

        if (!lastSwipe) {
            return res.status(404).json({ message: "No swipe found to undo" });

        }
        //gemini suggested
        if (lastSwipe.action === 'right') {
            const oppositeSwipe = await Swipe.findOne({
                swiperId: lastSwipe.swipedUserId,
                swipedUserId: swiperId,
                action: 'right'
            });
            if (oppositeSwipe) {
                await Match.deleteOne({
                    $or: [
                        { user1: swiperId, user2: lastSwipe.swipedUserId },
                        { user1: lastSwipe.swipedUserId, user2: swiperId },
                    ],
                });
            }
        }
        //till here
        await Swipe.deleteOne({ _id: lastSwipe._id });

        res.status(200).json({ message: "Swipe undone successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message })

    }
}
```

#### `user.controller.js`
```javascript
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, age, gender } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const hasheedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hasheedPassword, age, gender });

        res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: "Login successful", token, user })

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });

    }
};
```

### `src/middlewares/`

#### `auth.middleware.js`
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Authorization token missing" });

        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
```

### `src/models/`

#### `match.model.js`
```javascript
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
```

#### `message.model.js`
```javascript
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },

},
    { timestamps: true }
)

module.exports = mongoose.model('message',messageSchema);
```

#### `notification.model.js`
```javascript
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

const notification = mongoose.model('Notification', notificationSchema);

module.exports = notification;
```

#### `payout.model.js`
```javascript
const mongoose = require('mongoose');
const payoutSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayPayout: { type: String },
    status: { type: String, enum: ['created', 'processed', 'failed'], default: 'created' },
    meta: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('payout', payoutSchema);
```

#### `swipe.model.js`
```javascript
const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({

    swiperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    swipedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
        type: String,
        enum: ['left', 'right', 'undo', 'redo'],
        required: true
    },
    timestamp: { type: Date, default: 0 },
    matchScore: { type: Number, default: 0 },
}, { timestamps: true });

swipeSchema.index({ swiperId: 1, swipedUserId: 1 }, { unique: true });

const swipe = mongoose.model('Swipe', swipeSchema);

module.exports = swipe;
```

#### `transaction.model.js`
```javascript
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
```

#### `user.model.js`
```javascript
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    
    name: {type: String, required: true, trim: true},
    age: {type: Number, required:true},
    email:{type: String, required: true, unique: true},
    password:{type: String,required:true},
    location:{
        type:{type: String,enum:['Point'],default:'Point'},
        coordinates:{type:[Number],index:'2dsphere'}
    },
    profilePic:{type:String},
    description:{type:String},
    skillsOffered:{type:String, lowercase:true, trim:true},
    skillsWanted:{type:String, lowercase:true, trim:true},
    experience:{type:Number,required:true},
    gender:{type: String,required:true},
    education:{
        school:{type:String},
        collage:{type:String},
        currentWorkingplace:{type:String}
    },
    photos:[String],
    videos:[String],
    accountType:{type: String, enum: ["free","premium"],default:"free"},
    rating:{type: Number,default:0},
    lastActive:{type: Date, default: Date.now},
    createdAt:{type: Date,default: Date.now}
    
});

const User = mongoose.model('User', userSchema);

module.exports = User;
```

#### `wallet.model.js`
```javascript
const mongoose = require('mongoose');
const walletSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    ledger: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
```

### `src/routes/`

#### `chat.routes.js`
```javascript
const express = require('express');

const { getChatHistory } = require('../controller/chat.controller');

const router = express.Router();

router.get('/history/:user1/:user2', getChatHistory);

module.exports = router;
```

#### `explore.routes.js`
```javascript
const express = require("express");
const { getExploreFeed } = require("../controller/explore.controller");
const router = express.Router();

router.get("/:userId", getExploreFeed);

module.exports = router;
```

#### `match.routes.js`
```javascript
const express = require('express');
const router = express.Router();
const{getUserMatches} = require('../controller/match.controller')

router.get('/:userId', getUserMatches);

module.exports = router;
```

#### `notification.routes.js`
```javascript
const express = require("express");
const {
  getUserNotifications,
  markAsRead,
  clearAll,
} = require("../controller/notification.controller.js");
const { protect } = require("../middlewares/auth.middleware.js");

const router = express.Router();

router.get("/", protect, getUserNotifications);
router.put("/:id/mark-as-read", protect, markAsRead);
router.delete("/clear-all", protect, clearAll);

module.exports = router;
```

#### `notification.routs.js`
```javascript
const express = require('express');
const{protect} = require('../middlewares/auth.middleware')
const{getUserNotification,markAsRead,clearAll} = require('../controller/notification.controller');

const router = express.Router();

router.get('/',protect,getUserNotification);
router.put('/:id/read',protect,markAsRead);
router.delete('/clear',protect,clearAll);

module.exports = router;
```

#### `payment.routes.js`
```javascript
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
```

#### `swipe.routes.js`
```javascript
const { swipeAction, getUserSwipes, undoSwipe } = require('../controller/swipe.controller');
const express = require('express');
const router = express.Router();

router.post("/", swipeAction);
router.get("/:userId", getUserSwipes);
router.delete("/", undoSwipe);

module.exports = router;
```

#### `user.routes.js`
```javascript
const express = require('express');
const { registerUser, loginUser, getAllUsers } = require('../controller/user.controller');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', getAllUsers);

module.exports = router;
```

#### `webhook.routes.js`
```javascript
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
```

## 4. Functionalities

### User Management

*   **Registration:** Users can create a new account with their name, email, password, age, and gender.
*   **Login:** Registered users can log in to receive a JWT for authenticating subsequent requests.
*   **User Profiles:** The `user.model.js` suggests that users have profiles with skills, experience, location, photos, and more.

### Core Matching Flow

*   **Explore Feed:** Users can get a list of potential matches based on skill compatibility.
*   **Swiping:** Users can swipe right ("like") or left ("dislike") on profiles in their explore feed.
*   **Matching:** A match is created when two users mutually swipe right on each other.
*   **Undo Swipe:** Users can undo their last swipe.

### Real-time Communication

*   **Chat:** Matched users can chat with each other in real-time. Chat history is persisted in the database.
*   **Notifications:** Users receive real-time notifications for events like new matches and new messages.

### Payments (Tutor/Student Model)

The payment system seems to be designed for a tutor/student interaction, which might be a specific feature of the app.

*   **Create Order:** A student can initiate a payment to a tutor, creating a Razorpay order.
*   **Verify Payment:** After the payment is completed on the frontend, the backend verifies the payment signature with Razorpay.
*   **Wallet System:** Tutors have a wallet where their earnings are credited after a platform fee (2.5%) is deducted.
*   **Payouts:** Tutors can request to withdraw their balance.
*   **Webhooks:** The backend can receive real-time updates from Razorpay about payment status (e.g., `payment.captured`, `payment.failed`).

## 5. API and Data Flow

1.  **Request Entry:** An incoming HTTP request first hits `server.js` and is passed to the Express app in `app.js`.
2.  **Middleware:** The request goes through global middleware like `cors`, `express.json`, and `morgan`.
3.  **Routing:** The request is directed to the appropriate router in the `src/routes/` directory based on its URL prefix (e.g., `/api/users` goes to `user.routes.js`).
4.  **Authentication:** For protected routes, the `protect` middleware in `auth.middleware.js` is executed. It validates the JWT and attaches the user object to the request.
5.  **Controller Logic:** The route handler calls the corresponding function in a controller from the `src/controller/` directory.
6.  **Business Logic:** The controller function executes the business logic. This often involves:
    *   Reading data from the request body or parameters.
    *   Interacting with the database through Mongoose models (from `src/models/`).
    *   Performing calculations or data transformations.
7.  **Database Interaction:** The Mongoose models handle all communication with the MongoDB database.
8.  **Response:** The controller sends an HTTP response back to the client with a status code and a JSON payload.

### Real-time Flow (Socket.IO)

1.  **Connection:** A client establishes a WebSocket connection with the server, which is handled in `server.js`.
2.  **User Join:** The client emits a `join` event with their `userId`. The server stores the user's socket ID in an `onlineUsers` map.
3.  **Event Emission:** The client can emit events like `sendMessage` or `sendNotification`.
4.  **Server Handling:** The server listens for these events. When an event is received:
    *   It performs an action, such as saving a message to the database.
    *   It checks if the recipient is in the `onlineUsers` map.
    *   If the recipient is online, the server emits an event (e.g., `receiveMessage`) directly to that user's socket.
5.  **Disconnection:** When a user disconnects, their entry is removed from the `onlineUsers` map.

## 6. Potential Issues and Areas for Improvement

*   **Duplicate Notification Routes:** There are two files for notification routes: `notification.routes.js` and `notification.routs.js`. The one with the typo should be removed, and its logic merged if necessary.
*   **Inconsistent `protect` Middleware Usage:** In `app.js`, some routes are protected at the router level (e.g., `app.use('/api/users', protect, userRoutes)`), while in `notification.routes.js`, the `protect` middleware is applied to individual routes. A consistent approach should be chosen.
*   **Missing Error Handling in `auth.middleware.js`:** The `next()` function is not called inside the `try` block, which will prevent the request from proceeding to the next middleware or route handler. Also, the `if` condition `if (authHeader || !authHeader.startWith('Bearer '))` seems to have a logic error. It should probably be `if (!authHeader || !authHeader.startsWith('Bearer '))`.
*   **Empty `services` and `utils` Directories:** The code could be better organized by moving some of the business logic from controller into service files, and creating utility functions for common tasks.
*   **Incomplete `explore.controller.js` Logic:** The line `const swipedIds = swipedUsers.map((s) => s.swipedIds.toString());` seems to have a typo and should likely be `s.swipedUserId`.
*   **Hardcoded Values:** The port number is hardcoded in `server.js`. It would be better to use the `PORT` environment variable that is being set.
*   **Security:** The CORS policy in `server.js` is set to `*` which is insecure for production. This should be restricted to the frontend's domain. The `production_guide.md` mentions this, but the code in `server.js` doesn't reflect the more secure configuration.
*   **No Input Validation:** There is no input validation on the request bodies. This could lead to unexpected errors or security vulnerabilities. Libraries like `joi` or `express-validator` could be used for this.
*   **Missing Tests:** There are no tests for the application. Adding unit and integration tests would improve the code's quality and prevent regressions.
*   **Inconsistent Naming:** There are some inconsistencies in naming conventions (e.g., `Notofication` vs `Notification` in `swipe.controller.js`).
*   **`chat.controller.js` uses `MessageChannel` which is not a defined model.** It should be `Message`.
*   **`user.model.js` has `Date` for `createdAt` and `swipe.model.js` has it for `timestamp` which is not a valid mongoose type.** It should be `Date`.
*   **`auth.middleware.js` has a logical error in the `if` condition.** It should be `!authHeader || !authHeader.startsWith('Bearer ')`.
*   **`auth.middleware.js` is missing `next()` in the `try` block.**
*   **`explore.controller.js` has a typo `swipedIds` instead of `swipedUserId`.**
*   **`swipe.controller.js` has a typo `Notofication` instead of `Notification`.**
*   **`server.js` hardcodes the port.**
*   **CORS is not securely configured for production.**
*   **No input validation.**
*   **No tests.**
*   **Inconsistent naming.**

## 7. Frontend Structure (React + Redux + Socket.io)

We’ll not build it yet — just plan the architecture so backend & frontend align.

```
EZNAT-frontend/
│
├── public/
│   └── index.html
│
├── src/
│   ├── api/
│   │   ├── axiosInstance.js
│   │   ├── userApi.js
│   │   ├── swipeApi.js
│   │   ├── matchApi.js
│   │   ├── chatApi.js
│   │   ├── paymentApi.js
│   │   └── notificationApi.js
│   │
│   ├── components/
│   │   ├── SwipeCard.jsx
│   │   ├── ExploreGrid.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── WalletModal.jsx
│   │   └── ProfileEditor.jsx
│   │
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Explore.jsx
│   │   ├── Chat.jsx
│   │   ├── Matches.jsx
│   │   ├── Notifications.jsx
│   │   ├── Wallet.jsx
│   │   └── Profile.jsx
│   │
│   ├── redux/
│   │   ├── store.js
│   │   ├── userSlice.js
│   │   ├── chatSlice.js
│   │   ├── matchSlice.js
│   │   └── notificationSlice.js
│   │
│   ├── sockets/
│   │   └── socket.js               # centralized socket.io connection
│   │
│   ├── utils/
│   │   └── helpers.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── package.json
└── vite.config.js
```

### Frontend Responsibilities (by feature)

| Feature | Frontend Responsibility | Backend Endpoint |
| :--- | :--- | :--- |
| Auth | Login/Register pages, JWT token storage | `/api/users/register`, `/api/users/login` |
| Profile | Show profile, edit profile, upload media | `/api/users/:id` |
| Explore | Swipe UI (left/right), fetch feed + undo | `/api/explore/:userId`, `/api/swipes` |
| Match | Show mutual matches | `/api/matches/:userId` |
| Chat | Realtime chat + history via Socket.io | `/api/chat/history/:u1/:u2`, socket.io |
| Notifications | Live bell + notification list | `/api/notifications` + socket events |
| Wallet / Payment | Razorpay Checkout, balance view UI + withdraw | `/api/payments/order`, `/api/payments/verify`, `/api/payments/payout` |
| Admin (optional) | Monitor transactions, payouts | `/api/admin/...` |

### Backend Readiness Conclusion

| Area | Status | Action Needed |
| :--- | :--- | :--- |
| Core Backend Modules | ✅ Done | — |
| File Uploads (Cloudinary or S3) | ⚠️ Add later | optional |
| Admin APIs (View Transactions/Users) | ⚠️ Add later | optional |
| Testing + Docs | 🟡 In progress | Postman collection |

### Next Recommended Backend Steps

Before moving to frontend implementation:

1.  Add Profile Update & File Upload API
2.  Add Wallet Balance & Transaction History API (for frontend display)
3.  Create Postman collection for end-to-end testing
