const Conversation = require("../models/Conversation");

const createConversation = async (req, res, next) => {
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
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    }).sort({ updatedAt: -1 });

    res.status(200).json(conversations);

  } catch (error) {
    next(error);
  }
};


module.exports = {
  createConversation,
  getConversations
};