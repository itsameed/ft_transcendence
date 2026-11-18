
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const Chunker = require('./chunker');
const Retriever = require('./retriever');
const PromptBuilder = require('./promptBuilder');
const LlmClient = require('./llmClient');
const EmbeddingsClient = require('./embeddingsClient');

const cache_dir = path.join(__dirname, 'cache');

function hash(text)
{
    return crypto.createHash('sha256').update(text).digest('hex');
}

function cache_file(group_id, type)
{
    const key = hash(String(group_id));
    return path.join(cache_dir, key + '_' + type + '.json');
}

function read_cache(file)
{
    try
    {
        if (fs.existsSync(file))
        {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    }
    catch (e) {}

    return {};
}

function write_cache(file, data)
{
    if (!fs.existsSync(cache_dir))
    {
        fs.mkdirSync(cache_dir, { recursive: true });
    }

    const temp = file + '.tmp';

    fs.writeFileSync(temp, JSON.stringify(data), 'utf8');
    fs.renameSync(temp, file);
}

class RagEngine
{
    constructor(llm_key, emb_key, emb_url, emb_model, emb_path)
    {
        this.chunker = new Chunker(200, 50);
        this.prompt = new PromptBuilder();
        this.llm = new LlmClient(llm_key);
        this.embed = new EmbeddingsClient(emb_key, emb_model, emb_url, emb_path);

        this.chunks = [];
        this.retriever = null;
        this.semantic = false;
        this.user_context = '';
    }

    async ensure(group_id, loader)
    {
        const result = await loader();

        if (!result || !Array.isArray(result.docs))
        {
            return false;
        }

        this.user_context = '';

        const old_chunks = read_cache(cache_file(group_id, 'chunks'));
        const old_vectors = read_cache(cache_file(group_id, 'vectors'));

        const chunks = {};
        const vectors = {};
        const all_chunks = [];
        const all_vectors = [];

        let vector_count = 0;

        for (const doc of result.docs)
        {
            if (!doc.id || typeof doc.text !== 'string')
            {
                continue;
            }

            if (doc.id.startsWith('user:'))
            {
                this.user_context = doc.text;
                continue;
            }

            const doc_hash = doc.hash || hash(doc.text);
            const old = old_chunks[doc.id];

            if (old && old.hash === doc_hash)
            {
                chunks[doc.id] = old;

                if (old_vectors[doc.id])
                {
                    vectors[doc.id] = old_vectors[doc.id];
                }
                else
                {
                    vectors[doc.id] = { vectors: [] };
                }
            }
            else
            {
                const parts = this.chunker.split(doc.text);
                const clean = [];

                for (const part of parts)
                {
                    if (part.length > 0)
                    {
                        clean.push(part);
                    }
                }

                let embedded = [];

                if (this.embed.isenabled() && clean.length > 0)
                {
                    try
                    {
                        const result = await this.embed.embedbatch(clean);

                        if (Array.isArray(result) && result.length === clean.length)
                        {
                            embedded = result;
                        }
                    }
                    catch (e)
                    {
                        console.error('[ragEngine] embedding:', e.message);
                    }
                }

                chunks[doc.id] = {
                    hash: doc_hash,
                    chunks: clean
                };

                vectors[doc.id] = { vectors: embedded };
            }

            const doc_chunks = chunks[doc.id];
            const doc_vectors = vectors[doc.id];

            for (let i = 0; i < doc_chunks.chunks.length; i++)
            {
                all_chunks.push(doc_chunks.chunks[i]);
            }

            if (doc_vectors.vectors.length === doc_chunks.chunks.length)
            {
                for (let i = 0; i < doc_vectors.vectors.length; i++)
                {
                    all_vectors.push(doc_vectors.vectors[i]);
                    vector_count++;
                }
            }
        }

        this.chunks = all_chunks;

        this.semantic =
            all_chunks.length > 0 &&
            vector_count === all_chunks.length;

        this.retriever = new Retriever({
            chunks: this.semantic ? all_chunks : [],
            vectors: this.semantic ? all_vectors : []
        });

        write_cache(cache_file(group_id, 'chunks'), chunks);
        write_cache(cache_file(group_id, 'vectors'), vectors);

        return true;
    }

    async ask(question, on_token, abort_signal, user_context)
    {
        if (!this.retriever)
        {
            throw new Error('ensure() must be called before ask().');
        }

        let query_vector = null;

        if (this.semantic)
        {
            try
            {
                query_vector = await this.embed.embed(question);
            }
            catch (e) {}
        }

        let docs = this.retriever.retrieve(query_vector, 15) || [];

        if (docs.length === 0)
        {
            docs = [];

            for (let i = 0; i < this.chunks.length && i < 15; i++)
            {
                docs.push({ text: this.chunks[i] });
            }
        }

        const current_user = user_context || this.user_context;

        if (current_user)
        {
            docs.unshift({ text: current_user });
        }

        const prompt = this.prompt.build(question, docs);

        const answer = await this.llm.generatestream(
            prompt,
            on_token || function () {},
            abort_signal
        );

        return {
            answer: answer,
            sources: docs
        };
    }
}

module.exports = RagEngine;
