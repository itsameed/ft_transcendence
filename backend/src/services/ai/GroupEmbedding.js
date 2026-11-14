const mongoose = require('mongoose');

const groupEmbeddingSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        index: true
    },
    // بصمة الـ data (باش نعرفو واش تبدّلت)
    fingerprint: {
        type: String,
        required: true
    },
    // الـ chunks النصية
    chunks: [{
        type: String
    }],
    // الـ vectors (كل vector هو array من أرقام)
    vectors: [{
        type: [Number]
    }],
    // عدد الـ docs الأصلية (للتشخيص)
    docCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('GroupEmbedding', groupEmbeddingSchema);