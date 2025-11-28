const app = require('./src/app');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const Notification = require('./src/models/notification.model');
connectDB();

//http + socket.io statements
const server = http.createServer(app);
const io = new Server(server, {
  // cors: { origin: "*", method: ["GET", "POST"] }
  cors: { origin: process.env.FRONTEND_URL, methods: ["GET", "POST"] }

});

// Handle user joining with userId
let onlineUsers = new Map();

// Suggested optional to be apploed the same logic in other
// blocks for notification in every functionality
// like mossage , match, swipe request etc .
//From here
app.set('io', io);
app.set('onlineUsers', onlineUsers);
// till here
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  // Handle sending a message
  socket.on("sendMessage", async ({ senderId, receiverId, message, matchId }) => {
    //DB is linked to store the message sending
    const Message = require("./src/models/message.model");

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