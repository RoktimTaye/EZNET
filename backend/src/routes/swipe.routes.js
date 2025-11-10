const { swipeAction, getUserSwipes, undoSwipe } = require('../controller/swipe.controller');
const express = require('express');
const router = express.Router();

router.post("/", swipeAction);
router.get("/:userId", getUserSwipes);
router.delete("/", undoSwipe);

module.exports = router;