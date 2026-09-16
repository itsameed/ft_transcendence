const express = require("express");

const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

const router = express.Router();

router.post("/:conversationId/messages", sendMessage);
router.get("/:conversationId/messages", getMessages);

module.exports = router;