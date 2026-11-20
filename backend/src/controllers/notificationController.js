const Notification = require("../models/Schemas/Notification");
const Expense = require("../models/Schemas/Expenses");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ userId })
      .populate("senderId", "username")
      .sort({ createdAt: -1 });

    const expenseIds = notifications
      .filter((notification) => notification.type === "EXPENSE_ADDED" && notification.relatedId)
      .map((notification) => notification.relatedId);
    const expenses = await Expense.find(
      { _id: { $in: expenseIds } },
      { _id: 1, group: 1 }
    ).lean();
    const expenseGroups = new Map(
      expenses.map((expense) => [String(expense._id), String(expense.group)])
    );

    const mappedNotifications = notifications.map((notification) => {
      const mapped = notification.toObject();
      if (notification.type === "EXPENSE_ADDED" && notification.relatedId) {
        const groupId = expenseGroups.get(String(notification.relatedId));
        if (groupId) mapped.relatedId = groupId;
      }
      return mapped;
    });

    return res.status(200).json(mappedNotifications);
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

const clearUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({
      userId: userId
    });

    return res.status(200).json({
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