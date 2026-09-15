const mongoose = require("mongoose");
const Group = require("../models/Group");
const User = require("../models/User");
const Conversation = require("../models/Conversation");

const createGroup = async (req, res) => {
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

    // Create Group
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

    // Create Conversation for this Group
    const conversation = await Conversation.create({
      participants: [createdBy]
    });

    // Link Conversation to Group
    group.conversationId = conversation._id;

    await group.save();

    return res.status(201).json({
      message: "Group created successfully",
      group,
      conversation
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const addMemberToGroup = async (req, res) => {
  try {
    const { userId, addedBy } = req.body;
    const { groupId } = req.params;

    // 1. Find the group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    // 2. Check if the person adding the member is the owner
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

    // 3. Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // 4. Check if user is already a member
    const alreadyMember = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "User is already a member of this group"
      });
    }

    // 5. Add user to Group
    group.members.push({
      userId: userId,
      role: "member"
    });

    await group.save();

    // 6. Add user to Conversation
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
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { removedBy } = req.body;

    // 1. Find the group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    // 2. Check that the person removing is the owner
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

    // 3. Check if the user is actually a member
    const memberExists = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (!memberExists) {
      return res.status(404).json({
        message: "User is not a member of this group"
      });
    }

    // 4. Owner cannot be removed
    const memberToRemove = group.members.find(
      (member) => member.userId.toString() === userId
    );

    if (memberToRemove.role === "owner") {
      return res.status(400).json({
        message: "The group owner cannot be removed"
      });
    }

    // 5. Remove user from Group.members
    group.members = group.members.filter(
      (member) => member.userId.toString() !== userId
    );

    await group.save();

    // 6. Remove user from group conversation
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
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const getGroupById = async (req, res) => {
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
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const getUserGroups = async (req, res) => {
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
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    // 1. Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    // 2. Find the member
    const member = group.members.find(
      (member) => member.userId.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        message: "You are not a member of this group"
      });
    }

    // 3. Owner cannot leave
    if (member.role === "owner") {
      return res.status(400).json({
        message: "The group owner cannot leave the group"
      });
    }

    // 4. Remove user from Group.members
    group.members = group.members.filter(
      (member) => member.userId.toString() !== userId
    );

    await group.save();

    // 5. Remove user from Conversation.participants
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
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, updatedBy } = req.body;

    // 1. Check name
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required"
      });
    }

    // 2. Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    // 3. Check owner
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

    // 4. Update name
    group.name = name.trim();

    await group.save();

    return res.status(200).json({
      message: "Group updated successfully",
      group
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { deletedBy } = req.body;

    // 1. Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    // 2. Check owner
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

    // 3. Delete conversation
    if (group.conversationId) {
      await Conversation.findByIdAndDelete(
        group.conversationId
      );
    }

    // 4. Delete group
    await Group.findByIdAndDelete(groupId);

    return res.status(200).json({
      message: "Group deleted successfully"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
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