const express = require("express");
const router = express.Router();

const {
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    getGroupById,
    getUserGroups,
    leaveGroup,
    updateGroup,
    deleteGroup
} = require("../controllers/groupController");

router.post("/", createGroup);

router.post("/:groupId/members", addMemberToGroup);

router.delete("/:groupId/members/:userId", removeMemberFromGroup);

router.get("/user/:userId", getUserGroups);

router.get("/:groupId", getGroupById);

router.delete("/:groupId/leave", leaveGroup);

router.patch("/:groupId", updateGroup);

router.delete("/:groupId", deleteGroup);

module.exports = router;