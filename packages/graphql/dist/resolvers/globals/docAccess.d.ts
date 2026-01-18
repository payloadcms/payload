import type { PayloadRequest, SanitizedCollectionPermission, SanitizedGlobalConfig, SanitizedGlobalPermission } from 'payload';
export type Resolver = (_: unknown, context: {
    req: PayloadRequest;
}) => Promise<SanitizedCollectionPermission | SanitizedGlobalPermission>;
export declare function docAccessResolver(global: SanitizedGlobalConfig): Resolver;
//# sourceMappingURL=docAccess.d.ts.map