import { type Payload, type SanitizedCollectionConfig, type SanitizedDocumentPermissions, type SanitizedGlobalConfig, type TypedUser } from 'payload';
type Args = {
    collectionConfig?: SanitizedCollectionConfig;
    /**
     * Optional - performance optimization.
     * If a document has been fetched before fetching versions, pass it here.
     * If this document is set to published, we can skip the query to find out if a published document exists,
     * as the passed in document is proof of its existence.
     */
    doc?: Record<string, any>;
    docPermissions: SanitizedDocumentPermissions;
    globalConfig?: SanitizedGlobalConfig;
    id?: number | string;
    locale?: string;
    payload: Payload;
    user: TypedUser;
};
type Result = Promise<{
    hasPublishedDoc: boolean;
    mostRecentVersionIsAutosaved: boolean;
    unpublishedVersionCount: number;
    versionCount: number;
}>;
export declare const getVersions: ({ id: idArg, collectionConfig, doc, docPermissions, globalConfig, locale, payload, user, }: Args) => Result;
export {};
//# sourceMappingURL=getVersions.d.ts.map