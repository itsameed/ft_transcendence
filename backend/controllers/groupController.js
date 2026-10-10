const mongoose = require("mongoose");
const Group = require("../models/Group");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const GroupInvitation = require("../models/GroupInvitation");
const Notification = require("../models/Notification");

const createGroup = async (req, res, next) => {
  try {
    const { name, createdBy } = req.body;

    if (!name || !createdBy) {
      return res.status(400).json({
        message: "Name and createdBy are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const group = await Group.create({
      name: name,
      createdBy: createdBy,
      members: [
        {
          userId: createdBy,
          role: "owner"
        }
      ]
    });

    const conversation = await Conversation.create({
      participants: [createdBy]
    });

    group.conversationId = conversation._id;

    await group.save();

    return res.status(201).json({
      message: "Group created successfully",
      group,
      conversation
    });

  } catch (error) {
    next(error);
  }
};

const addMemberToGroup = async (req, res, next) => {
  try {
    const { userId, addedBy } = req.body;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const owner = group.members.find(
      (member) =>
        member.userId.toString() === addedBy &&
        member.role === "owner"
    );

    if (!owner) {
      return res.status(403).json({
        message: "Only the group owner can add members"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const alreadyMember = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "User is already a member of this group"
      });
    }

    group.members.push({
      userId: userId,
      role: "member"
    });

    await group.save();

    if (group.conversationId) {
      await Conversation.findByIdAndUpdate(
        group.conversationId,
        {
          $addToSet: {
            participants: userId
          }
        }
      );
    }

    return res.status(200).json({
      message: "Member added successfully",
      group
    });

  } catch (error) {
    next(error);
  }
};

const removeMemberFromGroup = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;
    const { removedBy } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const owner = group.members.find(
      (member) =>
        member.userId.toString() === removedBy &&
        member.role === "owner"
    );

    if (!owner) {
      return res.status(403).json({
        message: "Only the group owner can remove members"
      });
    }

    const memberExists = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (!memberExists) {
      return res.status(404).json({
        message: "User is not a member of this group"
      });
    }

    const memberToRemove = group.members.find(
      (member) => member.userId.toString() === userId
    );

    if (memberToRemove.role === "owner") {
      return res.status(400).json({
        message: "The group owner cannot be removed"
      });
    }

    group.members = group.members.filter(
      (member) => member.userId.toString() !== userId
    );

    await group.save();

    if (group.conversationId) {
      await Conversation.findByIdAndUpdate(
        group.conversationId,
        {
          $pull: {
            participants: userId
          }
        }
      );
    }

    return res.status(200).json({
      message: "Member removed successfully",
      group
    });

  } catch (error) {
    next(error);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("createdBy", "username useremail")
      .populate("members.userId", "username useremail");

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    return res.status(200).json({
      group
    });

  } catch (error) {
    next(error);
  }
};

const getUserGroups = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const groups = await Group.find({
      "members.userId": userId
    })
      .populate("createdBy", "username useremail")
      .populate("members.userId", "username useremail")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      groups
    });

  } catch (error) {
    next(error);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const member = group.members.find(
      (member) => member.userId.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        message: "You are not a member of this group"
      });
    }

    if (member.role === "owner") {
      return res.status(400).json({
        message: "The group owner cannot leave the group"
      });
    }

    group.members = group.members.filter(
      (member) => member.userId.toString() !== userId
    );

    await group.save();

    if (group.conversationId) {
      await Conversation.findByIdAndUpdate(
        group.conversationId,
        {
          $pull: {
            participants: userId
          }
        }
      );
    }

    return res.status(200).json({
      message: "You left the group successfully"
    });

  } catch (error) {
    next(error);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { name, updatedBy } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required"
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const owner = group.members.find(
      (member) =>
        member.userId.toString() === updatedBy &&
        member.role === "owner"
    );

    if (!owner) {
      return res.status(403).json({
        message: "Only the group owner can update the group"
      });
    }

    group.name = name.trim();

    await group.save();

    return res.status(200).json({
      message: "Group updated successfully",
      group
    });

  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { deletedBy } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const owner = group.members.find(
      (member) =>
        member.userId.toString() === deletedBy &&
        member.role === "owner"
    );

    if (!owner) {
      return res.status(403).json({
        message: "Only the group owner can delete the group"
      });
    }

    if (group.conversationId) {
      await Message.deleteMany({
        conversationId: group.conversationId
      });

      await Conversation.findByIdAndDelete(
        group.conversationId
      );
    }
    const invitations = await GroupInvitation.find({
      groupId: groupId
    });

    const invitationIds = invitations.map(
      (invitation) => invitation._id
    );

    await Notification.deleteMany({
      relatedId: { $in: invitationIds }
    });

    await GroupInvitation.deleteMany({
      groupId: groupId
    });

    await Group.findByIdAndDelete(groupId);

    return res.status(200).json({
      message: "Group deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupById,
  getUserGroups,
  leaveGroup,
  updateGroup,
  deleteGroup
};