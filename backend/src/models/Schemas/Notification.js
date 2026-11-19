const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "GROUP_INVITATION",
                "FRIEND_REQUEST",
                "EXPENSE_ADDED",
                "PAYMENT_RECEIVED",
                "GROUP_REMOVED",
                "CHAT_MESSAGE",
                "RECURRING_EXPENSE",
                "PAYMENT_REMINDER",
                "GROUP_MEMBER_LEFT",
                "TRIP_INVITATION",
                "GROUP_UPDATED"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        relatedId: {
            type: mongoose.Schema.Types.ObjectId
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Notification", notificationSchema);