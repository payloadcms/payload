import type { DocumentSlots, PayloadRequest, SanitizedCollectionConfig, SanitizedDocumentPermissions, SanitizedGlobalConfig, ServerFunction } from 'payload';
export declare const renderDocumentSlots: (args: {
    collectionConfig?: SanitizedCollectionConfig;
    globalConfig?: SanitizedGlobalConfig;
    hasSavePermission: boolean;
    id?: number | string;
    permissions: SanitizedDocumentPermissions;
    req: PayloadRequest;
}) => DocumentSlots;
export declare const renderDocumentSlotsHandler: ServerFunction<{
    collectionSlug: string;
    id?: number | string;
}>;
//# sourceMappingURL=renderDocumentSlots.d.ts.map