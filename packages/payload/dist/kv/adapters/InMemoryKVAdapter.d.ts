import type { KVAdapter, KVAdapterResult, KVStoreValue } from '../index.js';
export declare class InMemoryKVAdapter implements KVAdapter {
    store: Map<string, {}>;
    clear(): Promise<void>;
    delete(key: string): Promise<void>;
    get<T extends KVStoreValue>(key: string): Promise<null | T>;
    has(key: string): Promise<boolean>;
    keys(): Promise<string[]>;
    set(key: string, value: KVStoreValue): Promise<void>;
}
export declare const inMemoryKVAdapter: () => KVAdapterResult;
//# sourceMappingURL=InMemoryKVAdapter.d.ts.map