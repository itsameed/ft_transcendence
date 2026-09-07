const express = require("express");

const {
  getNotifications,
  markAsRead,
  deleteNotification
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

router.post("/test", async (req, res) => {
  try {
    const Notification = require("../models/Notification");

    const notification = await Notification.create({
      userId: "6a9879a2e79e1e889a2897d0",
      type: "CHAT_MESSAGE",
      title: "Test notification",
      message: "Ameed is here",
      isRead: false
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;