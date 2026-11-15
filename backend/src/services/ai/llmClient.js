const https = require('https');

const TIMEOUT = 60000;

const MODELS = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
];

class llmClient {

    constructor(apiKey, options) {
        if (!apiKey) {
            throw new Error('API key required');
        }

        options = options || {};

        this.apiKey = apiKey;
        this.host = options.hostname || 'api.groq.com';
        this.path = options.chatPath || '/openai/v1/chat/completions';
        this.name = options.providerName || 'Groq';
        this.models = options.models || MODELS;
    }

    call(model, prompt, onToken, abortSignal) {
        const self = this;

        const body = JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            stream: true
        });

        return new Promise(function (resolve, reject) {
            if (abortSignal && abortSignal.aborted) {
                return reject(new Error('Aborted before start'));
            }

            const req = https.request({
                hostname: self.host,
                path: self.path,
                method: 'POST',
                timeout: TIMEOUT,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + self.apiKey,
                    'Content-Length': Buffer.byteLength(body)
                }
            }, function (res) {
                if (res.statusCode >= 400) {
                    res.resume();
                    return reject(new Error('[' + self.name + '] HTTP ' + res.statusCode));
                }

                let buf = '';
                let full = '';

                res.on('data', function (chunk) {
                    buf += chunk.toString();
                    const lines = buf.split('\n');
                    buf = lines.pop();

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line.indexOf('data:') !== 0) continue;

                        const data = line.slice(5).trim();
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices && json.choices[0] && json.choices[0].delta;
                            if (delta && delta.content) {
                                full += delta.content;
                                onToken(delta.content);
                            }
                        } catch (e) {}
                    }
                });

                res.on('end', function () {
                    resolve(full);
                });

                res.on('error', function (e) {
                    reject(new Error('[' + self.name + '] stream error: ' + e.message));
                });
            });

            if (abortSignal) {
                abortSignal.addEventListener('abort', function () {
                    req.destroy();
                    reject(new Error('Aborted'));
                });
            }

            req.on('timeout', function () {
                req.destroy();
                reject(new Error('Timeout'));
            });

            req.on('error', function (e) {
                reject(new Error('Connection: ' + e.message));
            });

            req.write(body);
            req.end();
        });
    }

    async generatestream(prompt, onToken, abortSignal) {
        if (!onToken) {
            onToken = function () {};
        }

        let lastErr;

        for (let i = 0; i < this.models.length; i++) {
            try {
                return await this.call(this.models[i], prompt, onToken, abortSignal);
            } catch (err) {
                lastErr = err;

                if (abortSignal && abortSignal.aborted) {
                    throw new Error('Aborted');
                }

                console.log('[llm] ' + this.models[i] + ' failed: ' + err.message);
            }
        }

        throw new Error('All models failed: ' + lastErr.message);
    }
}

module.exports = llmClient;