import type { CollectionPopulationRequestHandler, LivePreviewMessageEvent } from './types.js';
export declare const resetCache: () => void;
export declare const handleMessage: <T extends Record<string, any>>(args: {
    apiRoute?: string;
    depth?: number;
    event: LivePreviewMessageEvent<T>;
    initialData: T;
    requestHandler?: CollectionPopulationRequestHandler;
    serverURL: string;
}) => Promise<T>;
//# sourceMappingURL=handleMessage.d.ts.map