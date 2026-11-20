const ExpenseSchema = require('../models/Schemas/Expenses');
const {
    MAX_EXPENSE_AMOUNT,
    MAX_EXPENSE_DESCRIPTION_LENGTH,
} = require('../config/expenseLimits');

async function updateExpense(req, res, next) {
    try {
        const expenseId = req.params.id;
        const userId = req.session.userId;
        const updateData = req.body;

        // Find the expense
        const expense = await ExpenseSchema.findById(expenseId);
        
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        // Check if current user is the payer (only payer can edit)
        if (String(expense.payer) !== String(userId)) {
            return res.status(403).json({ error: 'Only the payer can edit this expense' });
        }

        // Build update object with only provided fields
        const updates = {};
        
        if (updateData.amount !== undefined) {
            const amount = Number(updateData.amount);
            if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_EXPENSE_AMOUNT) {
                return res.status(400).json({ error: 'Expense amount must be greater than 0 and no more than 100,000 MAD.' });
            }
            updates.amount = amount;
        }
        if (updateData.description !== undefined) {
            if (
                typeof updateData.description !== 'string' ||
                updateData.description.trim().length > MAX_EXPENSE_DESCRIPTION_LENGTH
            ) {
                return res.status(400).json({ error: 'Expense description must be text with no more than 140 characters.' });
            }
            updates.description = updateData.description;
        }
        if (updateData.date !== undefined) {
            updates.date = updateData.date;
        }
        if (updateData.splitMethod !== undefined) {
            updates.splitMethod = updateData.splitMethod;
        }
        if (updateData.participants !== undefined) {
            updates.participants = updateData.participants;
        }
        if (updateData.customSplit !== undefined) {
            updates.customSplit = updateData.customSplit;
        }

        // Update the expense
        const updatedExpense = await ExpenseSchema.findByIdAndUpdate(
            expenseId,
            updates,
            { new: true, runValidators: true }
        );

        res.json(updatedExpense);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
}

module.exports = updateExpense;