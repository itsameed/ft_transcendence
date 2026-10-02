const Mongoose = require(`mongoose`);
const User = require(`./User`);
const Group = require(`./Group`);


const ExpenseSchema = new Mongoose.Schema({
    group: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: `Group`,
        required: true,
    },
    payer: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: `User`,
        required: true,
    },
    participants: [{
        type: Mongoose.Schema.Types.ObjectId,
        ref: `User`,
    }], 
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        default: ``,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    splitMethod: {
        type: String,
        enum: ["equal", "custom", "percentage"],
        default: "equal",
    },
});


const Expense = new Mongoose.model(`Expense`, ExpenseSchema);
module.exports = Expense;