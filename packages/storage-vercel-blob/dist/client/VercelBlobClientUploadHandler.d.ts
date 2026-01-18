export type VercelBlobClientUploadHandlerExtra = {
    addRandomSuffix: boolean;
    baseURL: string;
    prefix: string;
};
export declare const VercelBlobClientUploadHandler: ({ children, collectionSlug, enabled, extra, prefix, serverHandlerPath, }: {
    children: import("react").ReactNode;
    collectionSlug: import("payload").UploadCollectionSlug;
    enabled?: boolean;
    extra: VercelBlobClientUploadHandlerExtra;
    prefix?: string;
    serverHandlerPath: `/${string}`;
}) => import("react").JSX.Element;
//# sourceMappingURL=VercelBlobClientUploadHandler.d.ts.map