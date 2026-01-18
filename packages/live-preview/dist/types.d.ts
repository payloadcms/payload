import type { DocumentEvent } from 'payload';
export type CollectionPopulationRequestHandler = ({ apiPath, data, endpoint, serverURL, }: {
    apiPath: string;
    data: Record<string, any>;
    endpoint: string;
    serverURL: string;
}) => Promise<Response>;
export type LivePreviewArgs = {};
export type LivePreview = void;
export type LivePreviewMessageEvent<T> = MessageEvent<{
    collectionSlug?: string;
    data: T;
    externallyUpdatedRelationship?: DocumentEvent;
    globalSlug?: string;
    locale?: string;
    type: 'payload-live-preview';
}>;
//# sourceMappingURL=types.d.ts.map