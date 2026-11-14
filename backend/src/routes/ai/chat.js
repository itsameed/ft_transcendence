const express = require('express');
const auth = require('../../middleware/requireAuth');
<<<<<<< Updated upstream
const datasource = require('../../services/ai/dataSource');
const contextbuilder = require('../../services/ai/contextBuilder');
const ragengine = require('../../services/ai/ragEngine');

const router = express.Router();

router.post('/chat/group/:groupId/stream', auth, async function (req, res)
{
    const question = (req.body.question || '').trim();
    const groupid = req.params.groupId;

    if (!question)
    {
        return res.status(400).json({ error: 'Question required' });
    }

    if (!groupid)
    {
        return res.status(400).json({ error: 'Group ID required' });
    }

=======
const chatService = require('../../services/ai/chatService');
const ChatHistory = require('../../services/ai/ChatHistory');

const router = express.Router();

const chatlimiter = ratelimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a minute.' }
});

router.post('/chat/group/:groupId/stream', chatlimiter, auth, async function (req, res) {
    const groupId = req.params.groupId;
    const userId = req.session && req.session.userId;

    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    if (!groupId) return res.status(400).json({ error: 'Group ID required' });

    if (req.body && req.body.history === true) {
        try {
            const chat = await ChatHistory.findOne({ userId, groupId }).lean();
            let messages = [];

            if (chat && Array.isArray(chat.messages)) {
                messages = chat.messages.map(function (m, i) {
                    return { id: 'hist-' + i, role: m.role, content: m.content };
                });
            }

            return res.json({ messages });
        } catch (err) {
            console.log('[ai-chat/history] error:', err.message);
            return res.status(500).json({ error: 'Failed to load history' });
        }
    }

    let question = '';

    if (req.body && typeof req.body.question === 'string') {
        question = req.body.question.trim();
    }

    if (!question) return res.status(400).json({ error: 'Question required' });
    if (question.length > 2000) return res.status(400).json({ error: 'Question too long' });

>>>>>>> Stashed changes
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

<<<<<<< Updated upstream
    function send(name, data)
    {
=======
    const abortController = new AbortController();
    let cancelled = false;

    res.on('close', function () {
        if (!res.writableEnded) {
            cancelled = true;
            abortController.abort();
        }
    });

    function send(name, data) {
        if (cancelled || res.writableEnded || res.destroyed) return;

>>>>>>> Stashed changes
        res.write('event: ' + name + '\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    }

<<<<<<< Updated upstream
    try
    {
        const userid = req.session.userId;

        const usercontext = await datasource.loadUserContext(userid, groupid);

        if (!usercontext)
        {
            send('token', { text: 'Unable to load your information.' });
=======
    try {
        const ctx = await chatService.prepare(userId, groupId);
        if (cancelled) return;

        if (!ctx) {
            send('error', { message: 'Unable to load this group or you do not have access.' });
>>>>>>> Stashed changes
            send('done', {});
            return res.end();
        }

<<<<<<< Updated upstream
        const result = await datasource.loadGroupDocuments(userid, groupid);

        if (!result)
        {
            send('token', { text: 'You do not have permission to access this group.' });
            send('done', {});
            return res.end();
        }

        const userdocs = contextbuilder.buildUserDocs(usercontext);
        const alldocs = userdocs.concat(result.docs);

        const rag = new ragengine(
            process.env.GROQ_API_KEY,
            process.env.EMBEDDINGS_API_KEY,
            process.env.EMBEDDINGS_BASE_URL,
            process.env.EMBEDDINGS_MODEL,
            process.env.EMBEDDINGS_PATH
        );

        const enrichedquestion = contextbuilder.buildEnrichedQuestion(usercontext, question);

        await rag.ingest(alldocs);

        const ragresult = await rag.ask(enrichedquestion, function (token)
        {
            send('token', { text: token });
        });

        send('sources', { sources: ragresult.sources });
=======
        const ragResult = await ctx.rag.ask(
            question,
            function (token) {
                send('token', { text: token });
            },
            abortController.signal,
            ctx.history
        );

        if (cancelled) return;

        await chatService.saveHistory(userId, groupId, question, ragResult.answer);

        send('sources', { sources: ragResult.sources });
>>>>>>> Stashed changes
        send('done', {});
        res.end();
    }
    catch (error)
    {
        console.log('[ai-chat/group] error:', error.message);
<<<<<<< Updated upstream
        send('error', { message: 'An error occurred.' });
        res.end();
=======

        if (!cancelled) {
            send('error', { message: 'An error occurred.' });
            send('done', {});
        }

        if (!res.writableEnded) res.end();
>>>>>>> Stashed changes
    }
});

module.exports = router;
