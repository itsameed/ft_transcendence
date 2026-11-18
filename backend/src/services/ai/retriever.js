
function cosine(a, b) {
    if (!a || !b || a.length !== b.length) return 0;

    let dot = 0;
    let na = 0;
    let nb = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }

    if (!na || !nb) return 0;

    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

class Retriever {
    constructor(sem) {
        this.sem = sem || { vectors: [], chunks: [] };
    }

    retrieve(qv, topk = 15) {
        if (!qv) return [];

        const results = [];
        const vectors = this.sem.vectors || [];
        const chunks = this.sem.chunks || [];

        for (let i = 0; i < vectors.length; i++) {
            if (!chunks[i]) continue;

            results.push({
                text: chunks[i],
                score: cosine(qv, vectors[i])
            });
        }

        results.sort((a, b) => b.score - a.score);

        return results.slice(0, topk);
    }
}

module.exports = Retriever;
