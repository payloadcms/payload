import type { Collection, PayloadRequest } from 'payload';
export type Resolver = (_: unknown, args: {
    draft?: boolean;
    id: number | string;
}, context: {
    req: PayloadRequest;
}) => Promise<Document>;
export declare function restoreVersionResolver(collection: Collection): Resolver;
//# sourceMappingURL=restoreVersion.d.ts.map