const mongoose = require('mongoose');
const {
    MAX_EXPENSE_AMOUNT,
    MAX_EXPENSE_DESCRIPTION_LENGTH,
} = require('../../config/expenseLimits');

const ExpenseSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `Group`,
        required: true,
    },
    payer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `User`,
        required: true,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: `User`,
    }], 
    amount: {
        type: Number,
        required: true,
        max: [MAX_EXPENSE_AMOUNT, 'Expense amount cannot exceed 100,000 MAD.'],
    },
    description: {
        type: String,
        default: ``,
        trim: true,
        maxlength: [MAX_EXPENSE_DESCRIPTION_LENGTH, 'Expense description cannot exceed 140 characters.'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    splitMethod: {
        type: String,
        enum: ["equal", "custom"],
        default: "equal",
    },
    customSplit: [{
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        amount: {
            type: Number,
            required: true,
        },
    }],
});

const Expense = mongoose.model(`Expense`, ExpenseSchema, 'expenses');
module.exports = Expense;