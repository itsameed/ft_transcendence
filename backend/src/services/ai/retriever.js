const min = 0.01;

function cosine(a, b)
{
    let dot = 0;
    let na = 0;
    let nb = 0;

    for (let i = 0; i < a.length; i++)
    {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }

    if (na === 0 || nb === 0)
    {
        return 0;
    }

    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

class retriever
{
    constructor(sem)
    {
        this.sem = sem;
    }

    retrieve(qv, topk, querytext)
    {
        if (!topk)
        {
            topk = 15;
        }
        if (qv)
        {
            const sems = {};
            let semmax = 0;

            for (let i = 0; i < this.sem.vectors.length; i++)
            {
                const s = cosine(qv, this.sem.vectors[i]);

                sems[i] = s;

                if (s > semmax)
                {
                    semmax = s;
                }
            }

            if (semmax > 0)
            {
                for (const k in sems)
                {
                    sems[k] = sems[k] / semmax;
                }
            }

            const out = [];

            for (const k in sems)
            {
                const i = parseInt(k, 10);
                const sem = sems[i];

                if (sem >= min)
                {
                    out.push({
                        text: this.sem.chunks[i],
                        score: Number(sem.toFixed(4)),
                        semantic: Number(sem.toFixed(4))
                    });
                }
            }

            out.sort(function (a, b)
            {
                return b.score - a.score;
            });

            return out.slice(0, topk);
        }

        return [];
    }
}

module.exports = retriever;
