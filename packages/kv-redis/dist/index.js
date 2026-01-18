import { Redis } from 'ioredis';
export class RedisKVAdapter {
    keyPrefix;
    redisClient;
    constructor(keyPrefix, redisURL){
        this.keyPrefix = keyPrefix;
        this.redisClient = new Redis(redisURL);
    }
    async clear() {
        const keys = await this.redisClient.keys(`${this.keyPrefix}*`);
        if (keys.length > 0) {
            await this.redisClient.del(keys);
        }
    }
    async delete(key) {
        await this.redisClient.del(`${this.keyPrefix}${key}`);
    }
    async get(key) {
        const data = await this.redisClient.get(`${this.keyPrefix}${key}`);
        if (data === null) {
            return null;
        }
        return JSON.parse(data);
    }
    async has(key) {
        const exists = await this.redisClient.exists(`${this.keyPrefix}${key}`);
        return exists === 1;
    }
    async keys() {
        const prefixedKeys = await this.redisClient.keys(`${this.keyPrefix}*`);
        if (this.keyPrefix) {
            return prefixedKeys.map((key)=>key.replace(this.keyPrefix, ''));
        }
        return prefixedKeys;
    }
    async set(key, data) {
        await this.redisClient.set(`${this.keyPrefix}${key}`, JSON.stringify(data));
    }
}
export const redisKVAdapter = (options = {})=>{
    const keyPrefix = options.keyPrefix ?? 'payload-kv:';
    const redisURL = options.redisURL ?? process.env.REDIS_URL;
    if (!redisURL) {
        throw new Error('redisURL or REDIS_URL env variable is required');
    }
    return {
        init: ()=>new RedisKVAdapter(keyPrefix, redisURL)
    };
};

//# sourceMappingURL=index.js.map