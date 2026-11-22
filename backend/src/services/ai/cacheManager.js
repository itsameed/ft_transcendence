const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const cacheDir = path.join(__dirname, 'cache');

function hash(text) 
{
    return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function getCachePath(groupId, type) 
{
    const key = hash(String(groupId));
    return path.join(cacheDir, key + '_' + type + '.json');
}

function readCache(file) 
{
    try 
    {
        if (fs.existsSync(file)) 
            return JSON.parse(fs.readFileSync(file, 'utf8'));
    } 
    catch (e) 
    {
        console.error('[cacheManager] read error:', e.message);
    }

    return {};
}

function writeCache(file, data) 
{
    try 
    {
        if (!fs.existsSync(cacheDir)) 
            fs.mkdirSync(cacheDir, { recursive: true });

        const temp = file + '.tmp';

        fs.writeFileSync(temp, JSON.stringify(data), 'utf8');
        fs.renameSync(temp, file);
    } 
    catch (e) 
    {
        console.error('[cacheManager] write error:', e.message);
    }
}

function deleteCache(file) 
{
    try 
    {
        if (fs.existsSync(file)) 
            fs.unlinkSync(file);
    } 
    catch (e) {}
}

module.exports = {
    hash,
    getCachePath,
    readCache,
    writeCache,
    deleteCache
};