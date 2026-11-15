const mongoose = require("mongoose");
const Group = require("../models/Schemas/Group");
const Expense = require("../models/Schemas/Expenses.js");

/**
 * GET /api/groups/:groupId/expenses
 * JSON list for the SPA group page (distinct from the legacy EJS
 * getGroupExpenses, which renders a view with a hardcoded group id).
 * Shape mirrors what the frontend maps: id, title/description, amount,
 * payer, date, plus shares so clients can compute per-person balances.
 */
async function getGroupExpensesList(req, res, next) {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await Group.findById(groupId).select("members");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    const isMember = (group.members ?? []).some(
      (m) => String(m.userId?._id ?? m.userId) === String(currentUserId)
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate("payer", "username email")
      .sort({ date: -1, createdAt: -1 });

    const rows = expenses.map((e) => {
      const participants = (e.participants ?? []).map(String);
      let shares = null;
      let myShare = null;
      if (e.splitMethod === "custom" && Array.isArray(e.customSplit) && e.customSplit.length) {
        shares = e.customSplit.map((s) => ({
          userId: String(s.user?._id ?? s.user),
          amount: Number(s.amount ?? 0),
        }));
        myShare = shares.find((s) => s.userId === String(currentUserId))?.amount ?? null;
      } else if (participants.length) {
        const each = Math.round((Number(e.amount) / participants.length) * 100) / 100;
        shares = participants.map((userId) => ({ userId, amount: each }));
        myShare = participants.includes(String(currentUserId)) ? each : null;
      }
      return {
        _id: e._id,
        id: e._id,
        title: e.description ?? "",
        description: e.description ?? "",
        amount: Number(e.amount ?? 0),
        category: e.category ?? "other",
        payer: e.payer
          ? { _id: e.payer._id, username: e.payer.username, email: e.payer.email }
          : null,
        paidBy: e.payer?._id ?? null,
        participants,
        shares,
        myShare,
        splitMethod: e.splitMethod,
        date: e.date,
        createdAt: e.date,
      };
    });

    return res.json({ expenses: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = getGroupExpensesList;
