const Notification = require("../models/Notification");

const createNotification = async ({
    userId,
    senderId = null,
    type,
    title,
    message,
    relatedId = null
}) => {

    const notification = await Notification.create({
        userId,
        senderId,
        type,
        title,
        message,
        relatedId,
        isRead: false
    });

    await notification.populate("senderId", "username");

    return notification;
};

module.exports = {
    createNotification
};