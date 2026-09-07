const Notification = require("../models/Notification");

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: "6a9879a2e79e1e889a2897d0"
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get notifications"
    });
  }
};


// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: "6a9879a2e79e1e889a2897d0"
      },
      {
        isRead: true
      },
      {
        new: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark notification as read"
    });
  }
};


// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: "6a9879a2e79e1e889a2897d0"
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.status(200).json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete notification"
    });
  }
};


module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification
};