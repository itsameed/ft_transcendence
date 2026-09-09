const express = require("express");

const {
  createConversation,
  getConversations
} = require("../controllers/conversationController");

const router = express.Router();

router.post("/", createConversation);
router.get("/", getConversations);

router.post("/test", async (req, res) => {
  try {
    const Conversation = require("../models/Conversation");

    // const { user1Id, user2Id } = req.body;

    const conversation = await Conversation.create({
      participants: ["6aa17a3f0e4485dfbaed9b5a", "6aa17a4e0e4485dfbaed9b5b"]
    });

    res.status(201).json(conversation);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;