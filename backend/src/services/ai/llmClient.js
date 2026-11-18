const https = require('https');

const TIMEOUT = 60000;

const FALLBACK_MODELS = [
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'llama-3.1-8b-instant',
    'llama3-8b-8192'
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
        this.models = options.models || FALLBACK_MODELS;
        this._cachedModels = null;
        this._lastFetchTime = 0;
    }

    async fetchAvailableModels() {
        if (this._cachedModels && (Date.now() - this._lastFetchTime < 600000)) {
            return this._cachedModels;
        }

        return new Promise((resolve) => {
            const options = {
                hostname: this.host,
                path: '/openai/v1/models',
                method: 'GET',
                timeout: 10000,
                headers: {
                    'Authorization': 'Bearer ' + this.apiKey
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const json = JSON.parse(data);
                            const models = json.data
                                .map(m => m.id)
                                .filter(id => 
                                    !id.includes('whisper') && 
                                    !id.includes('tts') && 
                                    !id.includes('embed') &&
                                    !id.includes('guard')
                                );
                            
                            this._cachedModels = models;
                            this._lastFetchTime = Date.now();
                            resolve(models);
                        } catch (e) {
                            resolve(FALLBACK_MODELS);
                        }
                    } else {
                        resolve(FALLBACK_MODELS);
                    }
                });
            });

            req.on('error', () => resolve(FALLBACK_MODELS));
            req.on('timeout', () => { req.destroy(); resolve(FALLBACK_MODELS); });
            req.end();
        });
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

            let committed = false;
            const pending = [];

            function flush() {
                committed = true;
                for (let k = 0; k < pending.length; k++) {
                    onToken(pending[k]);
                }
                pending.length = 0;
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
                    const err = new Error('[' + self.name + '] HTTP ' + res.statusCode);
                    err.statusCode = res.statusCode;
                    return reject(err);
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
                                if (committed) {
                                    onToken(delta.content);
                                } else {
                                    pending.push(delta.content);
                                }
                            }
                        } catch (e) {}
                    }
                });

                res.on('end', function () {
                    if (!committed) flush();
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

        const availableModels = await this.fetchAvailableModels();
        const modelsToTry = [...new Set([...this.models, ...availableModels])];

        let lastErr;
        for (let i = 0; i < modelsToTry.length; i++) {
            const model = modelsToTry[i];
            try {
                return await this.call(model, prompt, onToken, abortSignal);
            } catch (err) {
                lastErr = err;
                if (abortSignal && abortSignal.aborted) {
                    throw new Error('Aborted');
                }
                
                if (err.statusCode === 429 || err.statusCode === 404) {
                    await new Promise(r => setTimeout(r, 500)); 
                    continue; 
                }
            }
        }
        
        throw new Error('All models failed. Last error: ' + (lastErr ? lastErr.message : 'Unknown'));
    }
}

module.exports = llmClient;