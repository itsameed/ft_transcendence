const Mongoose = require(`mongoose`);
const User = require(`./User`);
const ExpenseSchema = require(`./Expenses`);

const GroupSchema = new Mongoose.Schema({
    owner: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    groupName: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, 'Group name must be at least 2 characters'],
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    expenses: [{
        type: Mongoose.Schema.Types.ObjectId,
        ref: `ExpenseSchema`,
    }],
    members: [{
        type: Mongoose.Schema.Types.ObjectId,
        ref: `User`
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});


module.exports = Mongoose.model(`GroupSchema`, GroupSchema);