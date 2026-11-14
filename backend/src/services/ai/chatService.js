const datasource = require('./dataSource');
const RagEngine = require('./ragEngine');
const ChatHistory = require('./ChatHistory');

// كاش بسيط: key = userId:groupId
const ragCache = new Map();

async function loadHistory(userId, groupId, limit) {
    try {
        const chat = await ChatHistory.findOne({ userId, groupId }).lean();
        if (chat && Array.isArray(chat.messages)) {
            return chat.messages.slice(-(limit || 6));
        }
    } catch (err) {
        console.log('[chat] history error:', err.message);
    }
    return [];
}

async function saveHistory(userId, groupId, question, answer) {
    if (!answer) return;
    try {
        await ChatHistory.findOneAndUpdate(
            { userId, groupId },
            {
                $push: {
                    messages: {
                        $each: [
                            { role: 'user', content: question },
                            { role: 'assistant', content: answer }
                        ],
                        $slice: -20
                    }
                }
            },
            { upsert: true }
        );
    } catch (err) {
        console.log('[chat] history save error:', err.message);
    }
}

async function getOrCreateRag(userId, groupId, docs) {
    const key = userId.toString() + ':' + groupId.toString();

    let rag = ragCache.get(key);

    if (!rag) {
        rag = new RagEngine(
            process.env.GROQ_API_KEY,
            process.env.EMBEDDINGS_API_KEY,
            process.env.EMBEDDINGS_BASE_URL,
            process.env.EMBEDDINGS_MODEL,
            process.env.EMBEDDINGS_PATH
        );
        await rag.ingest(docs);
        ragCache.set(key, rag);
        console.log('[chat] RAG CACHED');
    } else {
        console.log('[chat] RAG MEMORY HIT');
    }

    return rag;
}

async function prepare(userId, groupId) {
    const result = await datasource.loadGroupDocuments(userId, groupId);
    if (!result) return null;

    const rag = await getOrCreateRag(userId, groupId, result.docs);
    const history = await loadHistory(userId, groupId, 6);

    return { rag, history };
}

module.exports = {
    prepare,
    saveHistory
};