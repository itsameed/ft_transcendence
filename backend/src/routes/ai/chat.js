const express = require('express');
const Auth = require('../../middleware/requireAuth');         
const dataSource = require('../../services/ai/dataSource');
const contextBuilder = require('../../services/ai/contextBuilder');
const ragEngine = require('../../services/ai/ragEngine');

const router = express.Router();

// router.post: كننشؤوا Route كتستقبل HTTP POST.
// /chat/group/:groupId/stream: المسار ديال الطلب.
// Auth: Middleware كيتنفذ قبل الوصول للـ Handler.
// - async function: دالة كتقدر تستعمل await باش تتعامل مع العمليات غير المتزامنة.
router.post('/chat/group/:groupId/stream', Auth, async function (req, res) {
  const question = (req.body.question || '').trim();
  const groupId = req.params.groupId;

  if (!question) {
    return res.status(400).json({ error: 'Question required' });
  }

  if (!groupId) {
    return res.status(400).json({ error: 'Group ID required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function send(name, data) {
    res.write('event: ' + name + '\n');
    res.write('data: ' + JSON.stringify(data) + '\n\n');
  }

  try {
    const userId = req.session.userId;

    const userContext = await dataSource.loadUserContext(userId, groupId);
    if (!userContext) {
      send('token', { text: 'تعذر تحميل معلوماتك.' });
      send('done', {});
      return res.end();
    }

    const result = await dataSource.loadGroupDocuments(userId, groupId);
    if (!result) {
      send('token', { text: 'لا تملك صلاحية الوصول لهذه المجموعة.' });
      send('done', {});
      return res.end();
    }

    const userDocs = contextBuilder.buildUserDocs(userContext);

    const allDocs = userDocs.concat(result.docs);

    const rag = new ragEngine(
      process.env.GROQ_API_KEY,
      process.env.EMBEDDINGS_API_KEY,
      process.env.EMBEDDINGS_BASE_URL,
      process.env.EMBEDDINGS_MODEL,
      process.env.EMBEDDINGS_PATH
    );

    const enrichedQuestion = contextBuilder.buildEnrichedQuestion(userContext, question);

    await rag.ingest(allDocs);

    const ragResult = await rag.ask(enrichedQuestion, function (token) {
      send('token', { text: token });
    });

    send('sources', { sources: ragResult.sources });
    send('done', {});
    res.end();
  } catch (error) {
    console.log('[ai-chat/group] error:', error.message);
    send('error', { message: 'حدث خطأ.' });
    res.end();
  }
});

module.exports = router;

