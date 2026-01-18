import type { CollectionPopulationRequestHandler } from './types.js';
export declare const mergeData: <T extends Record<string, any>>(args: {
    apiRoute?: string;
    collectionSlug?: string;
    depth?: number;
    globalSlug?: string;
    incomingData: Partial<T>;
    initialData: T;
    locale?: string;
    requestHandler?: CollectionPopulationRequestHandler;
    serverURL: string;
}) => Promise<T>;
//# sourceMappingURL=mergeData.d.ts.map