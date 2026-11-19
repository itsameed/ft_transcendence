const Expense = require('../models/Schemas/Expenses.js');
const {
    MAX_EXPENSE_AMOUNT,
    MAX_EXPENSE_DESCRIPTION_LENGTH,
} = require('../config/expenseLimits');
const printLogsDate = require('./printLogs.js');
const Group = require('../models/Schemas/Group.js');
const { createNotification } = require("./notificationService");

async function createExpense(req, res, next) {
    const {
        groupId,
        amount,
        description,
        splitMethod,
        paidBy,
        payer
    } = req.body;

    if (!groupId || !amount || !splitMethod) {
        return res.status(400).json({
            message: 'Invalid expense details.'
        });
    }
    if (description !== undefined && (
        typeof description !== 'string' ||
        description.trim().length > MAX_EXPENSE_DESCRIPTION_LENGTH
    )) {
        return res.status(400).json({
            message: 'Expense description must be text with no more than 140 characters.'
        });
    }

    const expenseAmount = Number(amount);
    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0 || expenseAmount > MAX_EXPENSE_AMOUNT) {
        return res.status(400).json({ message: 'Expense amount must be greater than 0 and no more than 100,000 MAD.' });
    }

    let participants;
    let customSplit;

    try {
        participants = JSON.parse(req.body.participants || '[]');
        customSplit = JSON.parse(req.body.customSplits || '[]');
    } catch (error) {
        return res.status(400).json({
            message: 'Invalid participant data.'
        });
    }

    if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({
            message: 'At least one participant is required.'
        });
    }

    const payerId = paidBy || payer || req.session.userId;
    const senderId = req.session.userId;

    try {
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Group not found.'
            });
        }

        const expense = await Expense.create({
            group: groupId,
            payer: payerId,
            participants,
            amount: expenseAmount,
            description,
            splitMethod,
            customSplit,
        });

        const io = req.app.get("io");

        for (const member of group.members) {
            const receiverId = member.userId.toString();

            if (receiverId === senderId.toString()) {
                continue;
            }

            const notification = await createNotification({
                userId: receiverId,
                senderId,
                type: "EXPENSE_ADDED",
                title: "New expense",
                message: `A new expense "${description}" of ${amount} was added to group "${group.name}"`,
                relatedId: expense._id
            });

            if (io) {
                io.to(`user:${receiverId}`).emit(
                    "newNotification",
                    notification
                );
            }
        }

        printLogsDate(
            `User with Id ${senderId} created an expense at : `
        );

        return res.json({
            message: 'Expense created successfully.',
            expense
        });

    } catch (error) {
        console.error(
            'Error while attempting to save the expense:',
            error
        );

        return res.status(500).json({
            message: 'Unable to save the expense.'
        });
    }
}

module.exports = createExpense;