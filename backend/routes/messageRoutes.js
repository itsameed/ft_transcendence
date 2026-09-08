const express = require("express");

const {
  sendMessage,
  getMessages,
  markMessageAsRead
} = require("../controllers/messageController");

const router = express.Router();

router.post("/:conversationId/messages", sendMessage);
router.get("/:conversationId/messages", getMessages);
router.patch("/messages/:messageId/read", markMessageAsRead);

module.exports = router;