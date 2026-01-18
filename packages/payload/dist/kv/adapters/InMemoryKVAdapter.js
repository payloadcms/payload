/* eslint-disable @typescript-eslint/require-await */ export class InMemoryKVAdapter {
    store = new Map();
    async clear() {
        this.store.clear();
    }
    async delete(key) {
        this.store.delete(key);
    }
    async get(key) {
        const value = this.store.get(key);
        if (typeof value === 'undefined') {
            return null;
        }
        return value;
    }
    async has(key) {
        return this.store.has(key);
    }
    async keys() {
        return Array.from(this.store.keys());
    }
    async set(key, value) {
        this.store.set(key, value);
    }
}
export const inMemoryKVAdapter = ()=>{
    return {
        init: ()=>new InMemoryKVAdapter()
    };
};

//# sourceMappingURL=InMemoryKVAdapter.js.map