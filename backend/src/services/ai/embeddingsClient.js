const https = require('https');

class embeddingsClient {

    constructor(apiKey, model, baseUrl, path) {
        this.enabled = !!(apiKey && apiKey.trim());
        this.apiKey = apiKey;
        this.model = model || 'jina-embeddings-v3';
        this.host = baseUrl || 'api.jina.ai';
        this.path = path || '/v1/embeddings';
    }

    isenabled() {
        return this.enabled;
    }

    request(input) {
        const self = this;

        const body = JSON.stringify({
            model: this.model,
            input: input
        });

        return new Promise(function (resolve, reject) {
            const req = https.request({
                hostname: self.host,
                path: self.path,
                method: 'POST',
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + self.apiKey,
                    'Content-Length': Buffer.byteLength(body)
                }
            }, function (res) {
                let raw = '';

                res.on('data', function (c) {
                    raw += c;
                });

                res.on('end', function () {
                    if (res.statusCode >= 400) {
                        return reject(new Error(
                            '[embeddings] HTTP ' + res.statusCode + ': ' + raw.slice(0, 200)
                        ));
                    }

                    try {
                        const json = JSON.parse(raw);

                        if (!json.data || json.data.length !== input.length) {
                            return reject(new Error(
                                '[embeddings] bad response: expected ' +
                                input.length + ', got ' +
                                (json.data ? json.data.length : 0)
                            ));
                        }

                        const vectors = json.data.map(function (d) {
                            if (!d || !d.embedding) {
                                throw new Error('[embeddings] missing embedding in response');
                            }
                            return d.embedding;
                        });

                        resolve(vectors);
                    } catch (e) {
                        reject(new Error('[embeddings] ' + e.message));
                    }
                });

                res.on('error', function (e) {
                    reject(new Error('[embeddings] stream error: ' + e.message));
                });
            });

            req.on('timeout', function () {
                req.destroy();
                reject(new Error('[embeddings] timeout'));
            });

            req.on('error', function (e) {
                reject(new Error('[embeddings] connection: ' + e.message));
            });

            req.write(body);
            req.end();
        });
    }

    async embed(text) {
        if (!this.enabled) {
            return null;
        }

        const data = await this.request([text]);
        return data[0];
    }

    async embedbatch(texts) {
        if (!this.enabled) {
            return null;
        }

        if (!texts || texts.length === 0) {
            return [];
        }

        const allvectors = [];

        for (let i = 0; i < texts.length; i += 20) {
            const batch = texts.slice(i, i + 20);
            const vectors = await this.request(batch);

            for (let j = 0; j < vectors.length; j++) {
                allvectors.push(vectors[j]);
            }
        }

        return allvectors;
    }
}

module.exports = embeddingsClient;