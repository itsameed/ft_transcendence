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

    const messages = await Message.find({
      conversationId
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get messages"
    });
  }
};


module.exports = {
  sendMessage,
  getMessages
};