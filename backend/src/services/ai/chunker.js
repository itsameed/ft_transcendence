class textChunker 
{
  constructor(size, overlap) 
  {
    if (size === undefined || size === null) {
      this.size = 300;
    } else {
      this.size = size;
    }

    if (overlap === undefined || overlap === null) {
      this.overlap = 50;
    } else {
      this.overlap = overlap;
    }

    if (!Number.isInteger(this.size) || this.size < 1) {
      this.size = 300;
    }

    if (!Number.isInteger(this.overlap) || this.overlap < 0) {
      this.overlap = 50;
    }

    if (this.overlap >= this.size) {
      this.overlap = this.size - 1;
    }
  }

  split(text) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.size;

      if (end >= text.length) {
        chunks.push(text.slice(start).trim());
        break;
      }

      let boundary = text.lastIndexOf('\n', end);

      if (boundary <= start) {
        boundary = text.lastIndexOf('. ', end);
      }

      if (boundary <= start) {
        boundary = end;
      }

      chunks.push(text.slice(start, boundary).trim());

      let nextStart = boundary - this.overlap;

      if (nextStart <= start) {
        nextStart = end;
      }

      start = nextStart;
    }

    const result = [];

    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].length > 0) {
        result.push(chunks[i]);
      }
    }

    return result;
  }
}

module.exports = textChunker;
