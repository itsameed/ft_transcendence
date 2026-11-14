const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        }
    }]
}, { timestamps: true });


chatHistorySchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);