import type { Document, PayloadRequest, SanitizedGlobalConfig } from 'payload';
type Resolver = (_: unknown, args: {
    draft?: boolean;
    id: number | string;
}, context: {
    req: PayloadRequest;
}) => Promise<Document>;
export declare function restoreVersion(globalConfig: SanitizedGlobalConfig): Resolver;
export {};
//# sourceMappingURL=restoreVersion.d.ts.map