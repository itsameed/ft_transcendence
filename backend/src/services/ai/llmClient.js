
const https = require('https');

const TIMEOUT = 60000;

const FALLBACK_MODELS = [
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'llama-3.1-8b-instant',
    'llama3-8b-8192'
];

class llmClient 
{
    constructor(apiKey) 
    {
        if (!apiKey) 
            throw new Error('API key required');

        this.apiKey = apiKey;
        this.host = 'api.groq.com';
        this.path = '/openai/v1/chat/completions';
        this.name = 'Groq';
        this.models = FALLBACK_MODELS;
    }

    call(model, prompt, onToken) 
    {
        const self = this;

        const body = JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            stream: true
        });

        return new Promise(function (resolve, reject) 
        {
            let full = '';
            let buf = '';
            let settled = false;

            function fail(err) 
            {
                if (settled)
                    return;

                settled = true;
                reject(err);
            }

            function processLine(line) 
            {
                line = line.trim();

                if (line.indexOf('data:') !== 0)
                    return;

                const data = line.slice(5).trim();

                if (data === '[DONE]')
                    return;

                try 
                {
                    const json = JSON.parse(data);
                    const delta = json.choices &&
                        json.choices[0] &&
                        json.choices[0].delta;

                    if (delta && typeof delta.content === 'string') 
                    {
                        full += delta.content;
                        onToken(delta.content);
                    }
                } 
                catch (e) {}
            }

            const req = https.request({ hostname: self.host, path: self.path, method: 'POST', timeout: TIMEOUT,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + self.apiKey,
                    'Content-Length': Buffer.byteLength(body)
                }
            }, function (res) 
            {
                if (res.statusCode >= 400) 
                {
                    let errorBody = '';

                    res.on('data', function (chunk) 
                    {
                        errorBody += chunk.toString();
                    });

                    res.on('end', function () 
                    {
                        const err = new Error(
                            '[' + self.name + '] HTTP ' + res.statusCode + ': ' + errorBody
                        );

                        err.statusCode = res.statusCode;
                        fail(err);
                    });

                    return;
                }

                res.on('data', function (chunk) 
                {
                    buf += chunk.toString();

                    const lines = buf.split('\n');
                    buf = lines.pop();

                    for (let i = 0; i < lines.length; i++) 
                        processLine(lines[i]);
                });

                res.on('end', function () 
                {
                    if (buf.trim())
                        processLine(buf);

                    if (!settled) 
                    {
                        settled = true;
                        resolve(full);
                    }
                });

                res.on('error', function (e) 
                {
                    fail(new Error('[' + self.name + '] stream error: ' + e.message));
                });
            });

            req.on('timeout', function () 
            {
                req.destroy();
                fail(new Error('Timeout'));
            });

            req.on('error', function (e) 
            {
                fail(new Error('Connection: ' + e.message));
            });

            req.write(body);
            req.end();
        });
    }

    async generatestream(prompt, onToken) 
    {
        if (typeof onToken !== 'function')
            onToken = function () {};

        const modelsToTry = this.models;

        let lastErr;

        for (let i = 0; i < modelsToTry.length; i++) 
        {
            const model = modelsToTry[i];

            try 
            {
                return await this.call(model, prompt, onToken);
            } 
            catch (err) 
            {
                lastErr = err;

                if (err.statusCode === 429 || err.statusCode === 404) 
                {
                    await new Promise(function (r) 
                    {
                        setTimeout(r, 500);
                    });

                    continue;
                }

                break;
            }
        }

        throw new Error(
            'All models failed. Last error: ' +
            (lastErr ? lastErr.message : 'Unknown')
        );
    }
}

module.exports = llmClient;
