const User = require("../models/user.model");
const Swipe = require("../models/swipe.model");

exports.getExploreFeed = async (req, res) => {
    try {

        const { userId } = req.params;

        const swipedUsers = await Swipe.find({ swiperId: userId }).select('swipedUserId');
        const swipedIds = swipedUsers.map((s) => s.swipedUserId.toString());

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