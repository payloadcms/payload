import type { UploadCollectionSlug } from 'payload';
import { type ReactNode } from 'react';
type ClientUploadHandlerProps<T extends Record<string, unknown>> = {
    children: ReactNode;
    collectionSlug: UploadCollectionSlug;
    enabled?: boolean;
    extra: T;
    prefix?: string;
    serverHandlerPath: `/${string}`;
};
export declare const createClientUploadHandler: <T extends Record<string, unknown>>({ handler, }: {
    handler: (args: {
        apiRoute: string;
        collectionSlug: UploadCollectionSlug;
        extra: T;
        file: File;
        prefix?: string;
        serverHandlerPath: `/${string}`;
        serverURL: string;
        updateFilename: (value: string) => void;
    }) => Promise<unknown>;
}) => ({ children, collectionSlug, enabled, extra, prefix, serverHandlerPath, }: ClientUploadHandlerProps<T>) => import("react").JSX.Element;
export {};
//# sourceMappingURL=createClientUploadHandler.d.ts.map