const GroupInvitation = require("../models/GroupInvitation");
const Group = require("../models/Group");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { createNotification } = require("../utils/notificationService");

const sendGroupInvitation = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { userId, invitedBy } = req.body;

        if (!userId || !invitedBy) {
            return res.status(400).json({
                message: "userId and invitedBy are required"
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
                member.userId.toString() === invitedBy &&
                member.role === "owner"
        );

        if (!owner) {
            return res.status(403).json({
                message: "Only the group owner can invite members"
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

        const existingInvitation = await GroupInvitation.findOne({
            groupId,
            invitedUserId: userId,
            status: "pending"
        });

        if (existingInvitation) {
            return res.status(409).json({
                message: "User already has a pending invitation"
            });
        }

        const invitation = await GroupInvitation.create({
            groupId,
            invitedUserId: userId,
            invitedBy,
            status: "pending"
        });

        const notification = await createNotification({
            userId,
            senderId: invitedBy,
            type: "GROUP_INVITATION",
            title: "Group invitation",
            message: `You have been invited to join ${group.name}`,
            relatedId: invitation._id
        });

        const io = req.app.get("io");

        if (io) {
            io.to(`user:${userId}`).emit(
                "newNotification",
                notification
            );
        }

        return res.status(201).json({
            message: "Group invitation sent successfully",
            invitation
        });

    } catch (error) {
        next(error);
    }
};


const acceptGroupInvitation = async (req, res, next) => {
    try {
        const { invitationId } = req.params;

        const invitation = await GroupInvitation.findById(
            invitationId
        );

        if (!invitation) {
            return res.status(404).json({
                message: "Invitation not found"
            });
        }

        if (invitation.status !== "pending") {
            return res.status(400).json({
                message: "Invitation is no longer pending"
            });
        }

        const group = await Group.findById(
            invitation.groupId
        );

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const alreadyMember = group.members.some(
            (member) =>
                member.userId.toString() ===
                invitation.invitedUserId.toString()
        );

        if (!alreadyMember) {

            group.members.push({
                userId: invitation.invitedUserId,
                role: "member"
            });

            await group.save();

            if (group.conversationId) {
                await Conversation.findByIdAndUpdate(
                    group.conversationId,
                    {
                        $addToSet: {
                            participants: invitation.invitedUserId
                        }
                    }
                );
            }
        }

        invitation.status = "accepted";

        await invitation.save();

        return res.status(200).json({
            message: "Invitation accepted successfully",
            group
        });
    } catch (error) {
        next(error);
    }
};


const rejectGroupInvitation = async (req, res, next) => {
    try {
        const { invitationId } = req.params;

        const invitation = await GroupInvitation.findById(
            invitationId
        );

        if (!invitation) {
            return res.status(404).json({
                message: "Invitation not found"
            });
        }

        if (invitation.status !== "pending") {
            return res.status(400).json({
                message: "Invitation is no longer pending"
            });
        }

        invitation.status = "rejected";

        await invitation.save();

        return res.status(200).json({
            message: "Invitation rejected successfully"
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    sendGroupInvitation,
    acceptGroupInvitation,
    rejectGroupInvitation
};