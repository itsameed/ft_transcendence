const Conversation = require("../models/Conversation");

// Create a conversation
const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    const conversation = await Conversation.create({
      participants: [req.user.id, userId]
    });

    res.status(201).json(conversation);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create conversation"
    });
  }
};


// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    }).sort({ updatedAt: -1 });

    res.status(200).json(conversations);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get conversations"
    });
  }
};


module.exports = {
  createConversation,
  getConversations
};