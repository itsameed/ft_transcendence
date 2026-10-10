const mongoose = require("mongoose");
const Friendship = require("../models/Friendship");
const User = require("../models/User");
const { createNotification } = require("../utils/notificationService");

const sendFriendRequest = async (req, res, next) => {
  try {

    const { requesterId, receiverId } = req.body;
    const currentUserId = requesterId;

    if (!requesterId || !receiverId) {
      return res.status(400).json({
        message: "requesterId and receiverId are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    if (currentUserId === receiverId) {
      return res.status(400).json({
        message: "You cannot send a friend request to yourself"
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const existingFriendship = await Friendship.findOne({
      $or: [
        {
          requester: currentUserId,
          receiver: receiverId
        },
        {
          requester: receiverId,
          receiver: currentUserId
        }
      ]
    });

    if (existingFriendship) {

      if (existingFriendship.status === "PENDING") {
        return res.status(409).json({
          message: "Friend request already exists"
        });
      }

      if (existingFriendship.status === "ACCEPTED") {
        return res.status(409).json({
          message: "You are already friends"
        });
      }
      if (existingFriendship.status === "REJECTED") {

        existingFriendship.requester = currentUserId;
        existingFriendship.receiver = receiverId;
        existingFriendship.status = "PENDING";

        await existingFriendship.save();

        const notification = await createNotification({
          userId: receiverId,
          senderId: currentUserId,
          type: "FRIEND_REQUEST",
          title: "Friend request",
          message: "You received a new friend request",
          relatedId: existingFriendship._id
        });

        const io = req.app.get("io");

        if (io) {
          io.to(`user:${receiverId}`).emit(
            "newNotification",
            notification
          );
        }

        return res.status(200).json({
          message: "Friend request sent again",
          friendship: existingFriendship
        });
      }
    }

    const friendship = await Friendship.create({
      requester: currentUserId,
      receiver: receiverId,
      status: "PENDING"
    });
    const notification = await createNotification({
      userId: receiverId,
      senderId: currentUserId,
      type: "FRIEND_REQUEST",
      title: "Friend request",
      message: "You received a new friend request",
      relatedId: friendship._id
    });

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${receiverId}`).emit(
        "newNotification",
        notification
      );
    }

    return res.status(201).json({
      message: "Friend request sent",
      friendship
    });

  } catch (error) {
    next(error);
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const { friendshipId } = req.params;

    const friendship = await Friendship.findOne({
      _id: friendshipId,
      status: "PENDING"
    });

    if (!friendship) {
      return res.status(404).json({
        message: "Friend request not found"
      });
    }

    friendship.status = "ACCEPTED";

    await friendship.save();

    return res.status(200).json({
      message: "Friend request accepted",
      friendship
    });

  } catch (error) {
    next(error);
  }
};

const rejectFriendRequest = async (req, res, next) => {
  try {

    const { friendshipId } = req.params;

    const friendship = await Friendship.findOne({
      _id: friendshipId,
      status: "PENDING"
    });

    if (!friendship) {
      return res.status(404).json({
        message: "Friend request not found"
      });
    }

    friendship.status = "REJECTED";

    await friendship.save();

    return res.status(200).json({
      message: "Friend request rejected",
      friendship
    });

  } catch (error) {
    next(error);
  }
};

const getFriends = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: "ACCEPTED" },
        { receiver: userId, status: "ACCEPTED" }
      ]
    })
      .populate("requester", "username useremail")
      .populate("receiver", "username useremail");

    const friends = friendships.map((friendship) => {
      if (friendship.requester._id.toString() === userId) {
        return friendship.receiver;
      }

      return friendship.requester;
    });

    return res.status(200).json({
      friends
    });

  } catch (error) {
    next(error);
  }
};

const getFriendRequests = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const requests = await Friendship.find({
      receiver: userId,
      status: "PENDING"
    })
      .populate("requester", "username useremail");

    return res.status(200).json({
      requests
    });

  } catch (error) {
    next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const { userId, friendId } = req.body;

    const friendship = await Friendship.findOne({
      $or: [
        {
          requester: userId,
          receiver: friendId,
          status: "ACCEPTED"
        },
        {
          requester: friendId,
          receiver: userId,
          status: "ACCEPTED"
        }
      ]
    });

    if (!friendship) {
      return res.status(404).json({
        message: "Friendship not found"
      });
    }

    await Friendship.findByIdAndDelete(friendship._id);

    return res.status(200).json({
      message: "Friend removed successfully"
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend
};