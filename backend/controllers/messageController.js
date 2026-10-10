const Conversation = require("../models/Conversation");
const { createNotification } = require("../utils/notificationService");
const Message = require("../models/Message");

const sendMessage = async (req, res, next) => {
  try {
    const { content, senderId } = req.body;
    const { conversationId } = req.params;

    if (!content || !senderId || !content.trim()) {
      return res.status(400).json({
        message: "content and senderId are required"
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === senderId
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant in this conversation"
      });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content
    });

    await message.populate("senderId", "_id username");

    const io = req.app.get("io");

    const receiverIds = conversation.participants.filter(
      (id) => id.toString() !== senderId
    );

    for (const receiverId of receiverIds) {

      const notification = await createNotification({
        userId: receiverId,
        senderId: senderId,
        type: "CHAT_MESSAGE",
        title: "New message",
        message: content
      });

      io.to(`user:${receiverId}`).emit(
        "newNotification",
        notification
      );
    }

    io.to(`conversation:${conversationId}`).emit(
      "newMessage",
      message
    );

    return res.status(201).json(message);

  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant in this conversation"
      });
    }

    const messages = await Message.find({
      conversationId
    })
      .populate("senderId", "_id username")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
};