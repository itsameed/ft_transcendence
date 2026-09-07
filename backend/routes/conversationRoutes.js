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
      participants: ["6a9878447c14d5f2522a994c", "6a9879a2e79e1e889a2897d0"]
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