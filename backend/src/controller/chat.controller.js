const mongoose = require('mongoose');
const Message = require('../models/message.model');

exports.getChatHistory = async (req, res) => {
    try {
        const { user1, user2 } = req.params;

        const messages = await Message.find({
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