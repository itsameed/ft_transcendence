const express = require("express");

const {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearUserNotifications
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/:userId", getNotifications);
router.patch("/:notificationId/read", markNotificationAsRead);
router.delete("/:id", deleteNotification);
router.delete("/user/:userId", clearUserNotifications);

module.exports = router;