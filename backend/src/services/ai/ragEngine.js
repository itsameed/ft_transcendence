
const chunker = require('./chunker');
const retriever = require('./retriever');
<<<<<<< Updated upstream
const prompt = require('./promptBuilder');
const llm = require('./llmClient');
const embed = require('./embeddingsClient');

class ragEngine 
{
  constructor(llmkey, embkey, url, model, path) 
  {
    this.chunker = new chunker(300, 50);
    this.prompt = new prompt();
    this.llm = new llm(llmkey);
    this.embed = new embed(embkey, model, url, path);
    this.retriever = null;
  }

  async ingest(docs) 
  {
    this.chunks = [];

    for (let i = 0; i < docs.length; i++) 
    {
      const parts = this.chunker.split(docs[i]);

      for (let j = 0; j < parts.length; j++)
      {
        if (parts[j].length > 0) 
        {
          this.chunks.push(parts[j]);
=======
const promptBuilder = require('./promptBuilder');
const llmClient = require('./llmClient');
const embeddingsClient = require('./embeddingsClient');
const GroupEmbedding = require('../../services/ai/GroupEmbedding');

class RagEngine {
    constructor(llmKey, embKey, embUrl, embModel, embPath) {
        this.chunker = new chunker(200, 50);
        this.prompt = new promptBuilder();
        this.llm = new llmClient(llmKey);
        this.embed = new embeddingsClient(
            embKey,
            embModel,
            embUrl,
            embPath
        );

        this.chunks = [];
        this.retriever = null;
        this.semantic = false;
        this.fingerprint = null;
        this.statistics = null;
    }

    async ingest(docs) {
        this.chunks = [];

        for (let i = 0; i < docs.length; i++) {
            const parts = this.chunker.split(docs[i]);

            for (let j = 0; j < parts.length; j++) {
                if (parts[j].length > 0) {
                    this.chunks.push(parts[j]);
                }
            }
>>>>>>> Stashed changes
        }
      }
    }

<<<<<<< Updated upstream
    let vectors = [];

    if (this.embed.isEnabled())
    {
      try
      {
        vectors = await this.embed.embedBatch(this.chunks);
      } 
      catch (err)
      {
        console.log('[RAG] embeddings failed: ' + err.message);
      }
    }

    let semantic = false;

    if (vectors.length > 0)
    {
      semantic = true;
    }

    this.retriever = new retriever(
      {
        vectors: vectors,
        chunks: this.chunks
      }
    );
=======
        let vectors = [];

        if (this.embed.isenabled()) {
            try {
                const result = await this.embed.embedbatch(this.chunks);

                if (
                    Array.isArray(result) &&
                    result.length === this.chunks.length
                ) {
                    vectors = result;
                }
            } catch (err) {
                console.log('[rag] embedding error:', err.message);
            }
        }

        this.semantic = vectors.length === this.chunks.length &&
            vectors.length > 0;

        this.retriever = new retriever({
            vectors,
            chunks: this.chunks
        });
    }

    async ingestCached(groupId, docs, fingerprint, statistics) {
        let cached = null;

        this.statistics = statistics || null;

        try {
            cached = await GroupEmbedding.findOne({
                groupId
            }).lean();
        } catch (err) {
            console.log('[rag] cache read error:', err.message);
        }

        if (
            cached &&
            cached.fingerprint === fingerprint &&
            Array.isArray(cached.chunks) &&
            Array.isArray(cached.vectors) &&
            cached.chunks.length > 0 &&
            cached.chunks.length === cached.vectors.length
        ) {
            this.chunks = cached.chunks;
            this.semantic = true;

            this.retriever = new retriever({
                vectors: cached.vectors,
                chunks: cached.chunks
            });

            console.log('[rag] MongoDB CACHE HIT');

        } else {
            console.log('[rag] MongoDB CACHE MISS / STALE');

            await this.ingest(docs);

            if (this.semantic && this.chunks.length > 0) {
                try {
                    await GroupEmbedding.findOneAndUpdate(
                        { groupId },
                        {
                            $set: {
                                fingerprint,
                                chunks: this.chunks,
                                vectors: this.vectorsFromRetriever(),
                                docCount: docs.length
                            }
                        },
                        { upsert: true }
                    );
                } catch (err) {
                    console.log('[rag] cache save error:', err.message);
                }
            }
        }

        this.fingerprint = fingerprint;
    }

    vectorsFromRetriever() {
        if (!this.retriever || !this.retriever.sem) {
            return [];
        }

        return this.retriever.sem.vectors || [];
    }

    async ask(question, onToken, abortSignal, history) {
        if (!this.retriever) {
            throw new Error('ingest() must be called before ask().');
        }
>>>>>>> Stashed changes

    this.semantic = semantic;

<<<<<<< Updated upstream
    if (semantic)
    {
      console.log( '[RAG] ingested ' + this.chunks.length + ' chunks (Embeddings only).');
    }
    else 
    {
      console.log('[RAG] ingested ' + this.chunks.length + ' chunks (Embeddings unavailable).');
    }
  }

  async ask(q, onToken)
    {
    if (!this.retriever) 
    {
      throw new Error('ingest() must be called before ask().');
    }

    if (!onToken) 
    {
      onToken = function () {};
    }

    let qv = null;

    if (this.semantic)
    {
      try
      {
        qv = await this.embed.embed(q);
      } 
      catch (err) 
      {
        qv = null;
      }
    }
    
    const docs = this.retriever.retrieve(qv, 15);
    const p = this.prompt.build(q, docs);

    const answer = await this.llm.generateStream(p, onToken);
    return {
      answer: answer,
      sources: docs
    };
  }
}

module.exports = ragEngine;


=======
        if (!history) {
            history = [];
        }

        let queryVector = null;

        if (this.semantic) {
            try {
                queryVector = await this.embed.embed(question);
            } catch (err) {
                console.log('[rag] query embedding error:', err.message);
            }
        }

        const docs = this.retriever.retrieve(
            queryVector,
            20,
            question
        );

        const finalPrompt = this.prompt.build(
            question,
            docs,
            history,
            this.statistics
        );

        const answer = await this.llm.generatestream(
            finalPrompt,
            onToken,
            abortSignal
        );

        return {
            answer,
            sources: docs
        };
    }
}

module.exports = RagEngine;
>>>>>>> Stashed changes
