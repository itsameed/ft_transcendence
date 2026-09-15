const express = require("express");
const router = express.Router();

const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend
} = require("../controllers/friendController");

router.post("/request", sendFriendRequest);

router.patch("/request/accept", acceptFriendRequest);

router.patch("/request/reject", rejectFriendRequest);

router.get("/", getFriends);

router.get("/requests", getFriendRequests);

router.delete("/", removeFriend);

module.exports = router;