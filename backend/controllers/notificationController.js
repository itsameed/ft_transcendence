const Notification = require("../models/Notification");

const getNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId })
      .populate("senderId", "username")
      .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    next(error);
  }
};


const markNotificationAsRead = async (req, res, next) => {
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
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {

    const notification =
      await Notification.findByIdAndDelete(
        req.params.id
      );

    if (!notification) {

      return res.status(404).json({
        message: "Notification not found"
      });

    }

    res.status(200).json({
      message: "Notification deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};


const clearUserNotifications = async (req, res, next) => {
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
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearUserNotifications
};