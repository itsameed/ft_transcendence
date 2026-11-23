
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const auth = require('../../middleware/requireAuth');
const datasource = require('../../services/ai/dataSource');
const RagEngine = require('../../services/ai/ragEngine');

const router = express.Router();

const chatlimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a minute.' },
    keyGenerator: function (req) 
    {
        if (req.session && req.session.userId) 
        {
            return req.session.userId;
        }

        return ipKeyGenerator(req.ip);
    }
});

router.post('/chat/group/:groupId/stream', auth, chatlimiter, async function (req, res) 
{
    const question = req.body?.question?.trim();
    const groupId = req.params.groupId;
    const userId = req.session.userId;

    if (!question) 
        return res.status(400).json({ error: 'Question required' });

    if (question.length > 2000) 
        return res.status(400).json({ error: 'Question too long' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    function send(event, data) 
    {
        if (!res.writableEnded) 
        {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
    }

    try 
    {
        const rag = new RagEngine(
            process.env.GROQ_API_KEY,
            process.env.EMBEDDINGS_API_KEY,
            process.env.EMBEDDINGS_BASE_URL,
            process.env.EMBEDDINGS_MODEL,
            process.env.EMBEDDINGS_PATH
        );

        const success = await rag.ensure(groupId, function () {return datasource.loadGroupDocuments(userId, groupId);});

        if (!success) 
        {
            send('error', { message: 'Unable to load group.' });
            return res.end();
        }

        const result = await rag.ask(question, function (token) {send('token', { text: token });});

        send('sources', { sources: result.sources });
        send('done', {});
        res.end();
    } 
    catch (error) 
    {
        console.error('[ai-chat] Error:', error.message);

        if (!res.writableEnded && error.message !== 'Aborted') 
        {
            let msg = 'An error occurred.';

            if (error.message.includes('429') || error.message.includes('All models failed')) 
                msg = 'Server is busy (rate limit reached). Please try again in a minute.';
            else if (error.message.includes('Timeout')) 
                msg = 'Request timed out. Please try again.';

            send('error', { message: msg });
            res.end();
        }
    }
});

module.exports = router;
