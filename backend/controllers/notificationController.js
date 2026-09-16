const Notification = require("../models/Notification");

// GET notifications
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId })
      .populate("senderId", "username")
      .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error getting notifications"
    });
  }
};


// PATCH notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    notification.isRead = true;

    await notification.save();

    res.json(notification);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error marking notification as read"
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


const clearUserNotifications = async (req, res) => {
    try {

        const { userId } = req.params;

        const result = await Notification.deleteMany({
            userId: userId
        });

        res.status(200).json({
            message: "All notifications deleted",
            deletedCount: result.deletedCount
        });

    } catch (error) {

        console.error(
            "Error clearing notifications:",
            error
        );

        res.status(500).json({
            message: "Failed to clear notifications"
        });
    }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearUserNotifications
};