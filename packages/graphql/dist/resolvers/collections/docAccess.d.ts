import type { Collection, PayloadRequest, SanitizedCollectionPermission, SanitizedGlobalPermission } from 'payload';
export type Resolver = (_: unknown, args: {
    id: number | string;
}, context: {
    req: PayloadRequest;
}) => Promise<SanitizedCollectionPermission | SanitizedGlobalPermission>;
export declare function docAccessResolver(collection: Collection): Resolver;
//# sourceMappingURL=docAccess.d.ts.map