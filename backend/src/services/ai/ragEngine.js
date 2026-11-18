const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const Chunker = require('./chunker');
const Retriever = require('./retriever');
const PromptBuilder = require('./promptBuilder');
const LlmClient = require('./llmClient');
const EmbeddingsClient = require('./embeddingsClient');

const cacheDir = path.join(__dirname, 'cache');

function hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

function getCachePath(groupId, userId, type) {
    const key = hash(groupId + '|' + userId);
    return path.join(cacheDir, key + '_' + type + '.json');
}

function readCache(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function writeCache(file, data) {
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    const temp = file + '.tmp';
    fs.writeFileSync(temp, JSON.stringify(data), 'utf8');
    fs.renameSync(temp, file);
}

class RagEngine {
    constructor(llmKey, embKey, embUrl, embModel, embPath) {
        this.chunker = new Chunker(200, 50);
        this.prompt = new PromptBuilder();
        this.llm = new LlmClient(llmKey);
        this.embed = new EmbeddingsClient(embKey, embModel, embUrl, embPath);

        this.chunks = [];
        this.retriever = null;
        this.semantic = false;
        this.balanceSummary = "";
        this.expensesSummary = "";
    }

    async ensure(groupId, loaderFn) {
        const result = await loaderFn();
        if (!result || !Array.isArray(result.docs)) return false;

        let userId = null;
        for (const doc of result.docs) {
            if (doc.id && doc.id.startsWith('user:')) {
                userId = doc.id.substring(5);
                break;
            }
        }
        if (!userId) return false;

        const oldChunks = readCache(getCachePath(groupId, userId, 'chunks'));
        const oldVectors = readCache(getCachePath(groupId, userId, 'vectors'));

        const chunks = {};
        const vectors = {};
        const allChunks = [];
        const allVectors = [];

        for (const doc of result.docs) {
            if (!doc.id || typeof doc.text !== 'string') continue;

            if (doc.id === 'balances:summary') this.balanceSummary = doc.text;
            if (doc.id === 'expenses:summary') this.expensesSummary = doc.text;

            const currentHash = doc.hash || hash(doc.text);
            const old = oldChunks[doc.id];

            if (old && old.hash === currentHash) {
                chunks[doc.id] = old;
                vectors[doc.id] = oldVectors[doc.id] || { vectors: [] };
            } else {
                const parts = this.chunker.split(doc.text);
                const clean = [];
                for (const part of parts) {
                    if (part.length > 0) clean.push(part);
                }

                let embedded = [];
                if (this.embed.isenabled() && clean.length > 0) {
                    try {
                        const result = await this.embed.embedbatch(clean);
                        if (Array.isArray(result) && result.length === clean.length) {
                            embedded = result;
                        }
                    } catch (e) {
                        console.error('[ragEngine] embedding:', e.message);
                    }
                }

                chunks[doc.id] = { hash: currentHash, chunks: clean };
                vectors[doc.id] = { vectors: embedded };
            }

            const docChunks = chunks[doc.id];
            const docVectors = vectors[doc.id];

            if (doc.id !== 'balances:summary' && doc.id !== 'expenses:summary') {
                for (let i = 0; i < docChunks.chunks.length; i++) {
                    allChunks.push(docChunks.chunks[i]);
                }
                if (docVectors.vectors.length === docChunks.chunks.length) {
                    for (let i = 0; i < docVectors.vectors.length; i++) {
                        allVectors.push(docVectors.vectors[i]);
                    }
                }
            }
        }

        this.chunks = allChunks;
        this.semantic = allVectors.length > 0;

        this.retriever = new Retriever({
            chunks: this.semantic ? allChunks : [],
            vectors: allVectors
        });

        writeCache(getCachePath(groupId, userId, 'chunks'), chunks);
        writeCache(getCachePath(groupId, userId, 'vectors'), vectors);

        return true;
    }

    async ask(question, onToken, abortSignal) {
        if (!this.retriever) {
            throw new Error('ensure() must be called before ask().');
        }

        let queryVector = null;
        if (this.semantic) {
            try {
                queryVector = await this.embed.embed(question);
            } catch (e) {}
        }

        let docs = this.retriever.retrieve(queryVector, 5) || [];

        if (docs.length === 0) {
            docs = [];
            for (let i = 0; i < this.chunks.length && i < 5; i++) {
                docs.push({ text: this.chunks[i] });
            }
        }

        const prompt = this.prompt.build(question, docs, this.balanceSummary, this.expensesSummary);

        const answer = await this.llm.generatestream(
            prompt,
            onToken || function () {},
            abortSignal
        );

        return { answer: answer, sources: docs };
    }
}

module.exports = RagEngine;