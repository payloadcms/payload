/**
 * Default implementation of `beginTransaction` that returns a resolved promise of null
 */ export function defaultBeginTransaction() {
    const promiseSingleton = Promise.resolve(null);
    return ()=>promiseSingleton;
}

//# sourceMappingURL=defaultBeginTransaction.js.map