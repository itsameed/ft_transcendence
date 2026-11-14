const MIN = 0.01;

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  if (na === 0 || nb === 0) {
    return 0;
  }

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

<<<<<<< Updated upstream
class retriever 
{
  constructor(sem) 
  {
    this.sem = sem;
  }

  retrieve(qv, topk) 
  {
    if (!topk)
      topk = 15;

    const sems = {};
    let semMax = 0;

    if (!qv)
      return [];

    for (let i = 0; i < this.sem.vectors.length; i++) 
    {
      const s = cosine(qv, this.sem.vectors[i]);

      sems[i] = s;

=======


class retriever
{
  constructor(sem)
  {
    this.sem = sem;
  }



  retrieve(qv, topk, querytext)
  {
    if (!topk)
      topk = 15;

    if (!qv)
      return [];

    const sems = {};
    let semMax = 0;

    for (let i = 0; i < this.sem.vectors.length; i++)
    {
      const s = cosine(qv, this.sem.vectors[i]);
      sems[i] = s;
>>>>>>> Stashed changes
      if (s > semMax)
        semMax = s;
    }

<<<<<<< Updated upstream
    if (semMax > 0) 
=======
    if (semMax > 0)
>>>>>>> Stashed changes
    {
      for (const k in sems)
        sems[k] = sems[k] / semMax;
    }

    const out = [];

<<<<<<< Updated upstream
    for (const k in sems) 
=======
    for (const k in sems)
>>>>>>> Stashed changes
    {
      const i = parseInt(k, 10);
      const sem = sems[i];

<<<<<<< Updated upstream
      if (sem >= MIN) 
=======
      if (sem >= MIN)
>>>>>>> Stashed changes
      {
        out.push({
          text: this.sem.chunks[i],
          score: Number(sem.toFixed(4)),
          semantic: Number(sem.toFixed(4))
        });
      }
    }

    out.sort(function (a, b) {
      return b.score - a.score;
    });

    return out.slice(0, topk);
  }
}

module.exports = retriever;