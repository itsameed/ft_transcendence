const express = require('express');
const ratelimit = require('express-rate-limit');
const auth = require('../../middleware/requireAuth');
const datasource = require('../../services/ai/dataSource');
const RagEngine = require('../../services/ai/ragEngine');

const router = express.Router();
const engines = new Map();

const chatlimiter = ratelimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a minute.' }
});

router.post('/chat/group/:groupId/stream', chatlimiter, auth, async function (req, res) {
    const question = req.body?.question?.trim();
    const groupId = req.params.groupId;

    if (!question) {
        return res.status(400).json({ error: 'Question required' });
    }

    if (question.length > 2000) {
        return res.status(400).json({ error: 'Question too long' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const controller = new AbortController();
    let cancelled = false;

    res.on('close', function () {
        if (!res.writableEnded) {
            cancelled = true;
            controller.abort();
        }
    });

    function send(name, data) {
        if (!cancelled && !res.writableEnded) {
            res.write('event: ' + name + '\n');
            res.write('data: ' + JSON.stringify(data) + '\n\n');
        }
    }

    try {
        const userId = req.session.userId;
        const key = groupId + ':' + userId;

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

        const success = await rag.ensure(groupId, function () {
            return datasource.loadGroupDocuments(userId, groupId);
        });

        if (!success) {
            send('error', { message: 'Unable to load group.' });
            return res.end();
        }

        const result = await rag.ask(
            question,
            function (token) {
                send('token', { text: token });
            },
            controller.signal
        );

        send('sources', { sources: result.sources });
        send('done', {});
        res.end();

    } catch (error) {
        console.log('[ai-chat/group]', error.message);
        if (!res.writableEnded) {
            send('error', { message: 'An error occurred.' });
            res.end();
        }
    }
});

module.exports = router;