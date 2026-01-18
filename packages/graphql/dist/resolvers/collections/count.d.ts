import type { Collection, PayloadRequest, Where } from 'payload';
export type Resolver = (_: unknown, args: {
    data: Record<string, unknown>;
    locale?: string;
    trash?: boolean;
    where?: Where;
}, context: {
    req: PayloadRequest;
}) => Promise<{
    totalDocs: number;
}>;
export declare function countResolver(collection: Collection): Resolver;
//# sourceMappingURL=count.d.ts.map