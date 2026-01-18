import type { UploadCollectionSlug } from 'payload';
import React from 'react';
type UploadHandler = (args: {
    file: File;
    updateFilename: (filename: string) => void;
}) => Promise<unknown>;
export type UploadHandlersContext = {
    getUploadHandler: (args: {
        collectionSlug: UploadCollectionSlug;
    }) => null | UploadHandler;
    setUploadHandler: (args: {
        collectionSlug: UploadCollectionSlug;
        handler: UploadHandler;
    }) => unknown;
};
export declare const UploadHandlersProvider: ({ children }: {
    children: any;
}) => React.JSX.Element;
export declare const useUploadHandlers: () => UploadHandlersContext;
export {};
//# sourceMappingURL=index.d.ts.map