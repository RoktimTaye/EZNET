const Swipe = require('../models/swipe.model')
const Match = require('../models/match.model')
const Notification = require('../models/notification.model')

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