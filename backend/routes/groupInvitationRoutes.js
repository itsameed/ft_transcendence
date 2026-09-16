const express = require("express");

const {
  sendGroupInvitation,
  acceptGroupInvitation,
  rejectGroupInvitation
} = require("../controllers/groupInvitationController");

const router = express.Router();

router.post("/:groupId", sendGroupInvitation);

router.patch("/:invitationId/accept", acceptGroupInvitation);

router.patch("/:invitationId/reject", rejectGroupInvitation);

module.exports = router;