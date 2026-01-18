import type { Sort, Where } from 'payload';
export type OperationArgs = {
    depth?: number;
    draft?: boolean;
    fallbackLocale?: unknown;
    joins?: false | Record<string, unknown>;
    limit?: number;
    locale?: unknown;
    page?: number;
    pagination?: boolean;
    populate?: Record<string, unknown>;
    select?: unknown;
    sort?: Sort;
    where?: Where;
};
export declare const buildSearchParams: (args: OperationArgs) => string;
//# sourceMappingURL=buildSearchParams.d.ts.map