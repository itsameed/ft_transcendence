const Notification = require("../models/Notification");

const createNotification = async ({
    userId,
    senderId = null,
    type,
    title,
    message
}) => {

    const notification = await Notification.create({
        userId,
        senderId,
        type,
        title,
        message,
        isRead: false
    });

    await notification.populate("senderId", "username");

    return notification;
};

module.exports = {
    createNotification
};