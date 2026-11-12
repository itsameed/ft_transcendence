const chunker = require('./chunker');
const retriever = require('./retriever');
const promptBuilder = require('./promptBuilder');
const llmClient = require('./llmClient');
const embeddingsClient = require('./embeddingsClient');

class RagEngine {

    constructor(llmKey, embKey, embUrl, embModel, embPath) {
        this.chunker = new chunker(200, 50);
        this.prompt = new promptBuilder();
        this.llm = new llmClient(llmKey);
        this.embed = new embeddingsClient(embKey, embModel, embUrl, embPath);
        this.chunks = [];
        this.retriever = null;
        this.semantic = false;
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
        }

        let vectors = [];

        if (this.embed.isenabled()) {
            try {
                const result = await this.embed.embedbatch(this.chunks);

                if (Array.isArray(result) && result.length === this.chunks.length) {
                    vectors = result;
                }
            } catch (err) {
                vectors = [];
            }
        }

        this.semantic = vectors.length > 0;

        this.retriever = new retriever({
            vectors: vectors,
            chunks: this.chunks
        });
    }

    async ask(question, onToken, abortSignal) {
        if (!this.retriever) {
            throw new Error('ingest() must be called before ask().');
        }

        if (!onToken) {
            onToken = function () {};
        }

        let queryVector = null;

        if (this.semantic) {
            try {
                queryVector = await this.embed.embed(question);
            } catch (err) {
                queryVector = null;
            }
        }

        const docs = this.retriever.retrieve(queryVector, 15, question);
        console.log(docs);
        const finalPrompt = this.prompt.build(question, docs);
        console.log(finalPrompt);
        const answer = await this.llm.generatestream(finalPrompt, onToken, abortSignal);
            console.log(answer);
        return {
            answer: answer,
            sources: docs
        };
    }

}

module.exports = RagEngine;