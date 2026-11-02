const express = require('express');
const auth = require('../../middleware/requireAuth');
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

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    function send(name, data)
    {
        res.write('event: ' + name + '\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    }

    try
    {
        const userid = req.session.userId;

        const usercontext = await datasource.loadUserContext(userid, groupid);

        if (!usercontext)
        {
            send('token', { text: 'Unable to load your information.' });
            send('done', {});
            return res.end();
        }

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
        send('done', {});
        res.end();
    }
    catch (error)
    {
        console.log('[ai-chat/group] error:', error.message);
        send('error', { message: 'An error occurred.' });
        res.end();
    }
});

module.exports = router;
