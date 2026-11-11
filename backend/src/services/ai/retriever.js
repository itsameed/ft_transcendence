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

function isaggregativequestion(query)
{
    if (!query)
    {
        return false;
    }

    const q = query.toLowerCase();

    const keywords = [
        'all', 'every', 'each', 'total', 'sum', 'how much',
        'list', 'give me', 'show me', 'detailed', 'exhaustive',
        'breakdown', 'complete', 'full',
        'كل', 'جميع', 'المجموع', 'مجموع', 'كم', 'اعطني', 'أعطني',
        'قائمة', 'بالتفصيل', 'التفصيل', 'الممل', 'الطويل',
        'كامل', 'إجمالي', 'اجمالي',
        'tous', 'tout', 'somme', 'total', 'combien', 'liste',
        'détail', 'complet'
    ];

    for (let i = 0; i < keywords.length; i++)
    {
        if (q.indexOf(keywords[i]) !== -1)
        {
            return true;
        }
    }

    return false;
}

function isdatachunk(text)
{
    if (!text)
    {
        return false;
    }

    if (text.indexOf('Note for the assistant') !== -1)
    {
        return false;
    }

    if (text.indexOf('The current user asking') !== -1)
    {
        return false;
    }

    if (text.indexOf('The group "') !== -1 && text.indexOf('members') !== -1)
    {
        return false;
    }

    return true;
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

        if (querytext && isaggregativequestion(querytext))
        {
            const all = [];

            for (let i = 0; i < this.sem.chunks.length; i++)
            {
                const chunktext = this.sem.chunks[i];

                if (!isdatachunk(chunktext))
                {
                    continue;
                }

                all.push({
                    text: chunktext,
                    score: 1.0,
                    semantic: 1.0
                });
            }

            console.log(
                '[retriever] aggregative: returning ' +
                all.length +
                ' data chunks (from ' +
                this.sem.chunks.length +
                ' total)'
            );

            return all;
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