const express = require("express");
const apiAuth = require("../middleware/apiAuth");

const {
  createConversation,
  getConversations
} = require("../controllers/conversationController");

const router = express.Router();

router.post("/", apiAuth, createConversation);
router.get("/", apiAuth, getConversations);

module.exports = router;