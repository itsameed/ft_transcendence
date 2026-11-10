const express = require('express');
const ratelimit = require('express-rate-limit');
const auth = require('../../middleware/requireAuth');
const datasource = require('../../services/ai/dataSource');
const ragengine = require('../../services/ai/ragEngine');

const router = express.Router();

const chatlimiter = ratelimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a minute.' }
});

router.post('/chat/group/:groupId/stream', chatlimiter, auth, async function (req, res) {
    let question = '';
    const groupId = req.params.groupId;

    if (req.body && typeof req.body.question === 'string') {
        question = req.body.question.trim();
    }

    if (!question) {
        return res.status(400).json({ error: 'Question required' });
    }

    if (!groupId) {
        return res.status(400).json({ error: 'Group ID required' });
    }

    if (question.length > 2000) {
        return res.status(400).json({ error: 'Question too long' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const abortController = new AbortController();
    let cancelled = false;

    res.on('close', function () {
        if (!res.writableEnded) {
            cancelled = true;
            abortController.abort();
        }
    });

    function send(name, data) {
        if (cancelled) {
            return;
        }
        res.write('event: ' + name + '\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    }

    try {
        const userId = req.session.userId;

        const result = await datasource.loadGroupDocuments(userId, groupId);

        if (!result) {
            send('token', { text: 'Unable to load this group or you do not have access.' });
            send('done', {});
            return res.end();
        }

        const rag = new ragengine(
            process.env.GROQ_API_KEY,
            process.env.EMBEDDINGS_API_KEY,
            process.env.EMBEDDINGS_BASE_URL,
            process.env.EMBEDDINGS_MODEL,
            process.env.EMBEDDINGS_PATH
        );

        await rag.ingest(result.docs);

        const ragResult = await rag.ask(
            question,
            function (token) {
                if (cancelled) {
                    return;
                }
                send('token', { text: token });
            },
            abortController.signal
        );

        send('sources', { sources: ragResult.sources });
        send('done', {});
        res.end();
    } catch (error) {
        console.log('[ai-chat/group] error:', error.message);

        if (!cancelled) {
            send('error', { message: 'An error occurred.' });
        }

        if (!res.writableEnded) {
            res.end();
        }
    }
});

module.exports = router;