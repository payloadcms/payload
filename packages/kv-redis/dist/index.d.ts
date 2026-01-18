import type { KVAdapter, KVAdapterResult, KVStoreValue } from 'payload';
import { Redis } from 'ioredis';
export declare class RedisKVAdapter implements KVAdapter {
    readonly keyPrefix: string;
    redisClient: Redis;
    constructor(keyPrefix: string, redisURL: string);
    clear(): Promise<void>;
    delete(key: string): Promise<void>;
    get<T extends KVStoreValue>(key: string): Promise<null | T>;
    has(key: string): Promise<boolean>;
    keys(): Promise<string[]>;
    set(key: string, data: KVStoreValue): Promise<void>;
}
export type RedisKVAdapterOptions = {
    /**
     * Optional prefix for Redis keys to isolate the store
     *
     * @default 'payload-kv:'
     */
    keyPrefix?: string;
    /** Redis connection URL (e.g., 'redis://localhost:6379'). Defaults to process.env.REDIS_URL */
    redisURL?: string;
};
export declare const redisKVAdapter: (options?: RedisKVAdapterOptions) => KVAdapterResult;
//# sourceMappingURL=index.d.ts.map