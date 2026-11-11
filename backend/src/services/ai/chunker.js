class textChunker {
  constructor(size, overlap) {
    if (size === undefined || size === null) {
      this.size = 200;
    } else {
      this.size = size;
    }

    if (overlap === undefined || overlap === null) {
      this.overlap = 50;
    } else {
      this.overlap = overlap;
    }

    if (this.overlap >= this.size) {
      this.overlap = Math.floor(this.size / 2);
    }
  }

  split(text) {
    const chunks = [];

    if (!text || text.length === 0) {
      return chunks;
    }

    let start = 0;

    while (start < text.length) {
      let end = start + this.size;

      if (end >= text.length) {
        const tail = text.slice(start).trim();
        if (tail.length > 0) chunks.push(tail);
        break;
      }

      let boundary = text.lastIndexOf('\n', end);

      if (boundary === -1 || boundary <= start) {
        boundary = text.lastIndexOf('. ', end);
      }

      if (boundary === -1 || boundary <= start) {
        boundary = end;
      }

      const piece = text.slice(start, boundary).trim();
      if (piece.length > 0) {
        chunks.push(piece);
      }

      const nextStart = boundary - this.overlap;
      start = Math.max(nextStart, start + 1);
    }

    return chunks;
  }
}

module.exports = textChunker;