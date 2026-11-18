const express = require('express');
const auth = require('../../middleware/requireAuth');
const datasource = require('../../services/ai/dataSource');
const RagEngine = require('../../services/ai/ragEngine');

const router = express.Router();
const engines = new Map();

const userLimits = new Map();
const WINDOW = 60 * 1000;
const MAX = 10;

setInterval(() => {
    const now = Date.now();
    for (const [id, data] of userLimits.entries()) {
        if (now - data.start > WINDOW) userLimits.delete(id);
    }
}, 300000);

function checkLimit(userId) {
    const now = Date.now();
    let data = userLimits.get(userId);

    if (!data || (now - data.start) > WINDOW) {
        userLimits.set(userId, { start: now, count: 1 });
        return { allowed: true };
    }

    if (data.count >= MAX) {
        return { allowed: false, retry: Math.ceil((data.start + WINDOW - now) / 1000) };
    }

    data.count++;
    return { allowed: true };
}

router.post('/chat/group/:groupId/stream', auth, async (req, res) => {
    const question = req.body?.question?.trim();
    const groupId = req.params.groupId;
    const userId = req.session.userId;

    if (!question) return res.status(400).json({ error: 'Question required' });
    if (question.length > 2000) return res.status(400).json({ error: 'Question too long' });

    const limit = checkLimit(userId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event, data) => {
        if (!res.writableEnded) {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
    };

    if (!limit.allowed) {
        send('error', { 
            message: `Rate limit exceeded. Please wait ${limit.retry} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED'
        });
        return res.end();
    }

    const controller = new AbortController();
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });

    try {
        const key = `${groupId}:${userId}`;
        let rag = engines.get(key);

        if (!rag) {
            rag = new RagEngine(
                process.env.GROQ_API_KEY,
                process.env.EMBEDDINGS_API_KEY,
                process.env.EMBEDDINGS_BASE_URL,
                process.env.EMBEDDINGS_MODEL,
                process.env.EMBEDDINGS_PATH
            );
            engines.set(key, rag);
        }

        const success = await rag.ensure(groupId, () => datasource.loadGroupDocuments(userId, groupId));
        if (!success) {
            send('error', { message: 'Unable to load group.' });
            return res.end();
        }

        const result = await rag.ask(question, (token) => send('token', { text: token }), controller.signal);

        send('sources', { sources: result.sources });
        send('done', {});
        res.end();

    } catch (error) {
        console.log('[ai-chat] Error:', error.message);
        
        if (!res.writableEnded && error.message !== 'Aborted') {
            let msg = 'An error occurred.';
            if (error.message.includes('429') || error.message.includes('All models failed')) {
                msg = 'Server is busy (rate limit reached). Please try again in a minute.';
            } else if (error.message.includes('Timeout')) {
                msg = 'Request timed out. Please try again.';
            }
            send('error', { message: msg });
            res.end();
        }
    }
});

module.exports = router;