const ExpenseSchema = require('../models/Schemas/Expenses');

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
            updates.amount = updateData.amount;
        }
        if (updateData.description !== undefined) {
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