const Conversation = require("../models/Conversation");
const { createNotification } = require("../utils/notificationService");
const Message = require("../models/Message");

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { content, senderId } = req.body;
    const { conversationId } = req.params;

    if (!content || !senderId) {
      return res.status(400).json({
        message: "content and senderId are required"
      });
    }

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    // Check if sender is a participant
    const isParticipant = conversation.participants.some(
      (id) => id.toString() === senderId
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant in this conversation"
      });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      content
    });

    await message.populate("senderId", "_id username");

    const io = req.app.get("io");

    // Create notification for every participant except sender
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

      // Send notification in real-time
      io.to(`user:${receiverId}`).emit(
        "newNotification",
        notification
      );
    }

    // Send message to conversation room
    io.to(`conversation:${conversationId}`).emit(
      "newMessage",
      message
    );

    return res.status(201).json(message);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// Get messages
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    // Find conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant in this conversation"
      });
    }

    // Get messages
    const messages = await Message.find({
      conversationId
    })
      .populate("senderId", "_id username")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};