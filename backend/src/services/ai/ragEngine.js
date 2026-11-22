
const Chunker = require('./chunker');
const Retriever = require('./retriever');
const PromptBuilder = require('./promptBuilder');
const LlmClient = require('./llmClient');
const EmbeddingsClient = require('./embeddingsClient');
const CacheManager = require('./cacheManager');

class RagEngine 
{
    constructor(llmKey, embKey, embUrl, embModel, embPath) 
    {
        this.chunker = new Chunker(200, 50);
        this.prompt = new PromptBuilder();
        this.llm = new LlmClient(llmKey);
        this.embed = new EmbeddingsClient(embKey, embModel, embUrl, embPath);

        this.chunks = [];
        this.retriever = null;
        this.semantic = false;
        this.currentUser = "";
    }

    async ensure(groupId, loaderFn) 
    {
        const result = await loaderFn();

        if (!result || !Array.isArray(result.docs))
            return false;

        this.currentUser = "";

        for (const doc of result.docs) 
        {
            if (doc.id && doc.id.startsWith('user:')) 
            {
                this.currentUser = doc.text;
                break;
            }
        }

        const oldChunks = CacheManager.readCache(CacheManager.getCachePath(groupId, 'chunks'));
        const oldVectors = CacheManager.readCache(CacheManager.getCachePath(groupId, 'vectors'));

        const chunks = {};
        const vectors = {};

        for (const doc of result.docs) 
        {
            if (!doc.id || typeof doc.text !== 'string')
                continue;

            if (doc.id.startsWith('user:'))
                continue;

            const currentHash = doc.hash || CacheManager.hash(doc.text);
            const old = oldChunks[doc.id];

            if (old && old.hash === currentHash) 
            {
                chunks[doc.id] = old;

                if (oldVectors[doc.id])
                    vectors[doc.id] = oldVectors[doc.id];
                else
                    vectors[doc.id] = { vectors: [] };
            } 
            else 
            {
                const parts = this.chunker.split(doc.text);
                const clean = [];

                for (const part of parts) 
                {
                    if (part.length > 0)
                        clean.push(part);
                }

                let embedded = [];

                if (this.embed.isenabled() && clean.length > 0) 
                {
                    try 
                    {
                        const embResult = await this.embed.embedbatch(clean);

                        if (Array.isArray(embResult) && embResult.length === clean.length)
                            embedded = embResult;
                    } 
                    catch (e) 
                    {
                        console.error('[ragEngine] embedding:', e.message);
                    }
                }

                chunks[doc.id] = { hash: currentHash, chunks: clean };
                vectors[doc.id] = { vectors: embedded };
            }
        }

        const allChunks = [];
        const allVectors = [];

        for (const id in chunks) 
        {
            const docChunks = chunks[id];
            const docVectors = vectors[id] || { vectors: [] };

            for (let i = 0; i < docChunks.chunks.length; i++) 
            {
                allChunks.push(docChunks.chunks[i]);

                if (docVectors.vectors[i] !== undefined)
                    allVectors.push(docVectors.vectors[i]);
                else
                    allVectors.push(null);
            }
        }

        this.chunks = allChunks;

        const retChunks = [];
        const retVectors = [];

        for (let i = 0; i < allChunks.length; i++) 
        {
            if (allVectors[i] !== null) 
            {
                retChunks.push(allChunks[i]);
                retVectors.push(allVectors[i]);
            }
        }

        this.semantic = retVectors.length > 0;
        this.retriever = new Retriever({ chunks: retChunks, vectors: retVectors });

        CacheManager.writeCache(CacheManager.getCachePath(groupId, 'chunks'), chunks);
        CacheManager.writeCache(CacheManager.getCachePath(groupId, 'vectors'), vectors);

        return true;
    }

    async ask(question, onToken) 
    {
        if (!this.retriever)
            throw new Error('ensure() must be called before ask().');

        let queryVector = null;

        if (this.semantic) 
        {
            try 
            {
                queryVector = await this.embed.embed(question);
            } 
            catch (e) {}
        }

        let docs = this.retriever.retrieve(queryVector, 15);

        if (!docs)
            docs = [];

        if (docs.length === 0) 
        {
            for (let i = 0; i < this.chunks.length && i < 15; i++)
                docs.push({ text: this.chunks[i] });
        }

        docs = docs.filter(function (d) 
        {
            return d && typeof d.text === 'string' && d.text.length > 0;
        });

        const prompt = this.prompt.build(question, docs, this.currentUser);

        let tokenCallback = onToken;

        if (!tokenCallback)
            tokenCallback = function () {};

        const answer = await this.llm.generatestream(prompt, tokenCallback);

        return { answer: answer, sources: docs };
    }
}

module.exports = RagEngine;
