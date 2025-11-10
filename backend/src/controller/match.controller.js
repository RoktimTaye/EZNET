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