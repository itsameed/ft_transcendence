const express = require("express");

const {
  getNotifications,
  markNotificationAsRead,
  deleteNotification
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/:userId", getNotifications);
router.patch("/:notificationId/read", markNotificationAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;