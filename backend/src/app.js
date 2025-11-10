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