const mongoose = require("mongoose");

const groupMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member"
    },

    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    kind: {
      type:String,
      required: true,
      default: "other",
    },
    emoji: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: {
      type: [groupMemberSchema],
      default: []
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    expenses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: `ExpenseSchema`,
    }],

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Group", groupSchema);