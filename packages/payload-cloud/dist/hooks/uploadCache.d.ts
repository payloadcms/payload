import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';
interface Args {
    endpoint: string;
}
export declare const getCacheUploadsAfterChangeHook: ({ endpoint }: Args) => CollectionAfterChangeHook;
export declare const getCacheUploadsAfterDeleteHook: ({ endpoint }: Args) => CollectionAfterDeleteHook;
export {};
//# sourceMappingURL=uploadCache.d.ts.map