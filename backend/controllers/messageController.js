const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");
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

    // Find the other participant
    const receiverId = conversation.participants.find(
      (id) => id.toString() !== senderId
    );

    if (!receiverId) {
      return res.status(400).json({
        message: "Receiver not found"
      });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      content
    });

    // Create notification
    await Notification.create({
      userId: receiverId,
      type: "CHAT_MESSAGE",
      title: "New message",
      message: content,
      isRead: false
    });

    res.status(201).json(message);

  } catch (error) {
    console.error(error);

    res.status(500).json({
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
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    // Find conversation
    const conversation = await Conversation.findById(
      message.conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant in this conversation"
      });
    }

    // Don't allow sender to mark his own message as read
    if (message.senderId.toString() === userId) {
      return res.status(400).json({
        message: "You cannot mark your own message as read"
      });
    }

    // Mark as read
    message.isRead = true;

    await message.save();

    res.status(200).json({
      message: "Message marked as read",
      data: message
    });

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
  markMessageAsRead
};