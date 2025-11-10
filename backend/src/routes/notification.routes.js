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
