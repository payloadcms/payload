import type { PayloadRequest } from 'payload';
export type ParseCSVArgs = {
    data: Buffer | string;
    req: PayloadRequest;
};
/**
 * Parses CSV data into an array of record objects.
 * Handles type coercion for booleans, numbers, and null values.
 */
export declare const parseCSV: ({ data, req }: ParseCSVArgs) => Promise<Record<string, unknown>[]>;
//# sourceMappingURL=parseCSV.d.ts.map