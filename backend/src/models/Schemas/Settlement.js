const Mongoose = require(`mongoose`);
const User = require(`./User`);
const Group = require(`./Group`);

const SettlementSchema = new Mongoose.Schema({
    group: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: `Group`,
        required: true,
    }, 
    fromUser: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: `User`,
        required: true,
    },
    toUser: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: `User`,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const Settlement = Mongoose.model(`Settlement`, SettlementSchema);

module.exports = Settlement;