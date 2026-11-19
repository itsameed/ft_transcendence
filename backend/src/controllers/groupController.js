const mongoose = require("mongoose");
const Group = require("../models/Schemas/Group");
const User = require("../models/Schemas/User");
const Conversation = require("../models/Schemas/Conversation");
const Message = require("../models/Schemas/Message");
const GroupInvitation = require("../models/Schemas/GroupInvitation");
const Notification = require("../models/Schemas/Notification");
const { createNotification } = require("./notificationService");
const Expense = require("../models/Schemas/Expenses");
const Settlement = require("../models/Schemas/Settlement");

const {
  computeGroupBalances,
  computeOutstandingDebts,
  EPSILON
} = require("../services/balances");

const createGroup = async (req, res, next) => {
  try {
    const { name, description = '', memberIds = [] } = req.body ?? {};
    const createdBy = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required"
      });
    }

    const extras = Array.isArray(memberIds)
      ? [...new Set(memberIds.filter(
        (id) =>
          typeof id === 'string' &&
          mongoose.Types.ObjectId.isValid(id) &&
          id !== createdBy
      ))]
      : [];

    const valid = extras.length
      ? await User.find({ _id: { $in: extras } }).select('_id')
      : [];

    const members = [
      { userId: createdBy, role: "owner" },
      ...valid.map((u) => ({
        userId: u._id,
        role: "member"
      })),
    ];

    const group = await Group.create({
      name: name.trim(),
      description: typeof description === 'string'
        ? description.trim()
        : '',
      createdBy,
      members
    });

    const conversation = await Conversation.create({
      participants: members.map((m) => m.userId)
    });

    group.conversationId = conversation._id;
    await group.save();

    const io = req.app.get("io");

    for (const member of members) {
      const receiverId = member.userId.toString();

      if (receiverId === createdBy) {
        continue;
      }

      const notification = await createNotification({
        userId: receiverId,
        senderId: createdBy,
        type: "GROUP_INVITATION",
        title: "New group",
        message: `You were added to the group "${group.name}"`,
        relatedId: group._id
      });

      if (io) {
        io.to(`user:${receiverId}`).emit(
          "newNotification",
          notification
        );
      }
    }

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
    const { userId } = req.body;
    const addedBy = req.user.id;
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const isOwner = group.members.some(
      (member) =>
        member.userId.toString() === addedBy &&
        member.role === "owner"
    );

    if (!isOwner) {
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
        message: "User is already a member"
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

    const notification = await createNotification({
      userId: userId,
      senderId: addedBy,
      type: "GROUP_INVITATION",
      title: "Added to group",
      message: `You were added to the group "${group.name}"`,
      relatedId: group._id
    });

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${userId}`).emit(
        "newNotification",
        notification
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
    const removedBy = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        message: "Invalid ID"
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const isOwner = group.members.some(
      (member) =>
        member.userId.toString() === removedBy &&
        member.role === "owner"
    );

    if (!isOwner) {
      return res.status(403).json({
        message: "Only the group owner can remove members"
      });
    }

    const memberIndex = group.members.findIndex(
      (member) =>
        member.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        message: "User is not a member of this group"
      });
    }

    const member = group.members[memberIndex];

    if (member.role === "owner") {
      return res.status(400).json({
        message: "The group owner cannot be removed"
      });
    }

    const memberIds = group.members.map(
      (member) => member.userId.toString()
    );

    const [expenses, settlements] = await Promise.all([
      Expense.find({ group: groupId }),
      Settlement.find({
        group: groupId,
        status: "accepted"
      })
    ]);

    const netBalances = computeGroupBalances(
      expenses,
      settlements,
      memberIds
    );

    const outstandingDebts = computeOutstandingDebts(
      expenses,
      settlements,
      memberIds
    );

    if (
      outstandingDebts.length > 0 ||
      Object.values(netBalances).some(
        (balance) => Math.abs(balance) > EPSILON
      )
    ) {
      return res.status(409).json({
        message: "Cannot remove a member while group debts are outstanding.",
        error: "GROUP_HAS_UNSETTLED_DEBTS",
        memberBalances: netBalances,
        outstandingDebts
      });
    }

    group.members.splice(memberIndex, 1);
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

    const notification = await createNotification({
      userId,
      senderId: removedBy,
      type: "GROUP_REMOVED",
      title: "Removed from group",
      message: `You were removed from the group "${group.name}"`,
      relatedId: group._id
    });

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${userId}`).emit(
        "newNotification",
        notification
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
    const currentUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID"
      });
    }

    const group = await Group.findById(groupId)
      .populate("createdBy", "username email avatar")
      .populate("members.userId", "username email avatar");

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const isMember = group.members.some(
      (member) =>
        member.userId &&
        member.userId._id.toString() === currentUserId
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this group"
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
    const currentUserId = req.user.id;

    const groups = await Group.find({
      "members.userId": currentUserId
    })
      .populate("createdBy", "username email avatar")
      .populate("members.userId", "username email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: groups.length,
      groups
    });
  } catch (error) {
    next(error);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID"
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const memberIndex = group.members.findIndex(
      (member) =>
        member.userId.toString() === currentUserId
    );

    if (memberIndex === -1) {
      return res.status(403).json({
        message: "You are not a member of this group"
      });
    }

    const member = group.members[memberIndex];

    if (member.role === "owner") {
      return res.status(400).json({
        message: "The group owner cannot leave the group"
      });
    }

    const memberIds = group.members.map(
      (member) => member.userId.toString()
    );

    const [expenses, settlements] = await Promise.all([
      Expense.find({ group: groupId }),
      Settlement.find({
        group: groupId,
        status: "accepted"
      })
    ]);

    const netBalances = computeGroupBalances(
      expenses,
      settlements,
      memberIds
    );

    const outstandingDebts = computeOutstandingDebts(
      expenses,
      settlements,
      memberIds
    );

    if (
      outstandingDebts.length > 0 ||
      Object.values(netBalances).some(
        (balance) => Math.abs(balance) > EPSILON
      )
    ) {
      return res.status(409).json({
        message: "You cannot leave the group while group debts are outstanding.",
        error: "GROUP_HAS_UNSETTLED_DEBTS",
        memberBalances: netBalances,
        outstandingDebts
      });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    if (group.conversationId) {
      await Conversation.findByIdAndUpdate(
        group.conversationId,
        {
          $pull: {
            participants: currentUserId
          }
        }
      );
    }

    const owner = group.members.find(
      (member) => member.role === "owner"
    );

    if (owner) {
      const ownerId = owner.userId.toString();

      const notification = await createNotification({
        userId: ownerId,
        senderId: currentUserId,
        type: "GROUP_MEMBER_LEFT",
        title: "Member left group",
        message: `A member left the group "${group.name}"`,
        relatedId: group._id
      });

      const io = req.app.get("io");

      if (io) {
        io.to(`user:${ownerId}`).emit(
          "newNotification",
          notification
        );
      }
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
    const { name } = req.body;
    const updatedBy = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID"
      });
    }

    if (typeof name !== "string" || !name.trim()) {
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

    const isOwner = group.members.some(
      (member) =>
        member.userId.toString() === updatedBy &&
        member.role === "owner"
    );

    if (!isOwner) {
      return res.status(403).json({
        message: "Only the group owner can update the group"
      });
    }

    const oldName = group.name;

    group.name = name.trim();

    await group.save();

    const io = req.app.get("io");

    for (const member of group.members) {
      const receiverId = member.userId.toString();

      if (receiverId === updatedBy.toString()) {
        continue;
      }

      const notification = await createNotification({
        userId: receiverId,
        senderId: updatedBy,
        type: "GROUP_UPDATED",
        title: "Group updated",
        message: `Group name changed from "${oldName}" to "${group.name}"`,
        relatedId: group._id
      });

      if (io) {
        io.to(`user:${receiverId}`).emit(
          "newNotification",
          notification
        );
      }
    }

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
    const deletedBy = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID"
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const isOwner = group.members.some(
      (member) =>
        member.userId.toString() === deletedBy &&
        member.role === "owner"
    );

    if (!isOwner) {
      return res.status(403).json({
        message: "Only the group owner can delete the group"
      });
    }

    const memberIds = group.members.map(
      (member) => member.userId.toString()
    );

    const [expenses, settlements] = await Promise.all([
      Expense.find({ group: groupId }),
      Settlement.find({
        group: groupId,
        status: "accepted"
      })
    ]);

    const netBalances = computeGroupBalances(
      expenses,
      settlements,
      memberIds
    );

    const outstandingDebts = computeOutstandingDebts(
      expenses,
      settlements,
      memberIds
    );

    if (
      outstandingDebts.length > 0 ||
      Object.values(netBalances).some(
        (balance) => Math.abs(balance) > EPSILON
      )
    ) {
      return res.status(409).json({
        message: "Cannot delete the group while group debts are outstanding.",
        error: "GROUP_HAS_UNSETTLED_DEBTS",
        memberBalances: netBalances,
        outstandingDebts
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
      groupId: group._id
    }).select("_id");

    const invitationIds = invitations.map(
      (invitation) => invitation._id
    );

    if (invitationIds.length > 0) {
      await Notification.deleteMany({
        relatedId: { $in: invitationIds }
      });
    }

    await GroupInvitation.deleteMany({
      groupId: group._id
    });

    await Group.findByIdAndDelete(group._id);

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