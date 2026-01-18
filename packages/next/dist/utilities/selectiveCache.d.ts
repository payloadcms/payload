type CachedValue = object;
/**
 * Creates a selective cache function that provides more control over React's request-level caching behavior.
 *
 * @param namespace - A namespace to group related cached values
 * @returns A function that manages cached values within the specified namespace
 */
export declare function selectiveCache<TValue extends object = CachedValue>(namespace: string): {
    get: (factory: () => Promise<TValue>, ...cacheArgs: any[]) => Promise<TValue>;
};
export {};
//# sourceMappingURL=selectiveCache.d.ts.map