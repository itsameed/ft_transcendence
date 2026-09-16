const GroupInvitation = require("../models/GroupInvitation");
const Group = require("../models/Group");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { createNotification } = require("../utils/notificationService");

// Send group invitation
const sendGroupInvitation = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId, invitedBy } = req.body;

        // 1. Check required fields
        if (!userId || !invitedBy) {
            return res.status(400).json({
                message: "userId and invitedBy are required"
            });
        }

        // 2. Find group
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // 3. Check if invitedBy is the owner
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

        // 4. Check if user exists
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // 5. Check if user is already a member
        const alreadyMember = group.members.some(
            (member) => member.userId.toString() === userId
        );

        if (alreadyMember) {
            return res.status(409).json({
                message: "User is already a member of this group"
            });
        }

        // 6. Check if there is already a pending invitation
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

        // 7. Create invitation
        const invitation = await GroupInvitation.create({
            groupId,
            invitedUserId: userId,
            invitedBy,
            status: "pending"
        });

        // 8. Create notification
        const notification = await createNotification({
            userId,
            senderId: invitedBy,
            type: "GROUP_INVITATION",
            title: "Group invitation",
            message: `You have been invited to join ${group.name}`,
            relatedId: invitation._id
        });

        // 9. Send notification in real-time
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
        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// Accept group invitation
const acceptGroupInvitation = async (req, res) => {
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

        // Check invitation status
        if (invitation.status !== "pending") {
            return res.status(400).json({
                message: "Invitation is no longer pending"
            });
        }

        // Find group
        const group = await Group.findById(
            invitation.groupId
        );

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check if user is already a member
        const alreadyMember = group.members.some(
            (member) =>
                member.userId.toString() ===
                invitation.invitedUserId.toString()
        );

        if (!alreadyMember) {

            // Add user to group
            group.members.push({
                userId: invitation.invitedUserId,
                role: "member"
            });

            await group.save();

            // Add user to group conversation
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

        // Update invitation
        invitation.status = "accepted";

        await invitation.save();

        return res.status(200).json({
            message: "Invitation accepted successfully",
            group
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// Reject group invitation
const rejectGroupInvitation = async (req, res) => {
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

        // Check invitation status
        if (invitation.status !== "pending") {
            return res.status(400).json({
                message: "Invitation is no longer pending"
            });
        }

        // Update invitation
        invitation.status = "rejected";

        await invitation.save();

        return res.status(200).json({
            message: "Invitation rejected successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    sendGroupInvitation,
    acceptGroupInvitation,
    rejectGroupInvitation
};